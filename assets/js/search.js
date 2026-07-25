/* search.js — Página de Resultados de Búsqueda — Clusters Semánticos */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const q   = getParam('q');
  const cat = getParam('cat');

  // ── 1. Actualizar títulos y breadcrumb ──────────────────────────────────────
  if (q) {
    const display    = document.getElementById('query-display');
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
  const productsGrid   = document.getElementById('products-grid');
  const resultsCount   = document.getElementById('results-count');
  const paginationWrap = document.getElementById('pagination');
  const sortSelect     = document.getElementById('sort-select');
  const applyPriceBtn  = document.getElementById('apply-price');
  const clearFiltersBtn = document.getElementById('clear-filters');
  const filterInputs   = document.querySelectorAll('.filters-sidebar input[type="checkbox"]');

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
      limit:      60,
    };
  };

  // ── 4. Renderizar un producto individual dentro de un cluster ───────────────
  const renderClusterProduct = (p) => {
    const prices    = p.precios || [];
    const minPrice  = prices.length > 0 ? Number(prices[0].precio) : 0;
    const bestStore = prices[0]?.proveedor?.nombre || '';
    const productUrl = `product.html?id=${p.id}`;
    const imgHtml = p.imagen
      ? `<img src="${p.imagen}" alt="${p.nombre}" style="width:60px;height:60px;object-fit:contain;border-radius:6px;flex-shrink:0;" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><span class="cluster-product-emoji" style="display:none">📦</span>`
      : `<span class="cluster-product-emoji">📦</span>`;

    const storeChips = prices.map(pr => {
      const pName = pr.proveedor?.nombre || '';
      const pPrice = formatPrice(Number(pr.precio));
      return `<span class="store-chip" title="${pName}: ${pPrice}">
        <strong>${pName}</strong> ${pPrice}
      </span>`;
    }).join('');

    return `
      <div class="cluster-product-row">
        <div class="cluster-product-img">${imgHtml}</div>
        <div class="cluster-product-info">
          <a href="${productUrl}" class="cluster-product-name">${p.nombre}</a>
          ${p.marca ? `<span class="cluster-product-brand">${p.marca}</span>` : ''}
        </div>
        <div class="cluster-product-stores">${storeChips}</div>
        <div class="cluster-product-price">
          <span class="price-main md price-best">${minPrice > 0 ? formatPrice(minPrice) : '—'}</span>
          ${bestStore ? `<span class="cluster-product-store-label">en ${bestStore}</span>` : ''}
        </div>
        <a href="${productUrl}" class="btn btn-secondary btn-sm cluster-product-btn">Comparar</a>
      </div>`;
  };

  // ── 5. Renderizar un cluster completo ───────────────────────────────────────
  const renderCluster = (cluster, index) => {
    const savingPct = (cluster.peorPrecio && cluster.mejorPrecio && cluster.peorPrecio > cluster.mejorPrecio)
      ? Math.round(((cluster.peorPrecio - cluster.mejorPrecio) / cluster.peorPrecio) * 100)
      : 0;

    const isExpanded = index < 3; // Expandir los 3 primeros clusters por defecto
    const productsToShow = isExpanded ? cluster.productos : cluster.productos.slice(0, 2);
    const hiddenCount = cluster.productos.length - productsToShow.length;

    return `
      <div class="cluster-card" data-cluster-key="${cluster.clusterKey}">
        <div class="cluster-header" onclick="this.closest('.cluster-card').classList.toggle('collapsed')">
          <div class="cluster-title-row">
            <h3 class="cluster-name">${cluster.nombre}</h3>
            <div class="cluster-badges">
              <span class="badge badge-info">${cluster.cantidadProductos} producto${cluster.cantidadProductos !== 1 ? 's' : ''}</span>
              <span class="badge badge-secondary">${cluster.cantidadProveedores} tienda${cluster.cantidadProveedores !== 1 ? 's' : ''}</span>
              ${savingPct >= 5 ? `<span class="badge badge-success">↓ Ahorra hasta ${savingPct}%</span>` : ''}
            </div>
          </div>
          <div class="cluster-price-range">
            <div class="cluster-price-block">
              <span class="cluster-price-label">Desde</span>
              <span class="price-main md price-best">${cluster.mejorPrecio ? formatPrice(cluster.mejorPrecio) : '—'}</span>
            </div>
            ${cluster.peorPrecio && cluster.peorPrecio > cluster.mejorPrecio ? `
            <div class="cluster-price-block">
              <span class="cluster-price-label">Hasta</span>
              <span class="price-main md price-worst">${formatPrice(cluster.peorPrecio)}</span>
            </div>` : ''}
            ${cluster.marcas && cluster.marcas.length > 0 ? `
            <div class="cluster-brands">
              ${cluster.marcas.slice(0, 5).map(m => `<span class="category-chip">${m}</span>`).join('')}
              ${cluster.marcas.length > 5 ? `<span class="category-chip">+${cluster.marcas.length - 5}</span>` : ''}
            </div>` : ''}
          </div>
          <span class="material-icons cluster-toggle-icon">expand_more</span>
        </div>
        <div class="cluster-body">
          ${productsToShow.map(p => renderClusterProduct(p)).join('')}
          ${hiddenCount > 0 ? `
            <button class="cluster-show-more" onclick="event.stopPropagation(); this.closest('.cluster-card').classList.add('show-all'); this.remove();">
              <span class="material-icons" style="font-size:16px">expand_more</span>
              Ver ${hiddenCount} producto${hiddenCount !== 1 ? 's' : ''} más
            </button>
            <div class="cluster-hidden-products">
              ${cluster.productos.slice(productsToShow.length).map(p => renderClusterProduct(p)).join('')}
            </div>` : ''}
        </div>
      </div>`;
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

  // ── 7. Estado vacío ────────────────────────────────────────────────────────
  const renderEmpty = (termino) => `
    <div style="text-align:center;width:100%;padding:60px 20px;">
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
      <div style="text-align:center;width:100%;padding:60px;">
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
          const clusterCount = data.clusters?.length || 0;
          resultsCount.textContent = `${data.total} resultados en ${clusterCount} grupo${clusterCount !== 1 ? 's' : ''}`;
        } else {
          resultsCount.textContent = '0 resultados encontrados';
        }
      }

      // Renderizar clusters o estado vacío
      if (data.clusters && data.clusters.length > 0) {
        productsGrid.innerHTML = data.clusters.map((c, i) => renderCluster(c, i)).join('');
        productsGrid.classList.add('cluster-view');
      } else if (data.productos && data.productos.length > 0) {
        // Fallback a lista plana si no hay clusters
        productsGrid.innerHTML = data.productos.map(p => renderClusterProduct(p)).join('');
        productsGrid.classList.remove('cluster-view');
      } else {
        productsGrid.innerHTML = renderEmpty(q || cat || '');
      }

      renderFacets(data.facetas);

    } catch (err) {
      console.error('[Search] Error al obtener resultados:', err);
      const isTimeout = err.name === 'TimeoutError';
      productsGrid.innerHTML = `
        <div style="text-align:center;width:100%;padding:60px;color:var(--error);">
          <span class="material-icons" style="font-size:48px">wifi_off</span>
          <h3 style="margin-top:16px">${isTimeout ? 'La búsqueda tardó demasiado' : 'Error de conexión'}</h3>
          <p style="color:var(--on-surface-variant);margin-top:8px">
            ${isTimeout ? 'El servidor está procesando tu solicitud. Intenta en unos segundos.' : (err.message || 'No pudimos contactar al servidor.')}
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
        <div style="text-align:center;width:100%;padding:60px;">
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

  // ── 11. Toggle vista (mantener para no romper UX) ──────────────────────────
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

  // ── 12. Toggle filtros ─────────────────────────────────────────────────────
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

  // ── 13. Sugerencias de búsqueda en navbar ──────────────────────────────────
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
      } catch { /* silenciar */ }
    }, 300);

    searchInput.addEventListener('input', (e) => fetchSuggestions(e.target.value));
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target)) suggestionBox?.remove();
    });
  }
});
