// ═══════════════════════════════════════════
// SCROLL REVEALS + MOTION ENHANCEMENTS
// ═══════════════════════════════════════════
(function () {
    // ── FALLBACK: IntersectionObserver reveals ──
    // Always set up the CSS-based reveals so content is never invisible
    var revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.15 });
        revealEls.forEach(function (el) { observer.observe(el); });
    } else {
        // No IntersectionObserver — just show everything
        revealEls.forEach(function (el) { el.classList.add('visible'); });
    }

    // ── MOTION.JS ENHANCEMENTS (optional) ──
    if (typeof Motion === 'undefined') return;

    var animate = Motion.animate;
    var scroll = Motion.scroll;
    var inView = Motion.inView;
    var stagger = Motion.stagger;
    var hover = Motion.hover;

    // ── SCROLL-LINKED PARALLAX ───────────────
    var heroRight = document.querySelector('.hero-right');
    var heroLeft = document.querySelector('.hero-left');

    if (heroRight && heroLeft) {
        scroll(
            animate(heroRight, { y: [0, -60] }, { ease: 'linear' }),
            { target: document.querySelector('.hero'), offset: ['start start', 'end start'] }
        );
        scroll(
            animate(heroLeft, { y: [0, -30] }, { ease: 'linear' }),
            { target: document.querySelector('.hero'), offset: ['start start', 'end start'] }
        );
    }

    // Collage items drift with subtle parallax
    var collageItems = document.querySelectorAll('.collage-item');
    collageItems.forEach(function (item, i) {
        var drift = (i % 2 === 0) ? -20 : 20;
        scroll(
            animate(item, { y: [drift, -drift] }, { ease: 'linear' }),
            { target: item, offset: ['start end', 'end start'] }
        );
    });

    // Album cover subtle scale on scroll
    var albumCover = document.querySelector('.album-cover');
    if (albumCover) {
        scroll(
            animate(albumCover, { scale: [0.95, 1.02] }, { ease: 'linear' }),
            { target: albumCover, offset: ['start end', 'end start'] }
        );
    }

    // ── HOVER SPRINGS ────────────────────────
    collageItems.forEach(function (item) {
        hover(item, function () {
            animate(item, { scale: 1.04 }, { type: 'spring', stiffness: 300, damping: 20 });
            return function () {
                animate(item, { scale: 1 }, { type: 'spring', stiffness: 200, damping: 25 });
            };
        });
    });

    var socialLinks = document.querySelectorAll('.social-link');
    socialLinks.forEach(function (link) {
        hover(link, function () {
            animate(link, { x: 8 }, { type: 'spring', stiffness: 400, damping: 15 });
            var arrow = link.querySelector('.arrow');
            if (arrow) {
                animate(arrow, { x: 6 }, { type: 'spring', stiffness: 500, damping: 12 });
            }
            return function () {
                animate(link, { x: 0 }, { type: 'spring', stiffness: 200, damping: 25 });
                if (arrow) {
                    animate(arrow, { x: 0 }, { type: 'spring', stiffness: 200, damping: 25 });
                }
            };
        });
    });

    var pressCards = document.querySelectorAll('.press-card');
    pressCards.forEach(function (card) {
        hover(card, function () {
            animate(card, { y: -6 }, { type: 'spring', stiffness: 300, damping: 20 });
            return function () {
                animate(card, { y: 0 }, { type: 'spring', stiffness: 200, damping: 25 });
            };
        });
    });

    var trackItems = document.querySelectorAll('.track-item');
    trackItems.forEach(function (item) {
        hover(item, function () {
            animate(item, { x: 8 }, { type: 'spring', stiffness: 400, damping: 18 });
            return function () {
                animate(item, { x: 0 }, { type: 'spring', stiffness: 200, damping: 25 });
            };
        });
    });

    var orangeImgs = document.querySelectorAll('.bio-oranges img');
    orangeImgs.forEach(function (img) {
        hover(img, function () {
            animate(img, { scale: 1.12, rotate: Math.random() * 10 - 5 }, { type: 'spring', stiffness: 350, damping: 12 });
            return function () {
                animate(img, { scale: 1, rotate: 0 }, { type: 'spring', stiffness: 200, damping: 20 });
            };
        });
    });
})();
