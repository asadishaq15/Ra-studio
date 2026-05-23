(() => {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;

  const container = document.getElementById('reelContainer');
  const video = document.getElementById('reelVideo');
  const playBtn = document.getElementById('reelPlayBtn');
  const lightbox = document.getElementById('reelLightbox');
  const lightboxVideo = document.getElementById('reelLightboxVideo');
  const lightboxClose = document.getElementById('reelLightboxClose');
  if (!container) return;

  const REEL_VIDEO_SRC =
    document.querySelector('#reelVideo source')?.getAttribute('src') ||
    lightboxVideo?.dataset.src ||
    'assets/video/15153229_1920_1080_30fps.mp4';

  const modelCanvas = document.getElementById('modelCanvas');
  const servicesSection = document.getElementById('services');
  const reelHeading = document.querySelector('.reel-heading');
  const reelHeadingTitle = document.querySelector('.reel-heading__title');

  gsap.set(container, {
    width: '70%',
    borderRadius: '13px',
    opacity: 0,
  });

  if (reelHeadingTitle) {
    gsap.set(reelHeadingTitle, { opacity: 0, y: 24 });
  }

  gsap.timeline({
    scrollTrigger: {
      trigger: '#reel',
      start: 'top bottom',
      end: '+=50%',
      scrub: true,
      invalidateOnRefresh: true,
    },
    defaults: { ease: 'none' },
  }).fromTo(
    container,
    {
      width: '70%',
      borderRadius: '13px',
    },
    {
      width: '88%',
      borderRadius: '13px',
      duration: 1,
    }
  );

  function playInlineVideo() {
    if (!video) return;
    const p = video.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  }

  function pauseInlineVideo() {
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  }

  let reelVideoStarted = false;
  let handoffSnapReady = false;

  function resetHandoffState() {
    reelVideoStarted = false;
    handoffSnapReady = false;
    window.__handoffProgress = 0;
    if (modelCanvas) gsap.set(modelCanvas, { clearProps: 'opacity' });
    if (window.__raHandoff) {
      window.__raHandoff.resetHandoffTexts();
      window.__raHandoff.setBoomOpacity(1);
    }
    if (reelHeadingTitle) gsap.set(reelHeadingTitle, { clearProps: 'all' });
    gsap.set(container, { opacity: 0 });
    pauseInlineVideo();
  }

  let handoffScrubReady = false;

  function setupHandoffScrub() {
    if (handoffScrubReady || !servicesSection || !reelHeading) return;
    const servicesST = ScrollTrigger.getById('servicesScrub');
    if (!servicesST) return;
    handoffScrubReady = true;

    const handoffTl = gsap.timeline({
      scrollTrigger: {
        trigger: servicesSection,
        start: () => {
          const st = ScrollTrigger.getById('servicesScrub');
          return st ? st.end : 'bottom bottom';
        },
        endTrigger: reelHeading,
        end: 'top 70%',
        scrub: true,
        invalidateOnRefresh: true,
        onLeaveBack: resetHandoffState,
      },
      defaults: { ease: 'none' },
      onUpdate: () => {
        const p = handoffTl.progress();
        const handoff = window.__raHandoff;
        window.__handoffProgress = p;

        if (p > 0 && !handoffSnapReady && handoff) {
          handoff.beginHandoff();
          handoffSnapReady = true;
        }
        if (p <= 0) handoffSnapReady = false;

        if (handoff) {
          handoff.applyHandoffFade(p);
        }

        if (p >= 0.6 && !reelVideoStarted) {
          reelVideoStarted = true;
          playInlineVideo();
        }
        if (p < 0.5 && reelVideoStarted) {
          reelVideoStarted = false;
          pauseInlineVideo();
        }
      },
    });

    if (modelCanvas) {
      handoffTl.to(modelCanvas, { opacity: 0, duration: 0.7, ease: 'power1.in' }, 0);
    }

    if (reelHeadingTitle) {
      handoffTl.to(reelHeadingTitle, { opacity: 1, y: 0, duration: 0.65, ease: 'power1.out' }, 0.3);
    }

    handoffTl.to(container, { opacity: 1, duration: 0.55, ease: 'power1.out' }, 0.45);
  }

  window.addEventListener('servicesScrubReady', setupHandoffScrub);
  setupHandoffScrub();

  function ensureLightboxSrc() {
    if (!lightboxVideo) return;
    const current = lightboxVideo.getAttribute('src') || lightboxVideo.currentSrc || '';
    if (!current || !current.includes(REEL_VIDEO_SRC.replace(/^\//, ''))) {
      lightboxVideo.src = REEL_VIDEO_SRC;
      lightboxVideo.load();
    }
  }

  function clearLightboxSrc() {
    if (!lightboxVideo) return;
    lightboxVideo.pause();
    lightboxVideo.removeAttribute('src');
    lightboxVideo.load();
  }

  function openLightbox() {
    if (!lightbox || !lightboxVideo) return;
    ensureLightboxSrc();
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    lightboxVideo.currentTime = 0;
    const p = lightboxVideo.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightbox || !lightboxVideo) return;
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    clearLightboxSrc();
    document.body.style.overflow = '';
  }

  if (lightbox) {
    lightbox.setAttribute('aria-hidden', 'true');
  }

  if (playBtn) playBtn.addEventListener('click', openLightbox);
  if (video) video.addEventListener('click', openLightbox);
  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);

  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox && lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });

  ScrollTrigger.create({
    trigger: '#reel',
    onLeave: () => {
      pauseInlineVideo();
    },
    onEnterBack: () => {
      gsap.set(container, { opacity: 1 });
      playInlineVideo();
    },
  });

  window.addEventListener('load', () => {
    setupHandoffScrub();
    ScrollTrigger.refresh();
  });
})();
