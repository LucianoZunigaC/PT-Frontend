/* search.js — Página de Resultados de Búsqueda */
'use strict';

const API_BASE = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
  const q = getParam('q');
  let cat = getParam('cat');
  let currentPage = 1;
  const limit = 12;

  // Actualizar títulos y breadcrumb con el término buscado
  if (q) {
    const display = document.getElementById('query-display');
    const breadcrumb = document.getElementById('breadcrumb-query');
    const pageTitle = document.getElementById('page-title');
    if (display) display.textContent = `"${q}"`;
    if (breadcrumb) breadcrumb.textContent = `Resultados: ${q}`;
    if (pageTitle) pageTitle.textContent = `Resultados: ${q} — ConstructCompare`;
    document.title = `Resultados: ${q} — ConstructCompare`;
  } else if (cat) {
    const display = document.getElementById('query-display');
    if (display) display.textContent = `Categoría: ${cat}`;
  }

  // Elementos
  const productsGrid = document.getElementById('products-grid');
  const resultsCount = document.getElementById('results-count');
  const paginationWrap = document.getElementById('pagination');
  
  const sortSelect = document.getElementById('sort-select');
  const applyPriceBtn = document.getElementById('apply-price');
  const clearFiltersBtn = document.getElementById('clear-filters');
  const filterInputs = document.querySelectorAll('.filters-sidebar input[type="checkbox"]');

  // Función para obtener estado de filtros
  const getFiltersState = () => {
    const filters = { q, cat, page: currentPage, limit };
    
    // Marcas seleccionadas
    const marcas = Array.from(document.querySelectorAll('input[name="marca"]:checked')).map(cb => cb.value);
    if (marcas.length > 0) filters.marcas = marcas.join(',');

    // Categorías desde sidebar (sobrescribe cat si hay)
    const cats = Array.from(document.querySelectorAll('input[name="cat"]:checked')).map(cb => cb.value);
    if (cats.length > 0) filters.cat = cats.join(',');

    // Rango de precio
    const pMin = document.getElementById('price-min')?.value;
    const pMax = document.getElementById('price-max')?.value;
    if (pMin) filters.precio_min = pMin;
    if (pMax) filters.precio_max = pMax;

    // Sort
    if (sortSelect?.value && sortSelect.value !== 'relevance') {
      filters.sort = sortSelect.value;
    }

    return filters;
  };

  // Renderizar tarjeta de producto
  const renderProductCard = (p) => {
    const minPrice = p.precios && p.precios.length > 0 ? p.precios[0].precio : 0;
    const maxPrice = p.precios && p.precios.length > 0 ? p.precios[p.precios.length - 1].precio : 0;
    const provCount = p.precios ? p.precios.length : 0;
    
    return `
      <div class="search-product-card">
        <div class="spc-badges">
          ${provCount > 0 ? `<span class="badge badge-info">${provCount} tiendas</span>` : ''}
        </div>
        <div class="spc-thumb">
          <img src="${p.imagen || 'https://via.placeholder.com/150'}" alt="${p.nombre}" style="width:100%;height:150px;object-fit:contain;">
        </div>
        <div class="spc-body">
          <div class="spc-category text-muted" style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em">${p.categoria?.nombre || 'General'}</div>
          <h3 class="spc-name">
            <a href="product.html?id=${p.id}">${p.nombre}</a>
          </h3>
          <div class="spc-meta">
            ${p.marca ? `<span class="category-chip" style="font-size:0.7rem">${p.marca}</span>` : ''}
          </div>
          <div class="spc-price-row">
            <div>
              <div class="text-muted" style="font-size:0.75rem">Desde</div>
              <div class="price-main md price-best">${formatPrice(minPrice)}</div>
            </div>
            <div class="text-muted" style="font-size:0.75rem;text-align:right">
              ${maxPrice > minPrice ? `Hasta ${formatPrice(maxPrice)}<br />` : ''}en ${provCount} tiendas
            </div>
          </div>
          <a href="product.html?id=${p.id}" class="btn btn-primary" style="width:100%;justify-content:center">
            Ver comparativa
          </a>
        </div>
      </div>
    `;
  };

  // Renderizar paginación
  const renderPagination = (page, totalPages) => {
    if (!paginationWrap || totalPages <= 1) {
      if (paginationWrap) paginationWrap.innerHTML = '';
      return;
    }
    
    let html = `<button class="page-btn" ${page <= 1 ? 'disabled' : ''} data-page="${page - 1}"><span class="material-icons">chevron_left</span></button>`;
    
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
        html += `<button class="page-btn ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
      } else if (i === page - 2 || i === page + 2) {
        html += `<span class="page-ellipsis">…</span>`;
      }
    }
    
    html += `<button class="page-btn" ${page >= totalPages ? 'disabled' : ''} data-page="${page + 1}"><span class="material-icons">chevron_right</span></button>`;
    
    paginationWrap.innerHTML = html;
    
    // Eventos a botones
    paginationWrap.querySelectorAll('button[data-page]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        currentPage = parseInt(e.currentTarget.getAttribute('data-page'));
        fetchResults();
      });
    });
  };

  // Renderizar facetas (filtros laterales)
  const renderFacets = (facetas) => {
    // Rellenar marcas basado en los datos devueltos
    const filterMarca = document.getElementById('filter-marca');
    if (filterMarca && facetas.marcas) {
      const opts = filterMarca.querySelector('.filter-options');
      if (opts && Object.keys(facetas.marcas).length > 0) {
        // Preservamos los inputs checkeados actualmente
        const checked = Array.from(opts.querySelectorAll('input:checked')).map(i => i.value);
        let html = '';
        for (const [marca, count] of Object.entries(facetas.marcas)) {
          if (!marca) continue;
          const isChecked = checked.includes(marca) ? 'checked' : '';
          html += `
            <label class="filter-option">
              <input type="checkbox" name="marca" value="${marca}" ${isChecked} />
              <span style="text-transform: capitalize;">${marca}</span>
              <span class="filter-count">${count}</span>
            </label>
          `;
        }
        opts.innerHTML = html;
        
        // Re-añadir eventos
        opts.querySelectorAll('input').forEach(input => {
          input.addEventListener('change', () => { currentPage = 1; fetchResults(); });
        });
      }
    }
  };

  // Función principal de búsqueda
  const fetchResults = async () => {
    if (!productsGrid) return;
    
    productsGrid.innerHTML = '<div style="text-align:center;width:100%;padding:40px;"><span class="material-icons spinning" style="font-size:40px;color:var(--primary)">refresh</span><p>Buscando mejores precios...</p></div>';
    
    const filters = getFiltersState();
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) {
      if (v) query.append(k, v);
    }
    
    try {
      const url = `${API_BASE}/productos/busqueda?${query.toString()}`;
      console.log('Fetching:', url);
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);
      
      // Update UI
      if (resultsCount) {
        const start = (data.page - 1) * data.limit + 1;
        const end = Math.min(data.page * data.limit, data.total);
        resultsCount.textContent = data.total > 0 ? `Mostrando ${start}–${end} de ${data.total} resultados` : '0 resultados encontrados';
      }
      
      if (data.productos && data.productos.length > 0) {
        productsGrid.innerHTML = data.productos.map(renderProductCard).join('');
      } else {
        productsGrid.innerHTML = '<div style="text-align:center;width:100%;padding:40px;grid-column:1/-1;"><h3>No encontramos resultados</h3><p>Intenta con otros filtros o términos de búsqueda.</p></div>';
      }
      
      renderPagination(data.page, data.totalPages);
      renderFacets(data.facetas);
      
    } catch (err) {
      console.error(err);
      productsGrid.innerHTML = `<div style="text-align:center;width:100%;padding:40px;grid-column:1/-1;color:red;"><h3>Error de conexión</h3><p>${err.message || 'No pudimos contactar al servidor.'}</p></div>`;
    }
  };

  // Iniciar búsqueda
  if (q || cat) {
    fetchResults();
  }

  // Listeners para filtros
  filterInputs.forEach(input => {
    input.addEventListener('change', () => { currentPage = 1; fetchResults(); });
  });

  applyPriceBtn?.addEventListener('click', () => { currentPage = 1; fetchResults(); });

  sortSelect?.addEventListener('change', () => { currentPage = 1; fetchResults(); });

  clearFiltersBtn?.addEventListener('click', () => {
    document.querySelectorAll('.filters-sidebar input[type="checkbox"]').forEach(cb => cb.checked = false);
    const minEl = document.getElementById('price-min');
    const maxEl = document.getElementById('price-max');
    if (minEl) minEl.value = '';
    if (maxEl) maxEl.value = '';
    if (sortSelect) sortSelect.value = 'relevance';
    currentPage = 1;
    fetchResults();
  });

  // Toggle vista grid/lista
  const gridBtn = document.getElementById('view-grid');
  const listBtn = document.getElementById('view-list');

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

});
