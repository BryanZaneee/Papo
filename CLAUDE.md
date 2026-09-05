# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Electronic Press Kit (EPK) website for **PAPO** ("Ayo Papo" / "Papocito"), a rapper, DJ, and producer based in Gainesville, FL. The public site is a single-page static site — no build step, no framework, Google Fonts is its only external resource. It renders its content from **`content/site.json`**, which the client edits himself through a password-protected **`/admin/`** editor (Vite + React, mirrors the one in `../jordie`) backed by a small Express API.

## Commands

```bash
npm install && (cd api && npm install)   # root = admin editor; api/ = Express server
cd api && npm run setup -- '<password>'  # writes api/config.json (bcrypt hash + JWT secret). Gitignored. Re-run to rotate.
npm run dev:api    # Express API on http://127.0.0.1:3006 (node --watch)
npm run dev        # Vite at http://localhost:5174/ — public site at /, editor at /admin/, proxies /api → 3006
npm run build      # typecheck + build the editor to dist/admin/ (the public site is not built)
npm run typecheck  # tsc --noEmit
./deploy/deploy.sh root@100.88.216.70   # build + rsync to the VPS (see Deployment)
```

Vite's root is the repo so the editor's live preview can iframe the real site on the same origin; `index.html` and `src/*.js` are served as plain static files.

## Content flow

```
content/site.json  ──fetch at boot──▶  index.html (src/content.js fills the DOM)
       ▲
       │ PUT /api/content/site.json (backup + atomic write)
       │
   /admin/ (admin/src)  ──POST /api/upload──▶  content/uploads/*  (sharp → JPEG/WebP/AVIF srcsets, or raw mp4/jpg/m4a/mp3)
```

