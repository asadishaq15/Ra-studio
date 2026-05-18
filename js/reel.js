(() => {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;

  const container = document.getElementById('reelContainer');
  const video = document.getElementById('reelVideo');
  const playBtn = document.getElementById('reelPlayBtn');
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

  if (video && playBtn) {
    function togglePlay() {
      if (video.muted) {
        video.muted = false;
        video.play();
        playBtn.classList.add('hidden');
      } else if (video.paused) {
        video.play();
        playBtn.classList.add('hidden');
      } else {
        video.pause();
        playBtn.classList.remove('hidden');
      }
    }

    playBtn.addEventListener('click', togglePlay);
    video.addEventListener('click', togglePlay);
  }

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
