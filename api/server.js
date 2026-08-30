import express from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import sharp from 'sharp';
import { readFile, writeFile, rename, mkdir, copyFile, readdir, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, basename, extname } from 'node:path';

// --- CONFIG ---
const CONFIG_PATH = process.env.CONFIG_PATH || join(import.meta.dirname, 'config.json');
let config;
try {
  config = JSON.parse(await readFile(CONFIG_PATH, 'utf-8'));
} catch {
  console.error('Failed to read config.json — run `node setup.js <password>` first');
  process.exit(1);
}

const CONTENT_DIR = resolve(import.meta.dirname, config.contentDir);
const UPLOADS_DIR = join(CONTENT_DIR, 'uploads');
const BACKUPS_DIR = join(CONTENT_DIR, '.backups');
const SITE_PATH = join(CONTENT_DIR, 'site.json');
// Public URL prefix for anything in UPLOADS_DIR. Caddy (prod) and Vite (dev)
// both serve /content/* straight from the repo's content/ directory.
const UPLOADS_URL = '/content/uploads';

for (const dir of [UPLOADS_DIR, BACKUPS_DIR]) {
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
}

// --- APP ---
const app = express();
app.use(express.json({ limit: '1mb' }));
app.set('trust proxy', 1);

// --- RATE LIMITING ---
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts. Try again in a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Too many requests. Slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);

// --- AUTH MIDDLEWARE ---
function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer /, '');
  try {
    jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// --- HELPERS ---
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Write via a temp file + rename. rename() is atomic, so an interrupted or failed
// write leaves the original file intact instead of truncated.
let tmpSeq = 0;
async function writeAtomic(filePath, data) {
  const tmp = `${filePath}.${process.pid}.${tmpSeq++}.tmp`;
  try {
    await writeFile(tmp, data);
    await rename(tmp, filePath);
  } catch (err) {
    await unlink(tmp).catch(() => {});
    throw err;
  }
}

async function backupFile(filePath) {
  if (!existsSync(filePath)) return;
  const name = basename(filePath, '.json');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await copyFile(filePath, join(BACKUPS_DIR, `${name}_${timestamp}.json`));

  const files = await readdir(BACKUPS_DIR);
  const backups = files
    .filter(f => f.startsWith(name + '_') && f.endsWith('.json'))
    .sort()
    .reverse();
  for (const old of backups.slice(config.maxBackups)) {
    await unlink(join(BACKUPS_DIR, old)).catch(() => {});
  }
}

// --- IMAGE PIPELINE ---
// One source photo → AVIF + WebP + JPEG at several widths, returned as the
// `Picture` shape that src/content.js renders as <img srcset>. Widths above the
// source are skipped and nothing is upscaled; anything wider than MAX_WIDTH
// is capped there so a phone's 4K original doesn't ship to visitors. sharp
// strips EXIF (GPS included) by default — .rotate() bakes the orientation first.
const MAX_WIDTH = 2000;
const WIDTHS = [320, 640, 1200, 2000];
const FORMATS = {
  avif: { quality: 50, effort: 3 },
  webp: { quality: 75 },
  jpeg: { quality: 80 },
};

async function makePicture(buffer, id) {
  const rotated = await sharp(buffer).rotate().toBuffer();
  const { width } = await sharp(rotated).metadata();
  const max = Math.min(width, MAX_WIDTH);
  const widths = [...WIDTHS.filter(w => w < max), max];
  const sources = {};
  let img;
  for (const [fmt, opts] of Object.entries(FORMATS)) {
    const ext = fmt === 'jpeg' ? 'jpg' : fmt;
    const entries = [];
    for (const w of widths) {
      const name = `${id}-${w}.${ext}`;
      const out = await sharp(rotated).resize(w)[fmt](opts).toBuffer({ resolveWithObject: true });
      await writeAtomic(join(UPLOADS_DIR, name), out.data);
      entries.push(`${UPLOADS_URL}/${name} ${w}w`);
      if (fmt === 'jpeg' && w === max) {
        img = { src: `${UPLOADS_URL}/${name}`, w: out.info.width, h: out.info.height };
      }
    }
    sources[fmt] = entries.join(', ');
  }
  return { sources, img };
}

// --- ROUTES ---
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const { password } = req.body;
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Password is required' });
  }
  if (password.length > 128) {
    return res.status(400).json({ error: 'Password too long' });
  }

  try {
    const match = await bcrypt.compare(password, config.passwordHash);
    if (!match) return res.status(401).json({ error: 'Incorrect password' });

    const token = jwt.sign({ role: 'admin' }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    res.json({ token });
  } catch {
    res.status(500).json({ error: 'Authentication failed' });
  }
});

