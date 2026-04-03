// ═══════════════════════════════════════════
// CURSOR TRAIL — 8 dots that follow the mouse
// ═══════════════════════════════════════════
(function () {
    var TRAIL_LENGTH = 8;
    var trail = [];
    var positions = [];
    var mouseX = 0, mouseY = 0;

    // Create trail dots
    for (var i = 0; i < TRAIL_LENGTH; i++) {
        var dot = document.createElement('div');
        dot.className = 'cursor-trail-dot';
        dot.style.cssText =
            'position:fixed;' +
            'width:' + (4 - i * 0.4) + 'px;' +
            'height:' + (4 - i * 0.4) + 'px;' +
            'background:#c06a1a;' +
            'border-radius:50%;' +
            'pointer-events:none;' +
            'z-index:10000;' +
            'opacity:' + (0.6 - i * 0.07) + ';' +
            'transition:transform ' + (0.1 + i * 0.02) + 's ease;';
        document.body.appendChild(dot);
        trail.push(dot);
        positions.push({ x: 0, y: 0 });
    }

    document.addEventListener('mousemove', function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Each dot eases toward the one ahead of it
    function animate() {
        positions[0] = { x: mouseX, y: mouseY };
        for (var i = 1; i < TRAIL_LENGTH; i++) {
            positions[i] = {
                x: positions[i].x + (positions[i - 1].x - positions[i].x) * 0.35,
                y: positions[i].y + (positions[i - 1].y - positions[i].y) * 0.35
            };
        }
        for (var i = 0; i < TRAIL_LENGTH; i++) {
            trail[i].style.transform = 'translate(' + (positions[i].x - 2) + 'px,' + (positions[i].y - 2) + 'px)';
        }
        requestAnimationFrame(animate);
    }
    animate();
})();
