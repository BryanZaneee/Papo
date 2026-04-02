// Custom cursor trail (subtle)
const trail = [];
const trailLength = 8;

for (let i = 0; i < trailLength; i++) {
    const dot = document.createElement('div');
    dot.style.cssText = `
        position: fixed;
        width: ${4 - i * 0.4}px;
        height: ${4 - i * 0.4}px;
        background: #5c4e85;
        border-radius: 50%;
        pointer-events: none;
        z-index: 10000;
        opacity: ${0.6 - i * 0.07};
        transition: transform ${0.1 + i * 0.02}s ease;
    `;
    document.body.appendChild(dot);
    trail.push(dot);
}

let mouseX = 0, mouseY = 0;
const positions = Array(trailLength).fill({ x: 0, y: 0 });

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

function animateTrail() {
    positions[0] = { x: mouseX, y: mouseY };
    for (let i = 1; i < trailLength; i++) {
        positions[i] = {
            x: positions[i].x + (positions[i - 1].x - positions[i].x) * 0.35,
            y: positions[i].y + (positions[i - 1].y - positions[i].y) * 0.35
        };
    }
    trail.forEach((dot, i) => {
        dot.style.transform = `translate(${positions[i].x - 2}px, ${positions[i].y - 2}px)`;
    });
    requestAnimationFrame(animateTrail);
}
animateTrail();
