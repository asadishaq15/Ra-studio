(() => {
  const hero = document.querySelector('.hero');
  const canvas = document.getElementById('heroCanvas');

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let time = 0;

  const EASE = 0.03;

  function getRange() {
    return {
      x: (canvas.offsetWidth - window.innerWidth) / 2,
      y: (canvas.offsetHeight - window.innerHeight) / 2,
    };
  }

  window.addEventListener('mousemove', (e) => {
    // Map cursor position across full window for both axes
    targetX = -((e.clientX / window.innerWidth) - 0.5) * 2;
    targetY = -((e.clientY / window.innerHeight) - 0.5) * 2;
  });

  window.addEventListener('mouseleave', () => {
    targetX = 0;
    targetY = 0;
  });

  function animate() {
    time += 0.006;

    currentX += (targetX - currentX) * EASE;
    currentY += (targetY - currentY) * EASE;

    const range = getRange();
    const sineY = Math.sin(time) * range.y * 0.04;

    const moveX = currentX * range.x;
    const moveY = currentY * range.y + sineY;

    canvas.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;

    requestAnimationFrame(animate);
  }

  animate();
})();
