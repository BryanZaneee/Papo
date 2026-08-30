/**
 * API smoke test — the one check that fails if auth, publish validation,
 * backups or the upload pipeline break. Node's built-in runner, no deps.
 *
 *   npm test        (from the repo root; api/ must be `npm install`ed)
 */
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';

const API_DIR = join(import.meta.dirname, '..', 'api');
const require = createRequire(join(API_DIR, 'package.json'));
const bcrypt = require('bcrypt');
const sharp = require('sharp');

const TMP = join(import.meta.dirname, '.test-tmp');
const PORT = 3199;
const BASE = `http://127.0.0.1:${PORT}`;
const PASSWORD = 'test-password';

const seed = () => ({
  hero: { name: 'AYOPAPO', subtitle: 'Rapper', location: 'GNV', video: '/Assets/Videos/hero-bg.mp4', poster: '/Assets/Videos/hero-bg-poster.jpg' },
  socials: [{ label: 'Instagram', href: 'https://www.instagram.com/papocitoo/' }],
  bio: { heading: 'Biography', portrait: pic('/Assets/Photos/IMG_1228.JPG'), captionName: 'Papocito', captionPlace: 'GNV', paragraphs: ['hi'] },
  release: { title: 'JWTS', cover: pic('/Assets/jookjook.webp'), tags: ['2026'], blurb: 'b', indicia: 'i', tracks: [{ title: 'Gushy', feat: '', badge: '', audio: '/Assets/Music_/1.m4a' }] },
  events: { heading: 'DJ Events', posters: [{ image: pic('/Assets/Posters/poster-01.jpg'), caption: '' }, { video: '/Assets/Videos/a.mp4', caption: 'Arcade' }] },
  sets: ['https://www.youtube.com/watch?v=2tmAzKEgYls'],
  gallery: [{ image: pic('/Assets/Photos/P1010002.JPG'), alt: 'backstage' }],
  booking: { eyebrow: 'Booking', heading: 'BOOK PAPO', sub: 's', email: 'e@x.com', labels: ['Booking'] },
});
const pic = (src) => ({ sources: { jpeg: `${src} 100w` }, img: { src, w: 100, h: 100 } });

let server;
let token;

async function api(path, { method = 'GET', body, headers = {}, auth = true } = {}) {
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }
  const res = await fetch(BASE + path, { method, body, headers });
  return { status: res.status, body: await res.json().catch(() => null) };
}