app.get('/api/auth/verify', authenticate, (_req, res) => {
  res.json({ valid: true });
});

app.get('/api/content/site.json', authenticate, async (_req, res) => {
  try {
    res.json(JSON.parse(await readFile(SITE_PATH, 'utf-8')));
  } catch (err) {
    if (err.code === 'ENOENT') return res.status(404).json({ error: 'Content file not found' });
    res.status(500).json({ error: 'Failed to read content' });
  }
});

// Shape check for site.json — enough to stop a broken publish from blanking
// the public site. Matches SiteContent in admin/src/types.ts. Per-field
// character limits live in the editor (admin/src/sections.tsx); MAX_STRING is
// the server-side backstop.
const MAX_STRING = 1000;
function longestString(v) {
  if (typeof v === 'string') return v.length;
  if (v && typeof v === 'object') return Math.max(0, ...Object.values(v).map(longestString));
  return 0;
}

const YOUTUBE = /^https:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\//i;
const hasPicture = p => typeof p?.img?.src === 'string';

function validateSite(b) {
  if (!b || typeof b !== 'object' || Array.isArray(b)) return 'site.json must be an object';
  for (const k of ['hero', 'bio', 'release', 'events', 'booking']) {
    if (!b[k] || typeof b[k] !== 'object') return `Missing "${k}" section`;
  }
  const lists = { socials: b.socials, sets: b.sets, gallery: b.gallery, 'bio.paragraphs': b.bio.paragraphs, 'release.tags': b.release.tags, 'release.tracks': b.release.tracks, 'events.posters': b.events.posters, 'booking.labels': b.booking.labels };
  for (const [k, v] of Object.entries(lists)) {
    if (!Array.isArray(v)) return `"${k}" must be a list`;
  }
  if (!hasPicture(b.bio.portrait)) return 'The biography needs a portrait photo';
  if (!hasPicture(b.release.cover)) return 'The release needs cover art';
  if (b.gallery.some(g => !hasPicture(g?.image))) return 'Every gallery photo needs an image before publishing';
  if (b.events.posters.some(p => !hasPicture(p?.image) && !p?.video)) return 'Every poster needs an image or a video before publishing';
  if (b.release.tracks.some(t => !t?.audio)) return 'Every track needs an audio file before publishing';
  if (b.socials.some(s => !/^(https?:|mailto:)/i.test(s?.href ?? ''))) return 'Social links must start with https:// (or mailto:)';
  if (b.sets.some(u => !YOUTUBE.test(u))) return 'DJ sets must be YouTube links';
  if (longestString(b) > MAX_STRING) return `Text fields are limited to ${MAX_STRING} characters`;
  return null;
}

