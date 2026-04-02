// ═══════════════════════════════════════════
// ORANGE TREE BACKGROUND — Full page height
// ═══════════════════════════════════════════
function drawOrangeTree() {
    const canvas = document.getElementById('treeCanvas');
    const ctx = canvas.getContext('2d');
    const docHeight = document.documentElement.scrollHeight;
    const canvasWidth = 1200;

    // Size canvas to actual content bottom (footer), not full docHeight
    const footerElForHeight = document.querySelector('.footer');
    const canvasHeight = footerElForHeight
        ? footerElForHeight.offsetTop + footerElForHeight.offsetHeight
        : docHeight;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const cx = canvasWidth / 2; // center x
    const trunkColor = '#5a3a1a';
    const trunkHighlight = '#7a5a2a';
    const leafDark = '#1a4a1a';
    const leafMid = '#2a6a2a';
    const leafLight = '#3a8a3a';
    const orangeColor = '#e87a20';
    const orangeHighlight = '#f0a040';
    const rootColor = '#4a2a10';

    // ── HELPERS ──
    function rand(min, max) { return Math.random() * (max - min) + min; }

    function drawBranch(x1, y1, x2, y2, width, color) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        // Slight curve
        const cpx = (x1 + x2) / 2 + rand(-20, 20);
        const cpy = (y1 + y2) / 2 + rand(-10, 10);
        ctx.quadraticCurveTo(cpx, cpy, x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.stroke();
    }

    function drawLeafCluster(x, y, radius) {
        const count = Math.floor(rand(8, 16));
        for (let i = 0; i < count; i++) {
            const angle = rand(0, Math.PI * 2);
            const dist = rand(0, radius);
            const lx = x + Math.cos(angle) * dist;
            const ly = y + Math.sin(angle) * dist;
            const lr = rand(8, 22);

            ctx.beginPath();
            ctx.ellipse(lx, ly, lr, lr * 0.7, rand(0, Math.PI), 0, Math.PI * 2);
            const colors = [leafDark, leafMid, leafLight];
            ctx.fillStyle = colors[Math.floor(rand(0, 3))];
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
        // Main
        const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
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
        // Small stem
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
        const cp1x = x1 + (x2 - x1) * 0.3 + rand(-30, 30);
        const cp1y = y1 + (y2 - y1) * 0.3 + rand(-15, 15);
        const cp2x = x1 + (x2 - x1) * 0.7 + rand(-30, 30);
        const cp2y = y1 + (y2 - y1) * 0.7 + rand(-15, 15);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
        ctx.strokeStyle = rootColor;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.stroke();
    }

    // ── LAYOUT ZONES (anchored to actual DOM elements) ──
    const isMobile = window.innerWidth <= 900;
    const heroEl = document.querySelector('.hero');
    const footerEl = document.querySelector('.footer');
    const heroHeight = heroEl ? heroEl.offsetHeight : window.innerHeight;
    const footerTop = footerEl ? footerEl.offsetTop : docHeight - 100;
    const footerBottom = footerEl ? (footerEl.offsetTop + footerEl.offsetHeight) : docHeight;

    // Canopy sits within the hero section — next to / behind PAPO text
    const canopyTop = isMobile ? heroHeight * 0.02 : heroHeight * 0.1;
    const canopyBottom = isMobile ? heroHeight * 0.55 : heroHeight * 0.72;
    // Trunk starts below the hero so only canopy is visible in hero area
    const trunkTop = heroHeight;
    // Trunk ends where footer begins
    const trunkBottom = footerTop + 10;
    // Roots live inside the footer area
    const rootTop = footerTop - 10;
    const rootBottom = footerBottom;

    // ══════════════════
    // 1. TRUNK (drawn first so branches overlay)
    // ══════════════════
    const trunkWidth = 45;
    // Main trunk - slight taper
    for (let i = 0; i < 5; i++) {
        const offset = rand(-2, 2);
        ctx.beginPath();
        ctx.moveTo(cx + offset - trunkWidth / 2 + i * (trunkWidth / 5), trunkTop);
        ctx.lineTo(cx + offset - trunkWidth / 2 + i * (trunkWidth / 5) + rand(-5, 5), trunkBottom);
        ctx.strokeStyle = i % 2 === 0 ? trunkColor : trunkHighlight;
        ctx.lineWidth = rand(6, 14);
        ctx.lineCap = 'round';
        ctx.stroke();
    }

    // Main solid trunk
    ctx.beginPath();
    ctx.moveTo(cx - trunkWidth / 2, trunkTop);
    ctx.lineTo(cx - trunkWidth / 2 - 8, trunkBottom);
    ctx.lineTo(cx + trunkWidth / 2 + 8, trunkBottom);
    ctx.lineTo(cx + trunkWidth / 2, trunkTop);
    ctx.closePath();
    ctx.fillStyle = trunkColor;
    ctx.fill();

    // Bark texture lines
    for (let y = trunkTop; y < trunkBottom; y += rand(15, 40)) {
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
    // 2. BRANCHES (extending from trunk at various heights)
    // ══════════════════
    const branchZones = [
        { y: trunkTop + (trunkBottom - trunkTop) * 0.05, spread: 280 },
        { y: trunkTop + (trunkBottom - trunkTop) * 0.12, spread: 300 },
        { y: trunkTop + (trunkBottom - trunkTop) * 0.22, spread: 250 },
        { y: trunkTop + (trunkBottom - trunkTop) * 0.35, spread: 220 },
        { y: trunkTop + (trunkBottom - trunkTop) * 0.48, spread: 180 },
        { y: trunkTop + (trunkBottom - trunkTop) * 0.60, spread: 150 },
        { y: trunkTop + (trunkBottom - trunkTop) * 0.72, spread: 120 },
        { y: trunkTop + (trunkBottom - trunkTop) * 0.83, spread: 90 },
    ];

    branchZones.forEach(zone => {
        // Left branch
        const lEndX = cx - rand(zone.spread * 0.5, zone.spread);
        const lEndY = zone.y + rand(-40, 40);
        drawBranch(cx - 5, zone.y, lEndX, lEndY, rand(4, 10), trunkColor);
        // Sub-branch
        drawBranch(lEndX, lEndY, lEndX - rand(20, 60), lEndY + rand(-30, 30), rand(2, 5), trunkColor);
        // Leaves on branch
        drawLeafCluster(lEndX, lEndY, rand(25, 50));

        // Right branch
        const rEndX = cx + rand(zone.spread * 0.5, zone.spread);
        const rEndY = zone.y + rand(-40, 40);
        drawBranch(cx + 5, zone.y, rEndX, rEndY, rand(4, 10), trunkColor);
        drawBranch(rEndX, rEndY, rEndX + rand(20, 60), rEndY + rand(-30, 30), rand(2, 5), trunkColor);
        drawLeafCluster(rEndX, rEndY, rand(25, 50));

        // Oranges on some branches
        if (Math.random() > 0.3) {
            drawOrange(lEndX + rand(-15, 15), lEndY + rand(5, 25), rand(6, 12));
        }
        if (Math.random() > 0.3) {
            drawOrange(rEndX + rand(-15, 15), rEndY + rand(5, 25), rand(6, 12));
        }
    });

    // ══════════════════
    // 3. CANOPY (top of page — dense foliage + oranges)
    // ══════════════════
    const canopyCenterY = (canopyTop + canopyBottom) / 2;

    // Dense leaf clusters forming the canopy
    for (let i = 0; i < 50; i++) {
        const angle = rand(0, Math.PI * 2);
        const dist = rand(0, 320);
        const clx = cx + Math.cos(angle) * dist;
        const cly = canopyCenterY + Math.sin(angle) * dist * 0.55;
        drawLeafCluster(clx, cly, rand(35, 70));
    }

    // Oranges scattered in canopy
    for (let i = 0; i < 35; i++) {
        const angle = rand(0, Math.PI * 2);
        const dist = rand(20, 280);
        const ox = cx + Math.cos(angle) * dist;
        const oy = canopyCenterY + Math.sin(angle) * dist * 0.5;
        drawOrange(ox, oy, rand(7, 14));
    }

    // ══════════════════
    // 4. ROOTS (bottom of page — spreading underground)
    // ══════════════════
    // Ground line
    ctx.beginPath();
    ctx.moveTo(0, rootTop + 10);
    ctx.lineTo(canvasWidth, rootTop + 10);
    ctx.strokeStyle = 'rgba(60,30,10,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Trunk base flares into roots — scaled to fit footer area
    const rootZoneHeight = rootBottom - rootTop;
    const rootScale = Math.min(1, rootZoneHeight / 300);
    const rootSpread = [
        { angle: -0.8, length: 280 * rootScale, width: 14 },
        { angle: -0.5, length: 340 * rootScale, width: 12 },
        { angle: -0.2, length: 300 * rootScale, width: 10 },
        { angle: 0.15, length: 320 * rootScale, width: 11 },
        { angle: 0.45, length: 330 * rootScale, width: 13 },
        { angle: 0.75, length: 290 * rootScale, width: 10 },
        { angle: -1.1, length: 220 * rootScale, width: 8 },
        { angle: 1.0, length: 240 * rootScale, width: 9 },
    ];

    rootSpread.forEach(r => {
        const endX = cx + Math.sin(r.angle) * r.length;
        const endY = rootTop + Math.cos(r.angle) * r.length * 0.5 + r.length * 0.4;
        drawRoot(cx, rootTop, endX, Math.min(endY, rootBottom), r.width);

        // Sub-roots
        for (let j = 0; j < 3; j++) {
            const subStartT = rand(0.3, 0.7);
            const subStartX = cx + (endX - cx) * subStartT + rand(-10, 10);
            const subStartY = rootTop + (endY - rootTop) * subStartT;
            const subEndX = subStartX + rand(-80, 80);
            const subEndY = subStartY + rand(30, 100);
            drawRoot(subStartX, subStartY, subEndX, Math.min(subEndY, rootBottom), r.width * 0.4);

            // Tiny root tendrils
            if (Math.random() > 0.4) {
                drawRoot(subEndX, Math.min(subEndY, rootBottom),
                    subEndX + rand(-40, 40), Math.min(subEndY + rand(20, 60), rootBottom),
                    rand(1, 3));
            }
        }
    });

    // Scattered dirt particles near roots
    for (let i = 0; i < 80; i++) {
        const px = cx + rand(-450, 450);
        const py = rand(rootTop + 20, rootBottom);
        ctx.beginPath();
        ctx.arc(px, py, rand(1, 3), 0, Math.PI * 2);
        ctx.fillStyle = rootColor;
        ctx.globalAlpha = rand(0.1, 0.3);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // Small leaf clusters scattered along trunk
    for (let y = trunkTop + 100; y < trunkBottom - 100; y += rand(80, 200)) {
        if (Math.random() > 0.5) {
            const side = Math.random() > 0.5 ? 1 : -1;
            drawLeafCluster(cx + side * rand(20, 40), y, rand(12, 25));
        }
    }
}

// Draw tree and resize handling
function initTree() {
    const treeBgEl = document.getElementById('treeBg');
    const docH = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
    );
    if (docH < 500) {
        // Page hasn't laid out yet, retry
        setTimeout(initTree, 300);
        return;
    }
    const footerEl = document.querySelector('.footer');
    const treeHeight = footerEl
        ? footerEl.offsetTop + footerEl.offsetHeight
        : docH;
    treeBgEl.style.height = treeHeight + 'px';
    drawOrangeTree();
}

// Try multiple init points to ensure it fires
if (document.readyState === 'complete') {
    setTimeout(initTree, 200);
} else {
    window.addEventListener('load', () => setTimeout(initTree, 200));
}
// Extra fallback
setTimeout(initTree, 1000);

// Redraw on resize
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(initTree, 300);
});
