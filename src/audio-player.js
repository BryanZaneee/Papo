// One shared <audio>, per-row play buttons, fixed now-playing bar with seek.
(function () {
    var audio = document.getElementById('sharedAudio');
    var rows = Array.prototype.slice.call(document.querySelectorAll('.track-item[data-src]'));
    var bar = document.getElementById('nowPlaying');
    var npToggle = document.getElementById('npToggle');
    var npTitle = document.getElementById('npTitle');
    var npTime = document.getElementById('npTime');
    var npDur = document.getElementById('npDur');
    var npSeek = document.getElementById('npSeek');
    var npFill = document.getElementById('npFill');
    var current = null;

    function fmt(s) {
        s = Math.floor(s || 0);
        var m = Math.floor(s / 60), ss = s % 60;
        return m + ':' + (ss < 10 ? '0' : '') + ss;
    }

    function setPlayingUI(playing) {
        bar.classList.toggle('playing', playing);
        if (current) current.classList.toggle('playing', playing);
    }

    function play(row) {
        if (current === row) {
            if (audio.paused) audio.play(); else audio.pause();
            return;
        }
        if (current) current.classList.remove('playing');
        current = row;
        audio.src = row.dataset.src;
        var feat = row.dataset.feat;
        npTitle.innerHTML = '';
        npTitle.appendChild(document.createTextNode(row.dataset.title + ' '));
        if (feat) {
            var span = document.createElement('span');
            span.className = 'np-feat';
            span.textContent = feat;
            npTitle.appendChild(span);
        }
        npFill.style.width = '0%';
        npTime.textContent = '0:00';
        npDur.textContent = '—:—';
        bar.classList.add('active');
        audio.play();
    }

    rows.forEach(function (row) {
        row.addEventListener('click', function () { play(row); });
    });

    npToggle.addEventListener('click', function () {
        if (!current) return;
        if (audio.paused) audio.play(); else audio.pause();
    });

    npSeek.addEventListener('click', function (e) {
        if (!audio.duration) return;
        var r = npSeek.getBoundingClientRect();
        audio.currentTime = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * audio.duration;
    });

    audio.addEventListener('play', function () { setPlayingUI(true); });
    audio.addEventListener('pause', function () { setPlayingUI(false); });
    audio.addEventListener('ended', function () { setPlayingUI(false); });
    audio.addEventListener('loadedmetadata', function () { npDur.textContent = fmt(audio.duration); });
    audio.addEventListener('timeupdate', function () {
        npTime.textContent = fmt(audio.currentTime);
        if (audio.duration) npFill.style.width = (audio.currentTime / audio.duration * 100) + '%';
    });
})();
