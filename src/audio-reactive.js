// ═══════════════════════════════════════════
// AUDIO-REACTIVE ANIMATIONS
// ═══════════════════════════════════════════
//
// When a track plays, this hooks into Web Audio API and drives
// visual effects across the page: tree glow, hero pulse, album
// cover glow, cursor trail scaling, lava lamp in music section,
// contact/social link glow, footer letter-spacing, and more.
//
// Flow: audio-player.js toggles .playing class → MutationObserver
// detects it → intercepted HTMLMediaElement.play() connects the
// Audio element to an AnalyserNode → tick() reads frequency data
// every frame → applyVisuals() maps bass/mids/treble/energy to
// CSS inline styles on cached DOM elements.
//
(function () {
    var animate = Motion.animate;
    var audioCtx = null;
    var analyser = null;
    var sourceMap = new WeakMap();
    var freqData = null;
    var running = false;

    // Smoothed frequency band values (0-1)
    var bass = 0, mids = 0, treble = 0, energy = 0;
    var SMOOTHING = 0.3;

    // ── CACHED DOM REFS ──────────────────────
    var treeBg = document.getElementById('treeBg');
    var treeCanvas = document.getElementById('treeCanvas');
    var heroName = document.querySelector('.hero-name');
    var albumCover = document.querySelector('.album-cover-img');
    var contactHeading = document.querySelector('.contact-heading');
    var socialLinks = document.querySelectorAll('.social-link');
    var followLabel = document.querySelector('.contact-right .section-label');
    var footerEl = document.querySelector('.footer');
    var footerSpans = footerEl ? footerEl.querySelectorAll('span') : [];
    var trailDots = null;
    var root = document.documentElement;

    // ── LAVA LAMP (music section background) ─
    var musicSection = document.querySelector('.music-section');
    var lavaCanvas = null;
    var lavaCtx = null;
    var blobs = [];
    var BLOB_COUNT = 6;
    var LAVA_SMOOTHING = 0.06;
    var dominantHue = 20;
    var targetHue = 20;

    function initLavaLamp() {
        if (!musicSection || lavaCanvas) return;

        lavaCanvas = document.createElement('canvas');
        lavaCanvas.className = 'lava-lamp-canvas';
        musicSection.style.position = 'relative';
        musicSection.insertBefore(lavaCanvas, musicSection.firstChild);
        lavaCtx = lavaCanvas.getContext('2d');
        sizeLavaCanvas();

        for (var i = 0; i < BLOB_COUNT; i++) {
            blobs.push({
                x: Math.random(),
                y: Math.random(),
                vx: (Math.random() - 0.5) * 0.0003,
                vy: (Math.random() - 0.5) * 0.0003,
                radius: 0.15 + Math.random() * 0.2,
                hueOffset: (i / BLOB_COUNT) * 60 - 30,
                phase: Math.random() * Math.PI * 2,
            });
        }
        window.addEventListener('resize', sizeLavaCanvas);
    }

    function sizeLavaCanvas() {
        if (!lavaCanvas || !musicSection) return;
        lavaCanvas.width = musicSection.offsetWidth;
        lavaCanvas.height = musicSection.offsetHeight;
    }

    function findDominantHue() {
        if (!freqData) return;
        // Strongest bin in 60Hz-3kHz range (bins 2-40)
        var maxVal = 0, maxBin = 10;
        for (var i = 2; i < 40; i++) {
            if (freqData[i] > maxVal) { maxVal = freqData[i]; maxBin = i; }
        }
        targetHue = 15 + (maxBin / 40) * 280;
    }

    function drawLavaLamp() {
        if (!lavaCtx || !lavaCanvas) return;
        var w = lavaCanvas.width, h = lavaCanvas.height;
        if (w === 0 || h === 0) { sizeLavaCanvas(); w = lavaCanvas.width; h = lavaCanvas.height; }

        dominantHue += (targetHue - dominantHue) * LAVA_SMOOTHING;

        lavaCtx.fillStyle = '#140e06';
        lavaCtx.fillRect(0, 0, w, h);

        var time = performance.now() * 0.001;

        for (var i = 0; i < blobs.length; i++) {
            var b = blobs[i];

            // Bass pushes blobs up, mids shift sideways
            b.x += b.vx + Math.sin(time * 0.3 + b.phase) * 0.0008 + mids * 0.001 * Math.cos(b.phase);
            b.y += b.vy + Math.cos(time * 0.2 + b.phase) * 0.0006 - bass * 0.002;

            // Wrap edges
            if (b.x < -0.2) b.x = 1.2; if (b.x > 1.2) b.x = -0.2;
            if (b.y < -0.2) b.y = 1.2; if (b.y > 1.2) b.y = -0.2;

            var pr = b.radius * (1 + energy * 0.4 + Math.sin(time * 0.5 + b.phase) * 0.1) * Math.min(w, h);
            var px = b.x * w, py = b.y * h;
            var hue = (dominantHue + b.hueOffset + 360) % 360;
            var sat = Math.floor(50 + energy * 40);
            var light = Math.floor(15 + energy * 20);
            var alpha = 0.3 + energy * 0.35;

            var grad = lavaCtx.createRadialGradient(px, py, 0, px, py, pr);
            grad.addColorStop(0, 'hsla(' + hue + ',' + sat + '%,' + (light + 15) + '%,' + alpha.toFixed(2) + ')');
            grad.addColorStop(0.4, 'hsla(' + hue + ',' + sat + '%,' + light + '%,' + (alpha * 0.6).toFixed(2) + ')');
            grad.addColorStop(1, 'hsla(' + hue + ',' + sat + '%,' + (light - 5) + '%,0)');
            lavaCtx.fillStyle = grad;
            lavaCtx.fillRect(0, 0, w, h);
        }

        // Vignette to blend edges
        var vignette = lavaCtx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.7);
        vignette.addColorStop(0, 'rgba(20,14,6,0)');
        vignette.addColorStop(1, 'rgba(20,14,6,0.6)');
        lavaCtx.fillStyle = vignette;
        lavaCtx.fillRect(0, 0, w, h);
    }

    // ── WEB AUDIO SETUP ─────────────────────

    function initAudioContext() {
        if (audioCtx) return;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        freqData = new Uint8Array(analyser.frequencyBinCount);
    }

    function connectAudio(audioEl) {
        if (!audioCtx) initAudioContext();
        if (audioCtx.state === 'suspended') audioCtx.resume();

        if (!sourceMap.has(audioEl)) {
            var source = audioCtx.createMediaElementSource(audioEl);
            source.connect(analyser);
            analyser.connect(audioCtx.destination);
            sourceMap.set(audioEl, source);
        }

        if (!running) {
            running = true;
            if (treeBg) treeBg.classList.add('audio-active');
            initLavaLamp();
            if (lavaCanvas) lavaCanvas.style.opacity = '1';
            requestAnimationFrame(tick);
        }
    }

    function disconnectVisuals() {
        running = false;
        if (treeBg) treeBg.classList.remove('audio-active');

        bass = 0; mids = 0; treble = 0; energy = 0;
        applyVisuals();

        // Clear inline styles
        if (contactHeading) { contactHeading.style.transform = ''; contactHeading.style.textShadow = ''; }
        if (followLabel) followLabel.style.textShadow = '';
        socialLinks.forEach(function (l) { l.style.textShadow = ''; l.style.borderColor = ''; });
        footerSpans.forEach(function (s) { s.style.letterSpacing = ''; s.style.textShadow = ''; });

        if (lavaCanvas) {
            animate(lavaCanvas, { opacity: 0 }, { duration: 1.5 }).then(function () {
                if (lavaCanvas) lavaCanvas.style.opacity = '0';
            });
        }
    }

    // ── PER-FRAME LOOP ──────────────────────

    function tick() {
        if (!running) return;

        analyser.getByteFrequencyData(freqData);

        // Split into bands and normalize to 0-1
        var rawBass   = avg(freqData, 0, 10) / 255;
        var rawMids   = avg(freqData, 10, 60) / 255;
        var rawTreble = avg(freqData, 60, 128) / 255;
        var rawEnergy = avg(freqData, 0, 128) / 255;

        // Smooth
        bass   += (rawBass - bass) * SMOOTHING;
        mids   += (rawMids - mids) * SMOOTHING;
        treble += (rawTreble - treble) * SMOOTHING;
        energy += (rawEnergy - energy) * SMOOTHING;

        findDominantHue();
        drawLavaLamp();
        applyVisuals();
        requestAnimationFrame(tick);
    }

    function avg(arr, start, end) {
        var sum = 0;
        for (var i = start; i < end && i < arr.length; i++) sum += arr[i];
        return sum / (end - start);
    }

    // ── APPLY VISUALS (maps audio bands to styles) ──

    function applyVisuals() {
        // CSS custom properties for any CSS-side reactivity
        root.style.setProperty('--audio-bass', bass.toFixed(3));
        root.style.setProperty('--audio-energy', energy.toFixed(3));

        // 1. Tree opacity pulses with bass
        if (treeCanvas) treeCanvas.style.opacity = 0.35 + bass * 0.2;

        // 2. Hero name scales on bass hits
        if (heroName) heroName.style.transform = bass > 0.15 ? 'scale(' + (1 + bass * 0.025) + ')' : '';

        // 3. Album cover glow with energy
        if (albumCover) {
            var gs = Math.floor(8 + energy * 30);
            albumCover.style.filter = 'drop-shadow(0 0 ' + gs + 'px rgba(232,122,32,' + (0.15 + energy * 0.5).toFixed(2) + '))';
        }

        // 4. Cursor trail dots scale + brighten with energy
        if (!trailDots) trailDots = document.querySelectorAll('.cursor-trail-dot');
        if (trailDots.length) {
            var ts = 1 + energy * 1.5;
            var to = Math.min(1, 0.6 + energy * 0.8);
            trailDots.forEach(function (dot, i) {
                var s = ts - i * 0.1;
                dot.style.width = (4 - i * 0.4) * s + 'px';
                dot.style.height = (4 - i * 0.4) * s + 'px';
                dot.style.opacity = Math.max(0.05, (0.6 - i * 0.07) * to);
            });
        }

        // 5. Playing track border glow
        var pt = document.querySelector('.track-item.playing');
        if (pt) pt.style.boxShadow = '0 0 ' + Math.floor(4 + bass * 16) + 'px rgba(232,122,32,' + (0.1 + bass * 0.6).toFixed(2) + ')';

        // 6. Film grain opacity
        root.style.setProperty('--grain-opacity', (0.03 + energy * 0.06).toFixed(3));

        // 7. Accent color shifts warmer on bass
        if (bass > 0.2) {
            root.style.setProperty('--accent', 'rgb(' + Math.floor(192 + bass * 40) + ',' + Math.floor(106 - bass * 30) + ',26)');
        } else {
            root.style.setProperty('--accent', '#c06a1a');
        }

        // 8. "BOOK Papo" heading — scale + glow on bass
        if (contactHeading) {
            if (bass > 0.12) {
                contactHeading.style.transform = 'scale(' + (1 + bass * 0.03) + ')';
                contactHeading.style.textShadow = '0 0 ' + Math.floor(6 + bass * 24) + 'px rgba(232,122,32,' + (0.1 + bass * 0.5).toFixed(2) + ')';
            } else {
                contactHeading.style.transform = '';
                contactHeading.style.textShadow = '';
            }
        }

        // 9. Social links — staggered glow on mids
        socialLinks.forEach(function (link, i) {
            var val = Math.max(0, mids - i * 0.08);
            if (val > 0.1) {
                link.style.textShadow = '0 0 ' + Math.floor(4 + val * 18) + 'px rgba(232,122,32,' + (0.1 + val * 0.5).toFixed(2) + ')';
                link.style.borderColor = 'rgba(232,122,32,' + (0.2 + val * 0.5).toFixed(2) + ')';
            } else {
                link.style.textShadow = '';
                link.style.borderColor = '';
            }
        });

        // 10. Follow label — pulses with treble
        if (followLabel) {
            followLabel.style.textShadow = treble > 0.1
                ? '0 0 ' + Math.floor(4 + treble * 12) + 'px rgba(232,122,32,' + (0.15 + treble * 0.6).toFixed(2) + ')'
                : '';
        }

        // 11. Footer text — letter-spacing + glow on energy
        footerSpans.forEach(function (span) {
            if (energy > 0.1) {
                span.style.letterSpacing = (0.15 + energy * 0.3).toFixed(2) + 'em';
                span.style.textShadow = '0 0 ' + Math.floor(3 + energy * 12) + 'px rgba(232,122,32,' + (0.1 + energy * 0.4).toFixed(2) + ')';
            } else {
                span.style.letterSpacing = '';
                span.style.textShadow = '';
            }
        });
    }

    // ── PLAYBACK DETECTION ──────────────────
    //
    // Two mechanisms work together:
    // 1. MutationObserver watches .track-item for .playing class changes
    //    → on stop, clears glow and disconnects visuals if nothing plays
    // 2. Patched HTMLMediaElement.play() intercepts the actual Audio.play()
    //    call from audio-player.js → connects the element to the analyser

    function observePlayback() {
        var trackItems = document.querySelectorAll('.track-item[data-src]');
        if (!trackItems.length) return;

        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (m) {
                var item = m.target;
                if (!item.classList.contains('playing')) {
                    item.style.boxShadow = '';
                    if (!document.querySelector('.track-item.playing')) disconnectVisuals();
                }
            });
        });

        trackItems.forEach(function (item) {
            observer.observe(item, { attributes: true, attributeFilter: ['class'] });
        });
    }

    // Intercept Audio.play() to capture the Audio element for connectAudio()
    var origPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
        var self = this;
        if (self.src || self.currentSrc) {
            document.querySelectorAll('.track-item[data-src]').forEach(function (item) {
                if (self.src && (self.src.indexOf(item.dataset.src) !== -1 ||
                    decodeURIComponent(self.src).indexOf(item.dataset.src) !== -1)) {
                    connectAudio(self);
                }
            });
        }
        return origPlay.apply(self, arguments);
    };

    // ── INIT ─────────────────────────────────
    observePlayback();
})();