app.put('/api/content/site.json', authenticate, async (req, res) => {
  const error = validateSite(req.body);
  if (error) return res.status(400).json({ error });

  try {
    await backupFile(SITE_PATH);
    await writeAtomic(SITE_PATH, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to write content' });
  }
});

// --- UPLOAD ---
// Two kinds, chosen by the `kind` multipart field (mimetype alone is ambiguous —
// a PNG can be a photo or a logo):
//   kind=image → sharp pipeline → { kind: 'image', picture }   (photos)
//   kind=file  → stored as-is   → { kind: 'file', url }        (mp4 video, poster jpg, m4a/mp3 audio)
// The mimetype is client-supplied, so kind=file bytes are sniffed before they
// land on disk (kind=image is validated by sharp decoding it).
const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const EXT = { 'image/svg+xml': '.svg', 'image/png': '.png', 'image/jpeg': '.jpg', 'video/mp4': '.mp4', 'audio/mp4': '.m4a', 'audio/x-m4a': '.m4a', 'audio/mpeg': '.mp3' };
const isMp4 = b => b.subarray(4, 8).toString() === 'ftyp';
const LOOKS_LIKE = {
  'image/png': b => b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])),
  'image/jpeg': b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'video/mp4': isMp4,
  'audio/mp4': isMp4, // m4a is an MP4 container
  'audio/x-m4a': isMp4,
  'audio/mpeg': b => b.subarray(0, 3).toString() === 'ID3' || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0),
  // SVG is XML that can carry script; the site's CSP blocks inline script,
  // but there's no reason to store it at all.
  'image/svg+xml': b => /<svg[\s>]/i.test(b.subarray(0, 2048).toString()) && !/<script|\son\w+\s*=|javascript:/i.test(b.toString()),
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxFileSizeMB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (IMAGE_MIMES.includes(file.mimetype) || file.mimetype in EXT) cb(null, true);
    else cb(new Error('Please upload a JPG, PNG, WebP, MP4, M4A or MP3'));
  },
});

app.post('/api/upload', authenticate, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: `That file is too big — max ${config.maxFileSizeMB} MB.` });
    }
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });

  const kind = req.body.kind;
  const { mimetype, originalname } = req.file;
  let { buffer } = req.file;
  // Unique-per-upload name means no cache busting and no overwrite races. It's
  // built only from slugify() output and a fixed extension map, so it can't
  // escape UPLOADS_DIR.
  const id = `${slugify(basename(originalname, extname(originalname))) || 'upload'}-${Date.now().toString(36)}`;

  try {
    if (kind === 'image') {
      if (!IMAGE_MIMES.includes(mimetype)) return res.status(400).json({ error: 'Photos must be JPG, PNG or WebP' });
      const picture = await makePicture(buffer, id).catch(() => null);
      if (!picture) return res.status(400).json({ error: "That doesn't look like a photo" });
      return res.json({ kind: 'image', picture });
    }
    if (kind === 'file') {
      if (!(mimetype in EXT)) return res.status(400).json({ error: 'Video must be MP4, posters JPG/PNG, audio M4A/MP3' });
      if (!LOOKS_LIKE[mimetype](buffer)) return res.status(400).json({ error: `That file doesn't look like a valid ${EXT[mimetype].slice(1).toUpperCase()}` });
      if (mimetype === 'image/png' || mimetype === 'image/jpeg') {
        buffer = await sharp(buffer).rotate().resize({ width: MAX_WIDTH, withoutEnlargement: true }).toBuffer();
      }
      const name = id + EXT[mimetype];
      await writeAtomic(join(UPLOADS_DIR, name), buffer);
      return res.json({ kind: 'file', url: `${UPLOADS_URL}/${name}` });
    }
    res.status(400).json({ error: 'kind must be "image" or "file"' });
  } catch (err) {
    console.error('Upload processing error:', err);
    res.status(500).json({ error: 'Failed to process upload' });
  }
});
// ponytail: no DELETE — replaced uploads just sit on disk. Add a sweep of
// files not referenced by site.json if disk ever matters.

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// --- ERROR HANDLER ---
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error('Unhandled error:', err);
  res.status(status).json({ error: status >= 500 ? 'Internal server error' : err.message });
});

// --- START ---
// Loopback only — Caddy (prod) / Vite (dev) proxy /api to it.
const PORT = process.env.PORT || 3006;
const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`Admin API running on http://127.0.0.1:${PORT}`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

// close() drains in-flight requests so `systemctl restart` mid-publish can't
// truncate site.json (together with writeAtomic).
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