before(async () => {
  await rm(TMP, { recursive: true, force: true });
  await mkdir(join(TMP, 'content'), { recursive: true });
  await writeFile(join(TMP, 'content/site.json'), JSON.stringify(seed()));
  await writeFile(
    join(TMP, 'config.json'),
    JSON.stringify({
      contentDir: join(TMP, 'content'),
      maxBackups: 2,
      maxFileSizeMB: 1,
      jwtExpiresIn: '1h',
      jwtSecret: randomBytes(32).toString('hex'),
      passwordHash: await bcrypt.hash(PASSWORD, 4),
    }),
  );
  server = spawn(process.execPath, ['server.js'], {
    cwd: API_DIR,
    env: { ...process.env, PORT, CONFIG_PATH: join(TMP, 'config.json') },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  await new Promise((resolve, reject) => {
    server.stdout.on('data', (d) => d.toString().includes('running') && resolve());
    server.on('exit', (code) => reject(new Error(`server exited ${code}`)));
  });
});

after(async () => {
  server?.kill();
  await rm(TMP, { recursive: true, force: true });
});

describe('auth', () => {
  it('rejects a wrong password and unauthenticated reads', async () => {
    assert.equal((await api('/api/auth/login', { method: 'POST', body: { password: 'nope' }, auth: false })).status, 401);
    assert.equal((await api('/api/content/site.json', { auth: false })).status, 401);
  });
  it('issues a token that verifies', async () => {
    const res = await api('/api/auth/login', { method: 'POST', body: { password: PASSWORD }, auth: false });
    assert.equal(res.status, 200);
    token = res.body.token;
    assert.equal((await api('/api/auth/verify')).status, 200);
  });
});

describe('content', () => {
  it('reads the seed', async () => {
    const res = await api('/api/content/site.json');
    assert.equal(res.status, 200);
    assert.equal(res.body.hero.name, 'AYOPAPO');
  });
  it('refuses other files and broken shapes', async () => {
    assert.equal((await api('/api/content/other.json')).status, 404);
    assert.equal((await api('/api/content/site.json', { method: 'PUT', body: { hero: {} } })).status, 400);
    const put = async (mutate) => {
      const next = seed();
      mutate(next);
      return (await api('/api/content/site.json', { method: 'PUT', body: next })).status;
    };
    assert.equal(await put((s) => s.gallery.push({ alt: 'no image yet' })), 400);
    assert.equal(await put((s) => s.events.posters.push({ caption: 'empty card' })), 400);
    assert.equal(await put((s) => s.release.tracks.push({ title: 'x', feat: '', badge: '', audio: '' })), 400);
    assert.equal(await put((s) => s.socials.push({ label: 'x', href: 'javascript:alert(1)' })), 400);
    assert.equal(await put((s) => s.sets.push('https://vimeo.com/123')), 400);
    assert.equal(await put((s) => s.sets.push('https://youtu.be/B8RhRzGLGMg')), 200);
    assert.equal(await put((s) => s.socials.push({ label: 'x', href: 'https://instagram.com/x' })), 200);
    assert.equal(await put((s) => (s.bio.paragraphs[0] = 'a'.repeat(1001))), 400);
  });
  it('writes atomically with a pruned backup trail', async () => {
    for (const name of ['A', 'B', 'C']) {
      const next = seed();
      next.hero.name = name;
      assert.equal((await api('/api/content/site.json', { method: 'PUT', body: next })).status, 200);
    }
    assert.equal((await api('/api/content/site.json')).body.hero.name, 'C');
    const backups = (await readdir(join(TMP, 'content/.backups'))).filter((f) => f.endsWith('.json'));
    assert.equal(backups.length, 2); // maxBackups
    assert.equal((await readdir(join(TMP, 'content'))).filter((f) => f.endsWith('.tmp')).length, 0);
  });
});

describe('upload', () => {
  const jpeg = () => sharp({ create: { width: 700, height: 500, channels: 3, background: '#c8a94e' } }).jpeg().toBuffer();

  it('kind=image → Picture with avif/webp/jpeg srcsets, widths capped at the source', async () => {
    const fd = new FormData();
    fd.append('kind', 'image');
    fd.append('file', new Blob([await jpeg()], { type: 'image/jpeg' }), 'My Photo.jpg');
    const res = await api('/api/upload', { method: 'POST', body: fd });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    const { picture } = res.body;
    assert.deepEqual(Object.keys(picture.sources), ['avif', 'webp', 'jpeg']);
    assert.match(picture.sources.jpeg, /my-photo-\w+-320\.jpg 320w, .*-640\.jpg 640w, .*-700\.jpg 700w$/);
    assert.deepEqual([picture.img.w, picture.img.h], [700, 500]);
    assert.equal((await readdir(join(TMP, 'content/uploads'))).length, 9); // 3 widths × 3 formats
    const url = new URL(picture.img.src, BASE).pathname.replace('/content/uploads/', '');
    assert.ok((await readFile(join(TMP, 'content/uploads', url))).length > 0);
  });

  it('caps oversized photos at 2000px', async () => {
    const wide = await sharp({ create: { width: 3000, height: 200, channels: 3, background: '#000' } }).jpeg().toBuffer();
    const fd = new FormData();
    fd.append('kind', 'image');
    fd.append('file', new Blob([wide], { type: 'image/jpeg' }), 'wide.jpg');
    const { picture } = (await api('/api/upload', { method: 'POST', body: fd })).body;
    assert.match(picture.sources.jpeg, /-2000\.jpg 2000w$/);
    assert.equal(picture.img.w, 2000);
  });

  it('kind=file → raw URL; wrong kind/type/size rejected', async () => {
    let fd = new FormData();
    fd.append('kind', 'file');
    fd.append('file', new Blob(['<svg xmlns="http://www.w3.org/2000/svg"/>'], { type: 'image/svg+xml' }), 'logo.svg');
    let res = await api('/api/upload', { method: 'POST', body: fd });
    assert.equal(res.status, 200);
    assert.match(res.body.url, /^\/content\/uploads\/logo-\w+\.svg$/);

    fd = new FormData();
    fd.append('kind', 'image');
    fd.append('file', new Blob(['x'], { type: 'image/svg+xml' }), 'logo.svg');
    assert.equal((await api('/api/upload', { method: 'POST', body: fd })).status, 400); // svg is not a photo

    fd = new FormData();
    fd.append('kind', 'file');
    fd.append('file', new Blob(['x'], { type: 'text/html' }), 'evil.html');
    assert.equal((await api('/api/upload', { method: 'POST', body: fd })).status, 400);

    // Client mimetype is not trusted: bytes are sniffed, SVG script is refused.
    for (const [bytes, type] of [
      ['<html><script>1</script></html>', 'image/svg+xml'],
      ['not audio', 'audio/mp4'],
      ['<svg xmlns="http://www.w3.org/2000/svg"><script>1</script></svg>', 'image/svg+xml'],
      ['<svg xmlns="http://www.w3.org/2000/svg" onload="1"/>', 'image/svg+xml'],
      ['not a png', 'image/png'],
      ['not a video', 'video/mp4'],
    ]) {
      fd = new FormData();
      fd.append('kind', 'file');
      fd.append('file', new Blob([bytes], { type }), 'x');
      assert.equal((await api('/api/upload', { method: 'POST', body: fd })).status, 400, `${type}: ${bytes}`);
    }

    // Track audio: m4a is an MP4 container (ftyp at byte 4), mp3 starts with ID3 or a frame sync.
    const m4a = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypM4A '), Buffer.alloc(64)]);
    fd = new FormData();
    fd.append('kind', 'file');
    fd.append('file', new Blob([m4a], { type: 'audio/mp4' }), 'Gushy ft. Localhotboy.m4a');
    res = await api('/api/upload', { method: 'POST', body: fd });
    assert.equal(res.status, 200);
    assert.match(res.body.url, /^\/content\/uploads\/gushy-ft-localhotboy-\w+\.m4a$/);
    fd = new FormData();
    fd.append('kind', 'file');
    fd.append('file', new Blob([Buffer.concat([Buffer.from('ID3'), Buffer.alloc(32)])], { type: 'audio/mpeg' }), 'x.mp3');
    assert.equal((await api('/api/upload', { method: 'POST', body: fd })).status, 200);
    fd = new FormData();
    fd.append('kind', 'file');
    fd.append('file', new Blob(['not audio'], { type: 'audio/mpeg' }), 'x.mp3');
    assert.equal((await api('/api/upload', { method: 'POST', body: fd })).status, 400);

    // Raster covers/posters are shrunk to 2000px like photos.
    const png = await sharp({ create: { width: 2500, height: 100, channels: 4, background: '#0000' } }).png().toBuffer();
    fd = new FormData();
    fd.append('kind', 'file');
    fd.append('file', new Blob([png], { type: 'image/png' }), 'poster.png');
    res = await api('/api/upload', { method: 'POST', body: fd });
    assert.equal(res.status, 200);
    const { width } = await sharp(join(TMP, 'content/uploads', res.body.url.replace('/content/uploads/', ''))).metadata();
    assert.equal(width, 2000);

    fd = new FormData();
    fd.append('kind', 'file');
    fd.append('file', new Blob([Buffer.alloc(1.5 * 1024 * 1024)], { type: 'video/mp4' }), 'big.mp4');
    res = await api('/api/upload', { method: 'POST', body: fd });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /too big/);
  });
});
