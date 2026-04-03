(function () {
    'use strict';

    // ═══════════════════════════════════════════
    //  CONFIG
    // ═══════════════════════════════════════════
    const LANE_COUNT = 3;
    const MAX_Z = 300;
    const OBSTACLE_GAP = 45;
    const FINISH_DISTANCE = 2400;
    const BASE_SPEED = 130;
    const MAX_SPEED = 220;
    const JUMP_DURATION = 0.55;
    const JUMP_HEIGHT = 80;

    const COLORS = {
        sky: '#0a0804',
        skyHorizon: '#1a1208',
        ground: '#2a1e12',
        groundDark: '#1a1208',
        road: '#332816',
        roadLight: '#3d3020',
        rumble: '#c06a1a',
        rumbleDim: '#2a1e12',
        lane: 'rgba(240,230,208,0.25)',
        player: '#e87a20',
        playerGlow: 'rgba(232,122,32,0.4)',
        text: '#f0e6d0',
        textDim: '#9c8a72',
        accent: '#e87a20',
        treeTrunk: '#6b4226',
        treeCanopy: '#3a7a2a',
        treeCanopyDark: '#2d5a1e',
        orange: '#e87a20',
        leaf: '#4a8a2e',
        speakerBody: '#2a2a2a',
        speakerCone: '#1a1a1a',
        speakerRing: '#444',
        shadow: 'rgba(0,0,0,0.3)',
    };

    // ═══════════════════════════════════════════
    //  STATE
    // ═══════════════════════════════════════════
    let canvas, ctx;
    let gameState = 'title'; // title | playing | crashed | finished
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

    // ═══════════════════════════════════════════
    //  PROJECTION
    // ═══════════════════════════════════════════
    function project(z) {
        var d = z / MAX_Z;
        var perspective = 1 / (1 + d * 5);
        var horizonY = canvas.height * 0.05;
        var playerY = canvas.height * 0.93;
        return { y: horizonY + (playerY - horizonY) * perspective, scale: perspective };
    }

    function laneToX(lane, scale) {
        var cx = canvas.width / 2;
        var halfW = canvas.width * 0.32 * scale;
        return cx + (lane - 1) * halfW * 0.7;
    }

    // ═══════════════════════════════════════════
    //  INIT
    // ═══════════════════════════════════════════
    function init() {
        canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        ctx = canvas.getContext('2d');

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        // Generate roadside decorations
        for (var i = 0; i < 40; i++) {
            decorations.push({
                z: Math.random() * MAX_Z,
                side: Math.random() < 0.5 ? -1 : 1,
                offset: 1.3 + Math.random() * 0.8,
                type: Math.random() < 0.7 ? 'tree' : 'speaker',
                size: 0.5 + Math.random() * 0.5,
            });
        }

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
    }

    function moveLeft() { if (targetLane > 0) { laneFrom = playerLane; targetLane--; laneT = 0; } }
    function moveRight() { if (targetLane < LANE_COUNT - 1) { laneFrom = playerLane; targetLane++; laneT = 0; } }
    function doJump() { if (!jumping) { jumping = true; jumpTime = 0; } }

    // ═══════════════════════════════════════════
    //  GAME FLOW
    // ═══════════════════════════════════════════
    function startGame() {
        gameState = 'playing';
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
        lastTime = performance.now();
        seedObstacles();
    }

    var entered = false;
    function enterSite() {
        if (entered) return;
        entered = true;
        var overlay = document.getElementById('gameOverlay');
        if (!overlay) return;
        overlay.style.transition = 'opacity 0.8s ease';
        overlay.style.opacity = '0';
        setTimeout(function () {
            overlay.style.display = 'none';
            document.body.classList.remove('game-active');
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
        if (gameState === 'title') {
            titleRoadOffset += 60 * dt;
            return;
        }
        if (gameState !== 'playing') return;

        speed = Math.min(MAX_SPEED, BASE_SPEED + distance * 0.025);
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
                score += 10;
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

        // Win
        if (distance >= FINISH_DISTANCE) { gameState = 'finished'; finishTimer = 0; }
    }

    function crash() {
        gameState = 'crashed';
        crashTimer = 0;
        screenShake = 15;
    }

    // ═══════════════════════════════════════════
    //  RENDER
    // ═══════════════════════════════════════════
    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (screenShake > 0) {
            ctx.save();
            ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
        }

        var horizonY = canvas.height * 0.05;

        // Sky
        var sky = ctx.createLinearGradient(0, 0, 0, horizonY);
        sky.addColorStop(0, COLORS.sky);
        sky.addColorStop(1, COLORS.skyHorizon);
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, canvas.width, horizonY);

        // Ground
        var gnd = ctx.createLinearGradient(0, horizonY, 0, canvas.height);
        gnd.addColorStop(0, COLORS.ground);
        gnd.addColorStop(1, COLORS.groundDark);
        ctx.fillStyle = gnd;
        ctx.fillRect(0, horizonY, canvas.width, canvas.height - horizonY);

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

        if (screenShake > 0) ctx.restore();

        // UI overlays
        if (gameState === 'playing') drawHUD();
        if (gameState === 'title') drawTitle();
        if (gameState === 'crashed') drawCrash();
        if (gameState === 'finished') drawFinish();
    }

    // ── Road ──────────────────────────────────
    function drawRoad(horizonY, offset) {
        var cx = canvas.width / 2;
        var baseW = canvas.width * 0.65;

        // Road surface — single gradient-filled trapezoid (1 draw call)
        var pNear = project(0), pFar = project(MAX_Z);
        var wNear = baseW * pNear.scale, wFar = baseW * pFar.scale;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx - wNear, pNear.y); ctx.lineTo(cx + wNear, pNear.y);
        ctx.lineTo(cx + wFar, pFar.y); ctx.lineTo(cx - wFar, pFar.y);
        ctx.closePath();
        ctx.clip();

        var roadGrad = ctx.createLinearGradient(0, pFar.y, 0, pNear.y);
        roadGrad.addColorStop(0, '#292014');
        roadGrad.addColorStop(1, '#3a2e1e');
        ctx.fillStyle = roadGrad;
        ctx.fillRect(0, pFar.y, canvas.width, pNear.y - pFar.y);
        ctx.restore();

        // Rumble strips — 30 chunky segments (alternating orange/dark)
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

            ctx.strokeStyle = 'rgba(240,230,208,0.18)';
            ctx.lineWidth = Math.max(1, 2.5 * p1.scale);
            ctx.beginPath(); ctx.moveTo(cx - w1 * 0.33, p1.y); ctx.lineTo(cx - w2 * 0.33, p2.y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx + w1 * 0.33, p1.y); ctx.lineTo(cx + w2 * 0.33, p2.y); ctx.stroke();
        }

        // Finish line preview
        if (gameState === 'playing') {
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
                        ctx.fillStyle = c % 2 === 0 ? '#fff' : '#222';
                        ctx.globalAlpha = 0.7;
                        ctx.fillRect(cx - fw + c * cw, fp.y - 4 * fp.scale, cw, 8 * fp.scale);
                    }
                    ctx.globalAlpha = 1;
                }
            }
        }
    }

    // ── Decorations ───────────────────────────
    function drawDecoration(dec, y, scale) {
        var cx = canvas.width / 2;
        var hw = canvas.width * 0.32 * scale;
        var x = cx + dec.side * (hw + dec.offset * hw);
        var s = 30 * scale * dec.size;
        if (s < 2) return;

        if (dec.type === 'tree') {
            ctx.fillStyle = COLORS.treeTrunk;
            ctx.fillRect(x - s * 0.12, y - s * 1.5, s * 0.24, s * 1.5);
            ctx.fillStyle = COLORS.treeCanopy;
            ctx.beginPath(); ctx.arc(x, y - s * 1.8, s * 0.7, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = COLORS.orange;
            ctx.beginPath(); ctx.arc(x + s * 0.3, y - s * 1.7, s * 0.12, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(x - s * 0.2, y - s * 2.0, s * 0.1, 0, Math.PI * 2); ctx.fill();
        } else {
            ctx.fillStyle = '#333';
            ctx.fillRect(x - s * 0.3, y - s * 0.8, s * 0.6, s * 0.8);
            ctx.fillStyle = '#222';
            ctx.beginPath(); ctx.arc(x, y - s * 0.4, s * 0.2, 0, Math.PI * 2); ctx.fill();
        }
    }

    // ── Obstacles ─────────────────────────────
    function drawObstacle(obs, y, scale) {
        var x = laneToX(obs.lane, scale);
        var s = 40 * scale;
        if (s < 3) return;

        // Shadow
        ctx.fillStyle = COLORS.shadow;
        ctx.beginPath(); ctx.ellipse(x, y, s * 0.7, s * 0.18, 0, 0, Math.PI * 2); ctx.fill();

        if (obs.type === 'tree') {
            // Tall tree — must dodge, cannot jump
            ctx.fillStyle = COLORS.treeTrunk;
            ctx.fillRect(x - s * 0.1, y - s * 2, s * 0.2, s * 2);
            ctx.fillStyle = COLORS.treeCanopy;
            ctx.beginPath(); ctx.arc(x, y - s * 2.2, s * 0.65, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = COLORS.treeCanopyDark;
            ctx.beginPath(); ctx.arc(x - s * 0.15, y - s * 2.4, s * 0.35, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = COLORS.orange;
            var oo = [[0.25, -2.0], [-0.2, -2.3], [0.1, -2.5], [-0.35, -1.95]];
            for (var i = 0; i < oo.length; i++) {
                ctx.beginPath(); ctx.arc(x + oo[i][0] * s, y + oo[i][1] * s, s * 0.1, 0, Math.PI * 2); ctx.fill();
            }
        } else if (obs.type === 'hydrant') {
            // Fire hydrant — jumpable
            var hw = s * 0.3, hh = s * 0.7;
            ctx.fillStyle = '#cc2222';
            rrect(x - hw * 0.6, y - hh * 0.15, hw * 1.2, hh * 0.15, s * 0.02); ctx.fill();
            ctx.fillStyle = '#dd3333';
            rrect(x - hw / 2, y - hh, hw, hh, s * 0.04); ctx.fill();
            ctx.fillStyle = '#bb2222';
            rrect(x - hw * 0.35, y - hh - hh * 0.18, hw * 0.7, hh * 0.18, s * 0.03); ctx.fill();
            ctx.fillStyle = '#cc2222';
            ctx.beginPath(); ctx.arc(x, y - hh - hh * 0.18, hw * 0.2, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#aa1818';
            rrect(x - hw * 0.75, y - hh * 0.65, hw * 0.3, hh * 0.12, s * 0.02); ctx.fill();
            rrect(x + hw * 0.45, y - hh * 0.65, hw * 0.3, hh * 0.12, s * 0.02); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            rrect(x - hw * 0.15, y - hh * 0.9, hw * 0.12, hh * 0.6, s * 0.01); ctx.fill();
        } else {
            // Speaker — short, jumpable
            var sw = s * 0.6, sh = s * 0.65;
            ctx.fillStyle = COLORS.speakerBody;
            rrect(x - sw / 2, y - sh, sw, sh, s * 0.06); ctx.fill();
            ctx.fillStyle = COLORS.speakerCone;
            ctx.beginPath(); ctx.arc(x, y - sh * 0.5, sw * 0.28, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = COLORS.speakerRing;
            ctx.lineWidth = Math.max(1, s * 0.03); ctx.stroke();
            ctx.strokeStyle = COLORS.accent;
            ctx.lineWidth = Math.max(1, s * 0.05);
            ctx.beginPath(); ctx.arc(x, y - sh * 0.5, sw * 0.13, 0, Math.PI * 2); ctx.stroke();
        }
    }

    // ── Collectibles ──────────────────────────
    function drawCollectible(col, y, scale) {
        var x = laneToX(col.lane, scale);
        var s = 14 * scale;
        if (s < 2) return;
        var float = Math.sin(performance.now() * 0.005 + col.z) * 5 * scale;
        var cy = y - 30 * scale + float;

        ctx.fillStyle = COLORS.playerGlow;
        ctx.beginPath(); ctx.arc(x, cy, s * 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = COLORS.orange;
        ctx.beginPath(); ctx.arc(x, cy, s, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = COLORS.leaf;
        ctx.beginPath(); ctx.ellipse(x + s * 0.3, cy - s * 0.85, s * 0.45, s * 0.18, 0.5, 0, Math.PI * 2); ctx.fill();
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

        // Glow
        ctx.shadowColor = COLORS.accent;
        ctx.shadowBlur = 25;

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
        var progress = Math.min(1, distance / FINISH_DISTANCE);
        var bw = Math.min(canvas.width * 0.35, 250);
        var bh = 5;
        var bx = (canvas.width - bw) / 2;
        var by = 28;

        // Bar bg
        ctx.fillStyle = 'rgba(240,230,208,0.08)';
        rrect(bx, by, bw, bh, 3); ctx.fill();
        // Bar fill
        ctx.fillStyle = COLORS.accent;
        if (bw * progress > 0) { rrect(bx, by, bw * progress, bh, 3); ctx.fill(); }

        // Label
        ctx.fillStyle = COLORS.textDim;
        ctx.font = "11px 'Space Mono', monospace";
        ctx.textAlign = 'center';
        ctx.fillText(Math.floor(progress * 100) + '% to finish', canvas.width / 2, by - 6);

        // Score
        if (score > 0) {
            ctx.fillStyle = COLORS.accent;
            ctx.font = "18px 'Bebas Neue', sans-serif";
            ctx.textAlign = 'left';
            ctx.fillText('\uD83C\uDF4A ' + score, 20, by + 4);
        }

        // Controls hint
        if (distance < 300) {
            var a = Math.max(0, 1 - distance / 300);
            ctx.globalAlpha = a;
            ctx.fillStyle = COLORS.textDim;
            ctx.font = "11px 'Space Mono', monospace";
            ctx.textAlign = 'center';
            var mobile = 'ontouchstart' in window;
            var hintY = canvas.height - 50;
            if (mobile) {
                ctx.fillText('SWIPE \u2190 \u2192 TO SWITCH LANES  //  SWIPE \u2191 TO JUMP', canvas.width / 2, hintY);
            } else {
                ctx.fillText('\u2190 \u2192 TO SWITCH LANES  //  SPACE TO JUMP OVER LOW OBSTACLES', canvas.width / 2, hintY);
            }
            ctx.fillText('COLLECT \uD83C\uDF4A TO REACH THE FINISH FASTER', canvas.width / 2, hintY + 18);
            ctx.globalAlpha = 1;
        }
    }

    // ── Title Screen ──────────────────────────
    function drawTitle() {
        ctx.fillStyle = 'rgba(10,8,4,0.65)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        var cx = canvas.width / 2;
        var cy = canvas.height * 0.42;
        var mobile = 'ontouchstart' in window;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Title
        ctx.save();
        ctx.shadowColor = '#5c4e85';
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        ctx.shadowBlur = 0;
        ctx.fillStyle = COLORS.text;
        ctx.font = "bold " + Math.min(80, canvas.width * 0.12) + "px 'Anton', sans-serif";
        ctx.fillText('AYOPAPO', cx, cy - 80);
        ctx.restore();

        // EPK goal text
        ctx.fillStyle = COLORS.accent;
        ctx.font = "italic " + Math.min(22, canvas.width * 0.04) + "px 'Playfair Display', serif";
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
            ctx.fillText('SWIPE \u2191 TO JUMP OVER LOW OBSTACLES', cx, lineY + 20);
            ctx.fillText('COLLECT \uD83C\uDF4A TO REACH THE FINISH FASTER', cx, lineY + 40);
        } else {
            ctx.fillText('\u2190 \u2192 ARROWS TO SWITCH LANES', cx, lineY);
            ctx.fillText('SPACE TO JUMP OVER LOW OBSTACLES', cx, lineY + 20);
            ctx.fillText('COLLECT \uD83C\uDF4A TO REACH THE FINISH FASTER', cx, lineY + 40);
        }

        ctx.textBaseline = 'alphabetic';
    }

    // ── Crash Screen ──────────────────────────
    function drawCrash() {
        crashTimer += 0.016;
        if (crashTimer < 0.15) {
            ctx.fillStyle = 'rgba(200,50,30,' + (0.3 * (1 - crashTimer / 0.15)) + ')';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        var alpha = Math.min(0.7, crashTimer * 2);
        ctx.fillStyle = 'rgba(10,8,4,' + alpha + ')';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (crashTimer > 0.25) {
            var cx = canvas.width / 2, cy = canvas.height / 2;
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ff4444';
            ctx.font = "bold 56px 'Bebas Neue', sans-serif";
            ctx.fillText('CRASHED!', cx, cy - 20);

            ctx.fillStyle = COLORS.textDim;
            ctx.font = "13px 'Space Mono', monospace";
            ctx.fillText(Math.floor(distance / FINISH_DISTANCE * 100) + '% completed', cx, cy + 15);

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
    function drawFinish() {
        finishTimer += 0.016;
        var alpha = Math.min(0.85, finishTimer);
        ctx.fillStyle = 'rgba(10,8,4,' + alpha + ')';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (finishTimer > 0.3) {
            var cx = canvas.width / 2, cy = canvas.height / 2;
            ctx.textAlign = 'center';

            ctx.save();
            ctx.shadowColor = '#5c4e85';
            ctx.shadowOffsetX = 3;
            ctx.shadowOffsetY = 3;
            ctx.shadowBlur = 0;
            ctx.fillStyle = COLORS.accent;
            ctx.font = "bold 56px 'Bebas Neue', sans-serif";
            ctx.fillText('YOU MADE IT!', cx, cy - 30);
            ctx.restore();

            if (score > 0) {
                ctx.fillStyle = COLORS.textDim;
                ctx.font = "14px 'Space Mono', monospace";
                ctx.fillText('\uD83C\uDF4A ' + score + ' oranges collected', cx, cy + 10);
            }

            ctx.fillStyle = COLORS.text;
            ctx.font = "15px 'Space Mono', monospace";
            ctx.fillText('ENTERING EPK...', cx, cy + 50);
        }

        if (finishTimer > 2.5) enterSite();
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
        render();
        requestAnimationFrame(loop);
    }

    // ═══════════════════════════════════════════
    //  BACKGROUND ASSET PRELOADER
    // ═══════════════════════════════════════════
    function preloadEPKAssets() {
        // Prefetch gallery and other images into browser cache while game runs.
        // Uses requestIdleCallback (or setTimeout fallback) so it never
        // competes with the game's rendering budget.
        var urls = [
            'Assets/Photos/AyoPapo_1.jpeg',
            'Assets/Photos/DSC02620.JPG',
            'Assets/Photos/DSC02910.JPG',
            'Assets/Photos/IMG_0115%203.JPG',
            'Assets/Photos/IMG_0218%202.jpg',
            'Assets/Photos/IMG_0560.JPG',
            'Assets/Photos/IMG_1228.JPG',
            'Assets/Photos/IMG_1280.JPG',
            'Assets/Photos/IMG_6116.JPG',
            'Assets/Photos/IMG_9783.JPG',
            'Assets/Photos/P1010002.JPG',
            'Assets/Photos/36052C08-BC91-42F3-BB32-1A0140EF9E9B.JPG',
        ];
        var idx = 0;
        function next() {
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
