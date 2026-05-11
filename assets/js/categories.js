/* categories.js */
'use strict';
document.addEventListener('DOMContentLoaded', () => {
  const chips = document.querySelectorAll('.cat-filter-bar .category-chip');
  const sections = document.querySelectorAll('.cat-section');

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const target = chip.dataset.cat;
      sections.forEach(sec => {
        if (target === 'all' || sec.dataset.cat === target) {
          sec.classList.remove('hidden');
        } else {
          sec.classList.add('hidden');
        }
      });
    });
  });

  // Scroll suave al anclar desde Home
  const hash = window.location.hash;
  if (hash) {
    const el = document.querySelector(hash);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 300);
  }
});
