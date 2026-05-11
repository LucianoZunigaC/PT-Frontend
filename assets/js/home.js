/* home.js — Página principal */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // Foco automático al input del hero
  const heroInput = document.getElementById('hero-main-input');
  if (heroInput) setTimeout(() => heroInput.focus(), 400);

  // Animación de entrada para las cards de categorías
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.category-card, .product-card, .how-step').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = `opacity 0.4s ease ${i * 0.08}s, transform 0.4s ease ${i * 0.08}s`;
    observer.observe(el);
  });
});
