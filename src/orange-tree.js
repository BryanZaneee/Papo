// ═══════════════════════════════════════════
// ORANGE TREE BACKGROUND
// ═══════════════════════════════════════════
//
// Draws a full-page procedural orange tree on <canvas id="treeCanvas">:
//   - Canopy (dense leaves + oranges) sits in the hero area
//   - Trunk stretches from below hero to the footer
//   - Branches with leaf clusters + oranges extend from the trunk
//   - Roots spread inside the footer
//
// The tree redraws on resize (debounced).
//

// ── DRAW THE TREE ───────────────────────────

function drawOrangeTree() {
    var canvas = document.getElementById('treeCanvas');
    var ctx = canvas.getContext('2d');
    var docHeight = document.documentElement.scrollHeight;
    var isMobile = window.innerWidth <= 900;

    // Size canvas to content bottom (footer included)
    var footerEl = document.querySelector('.footer');
    var canvasWidth = 1200;
    var canvasHeight = footerEl ? footerEl.offsetTop + footerEl.offsetHeight : docHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    var cx = canvasWidth / 2;

    // Colors
    var trunkColor = '#5a3a1a';
    var trunkHighlight = '#7a5a2a';
    var leafDark = '#1a4a1a';
    var leafMid = '#2a6a2a';
    var leafLight = '#3a8a3a';
    var leafColors = [leafDark, leafMid, leafLight];
    var orangeColor = '#e87a20';
    var orangeHighlight = '#f0a040';
    var rootColor = '#4a2a10';

    // ── HELPERS ──

    function rand(min, max) { return Math.random() * (max - min) + min; }

    function drawBranch(x1, y1, x2, y2, width, color) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo((x1 + x2) / 2 + rand(-20, 20), (y1 + y2) / 2 + rand(-10, 10), x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.stroke();
    }

    function drawLeafCluster(x, y, radius) {
        var count = Math.floor(rand(8, 16));
        for (var i = 0; i < count; i++) {
            var angle = rand(0, Math.PI * 2);
            var dist = rand(0, radius);
            ctx.beginPath();
            ctx.ellipse(
                x + Math.cos(angle) * dist,
                y + Math.sin(angle) * dist,
                rand(8, 22), rand(8, 22) * 0.7, rand(0, Math.PI), 0, Math.PI * 2
            );
            ctx.fillStyle = leafColors[Math.floor(rand(0, 3))];
            ctx.globalAlpha = rand(0.4, 0.9);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    function drawOrange(x, y, r) {
        // Shadow
        ctx.beginPath();
        ctx.arc(x + 2, y + 2, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fill();
        // Gradient body
        var grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
        grad.addColorStop(0, orangeHighlight);
        grad.addColorStop(0.7, orangeColor);
        grad.addColorStop(1, '#c06010');
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        // Shine
        ctx.beginPath();
        ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fill();
        // Stem
        ctx.beginPath();
        ctx.moveTo(x, y - r);
        ctx.lineTo(x + 1, y - r - 5);
        ctx.strokeStyle = '#3a2a10';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    function drawRoot(x1, y1, x2, y2, width) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(
            x1 + (x2 - x1) * 0.3 + rand(-30, 30), y1 + (y2 - y1) * 0.3 + rand(-15, 15),
            x1 + (x2 - x1) * 0.7 + rand(-30, 30), y1 + (y2 - y1) * 0.7 + rand(-15, 15),
            x2, y2
        );
        ctx.strokeStyle = rootColor;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.stroke();
    }

    // ── LAYOUT ZONES (anchored to DOM) ──

    var heroEl = document.querySelector('.hero');
    var heroHeight = heroEl ? heroEl.offsetHeight : window.innerHeight;
    var footerTop = footerEl ? footerEl.offsetTop : docHeight - 100;
    var footerBottom = footerEl ? footerEl.offsetTop + footerEl.offsetHeight : docHeight;

    var canopyTop = isMobile ? heroHeight * 0.02 : heroHeight * 0.1;
    var canopyBottom = isMobile ? heroHeight * 0.55 : heroHeight * 0.72;
    var canopyCenterY = (canopyTop + canopyBottom) / 2;
    var trunkTop = heroHeight;
    var trunkBottom = footerTop + 10;
    var rootTop = footerTop - 10;
    var rootBottom = footerBottom;
    var trunkWidth = 45;

    // ══════════════════
    // 1. TRUNK
    // ══════════════════

    // Bark grain lines
    for (var i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + rand(-2, 2) - trunkWidth / 2 + i * (trunkWidth / 5), trunkTop);
        ctx.lineTo(cx + rand(-2, 2) - trunkWidth / 2 + i * (trunkWidth / 5) + rand(-5, 5), trunkBottom);
        ctx.strokeStyle = i % 2 === 0 ? trunkColor : trunkHighlight;
        ctx.lineWidth = rand(6, 14);
        ctx.lineCap = 'round';
        ctx.stroke();
    }

    // Solid trunk fill
    ctx.beginPath();
    ctx.moveTo(cx - trunkWidth / 2, trunkTop);
    ctx.lineTo(cx - trunkWidth / 2 - 8, trunkBottom);
    ctx.lineTo(cx + trunkWidth / 2 + 8, trunkBottom);
    ctx.lineTo(cx + trunkWidth / 2, trunkTop);
    ctx.closePath();
    ctx.fillStyle = trunkColor;
    ctx.fill();

    // Bark texture
    for (var y = trunkTop; y < trunkBottom; y += rand(15, 40)) {
        ctx.beginPath();
        ctx.moveTo(cx - trunkWidth / 2 + rand(2, 8), y);
        ctx.lineTo(cx + rand(-10, 10), y + rand(5, 20));
        ctx.strokeStyle = trunkHighlight;
        ctx.lineWidth = rand(0.5, 2);
        ctx.globalAlpha = rand(0.2, 0.5);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    // ══════════════════
    // 2. BRANCHES (8 zones along trunk)
    // ══════════════════

    var branchZones = [
        { y: trunkTop + (trunkBottom - trunkTop) * 0.05, spread: 280 },
        { y: trunkTop + (trunkBottom - trunkTop) * 0.12, spread: 300 },
        { y: trunkTop + (trunkBottom - trunkTop) * 0.22, spread: 250 },
        { y: trunkTop + (trunkBottom - trunkTop) * 0.35, spread: 220 },
        { y: trunkTop + (trunkBottom - trunkTop) * 0.48, spread: 180 },
        { y: trunkTop + (trunkBottom - trunkTop) * 0.60, spread: 150 },
        { y: trunkTop + (trunkBottom - trunkTop) * 0.72, spread: 120 },
        { y: trunkTop + (trunkBottom - trunkTop) * 0.83, spread: 90 },
    ];

    branchZones.forEach(function (zone) {
        // Left branch + sub-branch + leaves
        var lx = cx - rand(zone.spread * 0.5, zone.spread);
        var ly = zone.y + rand(-40, 40);
        drawBranch(cx - 5, zone.y, lx, ly, rand(4, 10), trunkColor);
        drawBranch(lx, ly, lx - rand(20, 60), ly + rand(-30, 30), rand(2, 5), trunkColor);
        drawLeafCluster(lx, ly, rand(25, 50));

        // Right branch + sub-branch + leaves
        var rx = cx + rand(zone.spread * 0.5, zone.spread);
        var ry = zone.y + rand(-40, 40);
        drawBranch(cx + 5, zone.y, rx, ry, rand(4, 10), trunkColor);
        drawBranch(rx, ry, rx + rand(20, 60), ry + rand(-30, 30), rand(2, 5), trunkColor);
        drawLeafCluster(rx, ry, rand(25, 50));

        // Oranges on some branches
        if (Math.random() > 0.3) drawOrange(lx + rand(-15, 15), ly + rand(5, 25), rand(6, 12));
        if (Math.random() > 0.3) drawOrange(rx + rand(-15, 15), ry + rand(5, 25), rand(6, 12));
    });

    // ══════════════════
    // 3. CANOPY (hero area — dense foliage + oranges)
    // ══════════════════

    for (var i = 0; i < 50; i++) {
        var angle = rand(0, Math.PI * 2);
        var dist = rand(0, 320);
        drawLeafCluster(cx + Math.cos(angle) * dist, canopyCenterY + Math.sin(angle) * dist * 0.55, rand(35, 70));
    }
    for (var i = 0; i < 35; i++) {
        var angle = rand(0, Math.PI * 2);
        var dist = rand(20, 280);
        drawOrange(cx + Math.cos(angle) * dist, canopyCenterY + Math.sin(angle) * dist * 0.5, rand(7, 14));
    }

    // ══════════════════
    // 4. ROOTS (footer area)
    // ══════════════════

    // Ground line
    ctx.beginPath();
    ctx.moveTo(0, rootTop + 10);
    ctx.lineTo(canvasWidth, rootTop + 10);
    ctx.strokeStyle = 'rgba(60,30,10,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    var rootScale = Math.min(1, (rootBottom - rootTop) / 300);
    var rootSpread = [
        { angle: -0.8, length: 280 * rootScale, width: 14 },
        { angle: -0.5, length: 340 * rootScale, width: 12 },
        { angle: -0.2, length: 300 * rootScale, width: 10 },
        { angle: 0.15, length: 320 * rootScale, width: 11 },
        { angle: 0.45, length: 330 * rootScale, width: 13 },
        { angle: 0.75, length: 290 * rootScale, width: 10 },
        { angle: -1.1, length: 220 * rootScale, width: 8 },
        { angle: 1.0, length: 240 * rootScale, width: 9 },
    ];

    rootSpread.forEach(function (r) {
        var endX = cx + Math.sin(r.angle) * r.length;
        var endY = rootTop + Math.cos(r.angle) * r.length * 0.5 + r.length * 0.4;
        drawRoot(cx, rootTop, endX, Math.min(endY, rootBottom), r.width);

        // Sub-roots + tiny tendrils
        for (var j = 0; j < 3; j++) {
            var t = rand(0.3, 0.7);
            var sx = cx + (endX - cx) * t + rand(-10, 10);
            var sy = rootTop + (endY - rootTop) * t;
            var sex = sx + rand(-80, 80);
            var sey = sy + rand(30, 100);
            drawRoot(sx, sy, sex, Math.min(sey, rootBottom), r.width * 0.4);
            if (Math.random() > 0.4) {
                drawRoot(sex, Math.min(sey, rootBottom), sex + rand(-40, 40), Math.min(sey + rand(20, 60), rootBottom), rand(1, 3));
            }
        }
    });

    // Dirt particles
    for (var i = 0; i < 80; i++) {
        ctx.beginPath();
        ctx.arc(cx + rand(-450, 450), rand(rootTop + 20, rootBottom), rand(1, 3), 0, Math.PI * 2);
        ctx.fillStyle = rootColor;
        ctx.globalAlpha = rand(0.1, 0.3);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // Small leaf clusters along trunk
    for (var y = trunkTop + 100; y < trunkBottom - 100; y += rand(80, 200)) {
        if (Math.random() > 0.5) {
            drawLeafCluster(cx + (Math.random() > 0.5 ? 1 : -1) * rand(20, 40), y, rand(12, 25));
        }
    }
}

// ── INIT & RESIZE ───────────────────────────

function initTree() {
    var treeBgEl = document.getElementById('treeBg');
    var docH = Math.max(
        document.body.scrollHeight, document.body.offsetHeight,
        document.documentElement.scrollHeight, document.documentElement.offsetHeight
    );
    if (docH < 500) {
        // Page hasn't laid out yet — retry shortly
        setTimeout(initTree, 300);
        return;
    }
    var footerEl = document.querySelector('.footer');
    treeBgEl.style.height = (footerEl ? footerEl.offsetTop + footerEl.offsetHeight : docH) + 'px';
    drawOrangeTree();
}

// Boot: wait for full layout, then draw
if (document.readyState === 'complete') {
    setTimeout(initTree, 200);
} else {
    window.addEventListener('load', function () { setTimeout(initTree, 200); });
}

// Redraw on resize (debounced)
var resizeTimer;
window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(initTree, 300);
});
