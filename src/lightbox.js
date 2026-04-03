// Click any collage image → fullscreen lightbox. ESC or click to close.
(function () {
    var lightbox = document.getElementById('lightbox');
    var lbImg = lightbox.querySelector('img');
    var closeBtn = lightbox.querySelector('.lightbox-close');

    document.querySelectorAll('.collage-item img').forEach(img => {
        img.addEventListener('click', () => {
            lbImg.src = img.src;
            lbImg.alt = img.alt;
            lightbox.classList.add('active');
        });
    });

    function close() {
        lightbox.classList.remove('active');
    }

    lightbox.addEventListener('click', close);
    closeBtn.addEventListener('click', close);
    lbImg.addEventListener('click', e => e.stopPropagation());

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') close();
    });
})();
