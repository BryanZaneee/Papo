// ═══════════════════════════════════════════
// MOTION ENHANCEMENTS — reveals, parallax, hover springs
// ═══════════════════════════════════════════
(function () {
    var animate = Motion.animate;
    var scroll = Motion.scroll;
    var inView = Motion.inView;
    var stagger = Motion.stagger;
    var hover = Motion.hover;

    // ── SCROLL REVEALS ───────────────────────
    // Group reveals by parent section for per-section stagger
    var sections = document.querySelectorAll('section, footer');

    sections.forEach(function (section) {
        var reveals = section.querySelectorAll('.reveal');
        if (!reveals.length) return;

        // Skip hero — it gets special treatment below
        if (section.classList.contains('hero')) return;

        inView(section, function () {
            animate(reveals, {
                opacity: [0, 1],
                y: [40, 0],
            }, {
                type: 'spring',
                stiffness: 80,
                damping: 18,
                mass: 0.8,
                delay: stagger(0.08),
            });
        }, { amount: 0.1, margin: '0px 0px -50px 0px' });
    });

    // Hero elements — more dramatic spring entrance
    var heroReveals = document.querySelectorAll('.hero .reveal');
    if (heroReveals.length) {
        inView('.hero', function () {
            animate(heroReveals, {
                opacity: [0, 1],
                y: [60, 0],
                scale: [0.97, 1],
            }, {
                type: 'spring',
                stiffness: 60,
                damping: 14,
                mass: 1,
                delay: stagger(0.12),
            });
        }, { amount: 0.05 });
    }

    // ── SCROLL-LINKED PARALLAX ───────────────
    var heroRight = document.querySelector('.hero-right');
    var heroLeft = document.querySelector('.hero-left');

    if (heroRight && heroLeft) {
        // Hero image drifts up slower than scroll — creates depth
        scroll(
            animate(heroRight, { y: [0, -60] }, { ease: 'linear' }),
            { target: document.querySelector('.hero'), offset: ['start start', 'end start'] }
        );

        // Hero text drifts slightly faster for parallax split
        scroll(
            animate(heroLeft, { y: [0, -30] }, { ease: 'linear' }),
            { target: document.querySelector('.hero'), offset: ['start start', 'end start'] }
        );
    }

    // Collage items drift with subtle parallax
    var collageItems = document.querySelectorAll('.collage-item');
    collageItems.forEach(function (item, i) {
        var drift = (i % 2 === 0) ? -20 : 20; // alternate drift direction
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
    // Collage items — spring scale on hover
    collageItems.forEach(function (item) {
        hover(item, function () {
            animate(item, { scale: 1.04 }, {
                type: 'spring', stiffness: 300, damping: 20,
            });
            return function () {
                animate(item, { scale: 1 }, {
                    type: 'spring', stiffness: 200, damping: 25,
                });
            };
        });
    });

    // Social links — spring translateX on hover
    var socialLinks = document.querySelectorAll('.social-link');
    socialLinks.forEach(function (link) {
        hover(link, function () {
            animate(link, { x: 8 }, {
                type: 'spring', stiffness: 400, damping: 15,
            });
            var arrow = link.querySelector('.arrow');
            if (arrow) {
                animate(arrow, { x: 6 }, {
                    type: 'spring', stiffness: 500, damping: 12,
                });
            }
            return function () {
                animate(link, { x: 0 }, {
                    type: 'spring', stiffness: 200, damping: 25,
                });
                if (arrow) {
                    animate(arrow, { x: 0 }, {
                        type: 'spring', stiffness: 200, damping: 25,
                    });
                }
            };
        });
    });

    // Press cards — spring lift
    var pressCards = document.querySelectorAll('.press-card');
    pressCards.forEach(function (card) {
        hover(card, function () {
            animate(card, { y: -6 }, {
                type: 'spring', stiffness: 300, damping: 20,
            });
            return function () {
                animate(card, { y: 0 }, {
                    type: 'spring', stiffness: 200, damping: 25,
                });
            };
        });
    });

    // Track items — spring indent on hover
    var trackItems = document.querySelectorAll('.track-item');
    trackItems.forEach(function (item) {
        hover(item, function () {
            animate(item, { x: 8 }, {
                type: 'spring', stiffness: 400, damping: 18,
            });
            return function () {
                animate(item, { x: 0 }, {
                    type: 'spring', stiffness: 200, damping: 25,
                });
            };
        });
    });

    // Orange images in bio — playful spring bounce on hover
    var orangeImgs = document.querySelectorAll('.bio-oranges img');
    orangeImgs.forEach(function (img) {
        hover(img, function () {
            animate(img, { scale: 1.12, rotate: Math.random() * 10 - 5 }, {
                type: 'spring', stiffness: 350, damping: 12,
            });
            return function () {
                animate(img, { scale: 1, rotate: 0 }, {
                    type: 'spring', stiffness: 200, damping: 20,
                });
            };
        });
    });
})();