- **`content/site.json`** is the single source of truth for every editable word, photo, track and link. Its shape is `SiteContent` in `admin/src/types.ts`. The copy in git is the **seed**; production has its own live copy that the deploy script never overwrites. Seed images point at the original files under `/Assets/…` (root-relative — the editor lives at `/admin/`) with empty `sources`; uploads get full srcsets.
- **`src/content.js`** — vanilla, `defer`, listed first. Fetches `/content/site.json` (`cache: 'no-cache'`) and fills the existing markup: `textContent` for single fields, escaped `innerHTML` for the lists (`.hero-links`/`.social-pills`, `.bio-text`, `.track-list`, `.poster-strip`, `#sets`, `.gallery-masonry`, `.booking-cards`). Only sections whose JSON changed are re-rendered (so the hero `<video>` is never restarted by an unrelated edit). Fires `content:rendered` when done. Bio paragraphs allow `**bold**` / `_italic_` only. With `?preview=1` it hides the game overlay and renders whatever the parent window `postMessage`s instead (the editor's live preview; same-origin checked). `{type:'scrollTo', target}` scrolls to a CSS selector: section content lands 24 px under the fixed nav, anything shorter than 60 % of the viewport is centred, and a target that doesn't exist yet (a row just added) is retried after the next render.
- `index.html` holds structure only — empty containers plus the hardcoded chrome (nav, section ids, now-playing bar, footer credit). **Don't put copy back into it.**
- `src/lightbox.js` and `src/audio-player.js` use delegated `click` handlers; `src/scroll-reveal.js` re-observes on `content:rendered`; `runner-game.js`'s `preloadEPKAssets()` reads the gallery URLs from the DOM. Everything that used to bind at load must keep working on rendered markup.
- No database, no router, no state library.

## Admin (`admin/`, served at `/admin/`)

Built for a non-technical user on a phone. **There is no link to it anywhere on the public site** and it's `noindex` — URL only.

- `api.ts` — `login`, `verify`, `getSite`, `putSite`, `uploadImage` (→ `Picture`), `uploadFile` (→ URL). Bearer JWT in `localStorage.admin_token`; a 401 dispatches `admin:signed-out`.
- `App.tsx` — SignIn → Home (one card per page section, `SCREENS`) → section screen. Draft `SiteContent` lives in memory; `dirty = JSON.stringify(site) !== original` shows the **Publish to site / Undo all** bar. Publish = one `PUT`.
- **Live preview**: `App.tsx` embeds `<iframe src="/?preview=1">` and posts `{type:'content', content}` (debounced 150 ms) on every edit. `preview.ts` posts `{type:'scrollTo', target}` when the screen changes (`SCREENS[].anchor`, a selector for the section's *content*) and when a list row is opened (`ListEditor` `onOpen` → `rowScroller('.track-list .track-item')` etc.), so the preview shows the exact row being edited. Desktop = editor left / preview right; ≤900px = **Edit | Preview** toggle.
- Field primitives, the API client, preview scroll helpers and the editor shell (`AdminShell`: sign-in, section cards, publish bar, mobile toggle, preview iframe) come from `bzs-edit/admin`; `App.tsx` only lists the screens and `sections.tsx` the per-section forms.
- `sections.tsx` — one editor per screen: hero, socials (shared by hero + footer), bio, release + tracks, events (poster wall: image or video card), sets (YouTube links), gallery, booking.
- `admin.css` — layout plus its own tokens/reset; the public `styles.css` is not loaded in the editor.

Plain-language rule: labels say "Photo", "Tagline", "Card label" — never `slug`, `srcset`, `JSON`.

## API (`api/server.js`, port 3006, loopback only)

`api/server.js` is three lines: it starts the shared [bzs-edit](https://github.com/BryanZaneee/bzs-edit) server with the `papo` site module (`bzs-edit/sites/papo.js` — port, `validateSite()`, allowed raw mimes incl. audio). Tests are `bzs-edit/tests/papo.test.js`. Same-origin through Caddy/Vite, so no CORS.

| Route | Auth | Notes |
|---|---|---|
| `POST /api/auth/login` | — | `{password}` → bcrypt compare → `{token}` (JWT, 30d). 5/min rate limit. |
| `GET /api/auth/verify` | Bearer | token check for the SPA on boot |
| `GET /api/content/site.json` | Bearer | the only content file — literal path |
| `PUT /api/content/site.json` | Bearer | `validateSite()` (shape; portrait + cover present; every gallery photo has an image, every poster an image or video, every track an audio file; social hrefs `https:`/`mailto:`; sets are YouTube links; no string > 1000 chars) → `backupFile()` (keeps `maxBackups` in `content/.backups/`) → `writeAtomic()` |
| `POST /api/upload` | Bearer | multipart `file` + `kind`. `kind=image` (jpg/png/webp) → sharp → widths `[320,640,1200,2000]` capped at the source × `{avif,webp,jpeg}` → `{picture}`. `kind=file` (mp4 / jpg / png / m4a / mp3 / svg) → bytes sniffed against the claimed type, jpg/png shrunk to ≤2000px, raw write → `{url}`. 100 MB cap. |

Upload filenames are server-generated (`slugify()` + a fixed extension map). Config (`api/config.json`, gitignored; template in `config.example.json`). Rotating the password with `npm run setup` also rotates the JWT secret, which signs everyone out. Per-field character limits are `max=` props in `sections.tsx`; `MAX_STRING` in the API is the backstop.

Deliberate omissions (`ponytail:` comments): no `DELETE` for uploads (orphans accumulate), no ffmpeg/audio transcode (he uploads a web-ready m4a/mp3 — see Assets for the recipe), no drag-and-drop reorder (▲▼ buttons).

## Architecture

`index.html` holds every section in order: game overlay, fixed backdrop layers (`.tree-bg` / `.tree-veil` / `.tree-glow` / `.grain`), fixed nav, hero, `.trunk` column (bio → releases), full-bleed DJ Event Archives poster wall (with autoplaying muted YouTube set embeds in a `.sets-grid` beneath the posters), a second `.trunk` column (gallery), booking footer, fixed now-playing bar, one shared `<audio id="sharedAudio">`, lightbox. One inline script at the bottom: tree parallax (scroll → `background-position-y` on `#treeBg`). The play/pause observer for `video.autovid` clips lives in `src/content.js`, which renders them.

- **`src/styles.css`** — all CSS: custom properties, backdrop layers, nav, section layouts, tracklist/now-playing player, poster strip, animations, one responsive breakpoint (900px).
- **`src/runner-game.js`** (~1050 lines) — 3-lane pseudo-3D runner game (vanilla Canvas 2D) that gates the EPK. Player dodges/jumps obstacles and collects oranges (count shown top-right). A clean run is ~10s (`FINISH_DISTANCE` / `BASE_SPEED` / `SPEED_RAMP`). Renders on a full-screen `#gameOverlay` canvas. Keyboard (arrows/WASD/space) + mobile swipe. States: `title → playing → crashed | finished`. **Loaded first and NOT deferred** (the other scripts are `defer`).
  - **Obstacle colour encodes affordance, not object identity** — `!jumpable` draws a tall red hazard barrier with chevrons, `jumpable` draws a low dark hurdle with a bright yellow band. Roadside decorations are desaturated, fogged (`fogAt()`) and pushed off the shoulder so scenery can never be confused with an obstacle. Don't reintroduce per-object art that breaks this.
  - **All drawing is in CSS pixels via the module-level `W`/`H`, never `canvas.width`/`canvas.height`** — `resize()` scales the backing store by `devicePixelRatio` (capped at `MAX_DPR`) and pre-transforms the context. Reading `canvas.width` in a draw function puts it at double coordinates.
  - Viewport-sized gradients (`skyGrad`/`groundGrad`/`roadGrad`/`vignette`) and the parallax `hills` are cached in `buildGradients()` on resize, not rebuilt per frame.
  - **Finishing is not terminal**: `#gameFinishActions` holds two real DOM buttons — `ENTER EPK` (`enterSite()`) and `KEEP RUNNING` (`goEndless()`, which drops the finish line and keeps oranges/speed climbing to `MAX_SPEED`). The old 2.5s auto-enter is gone.
  - The rAF loop stops (`running = false`) once the EPK is revealed; it used to render a full-screen canvas for the whole session.
- **`src/content.js`** — renders `content/site.json` into the page (see Content flow).
- **`src/audio-player.js`** — one shared `<audio>`; clicking a `.track-item[data-src]` row (delegated) plays it, toggles `.playing` on the row, and drives the fixed `#nowPlaying` bar (title/feat from `data-title`/`data-feat`, play/pause, seek, times).
- **`src/scroll-reveal.js`** — IntersectionObserver adds `.visible` to `.reveal` elements on scroll; re-observes on `content:rendered`.
- **`src/lightbox.js`** — click any `img.lb` (gallery) or `.lb-card img` (posters) to open `#lightbox` fullscreen (delegated); ESC or click to close.

## Key Design Patterns

- **CSS custom properties** on `:root` — palette `--bg-top`, `--bg-bot`, `--fg`, `--fg-dim`, `--fg-muted`, `--rule`, `--accent` (#ea5b1a), `--accent-soft` (#ffbf8a); hero-cutout positioning (`--cutout-*`).
- **Fixed tree backdrop**: `.tree-bg` is a fixed, full-viewport div showing `treebackground.png` at 250vh; scroll position maps 0→100% to its `background-position-y` so the page "climbs down" the tree. `.tree-veil` (vignette) and `.tree-glow` (orange bottom glow) sit above it; content sections use `z-index: 10`.
- **Hero** (kept from v1, do not restyle): background `<video>` (`Assets/Videos/hero-bg.mp4`, poster `hero-bg-poster.jpg`) with a veil overlay; glitch-text name plus a `.hero-cutout` PNG.
- **Trunk column**: bio/releases/gallery live in `.trunk` — a max-width 1200px translucent blurred column with hairline side borders.
- **Poster wall**: `.poster-strip` is a wrapped flex wall showing every flyer at once (order = `events.posters` order in `site.json`); `.poster-card`s overlap via negative margins on both axes with alternating nth-child rotations; hover flattens/lifts. Every card image/video is cropped to a uniform 3/4 aspect (`object-fit: cover`) so rows align — without this, taller dark posters peek out behind neighbors and read as black bars. `.poster-video` cards hold inline muted looping videos (`video.autovid`, played only while on screen).
- **Typography**: Anton (hero name), Bebas Neue (game skip button), Bricolage Grotesque (section headings), Archivo (body), Space Mono (labels/mono) — all from Google Fonts.
- **Reveal animations**: `.reveal` elements animate in on scroll; stagger via `.reveal-delay-1`…`.reveal-delay-4`.
- **Game gate**: `body.game-active` (set in HTML) locks scroll and hides the nav + hero video until the game finishes/skips. `content.js` removes it immediately in `?preview=1` mode.

## Deployment

- **Live site:** https://ayopapo.studio (behind Cloudflare). **Editor:** https://ayopapo.studio/admin/
- **GitHub:** `BryanZaneee/Papo`
- **VPS:** `ssh root@100.88.216.70` (shared with esme + jordie). Caddy web root `/var/www/papo-static/` (`index.html`, `src/`, `Assets/`, `admin/`); API + live content **outside** it at `/var/www/papo/{api,content}`. Ports on that box: 3003 esme, 3004 taken, 3005 jordie, **3006 papo**.

```bash
./deploy/deploy.sh root@100.88.216.70
```

The script builds the admin, rsyncs the site (excluding `*.wav`, `*.psd`, `DJ Event Archives/`) and `dist/admin/` into the web root (`--delete`), copies `api/` (including `config.json`), **seeds `content/` with `--ignore-existing`** — it never overwrites the client's live `site.json` or uploads — runs `npm install --omit=dev`, installs `deploy/papo-api.service` (PORT=3006, sandboxed: `ProtectSystem=strict`, `ReadWritePaths=/var/www/papo/content`) and restarts it. It replaced the old `git checkout -f origin/main` deploy; the stale `.git` in the web root is harmless.

The Caddy block is `deploy/caddy-papo.conf` — paste it over the `ayopapo.studio` block in `/etc/caddy/Caddyfile` (~line 424) and `systemctl reload caddy` the first time (the script tells you if it's missing). It spells out its own headers instead of `import sechdrs` because the editor's live preview iframes the site: `X-Frame-Options: SAMEORIGIN` / `frame-ancestors 'self'`. CSP: new external resources (iframes, scripts) must be allowlisted there. Don't run `caddy validate` over SSH — it false-fails because the Cloudflare DNS token env var only exists in the systemd unit.

**Cloudflare caches everything on this zone** (a cache rule with an edge TTL that overrides the origin's `no-cache` — `/` has been seen as an 8-hour-old edge HIT). Consequences: bump the `?v=` query string on any CSS/JS you change in `index.html`; `src/content.js` fetches `site.json` with a unique query string so a publish shows up immediately; old admin bundles are kept on deploy so a stale cached `/admin/` still works. After a deploy that changes `index.html`, purge the cache in the Cloudflare dashboard (or add a cache rule that bypasses `/`, `/admin/*`, `/api/*`, `/content/*` — then this paragraph can go).

To pull the client's live content back into the repo: `rsync -az --exclude .backups root@100.88.216.70:/var/www/papo/content/ content/`, then commit.

## Assets

- `Assets/Music_/` — the 7 seed tracks as 256k AAC `.m4a` (transcoded from the WAV masters with `ffmpeg -c:a aac -b:a 256k`), referenced by `release.tracks[].audio` in `site.json`. Both `.wav` and `.m4a` are gitignored; the deploy script rsyncs the m4a files (never the WAVs). Tracks the client adds through the editor land in `content/uploads/`.
- `Assets/Photos/` — JPG/JPEG seed portraits, web-sized to ≤1600px q78 via `sips -Z 1600 -s format jpeg -s formatOptions 78` (full-res originals live in git history before Jul 2026); `IMG_1228.JPG` is the bio image, 12 fill the gallery masonry — all referenced from `site.json`. Photos the client uploads go through sharp into `content/uploads/`.
- `Assets/Videos/` — `hero-bg.mp4` + `hero-bg-poster.jpg` (hero background), `Arcade Bar May23rd.mp4` (poster-wall video card).
- `Assets/Posters/` — `poster-01.jpg`…`poster-27.jpg`, the seed poster wall (900px-wide web versions of the DJ event flyers), with baked-in IG-screenshot black bars auto-trimmed. Originals are local-only in `Assets/DJ Event Archives/` (gitignored); regenerate with `sips` (resize) + a Pillow row-scan trim (a row is "bar" when ≥92% of pixels have max channel ≤60).
- `Assets/flavor/` — `papo2.webp` (hero cutout) and `treebackground.webp` (the fixed tree backdrop), both `cwebp` conversions of the old PNGs (in git history).
- Root `Assets/` — `orange1.png` (64px favicon), `jookjook.webp` (seed album cover).
- `content/uploads/` — everything uploaded through the editor. Unique names per upload (`<slug>-<base36 time>[-<w>].<ext>`), so the CDN cache can be immutable.

## Note

`AGENTS.md` is a Codex-targeted copy of this file and can drift; update both together when architecture changes.
