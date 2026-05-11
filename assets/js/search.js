/* search.js — Página de Resultados de Búsqueda */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const q = getParam('q');
  const cat = getParam('cat');

  // Actualizar títulos y breadcrumb con el término buscado
  if (q) {
    const display = document.getElementById('query-display');
    const breadcrumb = document.getElementById('breadcrumb-query');
    const pageTitle = document.getElementById('page-title');
    if (display) display.textContent = `"${q}"`;
    if (breadcrumb) breadcrumb.textContent = `Resultados: ${q}`;
    if (pageTitle) pageTitle.textContent = `Resultados: ${q} — ConstructCompare`;
    document.title = `Resultados: ${q} — ConstructCompare`;
  }

  // Toggle vista grid/lista
  const gridBtn = document.getElementById('view-grid');
  const listBtn = document.getElementById('view-list');
  const productsGrid = document.getElementById('products-grid');

  gridBtn?.addEventListener('click', () => {
    productsGrid?.classList.remove('list-view');
    gridBtn.classList.add('active');
    listBtn?.classList.remove('active');
  });
  listBtn?.addEventListener('click', () => {
    productsGrid?.classList.add('list-view');
    listBtn.classList.add('active');
    gridBtn?.classList.remove('active');
  });

  // Toggle filtros (colapsar/expandir)
  document.querySelectorAll('.filter-title').forEach(title => {
    title.addEventListener('click', () => {
      const group = title.closest('.filter-group');
      const opts = group?.querySelector('.filter-options');
      const icon = title.querySelector('.filter-toggle-icon');
      if (opts) {
        const isHidden = opts.style.display === 'none';
        opts.style.display = isHidden ? 'flex' : 'none';
        if (icon) icon.textContent = isHidden ? 'expand_less' : 'expand_more';
      }
    });
  });

  // Limpiar filtros
  document.getElementById('clear-filters')?.addEventListener('click', () => {
    document.querySelectorAll('.filter-option input[type="checkbox"]').forEach(cb => cb.checked = false);
    const minEl = document.getElementById('price-min');
    const maxEl = document.getElementById('price-max');
    if (minEl) minEl.value = '';
    if (maxEl) maxEl.value = '';
  });

  // Ordenar (placeholder — conectar con API real)
  document.getElementById('sort-select')?.addEventListener('change', (e) => {
    console.log('Ordenar por:', e.target.value);
    // TODO: llamar API de búsqueda con sort param
  });
});
