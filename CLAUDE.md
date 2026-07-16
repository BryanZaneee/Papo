# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Electronic Press Kit (EPK) website for **PAPO** ("Ayo Papo" / "Papocito"), a rapper, DJ, and producer based in Gainesville, FL. Single-page static site — no build tools, no frameworks, no package manager, no dependencies (Google Fonts is the only external resource).

## Development

Serve with any static file server (audio playback and asset loading require HTTP, not `file://`):
```
python3 -m http.server 8000
# or
npx serve .
```

No build step, no linting, no tests.

## Architecture

`index.html` holds every section in order: game overlay, fixed backdrop layers (`.tree-bg` / `.tree-veil` / `.tree-glow` / `.grain`), fixed nav, hero, `.trunk` column (bio → releases), full-bleed DJ Event Archives poster wall (with two autoplaying muted YouTube set embeds in a `.sets-grid` beneath the posters), a second `.trunk` column (gallery), booking footer, fixed now-playing bar, one shared `<audio id="sharedAudio">`, lightbox. Two small inline scripts at the bottom: tree parallax (scroll → `background-position-y` on `#treeBg`) and IntersectionObserver play/pause for `video.autovid` clips.

- **`src/styles.css`** — all CSS: custom properties, backdrop layers, nav, section layouts, tracklist/now-playing player, poster strip, animations, one responsive breakpoint (900px).
- **`src/runner-game.js`** (~980 lines) — 3-lane pseudo-3D runner game (vanilla Canvas 2D) that gates the EPK. Player dodges/jumps obstacles and collects oranges. Renders on a full-screen `#gameOverlay` canvas. On finish or skip, the overlay fades out and reveals the EPK. Keyboard (arrows/WASD/space) + mobile swipe. States: `title → playing → crashed | finished`. **Loaded first and NOT deferred** (the other scripts are `defer`).
- **`src/audio-player.js`** — one shared `<audio>`; clicking a `.track-item[data-src]` row plays it (all 7 tracks), toggles `.playing` on the row, and drives the fixed `#nowPlaying` bar (title/feat from `data-title`/`data-feat`, play/pause, seek, times).
- **`src/scroll-reveal.js`** — IntersectionObserver adds `.visible` to `.reveal` elements on scroll.
- **`src/lightbox.js`** — click any `img.lb` (gallery) or `.lb-card img` (posters) to open `#lightbox` fullscreen; ESC or click to close.

## Key Design Patterns

- **CSS custom properties** on `:root` — palette `--bg-top`, `--bg-bot`, `--fg`, `--fg-dim`, `--fg-muted`, `--rule`, `--accent` (#ea5b1a), `--accent-soft` (#ffbf8a); hero-cutout positioning (`--cutout-*`).
- **Fixed tree backdrop**: `.tree-bg` is a fixed, full-viewport div showing `treebackground.png` at 250vh; scroll position maps 0→100% to its `background-position-y` so the page "climbs down" the tree. `.tree-veil` (vignette) and `.tree-glow` (orange bottom glow) sit above it; content sections use `z-index: 10`.
- **Hero** (kept from v1, do not restyle): background `<video>` (`Assets/Videos/hero-bg.mp4`, poster `hero-bg-poster.jpg`) with a veil overlay; glitch-text name plus a `.hero-cutout` PNG.
- **Trunk column**: bio/releases/gallery live in `.trunk` — a max-width 1200px translucent blurred column with hairline side borders.
- **Poster wall**: `.poster-strip` is a wrapped flex wall showing all 27 flyers at once; `.poster-card`s overlap via negative margins on both axes with alternating nth-child rotations; hover flattens/lifts. Every card image/video is cropped to a uniform 3/4 aspect (`object-fit: cover`) so rows align — without this, taller dark posters peek out behind neighbors and read as black bars. `.poster-video` cards hold inline muted looping videos (`video.autovid`, played only while on screen).
- **Typography**: Anton (hero name), Bebas Neue (game skip button), Bricolage Grotesque (section headings), Archivo (body), Space Mono (labels/mono) — all from Google Fonts.
- **Reveal animations**: `.reveal` elements animate in on scroll; stagger via `.reveal-delay-1`…`.reveal-delay-4`.
- **Game gate**: `body.game-active` (set in HTML) locks scroll and hides the nav + hero video until the game finishes/skips.

## Deployment

- **Live site:** https://ayopapo.studio (behind Cloudflare)
- **GitHub:** `BryanZaneee/Papo` — push to `main`
- **VPS:** `ssh root@100.88.216.70` — Caddy serves from `/var/www/papo-static/`

**IMPORTANT:** No auto-deploy. After every `git push` you must update the VPS:
```
ssh root@100.88.216.70 "cd /var/www/papo-static && git fetch origin && git checkout -f origin/main -- ."
```

When updating a CSS or JS file, bump its `?v=` query string in `index.html` to bust Cloudflare/browser cache (e.g. `styles.css?v=35`). Image assets are versioned the same way where cached (e.g. `treebackground.png?v=20260701`).

Note: `*.wav` is gitignored — the music files must be copied to the VPS manually if they ever change.

## Assets

- `Assets/Music_/` — 7 tracks served as 256k AAC `.m4a` (transcoded from the WAV masters with `ffmpeg -c:a aac -b:a 256k`), referenced via `data-src` on `.track-item` elements. Both `.wav` and `.m4a` are gitignored; the m4a files must be `scp`'d to the VPS. WAV masters stay local-only.
- `Assets/Photos/` — JPG/JPEG portraits, web-sized to ≤1600px q78 via `sips -Z 1600 -s format jpeg -s formatOptions 78` (full-res originals live in git history before Jul 2026); `IMG_1228.JPG` is the bio image, 12 fill the gallery masonry. All referenced with `?v=1` in both `index.html` and the `preloadEPKAssets()` list in `src/runner-game.js` — keep those two URL lists identical or images download twice.
- `Assets/Videos/` — `hero-bg.mp4` + `hero-bg-poster.jpg` (hero background), `Arcade Bar May23rd.mp4` (poster-wall video card).
- `Assets/Posters/` — `poster-01.jpg`…`poster-27.jpg`, 900px-wide web versions of the DJ event flyers, with baked-in IG-screenshot black bars auto-trimmed. Originals are local-only in `Assets/DJ Event Archives/` (gitignored); regenerate with `sips` (resize) + a Pillow row-scan trim (a row is "bar" when ≥92% of pixels have max channel ≤60).
- `Assets/flavor/` — `papo2.webp` (hero cutout) and `treebackground.webp` (the fixed tree backdrop), both `cwebp` conversions of the old PNGs (in git history).
- Root `Assets/` — `orange1.png` (64px favicon), `jookjook.webp` (album cover).

## Note

`AGENTS.md` is a Codex-targeted copy of this file and can drift; update both together when architecture changes.
