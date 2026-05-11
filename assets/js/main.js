/* main.js — ConstructCompare — Funciones globales */
'use strict';

// ── URL Query Params helper ──
const getParam = (key) => new URLSearchParams(window.location.search).get(key) || '';

// ── Sincronizar barra de búsqueda del navbar con el query actual ──
document.addEventListener('DOMContentLoaded', () => {
  const q = getParam('q');

  // Llenar inputs de búsqueda con el término actual
  document.querySelectorAll('#search-input, #navbar-search-input').forEach(el => {
    if (q) el.value = q;
  });

  // Interceptar formularios de búsqueda para añadir el query params
  document.querySelectorAll('form.navbar-search, form#search-form').forEach(form => {
    form.addEventListener('submit', (e) => {
      const input = form.querySelector('input[type="text"]');
      const val = input ? input.value.trim() : '';
      if (!val) { e.preventDefault(); return; }
      // Redirigir a search.html con el parámetro q
      const base = window.location.pathname.includes('/pages/') ? 'search.html' : 'pages/search.html';
      window.location.href = `${base}?q=${encodeURIComponent(val)}`;
      e.preventDefault();
    });
  });

  // Marcar enlace activo en navbar
  const currentPage = window.location.pathname.split('/').pop();
  document.querySelectorAll('.navbar-links a, .sidebar-link').forEach(link => {
    if (link.getAttribute('href') && link.getAttribute('href').includes(currentPage)) {
      link.classList.add('active');
    }
  });
});

// ── Utility: format price (CLP) ──
const formatPrice = (n) => `$${Number(n).toLocaleString('es-CL')}`;

// ── Utility: debounce ──
const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
};
