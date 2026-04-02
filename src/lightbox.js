(function () {
    const lightbox = document.getElementById('lightbox');
    const lbImg = lightbox.querySelector('img');
    const closeBtn = lightbox.querySelector('.lightbox-close');

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
