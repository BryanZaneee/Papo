// IntersectionObserver adds .visible to .reveal elements on scroll.
// Re-run on content:rendered — content.js adds .reveal elements after load.
(function () {
    var observer = 'IntersectionObserver' in window && new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.15 });

    function observeAll() {
        document.querySelectorAll('.reveal:not(.visible)').forEach(function (el) {
            if (observer) observer.observe(el);
            else el.classList.add('visible');
        });
    }
    observeAll();
    document.addEventListener('content:rendered', observeAll);
})();
