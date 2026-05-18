(function () {
  var gsap = window.gsap;
  var intro = document.getElementById('intro');
  var purpleOverlay = intro ? intro.querySelector('.intro__purple') : null;
  if (!intro || !purpleOverlay) return;

  document.body.style.overflow = 'hidden';
  if (window.__lenis) window.__lenis.stop();

  var NS = 'http://www.w3.org/2000/svg';
  var vw = window.innerWidth;
  var vh = window.innerHeight;
  var EYE_W = Math.min(vw, vh) * 0.55;
  var EYE_H = EYE_W * (446 / 865);

  var svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('id', 'introMaskSvg');
  Object.assign(svg.style, {
    position: 'fixed', inset: '0',
    width: '100vw', height: '100vh',
    zIndex: '9998', pointerEvents: 'none', overflow: 'visible',
  });

  var maskRect = document.createElementNS(NS, 'path');
  maskRect.setAttribute('id', 'introMaskRect');
  svg.appendChild(maskRect);
  document.body.appendChild(svg);
  purpleOverlay.style.display = 'none';

  function eyeD(ew, eh) {
    var hw = ew / 2, hh = eh / 2;
    var cx = vw / 2, cy = vh / 2;
    var ctlX = hw * 0.55;
    return [
      'M', cx - hw, cy,
      'C', cx - hw, cy - hh * 0.01, cx - ctlX, cy - hh, cx, cy - hh,
      'C', cx + ctlX, cy - hh, cx + hw, cy - hh * 0.01, cx + hw, cy,
      'C', cx + hw, cy + hh * 0.01, cx + ctlX, cy + hh, cx, cy + hh,
      'C', cx - ctlX, cy + hh, cx - hw, cy + hh * 0.01, cx - hw, cy, 'Z',
    ].join(' ');
  }

  function fullRectD() { return 'M 0 0 H ' + vw + ' V ' + vh + ' H 0 Z'; }

  var currentEW = EYE_W;
  var currentEH = EYE_H;
  var blinkOffset = 0;

  function draw() {
    var eh = Math.max(currentEH * 0.04, currentEH - blinkOffset);
    maskRect.setAttribute('d', fullRectD() + ' ' + eyeD(currentEW, eh));
    maskRect.setAttribute('fill-rule', 'evenodd');
    maskRect.setAttribute('fill', '#1a0a2e');
  }

  svg.setAttribute('viewBox', '0 0 ' + vw + ' ' + vh);
  draw();

  window.addEventListener('resize', function () {
    vw = window.innerWidth; vh = window.innerHeight;
    EYE_W = Math.min(vw, vh) * 0.55;
    EYE_H = EYE_W * (446 / 865);
    svg.setAttribute('viewBox', '0 0 ' + vw + ' ' + vh);
    draw();
  });

  /* ── Wait for ≥2 full blinks before opening (even if assets load fast) ── */
  var MIN_BLINKS_BEFORE_OPEN = 2;
  var blinksCompleted = 0;
  var assetsReady = false;
  var opening = false;

  function onBlinkCompleted() {
    blinksCompleted += 1;
    tryBeginOpen();
  }

  function tryBeginOpen() {
    if (opening) return;
    if (!assetsReady || blinksCompleted < MIN_BLINKS_BEFORE_OPEN) return;
    opening = true;
    openEye();
  }

  /* ── Blink loop ─────────────────────────────────────────── */
  var blinkTl = null;

  function startBlink() {
    if (blinkTl) { blinkTl.kill(); blinkTl = null; }
    blinkOffset = 0;

    var proxy = { v: 0 };
    blinkTl = gsap.timeline({ repeat: -1 });

    function addBlink(at) {
      blinkTl.to(proxy, {
        v: 1, duration: 3 / 30, ease: 'power2.in',
        onUpdate: function () {
          blinkOffset = proxy.v * currentEH * 0.96;
          draw();
        }
      }, at);
      blinkTl.to(proxy, {
        v: 0, duration: 5 / 30, ease: 'power2.out',
        onUpdate: function () {
          blinkOffset = proxy.v * currentEH * 0.96;
          draw();
        },
        onComplete: onBlinkCompleted
      }, at + 3 / 30);
    }

    addBlink(0);
    addBlink(38 / 30);
    addBlink(69 / 30);
    blinkTl.to({}, { duration: 18 / 30 }, 77 / 30);
  }

  function stopBlink() {
    if (blinkTl) { blinkTl.kill(); blinkTl = null; }
    blinkOffset = 0;
    draw();
  }

  startBlink();

  /* ── Progress bar ──────────────────────────────────────── */
  var progressBar = document.getElementById('introProgressBar');

  window.__introSetProgress = function (pct) {
    if (progressBar) progressBar.style.width = Math.min(100, pct) + '%';
  };

  /* ── Auto-open when assets are ready ───────────────────── */
  var MAX_SIZE = Math.max(vw, vh) * 2.8;

  function openEye() {
    stopBlink();
    if (progressBar) progressBar.style.width = '100%';

    var proxy = { t: 0 };
    gsap.to(proxy, {
      t: 1,
      duration: 1.2,
      ease: 'power3.inOut',
      onUpdate: function () {
        var ease = 1 - Math.pow(1 - proxy.t, 3);
        currentEW = EYE_W + (MAX_SIZE - EYE_W) * ease;
        currentEH = EYE_H + (MAX_SIZE - EYE_H) * ease;
        maskRect.style.opacity = proxy.t < 0.6 ? '1' : String(1 - ((proxy.t - 0.6) / 0.4));
        draw();
      },
      onComplete: function () {
        document.body.style.overflow = '';
        if (window.__lenis) window.__lenis.start();
        intro.remove();
        svg.remove();
        if (window.ScrollTrigger) {
          setTimeout(function () { window.ScrollTrigger.refresh(); }, 100);
        }
      }
    });
  }

  window.__introSignalReady = function () {
    assetsReady = true;
    tryBeginOpen();
  };

})();
