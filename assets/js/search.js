/* search.js — Página de Resultados de Búsqueda — Conectado a API real */
'use strict';

// ── Configuración ──
const API_BASE = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', async () => {
  const q   = getParam('q');
  const cat = getParam('cat');

  // Actualizar UI con el término buscado
  if (q) {
    const display    = document.getElementById('query-display');
    const breadcrumb = document.getElementById('breadcrumb-query');
    const pageTitle  = document.getElementById('page-title');
    if (display)    display.textContent    = `"${q}"`;
    if (breadcrumb) breadcrumb.textContent = `Resultados: ${q}`;
    if (pageTitle)  pageTitle.textContent  = `Resultados: ${q} — ConstructCompare`;
    document.title = `Resultados: ${q} — ConstructCompare`;
  }

  // Toggle vista grid/lista
  const gridBtn      = document.getElementById('view-grid');
  const listBtn      = document.getElementById('view-list');
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
      const opts  = group?.querySelector('.filter-options');
      const icon  = title.querySelector('.filter-toggle-icon');
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
    cargarResultados();
  });

  // Ordenamiento
  document.getElementById('sort-select')?.addEventListener('change', () => {
    cargarResultados();
  });

  // Aplicar filtro de precio
  document.getElementById('apply-price')?.addEventListener('click', () => {
    cargarResultados();
  });

  // ── Carga inicial de resultados ──
  if (q || cat) {
    await cargarResultados();
  }
});

// ── Función principal: buscar en el backend ──
async function cargarResultados(page = 1) {
  const q         = getParam('q');
  const cat       = getParam('cat');
  const sort      = document.getElementById('sort-select')?.value || 'relevance';
  const precioMin = document.getElementById('price-min')?.value || '';
  const precioMax = document.getElementById('price-max')?.value || '';

  // 1. Obtener valores seleccionados de filtros (marcas y proveedores)
  let checkedBrands = Array.from(document.querySelectorAll('#filter-options-marcas input:checked')).map(cb => cb.value);
  let checkedProvs = Array.from(document.querySelectorAll('#filter-options-proveedores input:checked')).map(cb => cb.value);

  // Primera carga: Recuperar de la URL si no hay elementos renderizados aún
  const isFirstLoad = document.querySelectorAll('#filter-options-marcas input').length === 0;
  if (isFirstLoad) {
    const urlBrands = getParam('marcas');
    const urlProvs  = getParam('proveedores');
    if (urlBrands) checkedBrands = urlBrands.split(',');
    if (urlProvs)  checkedProvs  = urlProvs.split(',');
  }

  const grid      = document.getElementById('products-grid');
  const countEl   = document.getElementById('results-count');

  if (!grid) return;

  // Mostrar estado de carga
  grid.innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--on-surface-variant)">
      <span class="material-icons" style="font-size:2.5rem;animation:spin 1s linear infinite">refresh</span>
      <p style="margin-top:1rem">Buscando productos…</p>
    </div>
  `;

  try {
    const params = new URLSearchParams();
    if (q)         params.set('q', q);
    if (cat)       params.set('cat', cat);
    if (sort && sort !== 'relevance') params.set('sort', sort);
    if (precioMin) params.set('precio_min', precioMin);
    if (precioMax) params.set('precio_max', precioMax);
    
    // Agregar filtros dinámicos a la petición
    if (checkedBrands.length > 0) params.set('marcas', checkedBrands.join(','));
    if (checkedProvs.length > 0)  params.set('proveedores', checkedProvs.join(','));
    
    params.set('page', page);
    params.set('limit', 12);

    const resp = await fetch(`${API_BASE}/productos/busqueda?${params}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const data = await resp.json();
    const { productos, total, totalPages, facetas } = data;

    // Actualizar barra de filtros en el DOM (dinámica)
    renderFiltrosDinamicos(facetas, checkedBrands, checkedProvs);

    // Actualizar contador
    if (countEl) {
      const inicio = ((page - 1) * 12) + 1;
      const fin    = Math.min(page * 12, total);
      countEl.textContent = total > 0
        ? `Mostrando ${inicio}–${fin} de ${total} resultados`
        : 'Sin resultados';
    }

    if (!productos || productos.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--on-surface-variant)">
          <span class="material-icons" style="font-size:3rem">search_off</span>
          <p style="margin-top:1rem;font-size:1.1rem">No se encontraron productos que coincidan con la búsqueda.</p>
          <p style="font-size:0.875rem;margin-top:0.5rem">Intenta desmarcar filtros o expandir el rango de precio.</p>
        </div>
      `;
      return;
    }

    // Renderizar cards
    grid.innerHTML = productos.map(p => renderProductCard(p)).join('');

    // Paginación
    renderPaginacion(page, totalPages);

  } catch (err) {
    console.error('[Search] Error al cargar resultados:', err);
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--error)">
        <span class="material-icons" style="font-size:2.5rem">error_outline</span>
        <p style="margin-top:1rem">Error al conectar con el servidor.</p>
        <p style="font-size:0.875rem;margin-top:0.5rem">¿Está corriendo el backend en <code>localhost:3000</code>?</p>
      </div>
    `;
  }
}

