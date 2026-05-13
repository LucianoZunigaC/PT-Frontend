/* product.js — Ficha de Producto — Conectado a API real */
'use strict';

// ── Configuración ──
const API_BASE = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', async () => {
  const productId = getParam('id');

  if (!productId) {
    mostrarError('No se especificó un producto.');
    return;
  }

  await cargarProducto(productId);

  // Tooltip en chart bars
  document.querySelectorAll('.chart-bar').forEach(bar => {
    const title = bar.getAttribute('title') || '';
    bar.addEventListener('mouseenter', () => {
      const tooltip = document.createElement('div');
      tooltip.className = 'chart-tooltip';
      tooltip.textContent = title;
      tooltip.style.cssText = `
        position:fixed; background:var(--inverse-surface); color:#eceff1;
        padding:4px 10px; border-radius:4px; font-size:0.75rem; pointer-events:none;
        z-index:9999; white-space:nowrap;
      `;
      document.body.appendChild(tooltip);
      bar._tooltip = tooltip;
      bar.addEventListener('mousemove', e => {
        tooltip.style.left = (e.clientX + 12) + 'px';
        tooltip.style.top  = (e.clientY - 28) + 'px';
      });
    });
    bar.addEventListener('mouseleave', () => {
      if (bar._tooltip) { bar._tooltip.remove(); bar._tooltip = null; }
    });
  });
});

// ── Cargar datos del producto desde el backend ──
async function cargarProducto(id) {
  try {
    // Carga paralela: producto + historial
    const [respProducto, respHistorial] = await Promise.all([
      fetch(`${API_BASE}/productos/${id}`),
      fetch(`${API_BASE}/productos/${id}/historial?dias=30`),
    ]);

    if (!respProducto.ok) {
      if (respProducto.status === 404) {
        mostrarError('Producto no encontrado.');
        return;
      }
      throw new Error(`HTTP ${respProducto.status}`);
    }

    const producto  = await respProducto.json();
    const historial = respHistorial.ok ? await respHistorial.json() : null;

    // Renderizar datos del producto
    renderProducto(producto);

    // Renderizar historial si hay datos
    if (historial) {
      renderHistorial(historial);
    }

  } catch (err) {
    console.error('[Product] Error al cargar producto:', err);
    mostrarError('Error al conectar con el servidor. ¿Está corriendo el backend en localhost:3000?');
  }
}

