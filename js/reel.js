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

  gsap.timeline({
    scrollTrigger: {
      trigger: '#reel',
      start: 'top bottom',
      end: 'top top',
      scrub: true,
    },
    defaults: { ease: 'none' },
  })
    .fromTo(container, {
      width: '70%',
      borderRadius: '20px',
    }, {
      width: '88%',
      borderRadius: '14px',
      duration: 1,
    });

  function openLightbox() {
    if (!lightbox || !lightboxVideo) return;
    lightbox.classList.add('active');
    lightboxVideo.currentTime = 0;
    lightboxVideo.play();
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightbox || !lightboxVideo) return;
    lightbox.classList.remove('active');
    lightboxVideo.pause();
    document.body.style.overflow = '';
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

  const modelCanvas = document.getElementById('modelCanvas');
  const fixedOverlays = document.querySelectorAll('.about__text');

  ScrollTrigger.create({
    trigger: '#reel',
    start: 'top 80%',
    onEnter: () => {
      if (modelCanvas) modelCanvas.style.opacity = '0';
      fixedOverlays.forEach(el => { el.style.display = 'none'; });
    },
    onLeaveBack: () => {
      if (modelCanvas) modelCanvas.style.opacity = '1';
      fixedOverlays.forEach(el => { el.style.display = ''; });
    },
  });
})();
