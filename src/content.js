// Fills the page from content/site.json — the single source of truth every
// editable word, photo, track and link comes from (edited at /admin/).
// At /?preview=1 (the editor's live preview) it instead renders whatever the
// parent window posts, and skips the runner game.
(function () {
    var ENT = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ENT[c]; }); }
    function q(sel) { return document.querySelector(sel); }
    function text(sel, v) { var el = q(sel); if (el) el.textContent = v; }
    // **bold** and _italic_ — the only markup the bio editor allows.
    function rich(s) {
        return esc(s)
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/(^|[\s(])_(.+?)_(?=[\s.,;:!?)]|$)/g, '$1<em>$2</em>');
    }
    // Seed images have no srcset (they're the original files); uploads do.
    function img(p, alt, cls, sizes) {
        if (!p || !p.img) return '';
        var srcset = p.sources && p.sources.jpeg ? ' srcset="' + esc(p.sources.jpeg) + '" sizes="' + sizes + '"' : '';
        return '<img' + (cls ? ' class="' + cls + '"' : '') + ' src="' + esc(p.img.src) + '"' + srcset + ' alt="' + esc(alt) + '" loading="lazy">';
    }
    function ytId(u) {
        var m = String(u).match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/);
        return m && m[1];
    }

    // Inline poster-wall clips: play only while on screen.
    var io = 'IntersectionObserver' in window && new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (e.isIntersecting) e.target.play().catch(function () {});
            else e.target.pause();
        });
    }, { threshold: 0.2 });
    function watchVideos() {
        if (io) document.querySelectorAll('video.autovid').forEach(function (v) { io.observe(v); });
    }

    var R = {
        hero: function (h) {
            text('.glitch-text', h.name);
            text('.hero-subtitle', h.subtitle);
            var meta = q('.hero-meta > span');
            if (meta) meta.innerHTML = '<span class="dot"></span> ' + esc(h.location);
            text('.footer-line span:first-child', '© ' + new Date().getFullYear() + ' ' + h.name);
            // Only touch the video when it actually changed — reassigning the
            // src restarts playback, and the preview re-renders on every keystroke.
            var v = q('.hero-video'), src = v && v.querySelector('source');
            if (!v) return;
            if (v.getAttribute('poster') !== h.poster) v.setAttribute('poster', h.poster);
            if (src.getAttribute('src') !== h.video) {
                src.setAttribute('src', h.video);
                v.load();
                v.play().catch(function () {});
            }
        },
        socials: function (list) {
            var html = list.map(function (s) {
                return '<a href="' + esc(s.href) + '" target="_blank" rel="noopener">' + esc(s.label) + '</a>';
            }).join('');
            q('.hero-links').innerHTML = html;
            q('.social-pills').innerHTML = html;
        },
        bio: function (b) {
            q('.bio-image-frame').innerHTML = img(b.portrait, b.captionName + ' portrait', '', '(max-width: 900px) 100vw, 40vw');
            q('.bio-image-caption').innerHTML = '<span>' + esc(b.captionName) + '</span><span>' + esc(b.captionPlace) + '</span>';
            text('#bio .section-heading', b.heading);
            q('.bio-text').innerHTML = b.paragraphs.map(function (p) { return '<p>' + rich(p) + '</p>'; }).join('');
        },
        release: function (r) {
            q('.release-cover').innerHTML = img(r.cover, r.title + ' — cover art', '', '(max-width: 900px) 100vw, 40vw');
            q('.release-tags').innerHTML = r.tags.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');
            text('.release-title', r.title);
            text('.release-blurb', r.blurb);
            text('.track-indicia', r.indicia);
            text('.np-label', 'Now Playing · ' + r.title);
            q('.track-list').innerHTML = r.tracks.map(function (t, i) {
                return '<div class="track-item" data-src="' + esc(t.audio) + '" data-title="' + esc(t.title) + '" data-feat="' + esc(t.feat) + '">' +
                    '<span class="track-num">' + String(i + 1).padStart(2, '0') + '</span>' +
                    '<button class="track-btn" aria-label="Play ' + esc(t.title) + '"></button>' +
                    '<div class="track-meta"><div class="track-name">' + esc(t.title) +
                    (t.badge ? ' <span class="track-badge">' + esc(t.badge) + '</span>' : '') + '</div>' +
                    (t.feat ? '<div class="track-feat">' + esc(t.feat) + '</div>' : '') + '</div>' +
                    '<div class="track-eq"><span></span><span></span><span></span><span></span><span></span></div>' +
                    '</div>';
            }).join('');
        },
        events: function (e) {
            text('#archives .section-heading', e.heading);
            q('.poster-strip').innerHTML = e.posters.map(function (p) {
                if (p.video) {
                    return '<div class="poster-card poster-video">' +
                        '<video class="autovid" muted loop playsinline preload="metadata"><source src="' + esc(p.video) + '" type="video/mp4"></video>' +
                        (p.caption ? '<div class="poster-video-tag">' + esc(p.caption) + '</div>' : '') + '</div>';
                }
                return '<div class="poster-card lb-card">' + img(p.image, p.caption || 'PAPO event poster', '', '(max-width: 900px) 60vw, 25vw') + '</div>';
            }).join('');
            watchVideos();
        },
        sets: function (urls) {
            q('#sets').innerHTML = urls.map(function (u, i) {
                var id = ytId(u);
                if (!id) return '';
                return '<div class="set-embed reveal reveal-delay-' + (i % 4 + 1) + '">' +
                    '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&amp;mute=1&amp;playsinline=1" title="PAPO — DJ set" loading="lazy" ' +
                    'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>';
            }).join('');
        },
        gallery: function (g) {
            q('.gallery-masonry').innerHTML = g.map(function (p) { return img(p.image, p.alt, 'lb', '(max-width: 900px) 50vw, 30vw'); }).join('');
        },
        booking: function (b) {
            text('#book .eyebrow', b.eyebrow);
            text('.booking-heading', b.heading);
            text('.booking-sub', b.sub);
            q('.booking-cards').innerHTML = b.labels.map(function (l, i) {
                return '<a href="mailto:' + esc(b.email) + '" class="booking-card reveal reveal-delay-' + (i % 4 + 1) + '">' +
                    '<div class="booking-card-label">' + esc(l) + '</div></a>';
            }).join('');
        }
    };

    // Re-render only the sections whose data changed, so typing in the bio
    // doesn't rebuild the poster wall (or restart the hero video).
    var prev = {};
    function render(site) {
        Object.keys(R).forEach(function (k) {
            var json = JSON.stringify(site[k]);
            if (json === prev[k]) return;
            prev[k] = json;
            R[k](site[k]);
        });
        document.dispatchEvent(new Event('content:rendered'));
        if (pendingScroll !== null) scrollTo(pendingScroll);
    }

    // Editor → preview: scroll to a selector ("" = top). Sections sit under a
    // fixed nav and carry ~110px of top padding, so we aim at their content
    // and clear the nav; small things (a track row, one poster) are centred.
    // A target that doesn't exist yet (a row just added — the content message
    // lands 150 ms later) is retried once after the next render.
    var pendingScroll = null;
    function scrollTo(target) {
        pendingScroll = null;
        if (!target) return window.scrollTo({ top: 0, behavior: 'smooth' });
        var el = document.querySelector(target);
        if (!el) { pendingScroll = target; return; }
        var nav = document.querySelector('.site-nav');
        var navH = nav ? nav.offsetHeight : 0;
        var r = el.getBoundingClientRect();
        var top = r.height < window.innerHeight * 0.6
            ? r.top + window.scrollY - (window.innerHeight - r.height) / 2
            : r.top + window.scrollY - navH - 24;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }

    if (new URLSearchParams(location.search).has('preview')) {
        var overlay = document.getElementById('gameOverlay');
        if (overlay) overlay.style.display = 'none';
        document.body.classList.remove('game-active');
        // Also stops the game's rAF loop. ponytail: it scrolls to top 800 ms
        // after load; a section picked in that window jumps once, then behaves.
        if (window.skipRunnerGame) window.skipRunnerGame();
        window.addEventListener('message', function (e) {
            if (e.source !== window.parent || e.origin !== location.origin) return;
            var d = e.data || {};
            if (d.type === 'content') render(d.content);
            if (d.type === 'scrollTo') scrollTo(d.target);
        });
    } else {
        fetch('/content/site.json', { cache: 'no-cache' })
            .then(function (r) { return r.json(); })
            .then(render)
            .catch(function (err) { console.error('Could not load content/site.json', err); });
    }
})();