// ── Función: Renderizar filtros laterales dinámicos ──
function renderFiltrosDinamicos(facetas, checkedBrands, checkedProvs) {
  if (!facetas) return;

  // Renderizar Marcas
  const containerMarcas = document.getElementById('filter-options-marcas');
  if (containerMarcas) {
    const list = Object.entries(facetas.marcas || {}).sort((a, b) => b[1] - a[1]);
    if (list.length === 0) {
      containerMarcas.innerHTML = '<div class="text-muted" style="font-size:0.75rem;padding:4px">Sin marcas disponibles</div>';
    } else {
      containerMarcas.innerHTML = list.map(([nombre, total]) => {
        const isChecked = checkedBrands.includes(nombre);
        return `
          <label class="filter-option">
            <input type="checkbox" value="${escapeHtml(nombre)}" ${isChecked ? 'checked' : ''}>
            <span>${escapeHtml(nombre)}</span>
            <span class="filter-count">${total}</span>
          </label>
        `;
      }).join('');
      
      // Listener reactivo para recargar resultados automáticamente
      containerMarcas.querySelectorAll('input').forEach(cb => {
        cb.addEventListener('change', () => cargarResultados(1));
      });
    }
  }

  // Renderizar Proveedores (Tiendas)
  const containerProvs = document.getElementById('filter-options-proveedores');
  if (containerProvs) {
    const list = Object.entries(facetas.proveedores || {}).sort((a, b) => b[1] - a[1]);
    if (list.length === 0) {
      containerProvs.innerHTML = '<div class="text-muted" style="font-size:0.75rem;padding:4px">Sin tiendas disponibles</div>';
    } else {
      containerProvs.innerHTML = list.map(([nombre, total]) => {
        const isChecked = checkedProvs.includes(nombre);
        return `
          <label class="filter-option">
            <input type="checkbox" value="${escapeHtml(nombre)}" ${isChecked ? 'checked' : ''}>
            <span>${escapeHtml(nombre)}</span>
            <span class="filter-count">${total}</span>
          </label>
        `;
      }).join('');

      containerProvs.querySelectorAll('input').forEach(cb => {
        cb.addEventListener('change', () => cargarResultados(1));
      });
    }
  }
}

