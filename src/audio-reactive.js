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
    var contactHeading = document.querySelector('.contact-heading');
    var socialLinks = document.querySelectorAll('.social-link');
    var followLabel = document.querySelector('.contact-right .section-label');
    var footerEl = document.querySelector('.footer');
    var footerSpans = footerEl ? footerEl.querySelectorAll('span') : [];
    var trailDots = null; // grabbed after cursor-trail.js creates them
    var root = document.documentElement;

    // ── LAVA LAMP CANVAS ─────────────────────
    var musicSection = document.querySelector('.music-section');
    var lavaCanvas = null;
    var lavaCtx = null;
    var blobs = [];
    var BLOB_COUNT = 6;
    // Extra-slow smoothing for lava lamp (organic, flowing)
    var LAVA_SMOOTHING = 0.06;
    // Dominant frequency hue — slowly drifts with harmonic content
    var dominantHue = 20; // start at orange
    var targetHue = 20;

    function initLavaLamp() {
        if (!musicSection || lavaCanvas) return;

        lavaCanvas = document.createElement('canvas');
        lavaCanvas.className = 'lava-lamp-canvas';
        musicSection.style.position = 'relative';
        musicSection.insertBefore(lavaCanvas, musicSection.firstChild);

        lavaCtx = lavaCanvas.getContext('2d');
        sizeLavaCanvas();

        // Seed blobs with random positions and velocities
        for (var i = 0; i < BLOB_COUNT; i++) {
            blobs.push({
                x: Math.random(),           // 0-1 normalized position
                y: Math.random(),
                vx: (Math.random() - 0.5) * 0.0003,  // very slow drift
                vy: (Math.random() - 0.5) * 0.0003,
                radius: 0.15 + Math.random() * 0.2,   // normalized radius
                hueOffset: (i / BLOB_COUNT) * 60 - 30, // spread around dominant hue
                phase: Math.random() * Math.PI * 2,     // for organic pulsing
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

        // Find the frequency bin with the strongest energy in the musical range
        // Bins 2-40 roughly cover 60Hz-3kHz (where musical key lives)
        var maxVal = 0;
        var maxBin = 10;
        for (var i = 2; i < 40; i++) {
            if (freqData[i] > maxVal) {
                maxVal = freqData[i];
                maxBin = i;
            }
        }

        // Map the dominant bin to a hue on the color wheel
        // Low bins (bass) → warm (reds/oranges 0-40)
        // Mid bins → purples/blues (240-300)
        // Higher bins → cyans/greens (120-200)
        var t = maxBin / 40; // 0-1
        // Warm palette: cycle through orange → magenta → purple → teal → back
        targetHue = 15 + t * 280; // 15-295 range
    }

    function drawLavaLamp() {
        if (!lavaCtx || !lavaCanvas) return;

        var w = lavaCanvas.width;
        var h = lavaCanvas.height;
        if (w === 0 || h === 0) {
            sizeLavaCanvas();
            w = lavaCanvas.width;
            h = lavaCanvas.height;
        }

        // Drift dominant hue very slowly toward target
        dominantHue = dominantHue + (targetHue - dominantHue) * LAVA_SMOOTHING;

        // Base background — dark version of the section bg
        lavaCtx.fillStyle = '#140e06';
        lavaCtx.fillRect(0, 0, w, h);

        // Update and draw each blob
        var time = performance.now() * 0.001;

        for (var i = 0; i < blobs.length; i++) {
            var b = blobs[i];

            // Audio-driven movement: bass pushes blobs, mids shift sideways
            var bassForce = bass * 0.002;
            var midsForce = mids * 0.001;

            b.x += b.vx + Math.sin(time * 0.3 + b.phase) * 0.0008 + midsForce * Math.cos(b.phase);
            b.y += b.vy + Math.cos(time * 0.2 + b.phase) * 0.0006 - bassForce;

            // Wrap around edges with padding
            if (b.x < -0.2) b.x = 1.2;
            if (b.x > 1.2) b.x = -0.2;
            if (b.y < -0.2) b.y = 1.2;
            if (b.y > 1.2) b.y = -0.2;

            // Blob radius pulses with audio energy
            var pulseRadius = b.radius * (1 + energy * 0.4 + Math.sin(time * 0.5 + b.phase) * 0.1);
            var px = b.x * w;
            var py = b.y * h;
            var pr = pulseRadius * Math.min(w, h);

            // Color: dominant hue + this blob's offset, saturation driven by energy
            var hue = (dominantHue + b.hueOffset + 360) % 360;
            var sat = Math.floor(50 + energy * 40);
            var light = Math.floor(15 + energy * 20);
            var alpha = 0.3 + energy * 0.35;

            // Draw radial gradient blob
            var grad = lavaCtx.createRadialGradient(px, py, 0, px, py, pr);
            grad.addColorStop(0, 'hsla(' + hue + ',' + sat + '%,' + (light + 15) + '%,' + alpha.toFixed(2) + ')');
            grad.addColorStop(0.4, 'hsla(' + hue + ',' + sat + '%,' + light + '%,' + (alpha * 0.6).toFixed(2) + ')');
            grad.addColorStop(1, 'hsla(' + hue + ',' + sat + '%,' + (light - 5) + '%,0)');

            lavaCtx.fillStyle = grad;
            lavaCtx.fillRect(0, 0, w, h);
        }

        // Subtle vignette to blend edges into the page
        var vignette = lavaCtx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.7);
        vignette.addColorStop(0, 'rgba(20,14,6,0)');
        vignette.addColorStop(1, 'rgba(20,14,6,0.6)');
        lavaCtx.fillStyle = vignette;
        lavaCtx.fillRect(0, 0, w, h);
    }

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
            initLavaLamp();
            if (lavaCanvas) {
                lavaCanvas.style.opacity = '1';
            }
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

        // Clear inline styles on reactive elements
        if (contactHeading) { contactHeading.style.transform = ''; contactHeading.style.textShadow = ''; }
        if (followLabel) { followLabel.style.textShadow = ''; }
        socialLinks.forEach(function (link) { link.style.textShadow = ''; link.style.borderColor = ''; });
        footerSpans.forEach(function (span) { span.style.letterSpacing = ''; span.style.textShadow = ''; });

        // Fade out lava lamp canvas
        if (lavaCanvas) {
            Motion.animate(lavaCanvas, { opacity: 0 }, { duration: 1.5 }).then(function () {
                if (lavaCanvas) lavaCanvas.style.opacity = '0';
            });
        }
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

        // Lava lamp: find dominant frequency and render
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

        // 8. "BOOK Papo" heading — scale pulse + glow on bass
        if (contactHeading) {
            if (bass > 0.12) {
                var bookScale = 1 + bass * 0.03;
                var bookGlow = Math.floor(6 + bass * 24);
                var bookAlpha = (0.1 + bass * 0.5).toFixed(2);
                contactHeading.style.transform = 'scale(' + bookScale + ')';
                contactHeading.style.textShadow = '0 0 ' + bookGlow + 'px rgba(232,122,32,' + bookAlpha + ')';
            } else {
                contactHeading.style.transform = '';
                contactHeading.style.textShadow = '';
            }
        }

        // 9. Social links (Follow section) — staggered glow + slight x-shift on mids
        if (socialLinks.length) {
            socialLinks.forEach(function (link, i) {
                var offset = (i * 0.08); // stagger the reaction
                var bandVal = Math.max(0, mids - offset);
                if (bandVal > 0.1) {
                    var linkGlow = Math.floor(4 + bandVal * 18);
                    var linkAlpha = (0.1 + bandVal * 0.5).toFixed(2);
                    link.style.textShadow = '0 0 ' + linkGlow + 'px rgba(232,122,32,' + linkAlpha + ')';
                    link.style.borderColor = 'rgba(232,122,32,' + (0.2 + bandVal * 0.5).toFixed(2) + ')';
                } else {
                    link.style.textShadow = '';
                    link.style.borderColor = '';
                }
            });
        }

        // 10. Follow label — pulses with treble
        if (followLabel && treble > 0.1) {
            var followAlpha = (0.15 + treble * 0.6).toFixed(2);
            followLabel.style.textShadow = '0 0 ' + Math.floor(4 + treble * 12) + 'px rgba(232,122,32,' + followAlpha + ')';
        } else if (followLabel) {
            followLabel.style.textShadow = '';
        }

        // 11. Footer text — subtle letter-spacing + glow on energy
        if (footerSpans.length) {
            footerSpans.forEach(function (span) {
                if (energy > 0.1) {
                    var spacing = (0.15 + energy * 0.3).toFixed(2);
                    var footGlow = Math.floor(3 + energy * 12);
                    var footAlpha = (0.1 + energy * 0.4).toFixed(2);
                    span.style.letterSpacing = spacing + 'em';
                    span.style.textShadow = '0 0 ' + footGlow + 'px rgba(232,122,32,' + footAlpha + ')';
                } else {
                    span.style.letterSpacing = '';
                    span.style.textShadow = '';
                }
            });
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
                    // Always clear glow on the track that stopped
                    item.style.boxShadow = '';
                    // If nothing else is playing, disconnect visuals
                    var stillPlaying = document.querySelector('.track-item.playing');
                    if (!stillPlaying) {
                        disconnectVisuals();
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
