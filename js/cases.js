/* ══ OLD CASES JS (commented out) ══
(function () {
  const cards = document.querySelectorAll('.cases__card');
  if (!cards.length) return;

  function setActive(index) {
    cards.forEach((card, i) => {
      card.classList.toggle('active', i === index);
    });
  }

  setActive(0);

  cards.forEach((card, i) => {
    card.addEventListener('mouseenter', () => setActive(i));
    card.addEventListener('click', () => setActive(i));
  });
})();
══ END OLD CASES JS ══ */

/* New casesv2: hover blur is handled purely via CSS — no JS needed. */
