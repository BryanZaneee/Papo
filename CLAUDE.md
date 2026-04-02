# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Electronic Press Kit (EPK) website for **PAPO**, a rapper, DJ, and producer based in Gainesville, FL. It is a single-page static site — no build tools, no frameworks, no package manager.

## Development

Serve with any static file server (required for audio playback and asset loading):
```
python3 -m http.server 8000
# or
npx serve .
```

There is no build step, no linting, and no tests.

## Architecture

- **`index.html`** — Lean HTML shell (~230 lines). Links to external CSS/JS. Contains all semantic sections: hero, bio grid, photo collage (12 items), music/tracklist (7 tracks with custom audio player), press quotes, contact/booking, footer.
- **`src/styles.css`** — All CSS including custom properties, section layouts, audio player styles, animations, and responsive breakpoints (900px).
- **`src/scroll-reveal.js`** — IntersectionObserver adds `.visible` class to `.reveal` elements on scroll.
- **`src/cursor-trail.js`** — Animated 8-dot trail following mouse position.
- **`src/orange-tree.js`** — Procedurally generated background tree (canopy, trunk, branches, roots) drawn on a full-page `<canvas>` that resizes with the document.
- **`src/audio-player.js`** — Custom styled audio player with play/pause, progress bar, seek, and time display. Only one track plays at a time.

## Key Design Patterns

- **CSS custom properties** defined on `:root` — `--bg`, `--bg-card`, `--fg`, `--fg-dim`, `--accent`, `--accent-2`, `--accent-3`
- **Tree visibility toggling**: Sections use `.section-tree-visible` (transparent, tree shows through) or `.section-tree-hidden` (solid `#1e1e1e` background)
- **Film grain overlay**: Applied via `body::before` using an inline SVG noise filter in CSS
- **Typography stack**: Anton (hero name), Bebas Neue (headings/labels), Space Mono (body), Playfair Display (editorial/italic), Oswald (loaded but lightly used)
- **Reveal animations**: Elements with class `.reveal` animate in on scroll; stagger via `.reveal-delay-1` through `.reveal-delay-4`
- **Audio player**: Track items with `data-src` attribute get custom players. `.track-info` div wraps clickable content, `.track-player` div holds progress bar and time.

## Deployment

- **GitHub:** `BryanZaneee/Papo` — push to `main` branch
- **VPS:** `ssh root@100.88.216.70` — SSH in and git pull to update the live site

## Assets

- `Assets/Music_/` — WAV audio files (7 tracks), referenced via `data-src` attributes on `.track-item` elements
- `Assets/Photos/` — JPG/JPEG images (13 photos): DSC02086.JPG used as hero image, remaining 12 in the collage grid
- `Assets/Videos/` — Empty directory
