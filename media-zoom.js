/* Full-screen button for page videos. Opt-in: include this script on a page.
   Adds a button to every .showcase and every .stage.fit-portrait. On a phone
   this is how to see a clip big: it plays full screen and, where the browser
   allows it, turns to landscape. style.css forces `contain` in full screen so
   the whole frame shows.

   Why it works the way it does:

   * Where the browser can make any element full screen (Chrome, Android,
     Firefox, desktop Safari, iPad), the button plays a separate COPY of the clip
     full screen and pauses the page video meanwhile. clips.js swaps and reloads
     its two playlist layers on its own schedule, so going full screen on a layer
     directly can freeze the view mid-way; the copy is never touched by clips.js.
     The copy starts playing inside the click, because browsers that restrict
     autoplay only allow play() during a user gesture.

   * iPhone Safari only allows full screen on a video element through
     webkitEnterFullscreen, and only on one whose metadata is already loaded, so
     there the playing layer itself goes full screen. It is set to loop BEFORE the
     request, so it cannot end and be swapped out while the player opens.

   * While a clip is full screen its box carries data-zoomed. clips.js checks it
     and will not crossfade (and later reload) that box's layers, which covers a
     transition that was already waiting for a clip to load when the button was
     tapped.

   * Closing the player (Done on iPhone, or pause in any browser's controls)
     leaves the video paused, and a paused playlist never advances. So on exit
     the clip now showing in that box is resumed.

   * A request can be refused or never settle: every path gives up and restores
     the page after 2 s if full screen has not actually started. A second press
     while one is open or pending is ignored, so Space/Enter on the hidden button
     or a double-tap cannot tear the view down. */
(function () {
  var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" ' +
             'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
             '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
  var GIVE_UP_MS = 2000;
  var active = null;   // { clone, box } while a copy is shown or requested

  function currentVideo(box) {
    return box.querySelector('video.clip-layer.show') || box.querySelector('video:not(.zoom-clone)');
  }

  function fullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }

  function markZoomed(box, on) {
    if (on) box.dataset.zoomed = '';
    else delete box.dataset.zoomed;
  }

  function busy() { return !!active || !!document.querySelector('[data-zoomed]'); }

  function resume(box) {
    var v = currentVideo(box);   // the playlist may have moved on to another layer
    if (v && v.paused) v.play().catch(function () {});
  }

  function lockLandscape() {
    try {
      if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(function () {});
    } catch (e) {}
  }

  function unlockOrientation() {
    try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) {}
  }

  function openFile(v) { window.open(v.currentSrc || v.src, '_blank'); }

  // ---- element full screen: show a copy -------------------------------------

  function finishCopy() {
    if (!active) return;
    var a = active;
    active = null;
    if (a.clone.parentNode) a.clone.parentNode.removeChild(a.clone);
    a.clone.removeAttribute('src');
    a.clone.load();              // release the decoder
    unlockOrientation();
    markZoomed(a.box, false);
    resume(a.box);
  }

  function enterCopy(v, box) {
    var c = document.createElement('video');
    c.className = 'zoom-clone';
    c.muted = true; c.defaultMuted = true; c.setAttribute('muted', '');
    c.playsInline = true; c.setAttribute('playsinline', '');
    c.loop = true;
    c.controls = true;           // pause/seek in full screen (Firefox needs the attribute)
    c.preload = 'auto';
    // Park the invisible copy over the clip it copies: Safari animates into and
    // out of full screen from the element's box.
    var r = v.getBoundingClientRect();
    c.style.left = r.left + 'px';
    c.style.top = r.top + 'px';
    c.style.width = r.width + 'px';
    c.style.height = r.height + 'px';
    c.src = v.currentSrc || v.src;
    var t = v.currentTime;
    c.addEventListener('loadedmetadata', function () {
      try { c.currentTime = t; } catch (e) {}
    }, { once: true });
    document.body.appendChild(c);
    c.play().catch(function () {});
    active = { clone: c, box: box };
    markZoomed(box, true);
    v.pause();                   // one decoder at a time on phones; also holds the playlist still

    var p;
    try {
      p = c.requestFullscreen ? c.requestFullscreen() : c.webkitRequestFullscreen();
    } catch (e) {
      finishCopy();
      openFile(v);
      return;
    }
    if (p && p.then) {
      p.then(lockLandscape, function () { if (active && active.clone === c) finishCopy(); });
    }
    setTimeout(function () {
      if (active && active.clone === c && fullscreenElement() !== c) finishCopy();
    }, GIVE_UP_MS);
  }

  function onChange() {
    if (active && fullscreenElement() !== active.clone) finishCopy();
  }
  document.addEventListener('fullscreenchange', onChange);
  document.addEventListener('webkitfullscreenchange', onChange);

  // ---- iPhone: native player on the playing layer ----------------------------

  function hold(v) {
    if (v.dataset.zoomLoop !== undefined) return;
    v.dataset.zoomLoop = v.loop ? '1' : '0';
    v.loop = true;
  }

  function restore(v) {
    if (v.dataset.zoomLoop === undefined) return false;
    v.loop = v.dataset.zoomLoop === '1';
    delete v.dataset.zoomLoop;
    return true;
  }

  function endNative(v, box) {
    if (!restore(v)) return;
    markZoomed(box, false);
    resume(box);
  }

  function enterNative(v, box) {
    hold(v);
    markZoomed(box, true);
    try {
      v.webkitEnterFullscreen();
    } catch (e) {
      restore(v);
      markZoomed(box, false);
      openFile(v);
      return;
    }
    setTimeout(function () {
      if (!v.webkitDisplayingFullscreen) endNative(v, box);
    }, GIVE_UP_MS);
  }

  function watchNative(v, box) {
    if (v.dataset.zoomWatched) return;
    v.dataset.zoomWatched = '1';
    v.addEventListener('webkitendfullscreen', function () { endNative(v, box); });
  }

  // ---- button ---------------------------------------------------------------

  function enter(box) {
    if (busy()) return;
    var v = currentVideo(box);
    if (!v) return;
    var probe = document.createElement('video');
    if (probe.requestFullscreen || probe.webkitRequestFullscreen) enterCopy(v, box);
    else if (v.webkitEnterFullscreen) enterNative(v, box);
    else openFile(v);
  }

  function addButton(box) {
    if (!currentVideo(box) || box.querySelector(':scope > .zoom-btn')) return;
    box.querySelectorAll('video').forEach(function (v) { watchNative(v, box); });   // clips.js reuses its two layers
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'zoom-btn';
    b.setAttribute('aria-label', 'Play this clip full screen');
    b.title = 'Full screen';
    b.innerHTML = ICON;
    b.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      b.blur();                  // keep Space/Enter from pressing a button hidden behind full screen
      enter(box);
    });
    box.appendChild(b);
  }

  function boot() { document.querySelectorAll('.showcase, .stage.fit-portrait').forEach(addButton); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
