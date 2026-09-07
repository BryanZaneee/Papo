(function () {
    'use strict';

    // ═══════════════════════════════════════════
    //  CONFIG
    // ═══════════════════════════════════════════
    var LANE_COUNT = 3;
    var MAX_Z = 300;
    var FINISH_DISTANCE = 2300;  // ~12.5 s clean run with no oranges, ~10 s grabbing most of them
    var BASE_SPEED = 150;
    var SPEED_RAMP = 0.03;        // ramp(distance) = BASE_SPEED + distance * SPEED_RAMP
    var MAX_SPEED = 360;          // ramp cap — only reachable in endless mode
    var BOOST_MULT = 0.45;        // orange burst: speed *= 1 + BOOST_MULT * boost
    var BOOST_DECAY = 1.2;        // seconds for a burst to fade
    var GAP_SECONDS = 0.62;       // time between obstacle rows — constant reaction window at any speed
    var JUMP_DURATION = 0.55;
    var JUMP_HEIGHT = 80;
    var JUMP_BUFFER = 0.12;       // a jump pressed this close to landing fires on touchdown
    var HIT_Z = 14;               // ±window; wider than the max per-frame move (MAX_SPEED*1.45*0.05 ≈ 26)
    var HORIZON_FRAC = 0.24;
    var MAX_DPR = 2;
    var REDUCED = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

    // Two looks, same geometry. Picked by local hour (day 07:00–18:59), ?theme= overrides.
    // Obstacle colour still encodes AFFORDANCE, never identity: dodge = tall + red-lit,
    // jump = low + yellow band. Scenery is fogged and off the shoulder.
    var THEMES = {
        night: {
            skyTop: '#06070e', skyBot: '#2a140b', hazeRGB: '234,91,26', hazeA: 0.3,
            stars: true, sun: false, clouds: false,
            ridgeFar: '#16130e', ridgeNear: '#0d0b07',
            groundTop: '#16120a', groundBot: '#0b0a05',
            roadFar: '#14151a', roadNear: '#262830',
            dash: 'rgba(244,235,214,0.55)', shoulder: '#ea5b1a', shoulderDim: '#6e2f10',
            treeTrunk: '#1b150d', treeCanopy: '#1d2617', treeCanopyDark: '#131a10', treeFruit: '#d65f1e',
            sceneryAlpha: 0.9, vignette: 0.5, flash: 'rgba(255,160,60,',
            finishA: '#f4ebd6', finishB: '#ea5b1a', shadow: 'rgba(0,0,0,0.55)',
            streak: '255,200,140',
        },
        day: {
            skyTop: '#3d9bd8', skyBot: '#d3ebf6', hazeRGB: '211,235,246', hazeA: 0.65,
            stars: false, sun: true, clouds: true,
            ridgeFar: '#8db4a6', ridgeNear: '#4e8a4c',
            groundTop: '#6f9f47', groundBot: '#43782d',
            roadFar: '#5b5e67', roadNear: '#7e828c',
            dash: 'rgba(255,255,255,0.85)', shoulder: '#f6f6f6', shoulderDim: '#ea5b1a',
            treeTrunk: '#6b4630', treeCanopy: '#4f8f4c', treeCanopyDark: '#3d7340', treeFruit: '#ff8a1f',
            sceneryAlpha: 0.95, vignette: 0.16, flash: 'rgba(255,190,90,',
            finishA: '#ffffff', finishB: '#1e1f24', shadow: 'rgba(0,0,0,0.32)',
            streak: '255,255,255',
        },
    };
    var C = {
        // obstacles
        dodgeBody: '#d9382a', dodgeDark: '#8f1f12', dodgeLight: '#ff7a5c', lamp: '#ff2e1a',
        lampGlow: 'rgba(255,60,30,0.45)', band: '#e8e8e8', carGlass: '#1b1e26', carDark: '#2a2c33',
        jumpBody: '#2c2f38', jumpDark: '#1a1c22', jumpBand: '#ffd23f', jumpRim: '#fff2b0', cone: '#111317',
        coneRing: '#ff8a1f', outline: 'rgba(8,10,14,0.85)',
        // oranges
        pickup: '#ff8a1f', pickupDark: '#ea5b1a', leaf: '#4a9a3a', shine: 'rgba(255,255,255,0.85)',
        pickupGlow: 'rgba(255,160,60,0.4)',
        // runner
        skin: '#a9673f', skinDark: '#7d4a2b', hat: '#1c1c22', hatBrim: '#ea5b1a', shirt: '#ffffff',
        stripe: '#ffd23f', shorts: '#23262e', shoe: '#f4ebd6', shoeSole: '#ea5b1a',
    };

    // ═══════════════════════════════════════════
    //  STATE
    // ═══════════════════════════════════════════
    var canvas, ctx, overlay, T;
    var W = 0, H = 0;              // CSS-pixel viewport; backing store is W*dpr × H*dpr
    var gameState = 'title';       // title | playing | crashed | finished
    var endless = false;
    var running = true;            // false once the EPK is revealed — stops the rAF loop
    var playerLane = 1, targetLane = 1, laneFrom = 1, laneT = 1, laneVel = 0;
    var distance = 0, speed = BASE_SPEED, boost = 0;
    var obstacles = [], collectibles = [], decorations = [], particles = [];
    var score = 0;
    var jumping = false, jumpTime = 0, jumpHeight = 0, jumpQueued = false;
    var lastTime = 0, runPhase = 0, screenShake = 0, titleOffset = 0;
    var nextRowZ = 0;
    var clouds = [], stars = [], ridges = [];
    var skyGrad, groundGrad, roadGrad, vignetteGrad, flashGrad;
    var ui = {};

    // ═══════════════════════════════════════════
    //  VIEWPORT
    // ═══════════════════════════════════════════
    // Every draw function works in CSS pixels (W/H). The backing store is scaled by
    // devicePixelRatio and the context pre-transformed — nothing may read canvas.width.
    function resize() {
        W = window.innerWidth;
        H = window.innerHeight;
        var dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        buildStatic();
    }

    // Viewport-sized gradients and silhouettes only change on resize.
    function buildStatic() {
        var hy = H * HORIZON_FRAC;
        skyGrad = ctx.createLinearGradient(0, 0, 0, hy);
        skyGrad.addColorStop(0, T.skyTop);
        skyGrad.addColorStop(1, T.skyBot);

        groundGrad = ctx.createLinearGradient(0, hy, 0, H);
        groundGrad.addColorStop(0, T.groundTop);
        groundGrad.addColorStop(1, T.groundBot);

        var pNear = project(0), pFar = project(MAX_Z);
        roadGrad = ctx.createLinearGradient(0, pFar.y, 0, pNear.y);
        roadGrad.addColorStop(0, T.roadFar);
        roadGrad.addColorStop(1, T.roadNear);

        vignetteGrad = ctx.createRadialGradient(W / 2, H * 0.55, H * 0.4, W / 2, H * 0.55, H * 1.05);
        vignetteGrad.addColorStop(0, 'rgba(0,0,0,0)');
        vignetteGrad.addColorStop(1, 'rgba(0,0,0,' + T.vignette + ')');

        flashGrad = ctx.createRadialGradient(W / 2, H * 0.6, H * 0.2, W / 2, H * 0.6, H);
        flashGrad.addColorStop(0, T.flash + '0)');
        flashGrad.addColorStop(1, T.flash + '1)');

        // Two parallax grove ridges on the horizon — bumpy tree-line silhouettes
        ridges = [];
        for (var layer = 0; layer < 2; layer++) {
            var pts = [], step = W / (layer === 0 ? 18 : 12);
            for (var x = -step; x <= W * 2 + step; x += step) {
                var h = (layer === 0 ? 22 : 40) * (0.45 + Math.abs(Math.sin(x * 0.013 + layer * 2.3)) * 0.8);
                pts.push({ x: x, y: h });
            }
            ridges.push({ pts: pts, period: W + step, color: layer === 0 ? T.ridgeFar : T.ridgeNear, par: layer === 0 ? 0.01 : 0.025 });
        }

        stars = [];
        if (T.stars) for (var i = 0; i < 70; i++) stars.push({ x: Math.random() * W, y: Math.random() * hy * 0.85, r: 0.5 + Math.random() * 1.1, a: 0.3 + Math.random() * 0.7 });

        if (T.clouds && !clouds.length) for (var j = 0; j < 4; j++) clouds.push(newCloud(Math.random() * W));
    }

    function newCloud(x) {
        return { x: x, y: H * (0.02 + Math.random() * 0.1), s: 0.5 + Math.random() * 0.7, v: 5 + Math.random() * 8 };
    }

    // ═══════════════════════════════════════════
    //  PROJECTION
    // ═══════════════════════════════════════════
    function project(z) {
        var scale = 1 / (1 + (z / MAX_Z) * 5);
        var hy = H * HORIZON_FRAC, py = H * 0.93;
        return { y: hy + (py - hy) * scale, scale: scale };
    }

    function fogAt(z) {
        var t = z / MAX_Z;
        return Math.min(1, Math.max(0, (t - 0.25) / 0.75)) * 0.85;
    }

    function laneToX(lane, scale) {
        return W / 2 + (lane - 1) * W * 0.32 * scale * 0.7;
    }

    // ═══════════════════════════════════════════
    //  INIT
    // ═══════════════════════════════════════════
    function pickTheme() {
        var q = new URLSearchParams(location.search).get('theme');
        if (THEMES[q]) return q;
        var h = new Date().getHours();
        return h >= 7 && h < 19 ? 'day' : 'night';
    }

    function init() {
        canvas = document.getElementById('gameCanvas');
        overlay = document.getElementById('gameOverlay');
        if (!canvas || !overlay) return;
        ctx = canvas.getContext('2d');

        var themeName = pickTheme();
        T = THEMES[themeName];
        overlay.dataset.theme = themeName;

        ['gameStart', 'gameSkipInline', 'gameSkip', 'gameRetry', 'gameCrashEnter', 'gameEnter', 'gameKeepRunning',
            'gameProgress', 'gameProgressLabel', 'gameScore', 'gameHint', 'gameCrashStat', 'gameFinishStat', 'gameControls']
            .forEach(function (id) { ui[id] = document.getElementById(id); });

        resize();
        window.addEventListener('resize', resize);

        for (var i = 0; i < 36; i++) {
            decorations.push({ z: Math.random() * MAX_Z, side: Math.random() < 0.5 ? -1 : 1, offset: 1.4 + Math.random() * 1.0, size: 0.8 + Math.random() * 0.7, seed: Math.random() });
        }

        setupInput();
        setState('title');
        lastTime = performance.now();
        requestAnimationFrame(loop);
    }

    // ═══════════════════════════════════════════
    //  INPUT
    // ═══════════════════════════════════════════
    var TOUCH = 'ontouchstart' in window || (navigator.maxTouchPoints > 0);

    function setupInput() {
        document.addEventListener('keydown', function (e) {
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            var k = e.code;
            if (gameState === 'title' || gameState === 'crashed') {
                if (k === 'Space' || k === 'Enter') { e.preventDefault(); startGame(); }
            } else if (gameState === 'finished') {
                if (k === 'Space') { e.preventDefault(); enterSite(); }
            } else if (gameState === 'playing') {
                if (k === 'ArrowLeft' || k === 'KeyA') { e.preventDefault(); move(-1); }
                else if (k === 'ArrowRight' || k === 'KeyD') { e.preventDefault(); move(1); }
                else if (k === 'ArrowUp' || k === 'Space' || k === 'KeyW') { e.preventDefault(); jump(); }
            }
        });

        // Pointer on the whole overlay: swipe left/right = lane, swipe up or tap = jump,
        // tap = start / retry. Buttons handle themselves.
        var px = 0, py = 0, pt = 0, active = false;
        overlay.addEventListener('pointerdown', function (e) {
            if (e.target.closest('button')) return;
            active = true; px = e.clientX; py = e.clientY; pt = performance.now();
        });
        overlay.addEventListener('pointerup', function (e) {
            if (!active) return;
            active = false;
            var dx = e.clientX - px, dy = e.clientY - py, ax = Math.abs(dx), ay = Math.abs(dy);
            var tap = ax < 20 && ay < 20 && performance.now() - pt < 400;
            if (gameState === 'title' || gameState === 'crashed') { if (tap) startGame(); return; }
            if (gameState !== 'playing') return;
            if (ax > 28 && ax > ay) move(dx < 0 ? -1 : 1);
            else if (ay > 28 && dy < 0) jump();
            else if (tap) jump();
        });
        overlay.addEventListener('pointercancel', function () { active = false; });
        overlay.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });

        on('gameStart', startGame);
        on('gameRetry', startGame);
        on('gameSkipInline', enterSite);
        on('gameSkip', enterSite);
        on('gameCrashEnter', enterSite);
        on('gameEnter', enterSite);
        on('gameKeepRunning', goEndless);

        if (ui.gameStart) ui.gameStart.textContent = TOUCH ? 'TAP TO START' : 'SPACE TO START';
        if (ui.gameControls && TOUCH) ui.gameControls.textContent = 'Swipe to switch lanes. Swipe up or tap to jump over obstacles.';
        if (ui.gameHint) ui.gameHint.textContent = TOUCH
            ? 'SWIPE ← → LANES  ·  TAP TO JUMP THE YELLOW-TOPPED ONES'
            : '← → LANES  ·  SPACE TO JUMP THE YELLOW-TOPPED ONES';
    }

    function on(id, fn) {
        if (ui[id]) ui[id].addEventListener('click', function (e) { e.stopPropagation(); fn(); });
    }

    function move(dir) {
        var next = targetLane + dir;
        if (next < 0 || next >= LANE_COUNT) return;
        laneFrom = playerLane; targetLane = next; laneT = 0;
    }

    function jump() {
        if (!jumping) { jumping = true; jumpTime = 0; }
        else if (jumpTime > JUMP_DURATION - JUMP_BUFFER) jumpQueued = true;
    }

    // ═══════════════════════════════════════════
    //  GAME FLOW
    // ═══════════════════════════════════════════
    function setState(s) {
        gameState = s;
        overlay.dataset.state = s;
    }

    function startGame() {
        endless = false;
        distance = 0; speed = BASE_SPEED; boost = 0;
        playerLane = targetLane = laneFrom = 1; laneT = 1; laneVel = 0;
        obstacles = []; collectibles = []; particles = [];
        score = 0; lastScore = -1;
        jumping = false; jumpTime = 0; jumpHeight = 0; jumpQueued = false;
        screenShake = 0;
        nextRowZ = 110;
        spawnAhead();
        setState('playing');
        syncHUD();
        lastTime = performance.now();
    }

    // Chosen from the finish screen: drop the finish line and keep going.
    function goEndless() {
        endless = true;
        setState('playing');
        syncHUD();
        lastTime = performance.now();
    }

    var entered = false;
    function enterSite() {
        if (entered) return;
        entered = true;
        overlay = overlay || document.getElementById('gameOverlay');
        if (!overlay) return;
        overlay.style.transition = 'opacity 0.8s ease';
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
        setTimeout(function () {
            overlay.style.display = 'none';
            document.body.classList.remove('game-active');
            running = false;
            var v = document.querySelector('.hero-video');
            if (v && v.paused) v.play();
            window.scrollTo(0, 0);
        }, 800);
    }

    // ═══════════════════════════════════════════
    //  SPAWNING
    // ═══════════════════════════════════════════
    // Rows are spaced by *time* (speed × GAP_SECONDS) so the reaction window never
    // shrinks as you accelerate. One obstacle per row → two lanes always safe, one adjacent.
    var lastLane = 1;
    function spawnAhead() {
        while (nextRowZ < MAX_Z + 40) {
            spawnRow(nextRowZ);
            nextRowZ += speed * (GAP_SECONDS + Math.random() * 0.25);
        }
    }

    function spawnRow(z) {
        var lane = Math.floor(Math.random() * LANE_COUNT);
        if (lane === lastLane && Math.random() < 0.5) lane = (lane + 1 + Math.floor(Math.random() * 2)) % LANE_COUNT;
        lastLane = lane;
        var r = Math.random(), type = r < 0.33 ? 'pole' : r < 0.62 ? 'car' : 'speaker';
        var jumpable = type === 'speaker';
        obstacles.push({ z: z, lane: lane, type: type, jumpable: jumpable });

        if (jumpable && Math.random() < 0.45) {
            // Arc over the speaker — only reachable mid-jump
            for (var i = -1; i <= 1; i++) collectibles.push({ z: z + i * 13, lane: lane, h: i === 0 ? 52 : 26, got: false });
        } else if (Math.random() < 0.65) {
            var cl = (lane + 1 + Math.floor(Math.random() * 2)) % LANE_COUNT;
            var base = z + speed * GAP_SECONDS * 0.5;
            for (var j = 0; j < 3; j++) collectibles.push({ z: base + j * 15, lane: cl, h: 0, got: false });
        }
    }

    // ═══════════════════════════════════════════
    //  UPDATE
    // ═══════════════════════════════════════════
    function update(dt) {
        for (var ci = 0; ci < clouds.length; ci++) {
            var c = clouds[ci];
            c.x += c.v * dt;
            if (c.x - 120 * c.s > W) clouds[ci] = newCloud(-120);
        }
        updateParticles(dt);

        if (gameState === 'title') {
            titleOffset += 70 * dt;
            for (var d = 0; d < decorations.length; d++) {
                decorations[d].z -= 70 * dt;
                if (decorations[d].z < -10) decorations[d].z += MAX_Z;
            }
            return;
        }
        if (gameState !== 'playing') return;

        boost = Math.max(0, boost - dt / BOOST_DECAY);
        speed = Math.min(MAX_SPEED, BASE_SPEED + distance * SPEED_RAMP) * (1 + BOOST_MULT * boost);
        var mv = speed * dt;
        distance += mv;
        runPhase += dt * (9 + speed / 45);

        for (var i = 0; i < obstacles.length; i++) obstacles[i].z -= mv;
        for (i = 0; i < collectibles.length; i++) collectibles[i].z -= mv;
        for (i = 0; i < decorations.length; i++) {
            decorations[i].z -= mv;
            if (decorations[i].z < -10) decorations[i].z += MAX_Z;
        }
        nextRowZ -= mv;

        // Lane slide — ease-in-out, tracks velocity for the body lean
        var prevLane = playerLane;
        if (laneT < 1) {
            laneT = Math.min(1, laneT + dt * 7);
            var e = laneT < 0.5 ? 4 * laneT * laneT * laneT : 1 - Math.pow(-2 * laneT + 2, 3) / 2;
            playerLane = laneFrom + (targetLane - laneFrom) * e;
        } else playerLane = targetLane;
        laneVel += ((playerLane - prevLane) / Math.max(dt, 0.001) - laneVel) * Math.min(1, dt * 12);

        if (jumping) {
            jumpTime += dt;
            if (jumpTime >= JUMP_DURATION) {
                jumping = false; jumpTime = 0; jumpHeight = 0;
                if (jumpQueued) { jumpQueued = false; jumping = true; }
            } else jumpHeight = JUMP_HEIGHT * Math.sin((jumpTime / JUMP_DURATION) * Math.PI);
        }

        if (screenShake > 0) { screenShake *= 0.88; if (screenShake < 0.5) screenShake = 0; }

        // Collisions — the ±HIT_Z window is wider than any single frame's move
        for (i = 0; i < obstacles.length; i++) {
            var o = obstacles[i];
            if (o.z < HIT_Z && o.z > -HIT_Z && Math.abs(playerLane - o.lane) < 0.5) {
                if (o.jumpable && jumpHeight > JUMP_HEIGHT * 0.3) continue;
                crash(); return;
            }
        }
        for (i = 0; i < collectibles.length; i++) {
            var k = collectibles[i];
            if (!k.got && k.z < HIT_Z && k.z > -HIT_Z && Math.abs(playerLane - k.lane) < 0.5 && Math.abs(jumpHeight - k.h) < 40) {
                k.got = true;
                score++;
                boost = 1;
                burst(laneToX(playerLane, 1), project(0).y - 30 - jumpHeight, C.pickup, 8, '+1');
            }
        }

        obstacles = obstacles.filter(function (ob) { return ob.z > -30; });
        collectibles = collectibles.filter(function (cc) { return cc.z > -30 && !cc.got; });
        spawnAhead();

        if (!endless && distance >= FINISH_DISTANCE) {
            setState('finished');
            if (ui.gameFinishStat) ui.gameFinishStat.textContent = '🍊 ' + score + (score === 1 ? ' orange' : ' oranges') + ' collected';
        }
        syncHUD();
    }

    function crash() {
        setState('crashed');
        if (!REDUCED) screenShake = 16;
        burst(laneToX(playerLane, 1), project(0).y - 30, C.shorts, 14);
        if (ui.gameCrashStat) ui.gameCrashStat.textContent = endless
            ? Math.floor(distance) + ' m  ·  🍊 ' + score
            : Math.floor(distance / FINISH_DISTANCE * 100) + '% of the way  ·  🍊 ' + score;
    }

    // ── Particles (screen space) ──────────────
    function burst(x, y, color, n, text) {
        for (var i = 0; i < n; i++) {
            var a = Math.random() * Math.PI * 2, v = 60 + Math.random() * 140;
            particles.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: 0.5 + Math.random() * 0.3, max: 0.8, color: color, r: 2 + Math.random() * 3 });
        }
        if (text) particles.push({ x: x, y: y - 10, vx: 0, vy: -70, life: 0.8, max: 0.8, color: color, text: text });
    }

    function updateParticles(dt) {
        for (var i = particles.length - 1; i >= 0; i--) {
            var p = particles[i];
            p.life -= dt;
            if (p.life <= 0) { particles.splice(i, 1); continue; }
            p.x += p.vx * dt; p.y += p.vy * dt;
            if (!p.text) p.vy += 300 * dt;
        }
    }

    // ── HUD sync — only touches the DOM when a value changed ──
    var lastScore = -1, lastLabel = '';
    function syncHUD() {
        if (score !== lastScore) {
            lastScore = score;
            if (ui.gameScore) {
                ui.gameScore.textContent = score;
                ui.gameScore.classList.remove('pop');
                void ui.gameScore.offsetWidth;
                ui.gameScore.classList.add('pop');
            }
        }
        var label = endless ? 'ENDLESS  ·  ' + Math.floor(distance) + ' m' : Math.floor(Math.min(1, distance / FINISH_DISTANCE) * 100) + '% to finish';
        if (label !== lastLabel) {
            lastLabel = label;
            if (ui.gameProgressLabel) ui.gameProgressLabel.textContent = label;
            if (ui.gameProgress) ui.gameProgress.style.width = endless ? '100%' : Math.min(100, distance / FINISH_DISTANCE * 100) + '%';
        }
        if (ui.gameHint) ui.gameHint.style.opacity = endless ? 0 : Math.max(0, 1 - distance / 350);
    }

    // ═══════════════════════════════════════════
    //  RENDER
    // ═══════════════════════════════════════════
    function render() {
        ctx.clearRect(0, 0, W, H);
        var hy = H * HORIZON_FRAC;
        var off = gameState === 'title' ? titleOffset : distance;

        if (screenShake > 0) { ctx.save(); ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake); }

        ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, W, hy);
        if (T.stars) drawStars();
        if (T.sun) drawSun(hy);
        if (T.clouds) drawClouds();

        ctx.fillStyle = groundGrad; ctx.fillRect(0, hy, W, H - hy);
        drawRidges(hy, off);
        drawHaze(hy);
        drawRoad(hy, off);

        var objs = [];
        for (var i = 0; i < decorations.length; i++) objs.push({ z: decorations[i].z, k: 0, ref: decorations[i] });
        if (gameState !== 'title') {
            for (i = 0; i < obstacles.length; i++) if (obstacles[i].z > -5 && obstacles[i].z < MAX_Z) objs.push({ z: obstacles[i].z, k: 1, ref: obstacles[i] });
            for (i = 0; i < collectibles.length; i++) if (collectibles[i].z > -5 && collectibles[i].z < MAX_Z) objs.push({ z: collectibles[i].z, k: 2, ref: collectibles[i] });
        }
        objs.sort(function (a, b) { return b.z - a.z; });
        for (i = 0; i < objs.length; i++) {
            var it = objs[i], p = project(it.z);
            if (it.k === 0) drawTree(it.ref, p.y, p.scale);
            else if (it.k === 1) drawObstacle(it.ref, p.y, p.scale);
            else drawOrange(it.ref, p.y, p.scale);
        }

        if (gameState !== 'title') drawPlayer();
        drawParticles();
        if (gameState === 'playing' && !REDUCED) drawStreaks();

        if (screenShake > 0) ctx.restore();

        ctx.fillStyle = vignetteGrad; ctx.fillRect(0, 0, W, H);
        if (boost > 0 && gameState === 'playing') {
            ctx.globalAlpha = boost * 0.28;
            ctx.fillStyle = flashGrad; ctx.fillRect(0, 0, W, H);
            ctx.globalAlpha = 1;
        }
        if (gameState === 'crashed' || gameState === 'finished' || gameState === 'title') {
            ctx.fillStyle = T.stars ? 'rgba(5,5,8,0.55)' : 'rgba(10,20,35,0.32)';
            ctx.fillRect(0, 0, W, H);
        }
    }

    // ── Sky ───────────────────────────────────
    function drawStars() {
        var tw = performance.now() * 0.002;
        ctx.fillStyle = '#f4ebd6';
        for (var i = 0; i < stars.length; i++) {
            var s = stars[i];
            ctx.globalAlpha = s.a * (0.7 + 0.3 * Math.sin(tw + i));
            ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    function drawSun(hy) {
        var sx = W / 2, sy = hy - H * 0.06, r = Math.min(W, H) * 0.055;
        ctx.fillStyle = 'rgba(255,232,170,0.22)';
        ctx.beginPath(); ctx.arc(sx, sy, r * 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,244,214,0.95)';
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
    }

    function drawClouds() {
        for (var i = 0; i < clouds.length; i++) {
            var c = clouds[i], s = 30 * c.s;
            ctx.fillStyle = 'rgba(255,255,255,0.55)';
            ctx.beginPath(); ctx.ellipse(c.x + s * 0.5, c.y + s * 0.4, s * 1.6, s * 0.5, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.92)';
            ctx.beginPath();
            ctx.arc(c.x, c.y, s, 0, Math.PI * 2);
            ctx.arc(c.x + s * 0.85, c.y - s * 0.25, s * 0.85, 0, Math.PI * 2);
            ctx.arc(c.x + s * 1.6, c.y, s * 0.7, 0, Math.PI * 2);
            ctx.arc(c.x - s * 0.45, c.y + s * 0.1, s * 0.55, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawRidges(hy, off) {
        for (var l = 0; l < ridges.length; l++) {
            var r = ridges[l], pts = r.pts;
            var shift = -((off * r.par) % r.period);
            ctx.fillStyle = r.color;
            ctx.beginPath();
            ctx.moveTo(pts[0].x + shift, hy + 2);
            for (var i = 0; i < pts.length; i++) ctx.lineTo(pts[i].x + shift, hy - pts[i].y);
            ctx.lineTo(pts[pts.length - 1].x + shift, hy + 2);
            ctx.closePath(); ctx.fill();
        }
    }

    function drawHaze(hy) {
        var band = H * 0.06;
        var g = ctx.createLinearGradient(0, hy - band, 0, hy + band);
        g.addColorStop(0, 'rgba(' + T.hazeRGB + ',0)');
        g.addColorStop(0.5, 'rgba(' + T.hazeRGB + ',' + T.hazeA + ')');
        g.addColorStop(1, 'rgba(' + T.hazeRGB + ',0)');
        ctx.fillStyle = g; ctx.fillRect(0, hy - band, W, band * 2);
    }

    // ── Road ──────────────────────────────────
    function drawRoad(hy, off) {
        var cx = W / 2, baseW = W * 0.65;
        var pNear = project(-14), pFar = project(MAX_Z);
        var wNear = baseW * pNear.scale, wFar = baseW * pFar.scale;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx - wNear, pNear.y); ctx.lineTo(cx + wNear, pNear.y);
        ctx.lineTo(cx + wFar, pFar.y); ctx.lineTo(cx - wFar, pFar.y);
        ctx.closePath(); ctx.clip();
        ctx.fillStyle = roadGrad; ctx.fillRect(0, pFar.y, W, pNear.y - pFar.y);
        ctx.restore();

        var segs = 30;
        for (var i = 0; i < segs; i++) {
            var z1 = -14 + (i / segs) * (MAX_Z + 14), z2 = -14 + ((i + 1) / segs) * (MAX_Z + 14);
            var p1 = project(z1), p2 = project(z2);
            var w1 = baseW * p1.scale, w2 = baseW * p2.scale, rw1 = w1 * 0.04, rw2 = w2 * 0.04;
            ctx.fillStyle = Math.floor((z1 + off * 0.5) / 25) % 2 === 0 ? T.shoulder : T.shoulderDim;
            ctx.globalAlpha = 1 - fogAt(Math.max(0, z1)) * 0.6;
            ctx.beginPath();
            ctx.moveTo(cx - w1 - rw1, p1.y); ctx.lineTo(cx - w1, p1.y); ctx.lineTo(cx - w2, p2.y); ctx.lineTo(cx - w2 - rw2, p2.y); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(cx + w1, p1.y); ctx.lineTo(cx + w1 + rw1, p1.y); ctx.lineTo(cx + w2 + rw2, p2.y); ctx.lineTo(cx + w2, p2.y); ctx.fill();
        }
        ctx.globalAlpha = 1;

        ctx.strokeStyle = T.dash;
        for (i = 0; i < 20; i++) {
            var d1 = -14 + (i / 20) * (MAX_Z + 14), d2 = -14 + ((i + 0.35) / 20) * (MAX_Z + 14);
            if (Math.floor((d1 + off * 0.5) / 25) % 2 !== 0) continue;
            var q1 = project(d1), q2 = project(d2), v1 = baseW * q1.scale, v2 = baseW * q2.scale;
            ctx.lineWidth = Math.max(1, 2.5 * q1.scale);
            ctx.beginPath(); ctx.moveTo(cx - v1 * 0.33, q1.y); ctx.lineTo(cx - v2 * 0.33, q2.y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx + v1 * 0.33, q1.y); ctx.lineTo(cx + v2 * 0.33, q2.y); ctx.stroke();
        }

        if (gameState === 'playing' && !endless) {
            var fz = (FINISH_DISTANCE - distance) * 0.5;
            if (fz > 0 && fz < MAX_Z) {
                var fp = project(fz), fw = baseW * fp.scale, checks = 10, cw = fw * 2 / checks;
                ctx.globalAlpha = 0.85;
                for (var c = 0; c < checks; c++) {
                    ctx.fillStyle = c % 2 === 0 ? T.finishA : T.finishB;
                    ctx.fillRect(cx - fw + c * cw, fp.y - 4 * fp.scale, cw, 8 * fp.scale);
                }
                ctx.globalAlpha = 1;
            }
        }
    }

    // ── Scenery — orange trees, fogged, off the shoulder ──
    function drawTree(d, y, scale) {
        var hw = W * 0.32 * scale;
        var x = W / 2 + d.side * (hw + d.offset * hw);
        var s = 30 * scale * d.size;
        if (s < 2) return;
        ctx.save();
        ctx.globalAlpha = T.sceneryAlpha * (1 - fogAt(d.z) * 0.6);
        ctx.fillStyle = T.treeTrunk;
        ctx.fillRect(x - s * 0.12, y - s * 1.5, s * 0.24, s * 1.5);
        ctx.fillStyle = T.treeCanopy;
        ctx.beginPath(); ctx.arc(x, y - s * 1.85, s * 0.75, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = T.treeCanopyDark;
        ctx.beginPath(); ctx.arc(x - s * 0.2, y - s * 1.6, s * 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = T.treeFruit;
        for (var i = 0; i < 3; i++) {
            var a = d.seed * 6.28 + i * 2.1, fr = s * 0.45;
            ctx.beginPath(); ctx.arc(x + Math.cos(a) * fr, y - s * 1.85 + Math.sin(a) * fr * 0.7, s * 0.1, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }

    // ── Obstacles ─────────────────────────────
    function drawObstacle(o, y, scale) {
        var x = laneToX(o.lane, scale), s = 40 * scale;
        if (s < 3) return;
        ctx.fillStyle = T.shadow;
        ctx.beginPath(); ctx.ellipse(x, y, s * 0.8, s * 0.2, 0, 0, Math.PI * 2); ctx.fill();

        ctx.save();
        ctx.globalAlpha = 1 - fogAt(o.z) * 0.55;
        ctx.lineJoin = 'round';
        ctx.strokeStyle = C.outline;
        ctx.lineWidth = Math.max(1, s * 0.05);

        if (o.type === 'pole') {
            var pw = s * 0.26, ph = s * 2.7;
            ctx.fillStyle = C.carDark;
            rrect(x - pw / 2, y - ph, pw, ph, pw * 0.3); ctx.fill(); ctx.stroke();
            for (var i = 0; i < 4; i++) {
                ctx.fillStyle = i % 2 === 0 ? C.dodgeBody : C.band;
                ctx.fillRect(x - pw / 2, y - ph + ph * 0.08 + i * ph * 0.11, pw, ph * 0.11);
            }
            ctx.fillStyle = C.carDark;
            rrect(x - pw * 1.1, y - s * 0.18, pw * 2.2, s * 0.18, s * 0.04); ctx.fill();
            ctx.fillStyle = C.lampGlow;
            ctx.beginPath(); ctx.arc(x, y - ph, s * 0.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = C.lamp;
            ctx.beginPath(); ctx.arc(x, y - ph, pw * 0.7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        } else if (o.type === 'car') {
            var bw = s * 1.6, bh = s * 0.95, cw = s * 1.15, ch = s * 0.7;
            ctx.fillStyle = C.carDark;
            ctx.beginPath(); ctx.ellipse(x - bw * 0.35, y, s * 0.2, s * 0.09, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(x + bw * 0.35, y, s * 0.2, s * 0.09, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = C.dodgeDark;
            rrect(x - cw / 2, y - bh - ch + s * 0.1, cw, ch, s * 0.16); ctx.fill(); ctx.stroke();
            ctx.fillStyle = C.carGlass;
            rrect(x - cw / 2 + s * 0.08, y - bh - ch + s * 0.18, cw - s * 0.16, ch * 0.55, s * 0.08); ctx.fill();
            ctx.fillStyle = C.dodgeBody;
            rrect(x - bw / 2, y - bh, bw, bh - s * 0.08, s * 0.1); ctx.fill(); ctx.stroke();
            ctx.fillStyle = C.dodgeLight;
            ctx.fillRect(x - bw / 2 + s * 0.06, y - bh + s * 0.05, bw - s * 0.12, Math.max(1, s * 0.06));
            ctx.fillStyle = C.carDark;
            rrect(x - bw / 2 + s * 0.05, y - s * 0.28, bw - s * 0.1, s * 0.16, s * 0.04); ctx.fill();
            ctx.fillStyle = C.lampGlow;
            ctx.beginPath(); ctx.arc(x - bw * 0.36, y - bh * 0.55, s * 0.28, 0, Math.PI * 2); ctx.arc(x + bw * 0.36, y - bh * 0.55, s * 0.28, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = C.lamp;
            rrect(x - bw * 0.46, y - bh * 0.68, s * 0.34, s * 0.2, s * 0.04); ctx.fill();
            rrect(x + bw * 0.46 - s * 0.34, y - bh * 0.68, s * 0.34, s * 0.2, s * 0.04); ctx.fill();
        } else {
            var jw = s * 1.15, jh = s * 0.85;
            ctx.fillStyle = C.jumpBody;
            rrect(x - jw / 2, y - jh, jw, jh, s * 0.07); ctx.fill(); ctx.stroke();
            ctx.fillStyle = C.jumpDark;
            rrect(x - jw / 2 + s * 0.06, y - jh + s * 0.2, jw - s * 0.12, jh - s * 0.26, s * 0.05); ctx.fill();
            ctx.fillStyle = C.cone;
            ctx.beginPath(); ctx.arc(x, y - jh * 0.48, jw * 0.24, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = C.coneRing; ctx.lineWidth = Math.max(1, s * 0.04);
            ctx.beginPath(); ctx.arc(x, y - jh * 0.48, jw * 0.24, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(x, y - jh * 0.48, jw * 0.08, 0, Math.PI * 2); ctx.stroke();
            ctx.strokeStyle = C.outline; ctx.lineWidth = Math.max(1, s * 0.05);
            ctx.fillStyle = C.jumpBand;
            rrect(x - jw / 2, y - jh - s * 0.16, jw, s * 0.28, s * 0.05); ctx.fill(); ctx.stroke();
            ctx.fillStyle = C.jumpRim;
            rrect(x - jw / 2, y - jh - s * 0.16, jw, Math.max(1, s * 0.08), s * 0.03); ctx.fill();
        }
        ctx.restore();
    }

    // ── Oranges ───────────────────────────────
    function drawOrange(k, y, scale) {
        var x = laneToX(k.lane, scale), s = 14 * scale;
        if (s < 2) return;
        var cy = y - (30 + k.h) * scale + Math.sin(performance.now() * 0.005 + k.z) * 4 * scale;
        ctx.save();
        ctx.globalAlpha = 1 - fogAt(k.z) * 0.5;
        ctx.fillStyle = C.pickupGlow;
        ctx.beginPath(); ctx.arc(x, cy, s * 1.7, 0, Math.PI * 2); ctx.fill();
        var g = ctx.createRadialGradient(x - s * 0.3, cy - s * 0.3, s * 0.15, x, cy, s);
        g.addColorStop(0, C.pickup); g.addColorStop(1, C.pickupDark);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, cy, s, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = C.leaf;
        ctx.beginPath(); ctx.ellipse(x + s * 0.32, cy - s * 0.92, s * 0.34, s * 0.16, -0.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = C.shine;
        ctx.beginPath(); ctx.arc(x - s * 0.35, cy - s * 0.35, s * 0.24, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    // ── Player — seen from behind: cap, striped shirt, shorts, sneakers ──
    function drawPlayer() {
        var baseY = project(0).y, x = laneToX(playerLane, 1), s = 40;
        var stride = Math.sin(runPhase), bob = jumping ? 0 : Math.abs(stride) * 3;
        var y = baseY - jumpHeight - bob;
        var airT = jumping ? jumpHeight / JUMP_HEIGHT : 0;

        ctx.fillStyle = T.shadow;
        var ss = 1 - airT * 0.5;
        ctx.beginPath(); ctx.ellipse(x, baseY, 18 * ss, 5 * ss, 0, 0, Math.PI * 2); ctx.fill();

        ctx.save();
        ctx.translate(x, y - s * 0.5); // feet (≈ +0.5 s) land on the road line
        ctx.rotate(Math.max(-0.22, Math.min(0.22, laneVel * 0.05)));
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';

        // Legs — pump when running, tuck when airborne
        ctx.strokeStyle = C.shorts; ctx.lineWidth = s * 0.17;
        var legL = s * (0.42 + stride * 0.12) * (1 - airT * 0.45);
        var legR = s * (0.42 - stride * 0.12) * (1 - airT * 0.45);
        ctx.beginPath(); ctx.moveTo(-s * 0.14, -s * 0.15); ctx.lineTo(-s * 0.16 + stride * s * 0.04, legL); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(s * 0.14, -s * 0.15); ctx.lineTo(s * 0.16 - stride * s * 0.04, legR); ctx.stroke();
        ctx.fillStyle = C.shoe;
        ctx.beginPath(); ctx.ellipse(-s * 0.16 + stride * s * 0.04, legL, s * 0.13, s * 0.08, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(s * 0.16 - stride * s * 0.04, legR, s * 0.13, s * 0.08, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = C.shoeSole;
        ctx.fillRect(-s * 0.16 + stride * s * 0.04 - s * 0.12, legL + s * 0.04, s * 0.24, s * 0.04);
        ctx.fillRect(s * 0.16 - stride * s * 0.04 - s * 0.12, legR + s * 0.04, s * 0.24, s * 0.04);

        // Shorts
        ctx.fillStyle = C.shorts;
        rrect(-s * 0.34, -s * 0.5, s * 0.68, s * 0.42, s * 0.08); ctx.fill();

        // Torso — white tee with yellow stripes, clipped to the body shape
        ctx.save();
        rrect(-s * 0.36, -s * 1.3, s * 0.72, s * 0.9, s * 0.16); ctx.clip();
        ctx.fillStyle = C.shirt; ctx.fillRect(-s * 0.4, -s * 1.35, s * 0.8, s);
        ctx.fillStyle = C.stripe;
        for (var i = 0; i < 4; i++) ctx.fillRect(-s * 0.4, -s * 1.22 + i * s * 0.24, s * 0.8, s * 0.11);
        ctx.restore();

        // Arms — skin, swing opposite the legs, raised when airborne
        ctx.strokeStyle = C.skin; ctx.lineWidth = s * 0.11;
        var armL = -stride * s * 0.16 - airT * s * 0.35, armR = stride * s * 0.16 - airT * s * 0.35;
        ctx.beginPath(); ctx.moveTo(-s * 0.36, -s * 1.15); ctx.quadraticCurveTo(-s * 0.5, -s * 0.85, -s * 0.44, -s * 0.55 + armL); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(s * 0.36, -s * 1.15); ctx.quadraticCurveTo(s * 0.5, -s * 0.85, s * 0.44, -s * 0.55 + armR); ctx.stroke();

        // Neck + head
        ctx.fillStyle = C.skinDark; ctx.fillRect(-s * 0.09, -s * 1.45, s * 0.18, s * 0.18);
        ctx.fillStyle = C.skin;
        ctx.beginPath(); ctx.arc(0, -s * 1.62, s * 0.27, 0, Math.PI * 2); ctx.fill();

        // Backwards cap: dome over the head, brim poking out toward the viewer
        ctx.fillStyle = C.hat;
        ctx.beginPath(); ctx.arc(0, -s * 1.66, s * 0.29, Math.PI, Math.PI * 2); ctx.fill();
        ctx.fillRect(-s * 0.29, -s * 1.66, s * 0.58, s * 0.1);
        ctx.fillStyle = C.hatBrim;
        rrect(-s * 0.2, -s * 1.6, s * 0.4, s * 0.09, s * 0.04); ctx.fill();
        ctx.fillStyle = C.hatBrim;
        ctx.beginPath(); ctx.arc(0, -s * 1.9, s * 0.05, 0, Math.PI * 2); ctx.fill();

        ctx.restore();
    }

    function drawParticles() {
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i], a = Math.max(0, p.life / p.max);
            ctx.globalAlpha = a;
            ctx.fillStyle = p.color;
            if (p.text) {
                ctx.font = "bold 22px 'Bebas Neue', sans-serif"; ctx.textAlign = 'center';
                ctx.fillText(p.text, p.x, p.y);
            } else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r * a, 0, Math.PI * 2); ctx.fill(); }
        }
        ctx.globalAlpha = 1;
    }

    // Streaks along the edges that only appear once you're moving fast (or boosted).
    function drawStreaks() {
        var t = (speed - BASE_SPEED) / (MAX_SPEED - BASE_SPEED) + boost * 0.6;
        if (t <= 0.06) return;
        ctx.strokeStyle = 'rgba(' + T.streak + ',' + Math.min(0.35, 0.05 + t * 0.2).toFixed(3) + ')';
        ctx.lineWidth = 2;
        for (var i = 0; i < 12; i++) {
            var seed = (i * 137.5 + distance * 2.2) % 100 / 100;
            var y = H * (0.3 + seed * 0.65), len = 40 + t * 140;
            var edge = i % 2 === 0 ? W * (0.04 + seed * 0.05) : W * (0.96 - seed * 0.05);
            ctx.beginPath(); ctx.moveTo(edge, y); ctx.lineTo(edge, y + len); ctx.stroke();
        }
    }

    function rrect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    }

    // ═══════════════════════════════════════════
    //  LOOP
    // ═══════════════════════════════════════════
    function loop(ts) {
        var dt = Math.min(0.05, (ts - lastTime) / 1000);
        lastTime = ts;
        update(dt);
        render();
        if (running) requestAnimationFrame(loop);
    }

    // ═══════════════════════════════════════════
    //  BACKGROUND ASSET PRELOADER
    // ═══════════════════════════════════════════
    function preloadEPKAssets() {
        // Prefetch gallery + bio images into the browser cache while the game runs.
        // Idle-scheduled so it never competes with the rendering budget; reads the
        // URLs from the DOM (content.js has filled them by the time the delay is up).
        var urls = [], idx = 0;
        function next() {
            if (!urls.length) {
                urls = Array.prototype.map.call(document.querySelectorAll('.gallery-masonry img, .bio-image img'), function (i) { return i.currentSrc || i.src; });
            }
            if (idx >= urls.length) return;
            var img = new Image();
            img.src = urls[idx++];
            img.onload = img.onerror = function () {
                if (window.requestIdleCallback) requestIdleCallback(next);
                else setTimeout(next, 100);
            };
        }
        setTimeout(next, 1500);
    }

    // ═══════════════════════════════════════════
    //  BOOT
    // ═══════════════════════════════════════════
    window.skipRunnerGame = enterSite;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { init(); preloadEPKAssets(); });
    } else {
        init();
        preloadEPKAssets();
    }
})();
