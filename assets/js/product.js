/* product.js — Ficha de Producto */
'use strict';

const API_BASE = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', async () => {
  const productId = getParam('id');
  if (!productId) {
    document.getElementById('product-page').innerHTML = '<div style="text-align:center;padding:50px;"><h2>Producto no encontrado</h2><a href="../index.html">Volver al inicio</a></div>';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/productos/${productId}`);
    const producto = await res.json();
    
    if (producto.error) throw new Error(producto.error);

    // Populate metadata
    document.title = `${producto.nombre} — ConstructCompare`;
    const breadcrumb = document.querySelector('.breadcrumb-list li:last-child');
    if (breadcrumb) breadcrumb.textContent = producto.nombre;

    document.getElementById('product-name').textContent = producto.nombre;
    document.querySelector('.product-emoji-large').innerHTML = `<img src="${producto.imagen || 'https://via.placeholder.com/300'}" alt="${producto.nombre}" style="width:100%;max-width:300px;object-fit:contain;" />`;
    
    // Poblar descripción
    const descEl = document.querySelector('.product-description');
    if (descEl) {
      descEl.textContent = producto.descripcion || 'No hay descripción disponible para este producto.';
    }

    // Poblar especificaciones
    const specsTbody = document.querySelector('.specs-table tbody');
    if (specsTbody) {
      if (producto.especificaciones && Object.keys(producto.especificaciones).length > 0) {
        let specsHtml = '';
        for (const [key, val] of Object.entries(producto.especificaciones)) {
          specsHtml += `<tr><td>${key}</td><td class="font-mono">${val}</td></tr>`;
        }
        specsTbody.innerHTML = specsHtml;
      } else {
        specsTbody.innerHTML = '<tr><td colspan="2" class="text-center">No hay especificaciones técnicas registradas.</td></tr>';
      }
    }
    
    const catChip = document.querySelector('.tags-section .category-chip:first-child');
    if (catChip && producto.categoria) catChip.textContent = producto.categoria.nombre;
    
    const brandChip = document.querySelectorAll('.tags-section .category-chip')[1];
    if (brandChip && producto.marca) brandChip.textContent = producto.marca;

    const badgesContainer = document.querySelector('.product-badges');
    if (badgesContainer) {
      badgesContainer.innerHTML = `<span class="badge badge-success">Mejor precio disponible</span><span class="badge badge-info">${producto.cantidad_tiendas} tiendas</span>`;
    }

    // Populate prices
    if (producto.precios && producto.precios.length > 0) {
      const bestPrice = producto.precios[0];
      
      const bestHighlight = document.querySelector('.price-best-value .price-main');
      if (bestHighlight) bestHighlight.textContent = formatPrice(bestPrice.precio);
      
      const bestStore = document.querySelector('.price-best-store strong');
      if (bestStore) bestStore.textContent = bestPrice.proveedor?.nombre || 'Desconocido';

      const gotoBtn = document.getElementById('goto-best-price');
      if (gotoBtn) {
        gotoBtn.href = `redirect.html?product_id=${producto.id}&proveedor_id=${bestPrice.proveedor?.id}&nombre=${encodeURIComponent(bestPrice.proveedor?.nombre)}`;
        gotoBtn.innerHTML = `<span class="material-icons">open_in_new</span> Ir a ${bestPrice.proveedor?.nombre || 'Tienda'}`;
      }

      // Populate table
      const tbody = document.querySelector('#price-table tbody');
      if (tbody) {
        tbody.innerHTML = producto.precios.map((pr, idx) => `
          <tr class="${idx === 0 ? 'best-row' : ''}">
            <td>
              <div class="provider-cell">
                <span class="provider-logo">🏪</span>
                <div>
                  <span class="provider-name">${pr.proveedor?.nombre || 'Tienda'}</span>
                  ${idx === 0 ? '<span class="badge badge-success" style="margin-left:4px">Mejor precio</span>' : ''}
                </div>
              </div>
            </td>
            <td><span class="price-main md ${idx === 0 ? 'price-best' : ''}">${formatPrice(pr.precio)}</span></td>
            <td><span class="badge badge-success">Disponible</span></td>
            <td class="text-muted font-mono" style="font-size:0.8rem">${new Date(pr.fecha_actualizacion).toLocaleString('es-CL')}</td>
            <td>
              <a href="redirect.html?product_id=${producto.id}&proveedor_id=${pr.proveedor?.id}&nombre=${encodeURIComponent(pr.proveedor?.nombre)}"
                 class="btn ${idx === 0 ? 'btn-primary' : 'btn-secondary'} btn-sm">Ir al sitio</a>
            </td>
          </tr>
        `).join('');
      }
    } else {
       // Hide price section if no prices
       document.getElementById('price-comparison').style.display = 'none';
    }

  } catch (err) {
    console.error(err);
    document.getElementById('product-page').innerHTML = `<div style="text-align:center;padding:50px;color:red;"><h2>Error</h2><p>${err.message}</p></div>`;
  }

    // FETCH Y RENDER HISTORIAL DE PRECIOS
    try {
      const histRes = await fetch(`${API_BASE}/productos/${productId}/historial?dias=30`);
      if (histRes.ok) {
        const histData = await histRes.json();
        const chartBarsContainer = document.getElementById('chart-bars');
        const historySummary = document.querySelector('.price-history-summary');

        if (chartBarsContainer && histData.historial && histData.historial.length > 0) {
          const stats = histData.stats;
          const minVal = stats.minimo > 0 ? stats.minimo * 0.9 : 0; // Para el gráfico
          const maxVal = stats.maximo * 1.1 || 1;

          chartBarsContainer.innerHTML = histData.historial.map((h, i) => {
            let heightPct = 100;
            if (maxVal > minVal) {
              heightPct = Math.max(10, ((h.precio_promedio - minVal) / (maxVal - minVal)) * 100);
            }
            return `<div class="chart-bar" style="height:${heightPct}%" title="${formatPrice(h.precio_promedio)} — ${h.fecha}"></div>`;
          }).join('');

          if (historySummary) {
            historySummary.innerHTML = `
              <div class="history-stat">
                <span class="history-stat-label">Mínimo (30d)</span>
                <span class="price-main md price-best">${formatPrice(stats.minimo)}</span>
              </div>
              <div class="history-stat">
                <span class="history-stat-label">Máximo (30d)</span>
                <span class="price-main md price-worst">${formatPrice(stats.maximo)}</span>
              </div>
              <div class="history-stat">
                <span class="history-stat-label">Promedio (30d)</span>
                <span class="price-main md">${formatPrice(stats.promedio)}</span>
              </div>
            `;
          }

          // Animación de las barras del historial al hacer hover
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
              bar.addEventListener('mousemove', (e) => {
                tooltip.style.left = (e.clientX + 12) + 'px';
                tooltip.style.top = (e.clientY - 28) + 'px';
              });
            });
            bar.addEventListener('mouseleave', () => {
              if (bar._tooltip) { bar._tooltip.remove(); bar._tooltip = null; }
            });
          });
        } else {
          document.getElementById('price-history').style.display = 'none';
        }
      }
    } catch (e) {
      console.error("Error cargando historial", e);
      document.getElementById('price-history').style.display = 'none';
    }

  // Confirmar redirección con el mejor precio
  document.getElementById('goto-best-price')?.addEventListener('click', (e) => {
    // Ya no prevenimos default, dejamos que vaya a redirect.html
  });
});