// ── Renderizar los datos del producto en el DOM ──
function renderProducto(producto) {
  // Título
  const titleEl = document.getElementById('product-name');
  if (titleEl) titleEl.textContent = producto.nombre;
  document.title = `${producto.nombre} — ConstructCompare`;

  // Imagen
  const imgEl = document.getElementById('product-image');
  const emojiEl = document.getElementById('product-emoji');
  if (producto.imagen && imgEl) {
    imgEl.src = producto.imagen;
    imgEl.style.display = 'block';
    if (emojiEl) emojiEl.style.display = 'none';
  } else if (emojiEl) {
    emojiEl.style.display = 'flex';
  }

  // Actualizar meta description
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', `Compara precios de ${producto.nombre} en las principales tiendas de Chile.`);

  // Badges
  const badgesEl = document.querySelector('.product-badges');
  if (badgesEl) {
    badgesEl.innerHTML = `
      ${producto.cantidad_tiendas > 0 ? `<span class="badge badge-success">Mejor precio disponible</span>` : ''}
      ${producto.cantidad_tiendas > 0 ? `<span class="badge badge-info">${producto.cantidad_tiendas} ${producto.cantidad_tiendas === 1 ? 'tienda' : 'tiendas'}</span>` : ''}
    `;
  }

  // Categoria y marca en specs
  const marcaRow = document.querySelector('.specs-table td:last-child');

  // Mejor precio
  if (producto.precio_minimo) {
    const precioMejor = document.querySelector('.price-best-value .price-main');
    if (precioMejor) precioMejor.textContent = formatPrice(producto.precio_minimo);
  }

  // Proveedor con mejor precio
  const mejorPrecio = producto.precios?.[0];
  if (mejorPrecio) {
    const provNombre   = mejorPrecio.proveedor?.nombre || 'Tienda';
    const storeEl      = document.querySelector('.price-best-store strong');
    if (storeEl) storeEl.textContent = provNombre;

    // Botón ir al proveedor
    const gotoBtn = document.getElementById('goto-best-price');
    if (gotoBtn) {
      const urlParams = new URLSearchParams({
        producto_id:  producto.id,
        proveedor_id: mejorPrecio.proveedor?.id || '',
        price:        mejorPrecio.precio,
        provider:     provNombre,
        product:      producto.nombre,
        image:        producto.imagen || '',
      });
      gotoBtn.setAttribute('href', `redirect.html?${urlParams}`);
      gotoBtn.innerHTML = `<span class="material-icons">open_in_new</span> Ir a ${provNombre}`;
    }
  }

  // Tabla de precios por proveedor
  const tbody = document.querySelector('#price-table tbody');
  if (tbody && producto.precios?.length > 0) {
    tbody.innerHTML = producto.precios.map((pr, idx) => {
      const esMejor   = idx === 0;
      const provNombre = pr.proveedor?.nombre || 'Tienda';
      const urlParams = new URLSearchParams({
        producto_id:  producto.id,
        proveedor_id: pr.proveedor?.id || '',
        price:        pr.precio,
        provider:     provNombre,
        product:      producto.nombre,
        image:        producto.imagen || '',
      });
      const fecha = new Date(pr.fecha_actualizacion).toLocaleString('es-CL', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
      });

      return `
        <tr class="${esMejor ? 'best-row' : ''}">
          <td>
            <div class="provider-cell">
              <span class="provider-logo">🏪</span>
              <div>
                <span class="provider-name">${escapeHtml(provNombre)}</span>
                ${esMejor ? '<span class="badge badge-success" style="margin-left:4px">Mejor precio</span>' : ''}
              </div>
            </div>
          </td>
          <td>
            <span class="price-main md ${esMejor ? 'price-best' : idx === producto.precios.length - 1 ? 'price-worst' : ''}">
              ${formatPrice(pr.precio)}
            </span>
          </td>
          <td><span class="badge badge-success">Disponible</span></td>
          <td class="text-muted font-mono" style="font-size:0.8rem">${fecha}</td>
          <td>
            <a href="redirect.html?${urlParams}"
               class="btn ${esMejor ? 'btn-primary' : 'btn-secondary'} btn-sm"
               onclick="registrarRedireccion('${producto.id}', '${pr.proveedor?.id || ''}')">
              Ir al sitio
            </a>
          </td>
        </tr>
      `;
    }).join('');
  } else if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;padding:2rem;color:var(--on-surface-variant)">
          No hay precios disponibles aún. Ejecuta el scraper para poblar datos.
        </td>
      </tr>
    `;
  }
}

// ── Renderizar historial de precios ──
function renderHistorial(data) {
  const { historial, stats } = data;

  // Stats del período
  if (stats) {
    const minEl  = document.querySelector('.history-stat:nth-child(1) .price-main');
    const maxEl  = document.querySelector('.history-stat:nth-child(2) .price-main');
    const avgEl  = document.querySelector('.history-stat:nth-child(3) .price-main');
    if (minEl)  minEl.textContent  = formatPrice(stats.minimo);
    if (maxEl)  maxEl.textContent  = formatPrice(stats.maximo);
    if (avgEl)  avgEl.textContent  = formatPrice(stats.promedio);
  }

  // Chart de barras
  const chartBars = document.getElementById('chart-bars');
  if (chartBars && historial?.length > 0) {
    const maxPrecio = Math.max(...historial.map(d => d.precio_maximo));
    const ultimos   = historial.slice(-7); // Mostrar últimos 7 días

    chartBars.innerHTML = ultimos.map((d, idx) => {
      const altura  = Math.round((d.precio_minimo / maxPrecio) * 100);
      const esHoy   = idx === ultimos.length - 1;
      const tooltip = `${formatPrice(d.precio_minimo)} — ${d.fecha}`;
      return `<div class="chart-bar ${esHoy ? 'active' : ''}" style="height:${altura}%" title="${tooltip}"></div>`;
    }).join('');

    // Labels
    const labelsEl = chartBars.parentElement?.querySelector('.chart-labels');
    if (labelsEl) {
      labelsEl.innerHTML = ultimos.map((d, idx) => {
        const esHoy = idx === ultimos.length - 1;
        return `<span>${esHoy ? 'Hoy' : `-${ultimos.length - 1 - idx}d`}</span>`;
      }).join('');
    }
  }
}

// ── Registrar click al proveedor ──
window.registrarRedireccion = async (productoId, proveedorId) => {
  try {
    await fetch(`${API_BASE}/redirecciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ producto_id: productoId, proveedor_id: proveedorId }),
    });
  } catch (e) {
    // Silencioso — no interrumpir la navegación
  }
};

// ── Mostrar error en la página ──
function mostrarError(msg) {
  const container = document.getElementById('product-page');
  if (container) {
    container.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:4rem;color:var(--on-surface-variant)">
        <span class="material-icons" style="font-size:3rem">error_outline</span>
        <p style="margin-top:1rem;font-size:1.1rem">${msg}</p>
        <a href="search.html" class="btn btn-secondary" style="margin-top:1rem">Volver a búsqueda</a>
      </div>
    `;
  }
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
