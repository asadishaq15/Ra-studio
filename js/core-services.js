(function () {
  const items = document.querySelectorAll('.core-services__item');
  const preview = document.getElementById('servicePreview');
  const previewImg = document.getElementById('servicePreviewImg');
  if (!items.length || !preview) return;

  const imgCache = {};
  items.forEach((item) => {
    const src = item.dataset.img;
    if (src) {
      const img = new Image();
      img.src = src;
      imgCache[src] = img;
    }
  });

  let active = false;

  items.forEach((item) => {
    item.addEventListener('mouseenter', () => {
      const src = item.dataset.img;
      if (src) {
        previewImg.src = src;
        previewImg.classList.add('loaded');
      } else {
        previewImg.classList.remove('loaded');
      }
      active = true;
      preview.classList.add('active');
    });

    item.addEventListener('mouseleave', () => {
      active = false;
      preview.classList.remove('active');
      previewImg.classList.remove('loaded');
    });
  });

  document.addEventListener('mousemove', (e) => {
    if (!active) return;
    preview.style.left = e.clientX + 'px';
    preview.style.top = e.clientY + 'px';
  });
})();
