/* product.js — Ficha de Producto — Conectado al Backend Real */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const productId = getParam('id');

  if (!productId) {
    showError('No se especificó un ID de producto.');
    return;
  }

  // ── Skeleton loader ─────────────────────────────────────────────────────────
  const nameEl       = document.getElementById('product-name');
  const pageTitleEl  = document.getElementById('page-title');
  const priceTableEl = document.getElementById('price-table');
  const bestHighEl   = document.querySelector('.price-best-highlight');
  const specsTableEl = document.querySelector('.specs-table tbody');
  const tagsSection  = document.querySelector('.tags-section');
  const descEl       = document.querySelector('.product-description');
  const imgBox       = document.querySelector('.product-image-box');
  const badgesBox    = document.querySelector('.product-badges');
  const chartBarsEl  = document.getElementById('chart-bars');
  const historyStats  = document.querySelectorAll('.history-stat .price-main');

  // ── Cargar datos del producto ────────────────────────────────────────────────
  const loadProduct = async () => {
    try {
      const res  = await fetch(`${API_BASE}/productos/${productId}`, { signal: AbortSignal.timeout(15000) });
      if (res.status === 404) { showError('Producto no encontrado.'); return; }
      if (!res.ok) throw new Error(`Error ${res.status}`);

      const p = await res.json();
      renderProduct(p);
      loadHistorial(productId);

    } catch (err) {
      console.error('[Product] Error cargando producto:', err);
      showError(err.message || 'Error al conectar con el servidor.');
    }
  };

  // ── Renderizar datos del producto ────────────────────────────────────────────
  const renderProduct = (p) => {
    // Título
    const nombre = p.nombre || 'Producto sin nombre';
    if (nameEl) nameEl.textContent = nombre;
    document.title = `${nombre} — MaterialScan`;
    if (pageTitleEl) pageTitleEl.textContent = document.title;

    // Descripción
    if (descEl && p.descripcion) {
      descEl.textContent = p.descripcion;
    } else if (descEl && !p.descripcion) {
      descEl.textContent = `Compara precios de ${nombre} entre múltiples proveedores chilenos.`;
    }

    // Imagen / emoji
    if (imgBox) {
      const prev = imgBox.querySelector('.product-emoji-large');
      if (p.imagen) {
        const img = document.createElement('img');
        img.src   = p.imagen;
        img.alt   = nombre;
        img.style.cssText = 'max-width:100%;max-height:220px;object-fit:contain;border-radius:8px;';
        img.onerror = () => { img.style.display = 'none'; if (prev) prev.style.display = 'block'; };
        if (prev) prev.style.display = 'none';
        imgBox.insertBefore(img, imgBox.firstChild);
      }
    }

    // Badges superiores
    const precios = p.precios || [];
    if (badgesBox) {
      const tiendas = precios.length;
      badgesBox.innerHTML = `
        ${tiendas > 0 ? `<span class="badge badge-success">Mejor precio disponible</span>` : ''}
        ${tiendas > 0 ? `<span class="badge badge-info">${tiendas} tienda${tiendas !== 1 ? 's' : ''}</span>` : ''}
        ${p.marca ? `<span class="badge badge-secondary">${p.marca}</span>` : ''}
      `;
    }

    // Tags / chips
    if (tagsSection) {
      const chips = [];
      if (p.categoria?.nombre) chips.push(p.categoria.nombre);
      if (p.marca) chips.push(p.marca);
      tagsSection.innerHTML = chips.map(c => `<span class="category-chip">${c}</span>`).join('');
    }

    // Especificaciones técnicas
    if (specsTableEl) {
      const specs = p.especificaciones;
      let rows = '';
      if (specs && typeof specs === 'object' && Object.keys(specs).length > 0) {
        for (const [k, v] of Object.entries(specs)) {
          rows += `<tr><td>${k}</td><td class="font-mono">${v}</td></tr>`;
        }
      } else {
        // Fallback con datos básicos del producto
        if (p.id)    rows += `<tr><td>ID</td><td class="font-mono">${p.id}</td></tr>`;
        if (p.marca) rows += `<tr><td>Marca</td><td>${p.marca}</td></tr>`;
        if (p.categoria?.nombre) rows += `<tr><td>Categoría</td><td>${p.categoria.nombre}</td></tr>`;
        if (precios.length > 0) rows += `<tr><td>Proveedores</td><td>${precios.length}</td></tr>`;
        if (!rows) rows = `<tr><td colspan="2" style="color:var(--on-surface-variant);text-align:center">Sin especificaciones disponibles</td></tr>`;
      }
      specsTableEl.innerHTML = rows;
    }

    // Comparativa de precios
    renderPriceComparison(p, precios);
  };

  // ── Renderizar comparativa de precios ────────────────────────────────────────
  const renderPriceComparison = (p, precios) => {
    if (!priceTableEl && !bestHighEl) return;

    if (precios.length === 0) {
      if (bestHighEl) bestHighEl.innerHTML = `
        <div style="text-align:center;padding:24px;color:var(--on-surface-variant)">
          <span class="material-icons">info</span>
          <p>No hay precios disponibles para este producto.</p>
        </div>`;
      return;
    }

    const mejor   = precios[0];
    const peor    = precios[precios.length - 1];
    const minNum  = Number(mejor.precio);
    const maxNum  = Number(peor.precio);

    // Highlight de mejor precio
    if (bestHighEl) {
      const provName = mejor.proveedor?.nombre || 'Proveedor';
      const redirectUrl = `redirect.html?provider=${encodeURIComponent(provName.toLowerCase())}&product=${encodeURIComponent(p.id)}&price=${encodeURIComponent(minNum)}&url=${encodeURIComponent(mejor.link || '')}`;

      bestHighEl.innerHTML = `
        <div class="price-best-label">
          <span class="material-icons" style="color:#2e7d32">verified</span>
          Mejor precio encontrado
        </div>
        <div class="price-best-value">
          <span class="price-main lg price-best">${formatPrice(minNum)}</span>
          <span class="price-sub">IVA incluido</span>
        </div>
        <div class="price-best-store">en <strong>${provName}</strong></div>
        <a href="${redirectUrl}" class="btn btn-primary btn-lg" id="goto-best-price">
          <span class="material-icons">open_in_new</span>
          Ir a ${provName}
        </a>`;
    }

    // Tabla comparativa
    if (priceTableEl) {
      const tbody = priceTableEl.querySelector('tbody');
      if (!tbody) return;

      const providerEmojis = {
        sodimac:     '🟠', easy: '🟢', construmart: '🟡',
        imperial:    '🔵', mercadolibre: '🟣', default: '🏪',
      };

      const rows = precios.map((pr, idx) => {
        const provName = pr.proveedor?.nombre || 'Proveedor';
        const emoji    = providerEmojis[provName.toLowerCase().replace(/\s/g, '')] || providerEmojis.default;
        const precio   = Number(pr.precio);
        const esMejor  = idx === 0;
        const esPeor   = idx === precios.length - 1 && precios.length > 1;
        const fechaStr = pr.fecha_actualizacion
          ? new Date(pr.fecha_actualizacion).toLocaleString('es-CL', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })
          : 'Sin datos';
        const redirectUrl = `redirect.html?provider=${encodeURIComponent(provName.toLowerCase())}&product=${encodeURIComponent(p.id)}&price=${encodeURIComponent(precio)}&url=${encodeURIComponent(pr.link || '')}`;

        return `
          <tr class="${esMejor ? 'best-row' : ''}">
            <td>
              <div class="provider-cell">
                <span class="provider-logo">${emoji}</span>
                <div>
                  <span class="provider-name">${provName}</span>
                  ${esMejor ? '<span class="badge badge-success" style="margin-left:4px">Mejor precio</span>' : ''}
                  ${esPeor  ? '<span class="badge badge-secondary" style="margin-left:4px">Mayor precio</span>' : ''}
                </div>
              </div>
            </td>
            <td>
              <span class="price-main md ${esMejor ? 'price-best' : (esPeor ? 'price-worst' : '')}">
                ${formatPrice(precio)}
              </span>
            </td>
            <td><span class="badge badge-success">Disponible</span></td>
            <td class="text-muted font-mono" style="font-size:0.8rem">${fechaStr}</td>
            <td>
              <a href="${redirectUrl}" class="btn ${esMejor ? 'btn-primary' : 'btn-secondary'} btn-sm">
                Ir al sitio
              </a>
            </td>
          </tr>`;
      });

      tbody.innerHTML = rows.join('');
    }
  };

  // ── Cargar historial de precios ──────────────────────────────────────────────
  const loadHistorial = async (id) => {
    try {
      const res  = await fetch(`${API_BASE}/productos/${id}/historial?dias=30`, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) return;
      const data = await res.json();

      if (data.stats) {
        const statEls = document.querySelectorAll('.history-stat');
        statEls.forEach(el => {
          const label = el.querySelector('.history-stat-label')?.textContent?.toLowerCase() || '';
          const valEl = el.querySelector('.price-main');
          if (!valEl) return;
          if (label.includes('mínimo')) valEl.textContent = formatPrice(data.stats.minimo);
          else if (label.includes('máximo')) valEl.textContent = formatPrice(data.stats.maximo);
          else if (label.includes('promedio')) valEl.textContent = formatPrice(data.stats.promedio);
        });
      }

      if (chartBarsEl && data.historial && data.historial.length > 0) {
        const maxP = Math.max(...data.historial.map(d => d.precio_maximo));
        const minP = Math.min(...data.historial.map(d => d.precio_minimo));
        const range = maxP - minP || 1;
        const recent = data.historial.slice(-12); // max 12 barras

        chartBarsEl.innerHTML = recent.map((d, i) => {
          const height = Math.round(((d.precio_minimo - minP) / range) * 60 + 30);
          const isLast = i === recent.length - 1;
          return `<div class="chart-bar ${isLast ? 'active' : ''}" style="height:${height}%"
            title="${d.fecha}: ${formatPrice(d.precio_minimo)} – ${formatPrice(d.precio_maximo)}"></div>`;
        }).join('');

        // Reactivar tooltips
        chartBarsEl.querySelectorAll('.chart-bar').forEach(bar => {
          const title = bar.getAttribute('title') || '';
          bar.addEventListener('mouseenter', () => {
            const tooltip = document.createElement('div');
            tooltip.className = 'chart-tooltip';
            tooltip.textContent = title;
            tooltip.style.cssText = `position:fixed;background:var(--inverse-surface);color:#eceff1;
              padding:4px 10px;border-radius:4px;font-size:0.75rem;pointer-events:none;z-index:9999;white-space:nowrap;`;
            document.body.appendChild(tooltip);
            bar._tooltip = tooltip;
            bar.addEventListener('mousemove', (e) => {
              tooltip.style.left = (e.clientX + 12) + 'px';
              tooltip.style.top  = (e.clientY - 28) + 'px';
            });
          });
          bar.addEventListener('mouseleave', () => {
            if (bar._tooltip) { bar._tooltip.remove(); bar._tooltip = null; }
          });
        });
      } else if (chartBarsEl && (!data.historial || data.historial.length === 0)) {
        chartBarsEl.innerHTML = `
          <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--on-surface-variant);font-size:0.85rem;">
            Sin historial de precios disponible
          </div>`;
      }
    } catch (err) {
      console.warn('[Product] No se pudo cargar historial:', err.message);
    }
  };

  // ── Confirmación de redirección ─────────────────────────────────────────────
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#goto-best-price');
    if (btn) {
      const href = btn.getAttribute('href');
      if (href && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        window.location.href = href;
      }
    }
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const showError = (msg) => {
    const container = document.getElementById('product-page') || document.body;
    container.innerHTML = `
      <div style="text-align:center;padding:80px 20px;color:var(--error)">
        <span class="material-icons" style="font-size:56px">error_outline</span>
        <h2 style="margin-top:16px">Oops…</h2>
        <p style="color:var(--on-surface-variant);margin-top:8px">${msg}</p>
        <a href="../index.html" class="btn btn-primary" style="margin-top:24px">Volver al inicio</a>
      </div>`;
  };

  // ── Iniciar carga ────────────────────────────────────────────────────────────
  loadProduct();
});
