(function () {
  var slider = document.getElementById('workSlider');
  var track = document.getElementById('workSliderTrack');
  var gsap = window.gsap;
  if (!slider || !track || !gsap) return;

  /* ─── state ─────────────────────────────────── */
  var tx = 0;        // rendered x
  var targetTx = 0;        // lerp target
  var dragging = false;
  var startX = 0;
  var startTx = 0;
  var velX = 0;        // velocity for flick momentum
  var lastX = 0;
  var lastTime = 0;
  var activePointer = null;

  var LERP = 0.10;     // smoothness (lower = silkier)
  var FLICK_FACTOR = 1.6;      // momentum multiplier after release
  var SNAP_EASE = 0.09;     // snap-to-card easing

  /* ─── helpers ───────────────────────────────── */
  function cards() {
    return Array.from(track.querySelectorAll('.work__card'));
  }

  function maxTx() {
    return Math.min(0, slider.clientWidth - track.scrollWidth);
  }

  function clamp(v) {
    return Math.max(maxTx(), Math.min(0, v));
  }

  function apply() {
    track.style.transform = 'translate3d(' + tx.toFixed(2) + 'px,0,0)';
  }

  /* ─── snap to nearest card ───────────────────── */
  function snapToNearest() {
    var list = cards();
    if (!list.length) return;
    var cardW = list[0].offsetWidth + 24; /* 24 = gap (match CSS) */
    var raw = -targetTx;
    var idx = Math.round(raw / cardW);
    idx = Math.max(0, Math.min(list.length - 1, idx));
    targetTx = clamp(-idx * cardW);
  }

  /* ─── pointer events ────────────────────────── */
  slider.addEventListener('pointerdown', function (e) {
    if (e.button && e.button !== 0) return;
    dragging = true;
    activePointer = e.pointerId;
    startX = e.clientX;
    startTx = tx;
    targetTx = tx;
    velX = 0;
    lastX = e.clientX;
    lastTime = performance.now();
    slider.classList.add('dragging');
    try { slider.setPointerCapture(e.pointerId); } catch (err) { /**/ }
    e.preventDefault();
  }, { passive: false });

  window.addEventListener('pointermove', function (e) {
    if (!dragging || e.pointerId !== activePointer) return;
    var now = performance.now();
    var dt = Math.max(1, now - lastTime);
    velX = (e.clientX - lastX) / dt;   // px/ms
    lastX = e.clientX;
    lastTime = now;

    tx = clamp(startTx + (e.clientX - startX));
    targetTx = tx;
    apply();
  }, { passive: true });

  function endDrag(e) {
    if (!dragging) return;
    if (e && e.pointerId !== activePointer) return;
    dragging = false;
    activePointer = null;
    slider.classList.remove('dragging');

    /* flick momentum → offset target, then snap */
    var momentum = velX * FLICK_FACTOR * 120; /* 120 ms lookahead */
    targetTx = clamp(tx + momentum);
    snapToNearest();
  }

  window.addEventListener('pointerup', endDrag, { passive: true });
  window.addEventListener('pointercancel', endDrag, { passive: true });

  /* ─── keyboard nav (a11y) ───────────────────── */
  slider.setAttribute('tabindex', '0');
  slider.addEventListener('keydown', function (e) {
    var list = cards();
    var cardW = list.length ? list[0].offsetWidth + 24 : 0;
    var idx = Math.round(-targetTx / cardW);
    if (e.key === 'ArrowRight') {
      idx = Math.min(list.length - 1, idx + 1);
      targetTx = clamp(-idx * cardW);
    } else if (e.key === 'ArrowLeft') {
      idx = Math.max(0, idx - 1);
      targetTx = clamp(-idx * cardW);
    }
  });

  /* ─── ticker ─────────────────────────────────── */
  gsap.ticker.add(function () {
    var diff = targetTx - tx;
    if (Math.abs(diff) < 0.3) {
      tx = targetTx;
    } else {
      var ease = dragging ? LERP : SNAP_EASE;
      tx += diff * ease;
    }
    apply();
  });

  /* ─── resize ─────────────────────────────────── */
  function onResize() {
    tx = clamp(tx);
    targetTx = clamp(targetTx);
    snapToNearest();
    apply();
  }

  var ro = typeof ResizeObserver !== 'undefined'
    ? new ResizeObserver(onResize)
    : null;
  if (ro) { ro.observe(track); ro.observe(slider); }
  window.addEventListener('resize', onResize);

  /* ─── prevent page scroll while swiping horizontally ── */
  slider.addEventListener('touchstart', function () { /* capture intent */ }, { passive: true });
  slider.addEventListener('touchmove', function (e) {
    if (dragging) e.preventDefault();
  }, { passive: false });

  /* init */
  apply();
})();