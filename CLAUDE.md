# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Electronic Press Kit (EPK) website for **PAPO** ("Ayo Papo" / "Papocito"), a rapper, DJ, and producer based in Gainesville, FL. Single-page static site — no build tools, no frameworks, no package manager, no npm dependencies (one CDN `<script>` for Motion One).

## Development

Serve with any static file server (audio playback and asset loading require HTTP, not `file://`):
```
python3 -m http.server 8000
# or
npx serve .
```

No build step, no linting, no tests.

## Architecture

`index.html` is a ~310-line shell that links external CSS/JS and holds every section: game overlay, hero, bio, releases (album feature + tracklist), photo collage (10 items), contact/booking, footer, lightbox. Sections bio→footer are wrapped in a single `.trunk-bg` div carrying the tree background image.

- **`src/styles.css`** (~1300 lines) — all CSS: custom properties, section layouts, audio player, animations, responsive breakpoints (900px).
- **`src/runner-game.js`** (~980 lines) — 3-lane pseudo-3D runner game (vanilla Canvas 2D) that gates the EPK. Player dodges/jumps obstacles and collects oranges. Renders on a full-screen `#gameOverlay` canvas. On finish or skip, the overlay fades out and reveals the EPK. Keyboard (arrows/WASD/space) + mobile swipe. States: `title → playing → crashed | finished`. **Loaded first and NOT deferred** (the other scripts are `defer`).
- **`src/audio-player.js`** — custom styled player for `.track-item[data-src]` elements: play/pause, progress bar, seek, time. Only one track plays at a time; toggles a `.playing` class on the active track.
- **`src/audio-reactive.js`** (~330 lines) — hooks the Web Audio API into the playing `<audio>` element and drives page-wide visuals from live frequency data (hero pulse, album-cover glow, cursor-trail scaling, a lava-lamp canvas in the music section, social/footer effects). Flow: `.playing` class → MutationObserver → intercepted `play()` connects an AnalyserNode → per-frame `tick()` maps bass/mids/treble/energy to CSS inline styles and the `--audio-bass` / `--audio-energy` custom properties. Depends on the Motion One CDN global (`Motion.animate`).
- **`src/scroll-reveal.js`** — IntersectionObserver adds `.visible` to `.reveal` elements on scroll.
- **`src/cursor-trail.js`** — animated 8-dot trail following the mouse.
- **`src/lightbox.js`** — click any `.collage-item img` to open `#lightbox` fullscreen; ESC or click to close.

## Key Design Patterns

- **CSS custom properties** on `:root` — palette `--bg`, `--bg-card`, `--bg-rule`, `--fg`, `--fg-dim`, `--fg-muted`, `--accent` (orange), `--accent-2`, `--accent-3`, `--hot`; hero-cutout positioning (`--cutout-*`); audio-reactive (`--audio-bass`, `--audio-energy`, set from JS).
- **Tree visibility toggling**: sections use `.section-tree-visible` (transparent, tree image shows through) or `.section-tree-hidden` (solid background).
- **Hero**: background `<video>` (`Assets/Videos/hero-bg.mp4`, poster `hero-bg-poster.jpg`) with a veil overlay; glitch-text name plus a `.hero-cutout` PNG.
- **Film grain overlay**: `body::before` with an inline SVG noise filter in CSS.
- **Typography**: Anton (hero name), Bebas Neue (headings/labels), Space Mono (body), Playfair Display + Fraunces (editorial/italic) — all from Google Fonts.
- **Reveal animations**: `.reveal` elements animate in on scroll; stagger via `.reveal-delay-1`…`.reveal-delay-4`.
- **Game gate**: `body.game-active` (set in HTML) locks scroll and hides the tree background until the game finishes/skips.

## Deployment

- **Live site:** https://ayopapo.studio (behind Cloudflare)
- **GitHub:** `BryanZaneee/Papo` — push to `main`
- **VPS:** `ssh root@100.88.216.70` — Caddy serves from `/var/www/papo-static/`

**IMPORTANT:** No auto-deploy. After every `git push` you must update the VPS:
```
ssh root@100.88.216.70 "cd /var/www/papo-static && git fetch origin && git checkout -f origin/main -- ."
```

When updating a CSS or JS file, bump its `?v=` query string in `index.html` to bust Cloudflare/browser cache (e.g. `styles.css?v=32`). Image assets are versioned the same way where cached (e.g. `treebackground.png?v=20260427`).

## Assets

- `Assets/Music_/` — 7 WAV tracks, referenced via `data-src` on `.track-item` elements.
- `Assets/Photos/` — JPG/JPEG portraits; `IMG_1228.JPG` is the bio image, 10 others fill the collage grid.
- `Assets/Videos/` — `hero-bg.mp4` + `hero-bg-poster.jpg` (hero background).
- `Assets/flavor/` — cutout PNGs (`papo1`, `papo2`, `orange-can`) and `treebackground.png` (the trunk background).
- Root `Assets/` — `orange1–4.png`, `jookjook.png` (album cover), favicon.

## Note

`AGENTS.md` is a Codex-targeted copy of this file and can drift; update both together when architecture changes.