// ── Renderizar una card de producto ──
function renderProductCard(p) {
  const cantPrecios  = p.precios?.length || 0;
  const mejorPrecio  = p.precios?.[0]; // Al estar ordenados asc por el backend
  const precio       = mejorPrecio?.precio;
  const proveedor    = mejorPrecio?.proveedor?.nombre || 'Proveedor';
  const categoria    = p.categoria?.nombre || 'Materiales';
  const precioFmt    = precio ? formatPrice(precio) : '—';
  const emoji        = getCategoryEmoji(categoria);

  // Generar un badge dinámico según cuantas tiendas tengan el producto
  let badgeHTML = `<span class="badge badge-info">1 tienda</span>`;
  if (cantPrecios > 1) {
    badgeHTML = `<span class="badge badge-success" style="background:var(--success-container);color:var(--on-success-container)">${cantPrecios} tiendas</span>`;
  }

  return `
    <div class="search-product-card" id="sp-${p.id}">
      <div class="spc-badges">
        ${badgeHTML}
      </div>
      <div class="spc-thumb" style="background: white; display: flex; align-items: center; justify-content: center; padding: 8px;">
        ${p.imagen ? `<img src="${p.imagen}" alt="${escapeHtml(p.nombre)}" style="max-width:100%; max-height:120px; object-fit:contain;">` : `<span style="font-size:3rem">${emoji}</span>`}
      </div>
      <div class="spc-body">
        <div class="spc-category text-muted" style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em">
          ${categoria}
        </div>
        <h3 class="spc-name" style="min-height: 42px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
          <a href="product.html?id=${p.id}" title="${escapeHtml(p.nombre)}">${escapeHtml(p.nombre)}</a>
        </h3>
        <div class="spc-meta" style="margin-top: 8px; display:flex; flex-wrap:wrap; gap:4px;">
          ${p.marca ? `<span class="category-chip" style="font-size:0.7rem; background:var(--secondary-container); color:var(--on-secondary-container)">${escapeHtml(p.marca)}</span>` : ''}
          <span class="category-chip" style="font-size:0.7rem">${escapeHtml(proveedor)}</span>
        </div>
        <div class="spc-price-row" style="margin-top:12px; border-top:1px dashed var(--outline-variant); padding-top:8px;">
          <div>
            <div class="text-muted" style="font-size:0.75rem">Desde</div>
            <div class="price-main md price-best">${precioFmt}</div>
          </div>
        </div>
        <a href="product.html?id=${p.id}" class="btn btn-primary" style="width:100%;justify-content:center;margin-top:12px;">
          <span class="material-icons" style="font-size:1.1rem;margin-right:4px;">compare_arrows</span> Ver comparación
        </a>
      </div>
    </div>
  `;
}

// ── Renderizar paginación ──
function renderPaginacion(paginaActual, totalPages) {
  const wrap = document.getElementById('pagination');
  if (!wrap || totalPages <= 1) {
    if (wrap) wrap.style.display = 'none';
    return;
  }

  let html = `
    <button class="page-btn" ${paginaActual <= 1 ? 'disabled' : ''} id="prev-page" onclick="cambiarPagina(${paginaActual - 1})">
      <span class="material-icons">chevron_left</span>
    </button>
  `;

  for (let i = 1; i <= Math.min(totalPages, 5); i++) {
    html += `<button class="page-btn ${i === paginaActual ? 'active' : ''}" onclick="cambiarPagina(${i})">${i}</button>`;
  }

  if (totalPages > 5) {
    html += `<span class="page-ellipsis">…</span>
             <button class="page-btn" onclick="cambiarPagina(${totalPages})">${totalPages}</button>`;
  }

  html += `
    <button class="page-btn" ${paginaActual >= totalPages ? 'disabled' : ''} id="next-page" onclick="cambiarPagina(${paginaActual + 1})">
      <span class="material-icons">chevron_right</span>
    </button>
  `;

  wrap.innerHTML = html;
  wrap.style.display = 'flex';
}

window.cambiarPagina = (p) => cargarResultados(p);

// ── Helpers ──
function getCategoryEmoji(cat = '') {
  const c = cat.toLowerCase();
  if (c.includes('herramienta') || c.includes('electric')) return '⚡';
  if (c.includes('estructural') || c.includes('cemento'))  return '🏗️';
  if (c.includes('fijaci') || c.includes('tornill'))       return '🔩';
  if (c.includes('pintura') || c.includes('revestim'))     return '🎨';
  return '🔧';
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
