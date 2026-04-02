// ═══════════════════════════════════════════
// CUSTOM AUDIO PLAYER
// ═══════════════════════════════════════════
(function () {
    let currentAudio = null;
    let currentTrackItem = null;

    function formatTime(seconds) {
        if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return m + ':' + (s < 10 ? '0' : '') + s;
    }

    function initPlayers() {
        const trackItems = document.querySelectorAll('.track-item[data-src]');

        trackItems.forEach(item => {
            const audio = new Audio();
            audio.preload = 'metadata';
            audio.src = item.dataset.src;

            // Create player controls
            const playerRow = document.createElement('div');
            playerRow.className = 'track-player';
            playerRow.innerHTML = `
                <div class="track-progress-bar">
                    <div class="track-progress-fill"></div>
                </div>
                <div class="track-time">
                    <span class="track-current-time">0:00</span>
                    <span class="track-total-time">0:00</span>
                </div>
            `;
            item.appendChild(playerRow);

            const playBtn = item.querySelector('.track-play-btn');
            const progressBar = playerRow.querySelector('.track-progress-bar');
            const progressFill = playerRow.querySelector('.track-progress-fill');
            const currentTimeEl = playerRow.querySelector('.track-current-time');
            const totalTimeEl = playerRow.querySelector('.track-total-time');

            // Set duration when metadata loads
            audio.addEventListener('loadedmetadata', () => {
                totalTimeEl.textContent = formatTime(audio.duration);
            });

            // Update progress
            audio.addEventListener('timeupdate', () => {
                if (audio.duration) {
                    const pct = (audio.currentTime / audio.duration) * 100;
                    progressFill.style.width = pct + '%';
                    currentTimeEl.textContent = formatTime(audio.currentTime);
                }
            });

            // Reset when track ends
            audio.addEventListener('ended', () => {
                item.classList.remove('playing');
                progressFill.style.width = '0%';
                currentTimeEl.textContent = '0:00';
                currentAudio = null;
                currentTrackItem = null;
            });

            // Click track to play/pause
            const clickTarget = item.querySelector('.track-info');
            clickTarget.addEventListener('click', (e) => {
                e.stopPropagation();

                // If clicking a different track, stop the current one
                if (currentAudio && currentAudio !== audio) {
                    currentAudio.pause();
                    currentAudio.currentTime = 0;
                    currentTrackItem.classList.remove('playing');
                    const prevFill = currentTrackItem.querySelector('.track-progress-fill');
                    if (prevFill) prevFill.style.width = '0%';
                    const prevTime = currentTrackItem.querySelector('.track-current-time');
                    if (prevTime) prevTime.textContent = '0:00';
                }

                if (audio.paused) {
                    audio.play();
                    item.classList.add('playing');
                    currentAudio = audio;
                    currentTrackItem = item;
                } else {
                    audio.pause();
                    item.classList.remove('playing');
                    currentAudio = null;
                    currentTrackItem = null;
                }
            });

            // Play button click
            playBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                clickTarget.click();
            });

            // Seek on progress bar click
            progressBar.addEventListener('click', (e) => {
                e.stopPropagation();
                const rect = progressBar.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                audio.currentTime = pct * audio.duration;
                if (audio.paused) {
                    // If not playing, start it
                    if (currentAudio && currentAudio !== audio) {
                        currentAudio.pause();
                        currentAudio.currentTime = 0;
                        currentTrackItem.classList.remove('playing');
                    }
                    audio.play();
                    item.classList.add('playing');
                    currentAudio = audio;
                    currentTrackItem = item;
                }
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPlayers);
    } else {
        initPlayers();
    }
})();
