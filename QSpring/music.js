'use strict';
(() => {
  const audio = document.getElementById('music');
  const play = document.getElementById('musicPlay');
  const seek = document.getElementById('musicSeek');
  const loop = document.getElementById('musicLoop');
  function syncPlay() {
    const paused = audio.paused;
    const label = paused ? '播放音乐' : '暂停音乐';
    play.setAttribute('aria-label', label);
    play.title = label;
    play.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="' +
      (paused ? 'M8 5v14l11-7z' : 'M7 5h4v14H7zM14 5h4v14h-4z') + '"/></svg>';
  }
  function syncProgress() {
    const ready = Number.isFinite(audio.duration) && audio.duration > 0;
    seek.disabled = !ready;
    seek.value = ready ? Math.round(audio.currentTime / audio.duration * 1000) : 0;
    if (ready) seek.setAttribute('aria-valuetext', `${Math.floor(audio.currentTime)} / ${Math.floor(audio.duration)} 秒`);
  }
  play.addEventListener('click', async () => {
    if (!audio.paused) { audio.pause(); return; }
    try { await audio.play(); }
    catch { syncPlay(); play.title = '音乐播放失败，点击重试'; }
  });
  seek.addEventListener('input', () => {
    if (Number.isFinite(audio.duration)) audio.currentTime = Number(seek.value) / 1000 * audio.duration;
  });
  loop.addEventListener('change', () => { audio.loop = loop.checked; });
  for (const event of ['play', 'pause', 'ended']) audio.addEventListener(event, syncPlay);
  for (const event of ['loadedmetadata', 'durationchange', 'timeupdate', 'ended']) audio.addEventListener(event, syncProgress);
  audio.addEventListener('error', () => { seek.disabled = true; play.title = '音频加载失败，点击重试'; });
})();
