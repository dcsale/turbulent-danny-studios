/* Media playlist controller.
   Turns any element with  data-clips="a.webm|b.webm|..."  into a crossfading
   background playlist. Plays each clip once, auto-advances on end, and adds
   forward/back buttons + position dots to cycle the clips manually.
   Single-clip elements (no data-clips) keep their plain <video loop>.
   Captions optionally rotate via  data-captions="Cap A|Cap B|..."  (| separated). */
(function () {
  function initStrip(strip) {
    var clips = (strip.dataset.clips || '').split('|').map(function (s) { return s.trim(); }).filter(Boolean);
    if (clips.length < 2) return;
    var caps = (strip.dataset.captions || '').split('|').map(function (s) { return s.trim(); });
    var idx = (parseInt(strip.dataset.start || '0', 10) || 0) % clips.length;
    var nxtIdx = (idx + 1) % clips.length;
    var FADE = 650;                         // must match the CSS transition
    var transitioning = false;

    strip.querySelectorAll('video').forEach(function (v) { v.remove(); });
    var capEl = strip.querySelector('.strip-caption');

    function mkVideo() {
      var v = document.createElement('video');
      v.muted = true; v.defaultMuted = true; v.playsInline = true; v.preload = 'auto';
      v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
      v.className = 'clip-layer';
      strip.prepend(v);
      return v;
    }
    var cur = mkVideo(), nxt = mkVideo();

    function setCaption(i) { if (capEl && caps[i]) capEl.textContent = caps[i]; }

    cur.src = clips[idx];
    cur.classList.add('show');
    setCaption(idx);
    cur.play().catch(function () {});
    nxt.src = clips[nxtIdx]; nxt.load();

    // ---- forward / back controls + dots ----
    var nav = document.createElement('div');
    nav.className = 'clip-nav';
    var prevBtn = document.createElement('button');
    prevBtn.className = 'clip-prev'; prevBtn.type = 'button';
    prevBtn.setAttribute('aria-label', 'Previous background clip');
    prevBtn.innerHTML = '&#8249;';
    var dotsWrap = document.createElement('div');
    dotsWrap.className = 'clip-dots';
    var dots = clips.map(function (_, i) {
      var d = document.createElement('button');
      d.className = 'dot' + (i === idx ? ' active' : ''); d.type = 'button';
      d.setAttribute('aria-label', 'Show background clip ' + (i + 1));
      d.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); transitionTo(i); });
      dotsWrap.appendChild(d);
      return d;
    });
    var nextBtn = document.createElement('button');
    nextBtn.className = 'clip-next'; nextBtn.type = 'button';
    nextBtn.setAttribute('aria-label', 'Next background clip');
    nextBtn.innerHTML = '&#8250;';
    prevBtn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); transitionTo((idx - 1 + clips.length) % clips.length); });
    nextBtn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); transitionTo((idx + 1) % clips.length); });
    nav.appendChild(prevBtn); nav.appendChild(dotsWrap); nav.appendChild(nextBtn);
    strip.appendChild(nav);

    function updateDots(active) {
      dots.forEach(function (d, i) { d.classList.toggle('active', i === active); });
    }

    // ---- crossfade to an arbitrary target clip ----
    function transitionTo(target) {
      if (transitioning || target === idx) return;
      transitioning = true;
      var begin = function () {
        nxt.currentTime = 0;
        nxt.play().catch(function () {});
        nxt.classList.add('show');
        cur.classList.remove('show');
        setCaption(target);
        updateDots(target);
        setTimeout(function () {
          idx = target;
          var t = cur; cur = nxt; nxt = t;
          nxtIdx = (idx + 1) % clips.length;
          nxt.src = clips[nxtIdx]; nxt.load();   // preload the natural next
          transitioning = false;
        }, FADE);
      };
      if (nxtIdx === target && nxt.readyState >= 2) {
        begin();
      } else {
        nxtIdx = target;
        nxt.src = clips[target]; nxt.load();
        if (nxt.readyState >= 2) begin();
        else nxt.addEventListener('canplay', begin, { once: true });
      }
    }

    function autoNext(e) { if (e.target === cur && !transitioning) transitionTo((idx + 1) % clips.length); }
    cur.addEventListener('ended', autoNext);
    nxt.addEventListener('ended', autoNext);
    [cur, nxt].forEach(function (v) {
      v.addEventListener('error', function () { if (v === cur && !transitioning) transitionTo((idx + 1) % clips.length); });
    });
  }

  function boot() { document.querySelectorAll('[data-clips]').forEach(initStrip); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
