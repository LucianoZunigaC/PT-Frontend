/* search.js — Página de Resultados de Búsqueda — Conectado al Backend Real */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const q   = getParam('q');
  const cat = getParam('cat');

  // ── 1. Actualizar títulos y breadcrumb ──────────────────────────────────────
  if (q) {
    const display   = document.getElementById('query-display');
    const breadcrumb = document.getElementById('breadcrumb-query');
    if (display)    display.textContent  = `"${q}"`;
    if (breadcrumb) breadcrumb.textContent = `Resultados: ${q}`;
    document.title = `Resultados: ${q} — MaterialScan`;
  } else if (cat) {
    const breadcrumb = document.getElementById('breadcrumb-query');
    if (breadcrumb) breadcrumb.textContent = `Categoría: ${cat.replace(/-/g, ' ')}`;
    document.title = `${cat.replace(/-/g, ' ')} — MaterialScan`;
    const heading = document.getElementById('results-heading');
    if (heading) heading.innerHTML = `Resultados para <em>"${cat.replace(/-/g, ' ')}"</em>`;
  }

  // ── 2. Referencias DOM ──────────────────────────────────────────────────────
  const productsGrid  = document.getElementById('products-grid');
  const resultsCount  = document.getElementById('results-count');
  const paginationWrap = document.getElementById('pagination');
  const sortSelect    = document.getElementById('sort-select');
  const applyPriceBtn = document.getElementById('apply-price');
  const clearFiltersBtn = document.getElementById('clear-filters');
  const filterInputs  = document.querySelectorAll('.filters-sidebar input[type="checkbox"]');

  let currentPage = 1;

  // ── 3. Leer estado de filtros ───────────────────────────────────────────────
  const getFiltersState = () => {
    const marcasChecked = Array.from(
      document.querySelectorAll('input[name="marca"]:checked')
    ).map(i => i.value);

    const sortVal = sortSelect ? sortSelect.value : 'relevance';
    const minEl   = document.getElementById('price-min');
    const maxEl   = document.getElementById('price-max');

    return {
      q:          q   || '',
      cat:        cat || '',
      marcas:     marcasChecked.join(','),
      sort:       sortVal === 'relevance' ? '' : sortVal,
      precio_min: minEl?.value || '',
      precio_max: maxEl?.value || '',
      page:       currentPage,
      limit:      12,
    };
  };

  // ── 4. Renderizar tarjeta de producto ───────────────────────────────────────
  const renderProductCard = (p) => {
    const prices     = p.precios || [];
    const minPrice   = prices.length > 0 ? Number(prices[0].precio)   : 0;
    const maxPrice   = prices.length > 0 ? Number(prices[prices.length - 1].precio) : 0;
    const provCount  = prices.length;
    const bestStore  = prices[0]?.proveedor?.nombre || '';
    const productUrl = `product.html?id=${p.id}`;
    const imgHtml    = p.imagen
      ? `<img src="${p.imagen}" alt="${p.nombre}" style="width:100%;height:140px;object-fit:contain;" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><div class="spc-emoji" style="display:none">📦</div>`
      : `<div class="spc-emoji">📦</div>`;

    const savingPct = (maxPrice > 0 && minPrice > 0 && maxPrice > minPrice)
      ? Math.round(((maxPrice - minPrice) / maxPrice) * 100)
      : 0;

    return `
      <div class="search-product-card">
        <div class="spc-badges">
          ${provCount > 0 ? `<span class="badge badge-info">${provCount} tienda${provCount !== 1 ? 's' : ''}</span>` : ''}
          ${savingPct >= 5 ? `<span class="badge badge-success">↓ -${savingPct}%</span>` : ''}
        </div>
        <div class="spc-thumb">${imgHtml}</div>
        <div class="spc-body">
          <div class="spc-category text-muted" style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em">
            ${p.categoria?.nombre || 'General'}
          </div>
          <h3 class="spc-name">
            <a href="${productUrl}">${p.nombre}</a>
          </h3>
          <div class="spc-meta">
            ${p.marca ? `<span class="category-chip" style="font-size:0.7rem">${p.marca}</span>` : ''}
            ${bestStore ? `<span class="category-chip" style="font-size:0.7rem">${bestStore}</span>` : ''}
          </div>
          <div class="spc-price-row">
            <div>
              <div class="text-muted" style="font-size:0.75rem">Desde</div>
              <div class="price-main md price-best">${minPrice > 0 ? formatPrice(minPrice) : '—'}</div>
            </div>
            <div class="text-muted" style="font-size:0.75rem;text-align:right">
              ${maxPrice > minPrice ? `Hasta ${formatPrice(maxPrice)}<br />` : ''}
              ${provCount > 0 ? `en ${provCount} tienda${provCount !== 1 ? 's' : ''}` : ''}
            </div>
          </div>
          <a href="${productUrl}" class="btn btn-primary" style="width:100%;justify-content:center">
            Ver comparativa
          </a>
        </div>
      </div>
    `;
  };

  // ── 5. Renderizar paginación ────────────────────────────────────────────────
  const renderPagination = (page, totalPages) => {
    if (!paginationWrap) return;
    if (totalPages <= 1) { paginationWrap.innerHTML = ''; return; }

    let html = `<button class="page-btn" ${page <= 1 ? 'disabled' : ''} data-page="${page - 1}">
      <span class="material-icons">chevron_left</span></button>`;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
        html += `<button class="page-btn ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
      } else if (i === page - 2 || i === page + 2) {
        html += `<span class="page-ellipsis">…</span>`;
      }
    }

    html += `<button class="page-btn" ${page >= totalPages ? 'disabled' : ''} data-page="${page + 1}">
      <span class="material-icons">chevron_right</span></button>`;

    paginationWrap.innerHTML = html;
    paginationWrap.querySelectorAll('button[data-page]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        currentPage = parseInt(e.currentTarget.getAttribute('data-page'));
        fetchResults();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  };

  // ── 6. Renderizar facetas dinámicas ─────────────────────────────────────────
  const renderFacets = (facetas) => {
    const filterMarca = document.getElementById('filter-marca');
    if (filterMarca && facetas?.marcas && Object.keys(facetas.marcas).length > 0) {
      const opts = filterMarca.querySelector('.filter-options');
      if (opts) {
        const checked = Array.from(opts.querySelectorAll('input:checked')).map(i => i.value);
        const sorted  = Object.entries(facetas.marcas).sort((a, b) => b[1] - a[1]).slice(0, 10);
        let html = '';
        for (const [marca, count] of sorted) {
          if (!marca) continue;
          const isChecked = checked.includes(marca) ? 'checked' : '';
          const id = `f-marca-${marca.replace(/\s+/g, '-').toLowerCase()}`;
          html += `
            <label class="filter-option">
              <input type="checkbox" name="marca" value="${marca}" id="${id}" ${isChecked} />
              <span style="text-transform: capitalize;">${marca}</span>
              <span class="filter-count">${count}</span>
            </label>`;
        }
        opts.innerHTML = html;
        opts.querySelectorAll('input').forEach(input => {
          input.addEventListener('change', () => { currentPage = 1; fetchResults(); });
        });
      }
    }
  };

  // ── 7. Estado vacío con mensaje de scraping en curso ────────────────────────
  const renderEmpty = (termino) => `
    <div style="text-align:center;width:100%;padding:60px 20px;grid-column:1/-1;">
      <span class="material-icons" style="font-size:48px;color:var(--primary);opacity:0.5">search_off</span>
      <h3 style="margin-top:16px">No encontramos resultados para "${termino}"</h3>
      <p style="color:var(--on-surface-variant);max-width:400px;margin:8px auto">
        Hemos iniciado una búsqueda en tiempo real. Los resultados aparecerán en los próximos minutos. 
        Intenta recargar la página o busca con otro término.
      </p>
      <a href="../index.html" class="btn btn-secondary" style="margin-top:16px">Volver al inicio</a>
    </div>`;

  // ── 8. Función principal de búsqueda ────────────────────────────────────────
  const fetchResults = async () => {
    if (!productsGrid) return;

    productsGrid.innerHTML = `
      <div style="text-align:center;width:100%;padding:60px;grid-column:1/-1;">
        <span class="material-icons" style="font-size:48px;color:var(--primary);animation:spin 1s linear infinite">refresh</span>
        <p style="margin-top:12px;color:var(--on-surface-variant)">Buscando mejores precios…</p>
      </div>`;

    const filters = getFiltersState();
    const query   = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) {
      if (v !== '' && v !== null && v !== undefined) query.append(k, v);
    }

    try {
      const url = `${API_BASE}/productos/busqueda?${query.toString()}`;
      const res  = await fetch(url, { signal: AbortSignal.timeout(20000) });

      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Actualizar contador
      if (resultsCount) {
        if (data.total > 0) {
          const start = (data.page - 1) * data.limit + 1;
          const end   = Math.min(data.page * data.limit, data.total);
          resultsCount.textContent = `Mostrando ${start}–${end} de ${data.total} resultados`;
        } else {
          resultsCount.textContent = '0 resultados encontrados';
        }
      }

      // Renderizar productos
      if (data.productos && data.productos.length > 0) {
        productsGrid.innerHTML = data.productos.map(renderProductCard).join('');
      } else {
        productsGrid.innerHTML = renderEmpty(q || cat || '');
      }

      renderPagination(data.page, data.totalPages);
      renderFacets(data.facetas);

    } catch (err) {
      console.error('[Search] Error al obtener resultados:', err);
      const isTimeout = err.name === 'TimeoutError';
      productsGrid.innerHTML = `
        <div style="text-align:center;width:100%;padding:60px;grid-column:1/-1;color:var(--error);">
          <span class="material-icons" style="font-size:48px">wifi_off</span>
          <h3 style="margin-top:16px">${isTimeout ? 'La búsqueda tardó demasiado' : 'Error de conexión'}</h3>
          <p style="color:var(--on-surface-variant);margin-top:8px">
            ${isTimeout ? 'El servidor está procesando tu solicitud. Intenta en unos segundos.' : (err.message || 'No pudimos contactar al servidor. Verifica que el backend esté activo.')}
          </p>
          <button class="btn btn-primary" style="margin-top:16px" onclick="location.reload()">Reintentar</button>
        </div>`;
    }
  };

  // ── 9. Lanzar búsqueda inicial ──────────────────────────────────────────────
  if (q || cat) {
    fetchResults();
  } else {
    if (productsGrid) {
      productsGrid.innerHTML = `
        <div style="text-align:center;width:100%;padding:60px;grid-column:1/-1;">
          <span class="material-icons" style="font-size:48px;color:var(--primary);opacity:0.5">manage_search</span>
          <h3 style="margin-top:16px">Ingresa un término de búsqueda</h3>
          <p style="color:var(--on-surface-variant)">Usa la barra de búsqueda para encontrar materiales y herramientas.</p>
        </div>`;
    }
    if (resultsCount) resultsCount.textContent = '';
  }

  // ── 10. Listeners de filtros y controles ────────────────────────────────────
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

  // ── 11. Toggle vista grid / lista ───────────────────────────────────────────
  const gridBtn = document.getElementById('view-grid');
  const listBtn = document.getElementById('view-list');

  gridBtn?.addEventListener('click', () => {
    productsGrid?.classList.remove('list-view');
    gridBtn.classList.add('active');
    listBtn?.classList.remove('active');
    localStorage.setItem('ms-view', 'grid');
  });
  listBtn?.addEventListener('click', () => {
    productsGrid?.classList.add('list-view');
    listBtn.classList.add('active');
    gridBtn?.classList.remove('active');
    localStorage.setItem('ms-view', 'list');
  });

  // Restaurar preferencia de vista
  if (localStorage.getItem('ms-view') === 'list') {
    listBtn?.click();
  }

  // ── 12. Toggle filtros (colapsar/expandir) ──────────────────────────────────
  document.querySelectorAll('.filter-title').forEach(title => {
    title.addEventListener('click', () => {
      const group = title.closest('.filter-group');
      const opts  = group?.querySelector('.filter-options');
      const icon  = title.querySelector('.filter-toggle-icon');
      if (opts) {
        const isHidden = opts.style.display === 'none';
        opts.style.display = isHidden ? 'flex' : 'none';
        if (icon) icon.textContent = isHidden ? 'expand_less' : 'expand_more';
      }
    });
  });

  // ── 13. Sugerencias de búsqueda en navbar ───────────────────────────────────
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    let suggestionBox = null;

    const fetchSuggestions = debounce(async (val) => {
      if (val.length < 2) { suggestionBox?.remove(); return; }
      try {
        const res  = await fetch(`${API_BASE}/productos/sugerencias?q=${encodeURIComponent(val)}&limit=6`);
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) { suggestionBox?.remove(); return; }

        if (!suggestionBox) {
          suggestionBox = document.createElement('ul');
          suggestionBox.className = 'search-suggestions';
          searchInput.parentNode.style.position = 'relative';
          searchInput.parentNode.appendChild(suggestionBox);
        }
        suggestionBox.innerHTML = data.map(s =>
          `<li data-value="${s}"><span class="material-icons" style="font-size:14px;opacity:0.6">search</span> ${s}</li>`
        ).join('');
        suggestionBox.querySelectorAll('li').forEach(li => {
          li.addEventListener('click', () => {
            window.location.href = `search.html?q=${encodeURIComponent(li.dataset.value)}`;
          });
        });
      } catch { /* silenciar errores de sugerencias */ }
    }, 300);

    searchInput.addEventListener('input', (e) => fetchSuggestions(e.target.value));
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target)) suggestionBox?.remove();
    });
  }
});
