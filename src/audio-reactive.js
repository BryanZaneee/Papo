// ═══════════════════════════════════════════
// AUDIO-REACTIVE ANIMATIONS
// Connects Web Audio API to Motion-driven visuals
// ═══════════════════════════════════════════
(function () {
    var animate = Motion.animate;
    var audioCtx = null;
    var analyser = null;
    var sourceMap = new WeakMap(); // track which Audio elements already have a source node
    var freqData = null;
    var running = false;

    // Smoothed values (avoids jitter)
    var bass = 0;
    var mids = 0;
    var treble = 0;
    var energy = 0;

    var SMOOTHING = 0.3; // lower = smoother, higher = more reactive

    // ── ELEMENTS WE'LL ANIMATE ───────────────
    var treeBg = document.getElementById('treeBg');
    var treeCanvas = document.getElementById('treeCanvas');
    var heroName = document.querySelector('.hero-name');
    var albumCover = document.querySelector('.album-cover-img');
    var trailDots = null; // grabbed after cursor-trail.js creates them
    var root = document.documentElement;

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

        // Resume context if suspended (autoplay policy)
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        // Only create one MediaElementSource per Audio element
        if (!sourceMap.has(audioEl)) {
            var source = audioCtx.createMediaElementSource(audioEl);
            source.connect(analyser);
            analyser.connect(audioCtx.destination);
            sourceMap.set(audioEl, source);
        }

        if (!running) {
            running = true;
            if (treeBg) treeBg.classList.add('audio-active');
            requestAnimationFrame(tick);
        }
    }

    function disconnectVisuals() {
        running = false;
        if (treeBg) treeBg.classList.remove('audio-active');

        // Reset all reactive values smoothly
        bass = 0;
        mids = 0;
        treble = 0;
        energy = 0;
        applyVisuals();
    }

    // ── PER-FRAME ANALYSIS ───────────────────
    function tick() {
        if (!running) return;

        analyser.getByteFrequencyData(freqData);

        // Split frequency bins into bands
        var rawBass = avg(freqData, 0, 10);       // ~0-300Hz (kick, sub-bass)
        var rawMids = avg(freqData, 10, 60);      // ~300Hz-4.5kHz (vocals, snare)
        var rawTreble = avg(freqData, 60, 128);   // ~4.5kHz+ (hats, air)
        var rawEnergy = avg(freqData, 0, 128);    // full spectrum

        // Normalize to 0-1
        rawBass /= 255;
        rawMids /= 255;
        rawTreble /= 255;
        rawEnergy /= 255;

        // Smooth
        bass = bass + (rawBass - bass) * SMOOTHING;
        mids = mids + (rawMids - mids) * SMOOTHING;
        treble = treble + (rawTreble - treble) * SMOOTHING;
        energy = energy + (rawEnergy - energy) * SMOOTHING;

        applyVisuals();
        requestAnimationFrame(tick);
    }

    function avg(arr, start, end) {
        var sum = 0;
        for (var i = start; i < end && i < arr.length; i++) sum += arr[i];
        return sum / (end - start);
    }

    // ── APPLY VISUALS ────────────────────────
    function applyVisuals() {
        // Expose values as CSS custom properties (other CSS can react)
        root.style.setProperty('--audio-bass', bass.toFixed(3));
        root.style.setProperty('--audio-energy', energy.toFixed(3));

        // 1. Tree canvas — opacity pulses with bass
        if (treeCanvas) {
            var treeOpacity = 0.35 + bass * 0.2;
            treeCanvas.style.opacity = treeOpacity;
        }

        // 2. Hero name — subtle scale pulse on bass hits
        if (heroName && bass > 0.15) {
            var nameScale = 1 + bass * 0.025;
            heroName.style.transform = 'scale(' + nameScale + ')';
        } else if (heroName) {
            heroName.style.transform = '';
        }

        // 3. Album cover — glow intensity tied to energy
        if (albumCover) {
            var glowSize = Math.floor(8 + energy * 30);
            var glowAlpha = (0.15 + energy * 0.5).toFixed(2);
            albumCover.style.filter = 'drop-shadow(0 0 ' + glowSize + 'px rgba(232,122,32,' + glowAlpha + '))';
        }

        // 4. Cursor trail — dots get bigger/brighter with energy
        if (!trailDots) {
            trailDots = document.querySelectorAll('div[style*="z-index: 10000"][style*="border-radius"]');
        }
        if (trailDots.length) {
            var trailScale = 1 + energy * 1.5;
            var trailOpacity = Math.min(1, 0.6 + energy * 0.8);
            trailDots.forEach(function (dot, i) {
                var s = trailScale - i * 0.1;
                dot.style.width = (4 - i * 0.4) * s + 'px';
                dot.style.height = (4 - i * 0.4) * s + 'px';
                dot.style.opacity = Math.max(0.05, (0.6 - i * 0.07) * trailOpacity);
            });
        }

        // 5. Playing track item — pulse border glow
        var playingTrack = document.querySelector('.track-item.playing');
        if (playingTrack) {
            var trackGlow = Math.floor(4 + bass * 16);
            var trackAlpha = (0.1 + bass * 0.6).toFixed(2);
            playingTrack.style.boxShadow = '0 0 ' + trackGlow + 'px rgba(232,122,32,' + trackAlpha + ')';
        }

        // 6. Film grain intensity — energy drives grain opacity
        // body::before is the grain layer. We drive its opacity via a CSS var.
        root.style.setProperty('--grain-opacity', (0.03 + energy * 0.06).toFixed(3));

        // 7. Bio accent color — shifts warmer on bass
        if (bass > 0.2) {
            var r = Math.floor(192 + bass * 40);
            var g = Math.floor(106 - bass * 30);
            root.style.setProperty('--accent', 'rgb(' + r + ',' + g + ',26)');
        } else {
            root.style.setProperty('--accent', '#c06a1a');
        }
    }

    // ── HOOK INTO AUDIO PLAYER ───────────────
    // The audio-player.js creates Audio elements and toggles .playing class.
    // We observe class changes on .track-item elements to detect play/pause.
    function observePlayback() {
        var trackItems = document.querySelectorAll('.track-item[data-src]');
        if (!trackItems.length) return;

        // MutationObserver watches for .playing class changes
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (m) {
                var item = m.target;
                if (item.classList.contains('playing')) {
                    // Find the Audio element — audio-player.js creates them in closure,
                    // but we can grab it from the DOM event or reconstruct from data-src.
                    // Easier: find the audio via the src attribute.
                    var src = item.dataset.src;
                    var audioEls = document.querySelectorAll('audio');
                    // audio-player uses new Audio() which aren't in DOM —
                    // so we intercept at the HTMLMediaElement.play level.
                    onTrackPlay(src);
                } else {
                    // Check if anything is still playing
                    var stillPlaying = document.querySelector('.track-item.playing');
                    if (!stillPlaying) {
                        disconnectVisuals();
                        // Clean up track glow
                        item.style.boxShadow = '';
                    }
                }
            });
        });

        trackItems.forEach(function (item) {
            observer.observe(item, { attributes: true, attributeFilter: ['class'] });
        });
    }

    // Intercept Audio.play() to capture the Audio element reference
    var origPlay = HTMLMediaElement.prototype.play;
    var lastConnectedSrc = null;
    HTMLMediaElement.prototype.play = function () {
        var self = this;
        if (self.src || self.currentSrc) {
            // Only connect for our track items
            var trackItems = document.querySelectorAll('.track-item[data-src]');
            trackItems.forEach(function (item) {
                // Match by checking if the audio src ends with the data-src
                if (self.src && (self.src.indexOf(item.dataset.src) !== -1 ||
                    decodeURIComponent(self.src).indexOf(item.dataset.src) !== -1)) {
                    connectAudio(self);
                }
            });
        }
        return origPlay.apply(self, arguments);
    };

    function onTrackPlay(src) {
        // The connectAudio happens via the play() intercept above
        // This is just for backup / future use
    }

    // ── INIT ─────────────────────────────────
    observePlayback();

    // Also apply grain opacity CSS var support
    // Patch body::before to use the variable (done via CSS)
})();
