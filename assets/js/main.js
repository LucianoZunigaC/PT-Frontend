/* main.js — MaterialScan — Funciones globales */
'use strict';

// ── URL Query Params helper ──
const getParam = (key) => new URLSearchParams(window.location.search).get(key) || '';

// ══════════════════════════════════════════
// TEMA: Modo claro / oscuro
// ══════════════════════════════════════════
const THEME_KEY = 'cc-theme';
const THEMES    = { LIGHT: 'light', DARK: 'dark' };

/**
 * Aplica el tema al elemento raíz y actualiza el ícono del botón.
 * @param {'light'|'dark'} theme
 */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);

  // Actualizar aria-label del botón (puede haber varios en la página)
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.setAttribute('aria-label',
      theme === THEMES.DARK ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
    );
    btn.setAttribute('title',
      theme === THEMES.DARK ? 'Modo claro' : 'Modo oscuro'
    );
  });
}

/**
 * Devuelve el tema guardado o detecta la preferencia del sistema.
 * @returns {'light'|'dark'}
 */
function getInitialTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === THEMES.LIGHT || saved === THEMES.DARK) return saved;
  // Usar preferencia del sistema operativo
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? THEMES.DARK
    : THEMES.LIGHT;
}

/**
 * Alterna entre modo claro y oscuro.
 */
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || THEMES.LIGHT;
  applyTheme(current === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK);
}

// ── Sincronizar barra de búsqueda del navbar con el query actual ──
document.addEventListener('DOMContentLoaded', () => {
  // ── Aplicar tema inicial (antes de pintar) ──
  applyTheme(getInitialTheme());

  // ── Activar todos los botones de toggle ──
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });

  // ── Escuchar cambios en la preferencia del sistema ──
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    // Solo aplicar automáticamente si el usuario no ha guardado preferencia
    if (!localStorage.getItem(THEME_KEY)) {
      applyTheme(e.matches ? THEMES.DARK : THEMES.LIGHT);
    }
  });

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
