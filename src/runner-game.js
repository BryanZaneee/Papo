(function () {
    'use strict';

    // ═══════════════════════════════════════════
    //  CONFIG
    // ═══════════════════════════════════════════
    const LANE_COUNT = 3;
    const MAX_Z = 300;
    const OBSTACLE_GAP = 45;
    const FINISH_DISTANCE = 1800;   // ~10.5s clean run at the speed curve below
    const BASE_SPEED = 150;
    const SPEED_RAMP = 0.03;        // speed = BASE_SPEED + distance * SPEED_RAMP
    const MAX_SPEED = 340;          // only reachable in endless mode
    const JUMP_DURATION = 0.55;
    const JUMP_HEIGHT = 80;
    const HORIZON_FRAC = 0.22;
    const MAX_DPR = 2;
    const ORANGE = '🍊'; // 🍊 — the pickup, and the site's signature

    // Daytime street palette: blue sky + clouds, green grass, cool-dark asphalt.
    //
    // Obstacle colour encodes AFFORDANCE, not object identity:
    //   dodge-only  → hot red/orange, tall, dark outline
    //   jumpable    → yellow warning band, deliberately short
    // Roadside scenery is desaturated and fogged so it can never be mistaken
    // for something that kills you.
    const COLORS = {
        sky: '#5fb8e0',
        skyHorizon: '#bfe2f0',
        sun: 'rgba(255,244,214,0.95)',
        sunGlow: 'rgba(255,232,170,0.35)',
        hillFar: '#7fa8c4',
        hillNear: '#4e7a4a',
        cloud: 'rgba(255,255,255,0.92)',
        cloudSoft: 'rgba(255,255,255,0.55)',
        ground: '#5a8a3e',
        groundDark: '#3d6a26',
        road: '#1e1f24',
        roadLight: '#33353d',
        rumble: '#f4f4f4',
        rumbleDim: '#9aa0ad',
        lane: 'rgba(255,255,255,0.75)',
        player: '#2a5fa0',
        playerGlow: 'rgba(120,180,255,0.45)',
        text: '#f0f6ff',
        textDim: '#a8c0d4',
        accent: '#5fb8e0',
        // Scenery — muted, never confusable with an obstacle
        treeTrunk: '#5a3b26',
        treeCanopy: '#4a7a52',
        treeCanopyDark: '#3a6242',
        fruit: '#a8544a',
        orangeCanopy: '#a88a52',
        orangeCanopyDark: '#8a6c3c',
        orangeFruit: '#c98a45',
        // Obstacles — dodge (hot) vs jump (warning band)
        dodgeBody: '#e03a26',
        dodgeDark: '#a3220f',
        dodgeRim: '#ff9a7a',
        jumpBody: '#3a3f4a',
        jumpDark: '#22252c',
        jumpBand: '#ffd23f',
        jumpRim: '#fff2b0',
        outline: 'rgba(8,10,14,0.85)',
        // Orange pickups
        pickup: '#ff8a1f',
        pickupDark: '#ea5b1a',
        pickupLeaf: '#4a9a3a',
        pickupShine: 'rgba(255,255,255,0.85)',
        pickupGlow: 'rgba(255,160,60,0.45)',
        speakerBody: '#3a3a3a',
        speakerCone: '#1a1a1a',
        speakerRing: '#888888',
        shadow: 'rgba(0,0,0,0.35)',
    };

    // ═══════════════════════════════════════════
    //  STATE
    // ═══════════════════════════════════════════
    let canvas, ctx;
    let W = 0, H = 0;        // CSS-pixel viewport; the backing store is W*dpr × H*dpr
    let gameState = 'title'; // title | playing | crashed | finished
    let endless = false;     // set when the player chooses KEEP RUNNING after finishing
    let running = true;      // false once the EPK is revealed — stops the rAF loop
    let playerLane = 1;
    let targetLane = 1;
    let laneFrom = 1; // lane position when move started
    let laneT = 1; // interpolation 0→1
    let distance = 0;
    let speed = BASE_SPEED;
    let obstacles = [];
    let collectibles = [];
    let decorations = [];
    let score = 0;
    let jumping = false;
    let jumpTime = 0;
    let jumpHeight = 0;
    let lastTime = 0;
    let crashTimer = 0;
    let finishTimer = 0;
    let screenShake = 0;
    let titleRoadOffset = 0; // animate road on title screen
    let clouds = [];
    let hills = [];
    let skyGrad = null, roadGrad = null, groundGrad = null, vignette = null;

    // ═══════════════════════════════════════════
    //  VIEWPORT
    // ═══════════════════════════════════════════
    // Every draw function works in CSS pixels (W/H). The backing store is scaled
    // by devicePixelRatio and the context pre-transformed, so nothing downstream
    // has to know about DPR — but that also means nothing may read canvas.width.
    function resize() {
        W = window.innerWidth;
        H = window.innerHeight;
        var dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        buildGradients();
    }

    // Gradients are viewport-sized, so they only change on resize — rebuilding
    // them per frame was costing four object allocations every frame.
    function buildGradients() {
        var horizonY = H * HORIZON_FRAC;

        skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
        skyGrad.addColorStop(0, COLORS.sky);
        skyGrad.addColorStop(1, COLORS.skyHorizon);

        groundGrad = ctx.createLinearGradient(0, horizonY, 0, H);
        groundGrad.addColorStop(0, COLORS.ground);
        groundGrad.addColorStop(1, COLORS.groundDark);

        var pNear = project(0), pFar = project(MAX_Z);
        roadGrad = ctx.createLinearGradient(0, pFar.y, 0, pNear.y);
        roadGrad.addColorStop(0, COLORS.road);
        roadGrad.addColorStop(1, COLORS.roadLight);

        // Kept deliberately light — it's there to focus the eye on the lanes, not
        // to darken the scene. At 0.42 it turned a bright daytime road murky.
        vignette = ctx.createRadialGradient(W / 2, H * 0.55, H * 0.45, W / 2, H * 0.55, H * 1.05);
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(1, 'rgba(0,0,0,0.18)');

        // Two parallax ridges sitting on the horizon, regenerated at viewport width
        hills = [];
        for (var layer = 0; layer < 2; layer++) {
            var pts = [];
            var step = W / 12;
            for (var x = -step; x <= W + step; x += step) {
                pts.push({ x: x, y: (layer === 0 ? 26 : 42) * (0.5 + Math.abs(Math.sin(x * 0.011 + layer * 2.3))) });
            }
            hills.push(pts);
        }
    }

    // ═══════════════════════════════════════════
    //  PROJECTION
    // ═══════════════════════════════════════════
    function project(z) {
        var d = z / MAX_Z;
        var perspective = 1 / (1 + d * 5);
        var horizonY = H * HORIZON_FRAC;
        var playerY = H * 0.93;
        return { y: horizonY + (playerY - horizonY) * perspective, scale: perspective };
    }

    // Distance fog — everything fades toward the horizon haze as z grows.
    // Returns 0 (near, full colour) → 1 (far, fully hazed).
    function fogAt(z) {
        var t = z / MAX_Z;
        return Math.min(1, Math.max(0, (t - 0.25) / 0.75)) * 0.85;
    }

    function laneToX(lane, scale) {
        var cx = W / 2;
        var halfW = W * 0.32 * scale;
        return cx + (lane - 1) * halfW * 0.7;
    }

    // ═══════════════════════════════════════════
    //  INIT
    // ═══════════════════════════════════════════
    function init() {
        canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        ctx = canvas.getContext('2d');

        resize();
        window.addEventListener('resize', resize);

        // Generate roadside decorations: green trees, orange trees, speakers
        for (var i = 0; i < 40; i++) {
            var roll = Math.random();
            var decType;
            if (roll < 0.45) decType = 'tree';
            else if (roll < 0.75) decType = 'orangeTree';
            else decType = 'speaker';
            decorations.push({
                z: Math.random() * MAX_Z,
                side: Math.random() < 0.5 ? -1 : 1,
                // Pushed off the shoulder so scenery never crowds the lanes and
                // reads as something you have to dodge.
                offset: 1.5 + Math.random() * 0.9,
                type: decType,
                size: 0.8 + Math.random() * 0.7,
            });
        }

        spawnClouds();

        setupInput();
        lastTime = performance.now();
        requestAnimationFrame(loop);
    }

    // ═══════════════════════════════════════════
    //  INPUT
    // ═══════════════════════════════════════════
    function setupInput() {
        document.addEventListener('keydown', function (e) {
            if (gameState === 'title') {
                if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); startGame(); }
                return;
            }
            if (gameState === 'crashed') {
                if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); startGame(); }
                return;
            }
            if (gameState === 'finished') {
                // Buttons are real DOM elements, so Tab/Enter already work on them.
                // Space is the one key players will reach for out of habit.
                if (e.code === 'Space') { e.preventDefault(); enterSite(); }
                return;
            }
            if (gameState === 'playing') {
                if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); moveLeft(); }
                else if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); moveRight(); }
                else if (e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyW') { e.preventDefault(); doJump(); }
            }
        });

        // Touch
        var tx = 0, ty = 0, tt = 0;
        canvas.addEventListener('touchstart', function (e) {
            e.preventDefault();
            tx = e.touches[0].clientX;
            ty = e.touches[0].clientY;
            tt = Date.now();
            if (gameState === 'title') startGame();
            else if (gameState === 'crashed') startGame();
        }, { passive: false });

        canvas.addEventListener('touchend', function (e) {
            e.preventDefault();
            if (gameState !== 'playing') return;
            var dx = e.changedTouches[0].clientX - tx;
            var dy = e.changedTouches[0].clientY - ty;
            var dt = Date.now() - tt;
            if (dt > 350) return;
            var ax = Math.abs(dx), ay = Math.abs(dy);
            if (ax > 30 && ax > ay) { dx < 0 ? moveLeft() : moveRight(); }
            else if (ay > 30 && ay > ax && dy < 0) { doJump(); }
        }, { passive: false });

        canvas.addEventListener('click', function () {
            if (gameState === 'title') startGame();
            else if (gameState === 'crashed') startGame();
        });

        // Skip button
        var skipBtn = document.getElementById('gameSkip');
        if (skipBtn) skipBtn.addEventListener('click', function (e) { e.stopPropagation(); enterSite(); });

        // Finish-screen choices — real buttons, so hover/focus/keyboard come free
        var enterBtn = document.getElementById('gameEnter');
        if (enterBtn) enterBtn.addEventListener('click', function (e) { e.stopPropagation(); enterSite(); });
        var againBtn = document.getElementById('gameKeepRunning');
        if (againBtn) againBtn.addEventListener('click', function (e) { e.stopPropagation(); goEndless(); });
    }

    function spawnClouds() {
        clouds = [];
        for (var i = 0; i < 7; i++) {
            clouds.push({
                x: Math.random() * W,
                y: H * (0.02 + Math.random() * 0.14),
                scale: 0.6 + Math.random() * 0.9,
                speed: 6 + Math.random() * 10,
            });
        }
    }

    function moveLeft() { if (targetLane > 0) { laneFrom = playerLane; targetLane--; laneT = 0; } }
    function moveRight() { if (targetLane < LANE_COUNT - 1) { laneFrom = playerLane; targetLane++; laneT = 0; } }
    function doJump() { if (!jumping) { jumping = true; jumpTime = 0; } }

    // ═══════════════════════════════════════════
    //  GAME FLOW
    // ═══════════════════════════════════════════
    function startGame() {
        gameState = 'playing';
        endless = false;
        distance = 0;
        speed = BASE_SPEED;
        playerLane = 1;
        targetLane = 1;
        laneFrom = 1;
        laneT = 1;
        obstacles = [];
        collectibles = [];
        score = 0;
        jumping = false;
        jumpTime = 0;
        jumpHeight = 0;
        screenShake = 0;
        crashTimer = 0;
        finishTimer = 0;
        showFinishButtons(false);
        lastTime = performance.now();
        seedObstacles();
    }

    // Chosen from the finish screen: drop the finish line and keep the run going.
    // Oranges carry over, speed keeps climbing toward MAX_SPEED.
    function goEndless() {
        endless = true;
        gameState = 'playing';
        finishTimer = 0;
        showFinishButtons(false);
        lastTime = performance.now();
    }

    function showFinishButtons(show) {
        var el = document.getElementById('gameFinishActions');
        if (el) el.classList.toggle('is-visible', !!show);
    }

    var entered = false;
    function enterSite() {
        if (entered) return;
        entered = true;
        showFinishButtons(false);
        var overlay = document.getElementById('gameOverlay');
        if (!overlay) return;
        overlay.style.transition = 'opacity 0.8s ease';
        overlay.style.opacity = '0';
        setTimeout(function () {
            overlay.style.display = 'none';
            document.body.classList.remove('game-active');
            // The loop used to keep rendering a full-screen canvas for the rest of
            // the session; nothing is visible past this point, so stop it.
            running = false;
            // Safari can pause hidden autoplay video; nudge it on reveal
            var v = document.querySelector('.hero-video');
            if (v && v.paused) v.play();
            window.scrollTo(0, 0);
        }, 800);
    }

    // ═══════════════════════════════════════════
    //  OBSTACLES
    // ═══════════════════════════════════════════
    function seedObstacles() {
        for (var d = 80; d < MAX_Z; d += OBSTACLE_GAP + Math.random() * 25) {
            spawnAt(d);
        }
    }

    function spawnAt(z) {
        var lane = Math.floor(Math.random() * LANE_COUNT);
        var r = Math.random();
        var type, jumpable;
        if (r < 0.4) { type = 'tree'; jumpable = false; }           // 40% trees — must dodge
        else if (r < 0.7) { type = 'hydrant'; jumpable = true; }    // 30% fire hydrants — jump
        else { type = 'speaker'; jumpable = true; }                  // 30% speakers — jump
        obstacles.push({ z: z, lane: lane, type: type, jumpable: jumpable });

        // Collectible in a different lane
        if (Math.random() < 0.35) {
            var cl = lane;
            while (cl === lane) cl = Math.floor(Math.random() * LANE_COUNT);
            collectibles.push({ z: z + 5, lane: cl, collected: false });
        }
    }

    // ═══════════════════════════════════════════
    //  UPDATE
    // ═══════════════════════════════════════════
    function update(dt) {
        // Clouds drift in every state
        for (var ci = 0; ci < clouds.length; ci++) {
            var c = clouds[ci];
            c.x += c.speed * dt;
            var w = 60 * c.scale;
            if (c.x - w * 2 > W) {
                c.x = -w * 2;
                c.y = H * (0.02 + Math.random() * 0.14);
                c.scale = 0.6 + Math.random() * 0.9;
                c.speed = 6 + Math.random() * 10;
            }
        }

        if (gameState === 'title') {
            titleRoadOffset += 60 * dt;
            return;
        }
        if (gameState !== 'playing') return;

        speed = Math.min(MAX_SPEED, BASE_SPEED + distance * SPEED_RAMP);
        distance += speed * dt;

        // Move world
        var move = speed * dt;
        for (var i = 0; i < obstacles.length; i++) obstacles[i].z -= move;
        for (var i = 0; i < collectibles.length; i++) collectibles[i].z -= move;
        for (var i = 0; i < decorations.length; i++) {
            decorations[i].z -= move;
            if (decorations[i].z < -10) decorations[i].z += MAX_Z;
        }

        // Lane interpolation — smooth ease-in-out from laneFrom to targetLane
        if (laneT < 1) {
            laneT = Math.min(1, laneT + dt * 7);
            // Ease-in-out cubic
            var ease = laneT < 0.5
                ? 4 * laneT * laneT * laneT
                : 1 - Math.pow(-2 * laneT + 2, 3) / 2;
            playerLane = laneFrom + (targetLane - laneFrom) * ease;
        } else {
            playerLane = targetLane;
        }

        // Jump
        if (jumping) {
            jumpTime += dt;
            if (jumpTime >= JUMP_DURATION) { jumping = false; jumpTime = 0; jumpHeight = 0; }
            else { jumpHeight = JUMP_HEIGHT * Math.sin((jumpTime / JUMP_DURATION) * Math.PI); }
        }

        // Shake decay
        if (screenShake > 0) { screenShake *= 0.88; if (screenShake < 0.5) screenShake = 0; }

        // Collision
        var pLane = Math.round(playerLane);
        for (var i = 0; i < obstacles.length; i++) {
            var o = obstacles[i];
            if (o.z < 8 && o.z > -12 && o.lane === pLane) {
                if (o.jumpable && jumping && jumpHeight > JUMP_HEIGHT * 0.3) continue;
                crash(); return;
            }
        }

        // Pickup collectibles
        for (var i = 0; i < collectibles.length; i++) {
            var c = collectibles[i];
            if (!c.collected && c.z < 8 && c.z > -12 && c.lane === pLane) {
                c.collected = true;
                score += 1;
                distance += 60; // oranges boost you toward the finish line
            }
        }

        // Cleanup
        obstacles = obstacles.filter(function (o) { return o.z > -30; });
        collectibles = collectibles.filter(function (c) { return c.z > -30; });

        // Spawn ahead
        var maxZ = 0;
        for (var i = 0; i < obstacles.length; i++) if (obstacles[i].z > maxZ) maxZ = obstacles[i].z;
        while (maxZ < MAX_Z) { maxZ += OBSTACLE_GAP + Math.random() * 25; spawnAt(maxZ); }

        // Win — endless runs have no finish line to cross
        if (!endless && distance >= FINISH_DISTANCE) { gameState = 'finished'; finishTimer = 0; }
    }

    function crash() {
        gameState = 'crashed';
        crashTimer = 0;
        screenShake = 15;
    }

    // ═══════════════════════════════════════════
    //  RENDER
    // ═══════════════════════════════════════════
    function render(dt) {
        ctx.clearRect(0, 0, W, H);

        if (screenShake > 0) {
            ctx.save();
            ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
        }

        var horizonY = H * HORIZON_FRAC;

        // Sky
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, W, horizonY);
        drawSun(horizonY);

        // Clouds drift across the upper sky
        drawClouds();

        // Ground
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, horizonY, W, H - horizonY);

        drawHills(horizonY);
        drawHaze(horizonY);

        // Road
        var roadOff = gameState === 'title' ? titleRoadOffset : distance;
        drawRoad(horizonY, roadOff);

        // Collect all drawable objects, sort far → near
        var objs = [];
        for (var i = 0; i < decorations.length; i++) {
            var d = decorations[i];
            if (d.z > -5 && d.z < MAX_Z) objs.push({ z: d.z, kind: 'deco', ref: d });
        }
        if (gameState === 'playing' || gameState === 'crashed') {
            for (var i = 0; i < obstacles.length; i++) {
                var o = obstacles[i];
                if (o.z > -5 && o.z < MAX_Z) objs.push({ z: o.z, kind: 'obs', ref: o });
            }
            for (var i = 0; i < collectibles.length; i++) {
                var c = collectibles[i];
                if (!c.collected && c.z > -5 && c.z < MAX_Z) objs.push({ z: c.z, kind: 'col', ref: c });
            }
        }
        objs.sort(function (a, b) { return b.z - a.z; });

        for (var i = 0; i < objs.length; i++) {
            var item = objs[i];
            var p = project(item.z);
            if (item.kind === 'deco') drawDecoration(item.ref, p.y, p.scale);
            else if (item.kind === 'obs') drawObstacle(item.ref, p.y, p.scale);
            else if (item.kind === 'col') drawCollectible(item.ref, p.y, p.scale);
        }

        // Player (only during gameplay / crash)
        if (gameState === 'playing' || gameState === 'crashed') drawPlayer();

        if (gameState === 'playing') drawSpeedLines();

        if (screenShake > 0) ctx.restore();

        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, W, H);

        // UI overlays
        if (gameState === 'playing') drawHUD();
        if (gameState === 'title') drawTitle();
        if (gameState === 'crashed') drawCrash(dt);
        if (gameState === 'finished') drawFinish(dt);
    }

    // ── Atmosphere ────────────────────────────
    // Sun sits at the road's vanishing point, so the whole scene reads as one
    // perspective instead of a gradient with a road pasted on it.
    function drawSun(horizonY) {
        var sx = W / 2, sy = horizonY - H * 0.055, r = Math.min(W, H) * 0.055;
        ctx.fillStyle = COLORS.sunGlow;
        ctx.beginPath(); ctx.arc(sx, sy, r * 3.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = COLORS.sun;
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
    }

    // Two parallax ridges. They scroll far slower than the road, which is what
    // sells the distance.
    function drawHills(horizonY) {
        var off = (gameState === 'title' ? titleRoadOffset : distance);
        for (var layer = 0; layer < hills.length; layer++) {
            var pts = hills[layer];
            if (!pts || !pts.length) continue;
            var shift = -(off * (layer === 0 ? 0.012 : 0.028)) % (W + 200);
            ctx.fillStyle = layer === 0 ? COLORS.hillFar : COLORS.hillNear;
            ctx.globalAlpha = layer === 0 ? 0.55 : 0.75;
            ctx.beginPath();
            ctx.moveTo(pts[0].x + shift, horizonY + 2);
            for (var i = 0; i < pts.length; i++) ctx.lineTo(pts[i].x + shift, horizonY - pts[i].y);
            ctx.lineTo(pts[pts.length - 1].x + shift, horizonY + 2);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    // Thin haze right at the horizon so the ground doesn't meet the sky on a
    // hard line. A wide, opaque band here just greyed out the whole middle.
    function drawHaze(horizonY) {
        var band = H * 0.05;
        var g = ctx.createLinearGradient(0, horizonY - band, 0, horizonY + band);
        g.addColorStop(0, 'rgba(191,226,240,0)');
        g.addColorStop(0.5, 'rgba(191,226,240,0.4)');
        g.addColorStop(1, 'rgba(191,226,240,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, horizonY - band, W, band * 2);
    }

    // Streaks along the road edges that only appear once you're moving fast.
    function drawSpeedLines() {
        var t = (speed - BASE_SPEED) / (MAX_SPEED - BASE_SPEED);
        if (t <= 0.05) return;
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,' + (0.06 + t * 0.16).toFixed(3) + ')';
        ctx.lineWidth = 2;
        for (var i = 0; i < 10; i++) {
            var seed = (i * 137.5 + distance * 2.2) % 100 / 100;
            var y = H * (0.35 + seed * 0.6);
            var len = 40 + t * 120;
            var edge = i % 2 === 0 ? W * 0.06 : W * 0.94;
            ctx.beginPath(); ctx.moveTo(edge, y); ctx.lineTo(edge, y + len); ctx.stroke();
        }
        ctx.restore();
    }

    // ── Clouds ────────────────────────────────
    function drawClouds() {
        for (var i = 0; i < clouds.length; i++) {
            var c = clouds[i];
            var s = 30 * c.scale;
            // Soft underbelly
            ctx.fillStyle = COLORS.cloudSoft;
            ctx.beginPath();
            ctx.ellipse(c.x + s * 0.5, c.y + s * 0.4, s * 1.6, s * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            // Fluffy top
            ctx.fillStyle = COLORS.cloud;
            ctx.beginPath();
            ctx.arc(c.x, c.y, s, 0, Math.PI * 2);
            ctx.arc(c.x + s * 0.85, c.y - s * 0.25, s * 0.85, 0, Math.PI * 2);
            ctx.arc(c.x + s * 1.6, c.y, s * 0.7, 0, Math.PI * 2);
            ctx.arc(c.x + s * 0.45, c.y + s * 0.25, s * 0.6, 0, Math.PI * 2);
            ctx.arc(c.x - s * 0.45, c.y + s * 0.1, s * 0.55, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ── Road ──────────────────────────────────
    function drawRoad(horizonY, offset) {
        var cx = W / 2;
        var baseW = W * 0.65;

        // Road surface — single gradient-filled trapezoid (1 draw call)
        var pNear = project(0), pFar = project(MAX_Z);
        var wNear = baseW * pNear.scale, wFar = baseW * pFar.scale;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx - wNear, pNear.y); ctx.lineTo(cx + wNear, pNear.y);
        ctx.lineTo(cx + wFar, pFar.y); ctx.lineTo(cx - wFar, pFar.y);
        ctx.closePath();
        ctx.clip();

        ctx.fillStyle = roadGrad;
        ctx.fillRect(0, pFar.y, W, pNear.y - pFar.y);
        ctx.restore();

        // Edge stripes — 30 white segments along the road shoulder
        var rumbleSegs = 30;
        for (var i = 0; i < rumbleSegs; i++) {
            var z1 = (i / rumbleSegs) * MAX_Z;
            var z2 = ((i + 1) / rumbleSegs) * MAX_Z;
            var p1 = project(z1), p2 = project(z2);
            var w1 = baseW * p1.scale, w2 = baseW * p2.scale;
            var rw1 = w1 * 0.04, rw2 = w2 * 0.04;

            var seg = Math.floor((z1 + offset * 0.5) / 25);
            ctx.fillStyle = seg % 2 === 0 ? COLORS.rumble : COLORS.rumbleDim;

            ctx.beginPath();
            ctx.moveTo(cx - w1 - rw1, p1.y); ctx.lineTo(cx - w1, p1.y);
            ctx.lineTo(cx - w2, p2.y); ctx.lineTo(cx - w2 - rw2, p2.y);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(cx + w1, p1.y); ctx.lineTo(cx + w1 + rw1, p1.y);
            ctx.lineTo(cx + w2 + rw2, p2.y); ctx.lineTo(cx + w2, p2.y);
            ctx.fill();
        }

        // Lane dashes — 20 dashes
        var dashSegs = 20;
        for (var i = 0; i < dashSegs; i++) {
            var z1 = (i / dashSegs) * MAX_Z;
            var z2 = ((i + 0.35) / dashSegs) * MAX_Z;
            var p1 = project(z1), p2 = project(z2);
            var w1 = baseW * p1.scale, w2 = baseW * p2.scale;

            var seg = Math.floor((z1 + offset * 0.5) / 25);
            if (seg % 2 !== 0) continue;

            ctx.strokeStyle = 'rgba(255,255,255,0.7)';
            ctx.lineWidth = Math.max(1, 2.5 * p1.scale);
            ctx.beginPath(); ctx.moveTo(cx - w1 * 0.33, p1.y); ctx.lineTo(cx - w2 * 0.33, p2.y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx + w1 * 0.33, p1.y); ctx.lineTo(cx + w2 * 0.33, p2.y); ctx.stroke();
        }

        // Finish line preview — endless runs never show one
        if (gameState === 'playing' && !endless) {
            var remaining = FINISH_DISTANCE - distance;
            if (remaining < MAX_Z * 2 && remaining > 0) {
                var fz = remaining * 0.5;
                if (fz > 0 && fz < MAX_Z) {
                    var fp = project(fz);
                    var fw = baseW * fp.scale;
                    // Checkered pattern
                    var checks = 10;
                    var cw = (fw * 2) / checks;
                    for (var c = 0; c < checks; c++) {
                        ctx.fillStyle = c % 2 === 0 ? COLORS.text : COLORS.skyHorizon;
                        ctx.globalAlpha = 0.7;
                        ctx.fillRect(cx - fw + c * cw, fp.y - 4 * fp.scale, cw, 8 * fp.scale);
                    }
                    ctx.globalAlpha = 1;
                }
            }
        }
    }

    // ── Decorations ───────────────────────────
    // Scenery. Muted and fogged so it visibly sits *behind* the play space —
    // the old version reused obstacle art at obstacle saturation, which made
    // harmless roadside trees read as things you had to dodge.
    function drawDecoration(dec, y, scale) {
        var cx = W / 2;
        var hw = W * 0.32 * scale;
        var x = cx + dec.side * (hw + dec.offset * hw);
        var s = 30 * scale * dec.size;
        if (s < 2) return;

        ctx.save();
        ctx.globalAlpha = 0.9 * (1 - fogAt(dec.z) * 0.55);

        if (dec.type === 'tree') {
            ctx.fillStyle = COLORS.treeTrunk;
            ctx.fillRect(x - s * 0.12, y - s * 1.5, s * 0.24, s * 1.5);
            ctx.fillStyle = COLORS.treeCanopy;
            ctx.beginPath(); ctx.arc(x, y - s * 1.8, s * 0.7, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = COLORS.fruit;
            ctx.beginPath(); ctx.arc(x + s * 0.3, y - s * 1.7, s * 0.12, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(x - s * 0.2, y - s * 2.0, s * 0.1, 0, Math.PI * 2); ctx.fill();
        } else if (dec.type === 'orangeTree') {
            ctx.fillStyle = COLORS.treeTrunk;
            ctx.fillRect(x - s * 0.12, y - s * 1.5, s * 0.24, s * 1.5);
            ctx.fillStyle = COLORS.orangeCanopy;
            ctx.beginPath(); ctx.arc(x, y - s * 1.8, s * 0.7, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = COLORS.orangeCanopyDark;
            ctx.beginPath(); ctx.arc(x - s * 0.18, y - s * 1.95, s * 0.32, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = COLORS.orangeFruit;
            ctx.beginPath(); ctx.arc(x + s * 0.32, y - s * 1.65, s * 0.13, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(x - s * 0.05, y - s * 2.05, s * 0.11, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(x + s * 0.18, y - s * 1.95, s * 0.1, 0, Math.PI * 2); ctx.fill();
        } else {
            ctx.fillStyle = COLORS.speakerBody;
            ctx.fillRect(x - s * 0.3, y - s * 0.8, s * 0.6, s * 0.8);
            ctx.fillStyle = COLORS.speakerCone;
            ctx.beginPath(); ctx.arc(x, y - s * 0.4, s * 0.2, 0, Math.PI * 2); ctx.fill();
        }

        ctx.restore();
    }

    // ── Obstacles ─────────────────────────────
    // Colour encodes what you must DO, not what the object is:
    //   dodge-only → tall, hot red, hazard chevrons
    //   jumpable   → short, dark, bright yellow band on top
    // Both get a dark outline and a light top rim so they separate from the
    // asphalt regardless of hue — the old speaker was #2a2a2a on a #262626 road
    // and effectively invisible.
    function drawObstacle(obs, y, scale) {
        var x = laneToX(obs.lane, scale);
        var s = 40 * scale;
        if (s < 3) return;

        // Contact shadow — anchors the object to the road
        ctx.fillStyle = COLORS.shadow;
        ctx.beginPath(); ctx.ellipse(x, y, s * 0.75, s * 0.2, 0, 0, Math.PI * 2); ctx.fill();

        ctx.save();
        ctx.globalAlpha = 1 - fogAt(obs.z) * 0.55;
        ctx.lineJoin = 'round';
        ctx.strokeStyle = COLORS.outline;
        ctx.lineWidth = Math.max(1, s * 0.05);

        if (!obs.jumpable) {
            // ── DODGE — a tall hazard barrier, impossible to read as scenery
            var bw = s * 1.15, bh = s * 2.4;
            ctx.fillStyle = COLORS.dodgeBody;
            rrect(x - bw / 2, y - bh, bw, bh, s * 0.07); ctx.fill(); ctx.stroke();

            // Diagonal hazard chevrons
            ctx.save();
            rrect(x - bw / 2, y - bh, bw, bh, s * 0.07); ctx.clip();
            ctx.strokeStyle = COLORS.dodgeDark;
            ctx.lineWidth = Math.max(1.5, s * 0.13);
            for (var i = -2; i < 6; i++) {
                var ox = x - bw / 2 + i * s * 0.34;
                ctx.beginPath();
                ctx.moveTo(ox, y);
                ctx.lineTo(ox + bh * 0.6, y - bh);
                ctx.stroke();
            }
            ctx.restore();

            // Top rim light
            ctx.fillStyle = COLORS.dodgeRim;
            rrect(x - bw / 2, y - bh, bw, Math.max(1, s * 0.1), s * 0.04); ctx.fill();

            // Post
            ctx.fillStyle = COLORS.dodgeDark;
            ctx.fillRect(x - s * 0.06, y - s * 0.2, s * 0.12, s * 0.2);
        } else {
            // ── JUMP — wide and low, with a bright warning band on top. Reads
            // as "hurdle" at a glance next to the tall dodge barriers.
            var jw = s * 1.15, jh = s * 0.8;
            ctx.fillStyle = COLORS.jumpBody;
            rrect(x - jw / 2, y - jh, jw, jh, s * 0.06); ctx.fill(); ctx.stroke();

            ctx.fillStyle = COLORS.jumpDark;
            rrect(x - jw / 2, y - jh * 0.45, jw, jh * 0.45, s * 0.04); ctx.fill();

            // The band is the single strongest "you can clear this" signal
            ctx.fillStyle = COLORS.jumpBand;
            rrect(x - jw / 2, y - jh - s * 0.14, jw, s * 0.26, s * 0.05); ctx.fill(); ctx.stroke();
            ctx.fillStyle = COLORS.jumpRim;
            rrect(x - jw / 2, y - jh - s * 0.14, jw, Math.max(1, s * 0.08), s * 0.03); ctx.fill();

            // Speaker cone detail, kept from the old art
            if (obs.type === 'speaker') {
                ctx.fillStyle = COLORS.speakerCone;
                ctx.beginPath(); ctx.arc(x, y - jh * 0.55, jw * 0.2, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = COLORS.jumpBand;
                ctx.lineWidth = Math.max(1, s * 0.035);
                ctx.beginPath(); ctx.arc(x, y - jh * 0.55, jw * 0.2, 0, Math.PI * 2); ctx.stroke();
            }
        }

        ctx.restore();
    }

    // ── Collectibles ──────────────────────────
    // Oranges — the site's signature. Warm, so they never compete with the
    // yellow jump-band or the red dodge-barrier for meaning.
    function drawCollectible(col, y, scale) {
        var x = laneToX(col.lane, scale);
        var s = 14 * scale;
        if (s < 2) return;
        var float = Math.sin(performance.now() * 0.005 + col.z) * 5 * scale;
        var cy = y - 30 * scale + float;

        ctx.save();
        ctx.globalAlpha = 1 - fogAt(col.z) * 0.5;

        ctx.fillStyle = COLORS.pickupGlow;
        ctx.beginPath(); ctx.arc(x, cy, s * 1.6, 0, Math.PI * 2); ctx.fill();

        var g = ctx.createRadialGradient(x - s * 0.3, cy - s * 0.3, s * 0.15, x, cy, s);
        g.addColorStop(0, COLORS.pickup);
        g.addColorStop(1, COLORS.pickupDark);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, cy, s, 0, Math.PI * 2); ctx.fill();

        // Leaf
        ctx.fillStyle = COLORS.pickupLeaf;
        ctx.beginPath();
        ctx.ellipse(x + s * 0.32, cy - s * 0.92, s * 0.34, s * 0.16, -0.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = COLORS.pickupShine;
        ctx.beginPath(); ctx.arc(x - s * 0.35, cy - s * 0.35, s * 0.26, 0, Math.PI * 2); ctx.fill();

        ctx.restore();
    }

    // ── Player ────────────────────────────────
    function drawPlayer() {
        var baseP = project(0);
        var x = laneToX(playerLane, 1);
        var baseY = baseP.y;
        var s = 32;

        // Running cycle phase
        var phase = (performance.now() * 0.014) % (Math.PI * 2);
        var stride = Math.sin(phase);

        // Body bob — slight vertical bounce with each stride
        var bob = Math.abs(Math.sin(phase)) * 4;
        var y = baseY - jumpHeight - bob;

        // Shadow (stays on ground)
        ctx.fillStyle = COLORS.playerGlow;
        var ss = jumping ? 0.5 + 0.5 * (1 - jumpHeight / JUMP_HEIGHT) : 1;
        ctx.beginPath(); ctx.ellipse(x, baseY, 18 * ss, 5 * ss, 0, 0, Math.PI * 2); ctx.fill();

        ctx.save();
        ctx.translate(x, y);

        // Glow — kept tight; at 25 it smeared the limbs into a blue blob
        ctx.shadowColor = COLORS.accent;
        ctx.shadowBlur = 10;

        ctx.fillStyle = COLORS.player;
        ctx.strokeStyle = COLORS.player;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Head
        ctx.beginPath(); ctx.arc(0, -s * 1.55, s * 0.25, 0, Math.PI * 2); ctx.fill();

        // Torso — slight forward lean
        ctx.beginPath();
        ctx.moveTo(-s * 0.3, -s * 0.75);
        ctx.lineTo(-s * 0.25, -s * 0.05);
        ctx.lineTo(s * 0.25, -s * 0.05);
        ctx.lineTo(s * 0.3, -s * 0.75);
        ctx.lineTo(0, -s * 1.2);
        ctx.closePath();
        ctx.fill();

        // Legs — from behind, running forward means they pump up/down
        // When a leg is forward: knee bent up, foot hidden (shorter line)
        // When a leg is back: extended down (longer line)
        ctx.lineWidth = s * 0.14;

        // Left leg
        var leftExtend = stride; // 1 = back (long), -1 = forward (short)
        var leftLen = s * (0.35 + leftExtend * 0.12);
        var leftKneeX = -s * 0.13;
        var leftFootX = -s * 0.15 + leftExtend * s * 0.03;
        ctx.beginPath();
        ctx.moveTo(leftKneeX, -s * 0.05);
        ctx.quadraticCurveTo(leftKneeX - s * 0.02, leftLen * 0.5, leftFootX, leftLen);
        ctx.stroke();

        // Right leg (opposite phase)
        var rightExtend = -stride;
        var rightLen = s * (0.35 + rightExtend * 0.12);
        var rightKneeX = s * 0.13;
        var rightFootX = s * 0.15 + rightExtend * s * 0.03;
        ctx.beginPath();
        ctx.moveTo(rightKneeX, -s * 0.05);
        ctx.quadraticCurveTo(rightKneeX + s * 0.02, rightLen * 0.5, rightFootX, rightLen);
        ctx.stroke();

        // Arms — pump opposite to legs (opposite arm to leg)
        ctx.lineWidth = s * 0.09;

        // Left arm (pumps with right leg)
        var leftArmPump = -stride; // opposite to left leg
        var leftArmY = -s * 0.2 + leftArmPump * s * 0.12;
        ctx.beginPath();
        ctx.moveTo(-s * 0.3, -s * 0.65);
        ctx.quadraticCurveTo(-s * 0.38, -s * 0.4, -s * 0.32, leftArmY);
        ctx.stroke();

        // Right arm (pumps with left leg)
        var rightArmPump = stride;
        var rightArmY = -s * 0.2 + rightArmPump * s * 0.12;
        ctx.beginPath();
        ctx.moveTo(s * 0.3, -s * 0.65);
        ctx.quadraticCurveTo(s * 0.38, -s * 0.4, s * 0.32, rightArmY);
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.restore();
    }

    // ── HUD ───────────────────────────────────
    function drawHUD() {
        var by = 28;

        if (endless) {
            // No finish line to progress toward — show how far you've gone
            ctx.fillStyle = COLORS.textDim;
            ctx.font = "11px 'Space Mono', monospace";
            ctx.textAlign = 'center';
            ctx.fillText('ENDLESS  //  ' + Math.floor(distance) + 'M', W / 2, by + 2);
        } else {
            var progress = Math.min(1, distance / FINISH_DISTANCE);
            var bw = Math.min(W * 0.35, 250);
            var bh = 5;
            var bx = (W - bw) / 2;

            // Bar bg
            ctx.fillStyle = 'rgba(255,255,255,0.18)';
            rrect(bx, by, bw, bh, 3); ctx.fill();
            // Bar fill
            ctx.fillStyle = COLORS.accent;
            if (bw * progress > 0) { rrect(bx, by, bw * progress, bh, 3); ctx.fill(); }

            // Label
            ctx.fillStyle = COLORS.textDim;
            ctx.font = "11px 'Space Mono', monospace";
            ctx.textAlign = 'center';
            ctx.fillText(Math.floor(progress * 100) + '% to finish', W / 2, by - 6);
        }

        // Orange count — top right, always visible so the goal is never a mystery
        {
            ctx.save();
            ctx.fillStyle = COLORS.pickup;
            ctx.font = "22px 'Bebas Neue', sans-serif";
            ctx.textAlign = 'right';
            ctx.shadowColor = 'rgba(0,0,0,0.55)';
            ctx.shadowBlur = 6;
            ctx.fillText(ORANGE + ' ' + score, W - 22, by + 6);
            ctx.restore();
        }

        // Controls hint
        if (distance < 300) {
            var a = Math.max(0, 1 - distance / 300);
            ctx.globalAlpha = a;
            ctx.fillStyle = COLORS.textDim;
            ctx.font = "11px 'Space Mono', monospace";
            ctx.textAlign = 'center';
            var mobile = 'ontouchstart' in window;
            var hintY = H - 50;
            if (mobile) {
                ctx.fillText('SWIPE \u2190 \u2192 TO SWITCH LANES  //  SWIPE \u2191 TO JUMP', W / 2, hintY);
            } else {
                ctx.fillText('\u2190 \u2192 TO SWITCH LANES  //  SPACE TO JUMP THE YELLOW-TOPPED ONES', W / 2, hintY);
            }
            ctx.fillText('COLLECT ' + ORANGE + ' TO REACH THE FINISH FASTER', W / 2, hintY + 18);
            ctx.globalAlpha = 1;
        }
    }

    // ── Title Screen ──────────────────────────
    function drawTitle() {
        ctx.fillStyle = 'rgba(20,30,45,0.7)';
        ctx.fillRect(0, 0, W, H);

        var cx = W / 2;
        var cy = H * 0.42;
        var mobile = 'ontouchstart' in window;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Title
        ctx.save();
        ctx.shadowColor = COLORS.accent;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        ctx.shadowBlur = 0;
        ctx.fillStyle = COLORS.text;
        ctx.font = "bold " + Math.min(80, W * 0.12) + "px 'Anton', sans-serif";
        ctx.fillText('AYOPAPO', cx, cy - 80);
        ctx.restore();

        // EPK goal text
        ctx.fillStyle = COLORS.accent;
        ctx.font = "italic " + Math.min(22, W * 0.04) + "px 'Space Mono', monospace";
        ctx.fillText('Reach the finish line to enter the EPK', cx, cy - 20);

        // Prompt
        var pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.004);
        ctx.globalAlpha = 0.4 + pulse * 0.6;
        ctx.fillStyle = COLORS.text;
        ctx.font = "14px 'Space Mono', monospace";
        ctx.fillText(mobile ? 'TAP TO START' : 'PRESS SPACE TO START', cx, cy + 30);
        ctx.globalAlpha = 1;

        // Controls
        ctx.fillStyle = COLORS.textDim;
        ctx.font = "11px 'Space Mono', monospace";
        var lineY = cy + 70;
        if (mobile) {
            ctx.fillText('SWIPE \u2190 \u2192 TO SWITCH LANES', cx, lineY);
            ctx.fillText('SWIPE \u2191 TO JUMP THE YELLOW-TOPPED ONES', cx, lineY + 20);
            ctx.fillText('COLLECT ' + ORANGE + ' TO REACH THE FINISH FASTER', cx, lineY + 40);
        } else {
            ctx.fillText('\u2190 \u2192 ARROWS TO SWITCH LANES', cx, lineY);
            ctx.fillText('SPACE TO JUMP THE YELLOW-TOPPED ONES', cx, lineY + 20);
            ctx.fillText('COLLECT ' + ORANGE + ' TO REACH THE FINISH FASTER', cx, lineY + 40);
        }

        ctx.textBaseline = 'alphabetic';
    }

    // ── Crash Screen ──────────────────────────
    // Timers advance by real dt — they used to add a hardcoded 0.016 per frame,
    // which ran them at double speed on a 120Hz display.
    function drawCrash(dt) {
        crashTimer += dt;
        if (crashTimer < 0.15) {
            ctx.fillStyle = 'rgba(200,50,30,' + (0.3 * (1 - crashTimer / 0.15)) + ')';
            ctx.fillRect(0, 0, W, H);
        }
        var alpha = Math.min(0.7, crashTimer * 2);
        ctx.fillStyle = 'rgba(20,30,45,' + alpha + ')';
        ctx.fillRect(0, 0, W, H);

        if (crashTimer > 0.25) {
            var cx = W / 2, cy = H / 2;
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ff4444';
            ctx.font = "bold 56px 'Bebas Neue', sans-serif";
            ctx.fillText('CRASHED!', cx, cy - 20);

            ctx.fillStyle = COLORS.textDim;
            ctx.font = "13px 'Space Mono', monospace";
            ctx.fillText(endless
                ? Math.floor(distance) + 'M  //  ' + ORANGE + ' ' + score
                : Math.floor(distance / FINISH_DISTANCE * 100) + '% completed', cx, cy + 15);

            var pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.004);
            ctx.globalAlpha = 0.4 + pulse * 0.6;
            ctx.fillStyle = COLORS.text;
            ctx.font = "14px 'Space Mono', monospace";
            var mobile = 'ontouchstart' in window;
            ctx.fillText(mobile ? 'TAP TO RETRY' : 'PRESS SPACE TO RETRY', cx, cy + 55);
            ctx.globalAlpha = 1;
        }
    }

    // ── Finish Screen ─────────────────────────
    // No longer auto-enters the site. The player picks: ENTER EPK, or KEEP
    // RUNNING into endless mode. The choices are real DOM buttons living in
    // #gameFinishActions, revealed once the text has faded in.
    function drawFinish(dt) {
        finishTimer += dt;
        var alpha = Math.min(0.85, finishTimer);
        ctx.fillStyle = 'rgba(20,30,45,' + alpha + ')';
        ctx.fillRect(0, 0, W, H);

        if (finishTimer > 0.3) {
            var cx = W / 2, cy = H / 2;
            ctx.textAlign = 'center';

            ctx.save();
            ctx.shadowColor = COLORS.text;
            ctx.shadowOffsetX = 3;
            ctx.shadowOffsetY = 3;
            ctx.shadowBlur = 0;
            ctx.fillStyle = COLORS.accent;
            ctx.font = "bold 56px 'Bebas Neue', sans-serif";
            ctx.fillText('YOU MADE IT!', cx, cy - 70);
            ctx.restore();

            ctx.fillStyle = COLORS.textDim;
            ctx.font = "14px 'Space Mono', monospace";
            ctx.fillText(ORANGE + ' ' + score + (score === 1 ? ' orange' : ' oranges') + ' collected', cx, cy - 30);
        }

        if (finishTimer > 0.6) showFinishButtons(true);
    }

    // ═══════════════════════════════════════════
    //  HELPERS
    // ═══════════════════════════════════════════
    function rrect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    }

    // ═══════════════════════════════════════════
    //  LOOP
    // ═══════════════════════════════════════════
    function loop(ts) {
        var dt = Math.min(0.05, (ts - lastTime) / 1000);
        lastTime = ts;
        update(dt);
        render(dt);
        if (running) requestAnimationFrame(loop);
    }

    // ═══════════════════════════════════════════
    //  BACKGROUND ASSET PRELOADER
    // ═══════════════════════════════════════════
    function preloadEPKAssets() {
        // Prefetch gallery and other images into browser cache while game runs.
        // Uses requestIdleCallback (or setTimeout fallback) so it never
        // competes with the game's rendering budget.
        // Read from the DOM (content.js has filled the gallery + bio from
        // site.json by the time the 1.5 s delay below is up).
        var urls = [];
        var idx = 0;
        function next() {
            if (!urls.length) {
                urls = Array.prototype.map.call(document.querySelectorAll('.gallery-masonry img, .bio-image img'), function (i) { return i.currentSrc || i.src; });
            }
            if (idx >= urls.length) return;
            var img = new Image();
            img.src = urls[idx++];
            // Load next image after this one finishes (or errors), with idle scheduling
            img.onload = img.onerror = function () {
                if (window.requestIdleCallback) requestIdleCallback(next);
                else setTimeout(next, 100);
            };
        }
        // Start after a brief delay so the game boots first
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
