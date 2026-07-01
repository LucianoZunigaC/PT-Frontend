/* home.js — Página Principal — Conectado al Backend Real */
'use strict';

document.addEventListener('DOMContentLoaded', () => {

  // ── 1. Foco automático al input del hero ────────────────────────────────────
  const heroInput = document.getElementById('hero-main-input');
  if (heroInput) setTimeout(() => heroInput.focus(), 400);

  // ── 2. Animación de entrada de las cards ────────────────────────────────────
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.category-card, .how-step').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = `opacity 0.4s ease ${i * 0.08}s, transform 0.4s ease ${i * 0.08}s`;
    observer.observe(el);
  });

  // ── 3. Cargar productos destacados (real) ────────────────────────────────────
  const featuredGrid = document.getElementById('featured-products');
  if (featuredGrid) {
    featuredGrid.innerHTML = `
      <div style="text-align:center;width:100%;padding:40px;grid-column:1/-1;">
        <span class="material-icons" style="font-size:36px;color:var(--primary);animation:spin 1s linear infinite">refresh</span>
      </div>`;

    fetch(`${API_BASE}/productos/destacados?limit=4`, { signal: AbortSignal.timeout(10000) })
      .then(r => r.json())
      .then(products => {
        if (!Array.isArray(products) || products.length === 0) {
          // Fallback: mostrar cards de ejemplo si no hay datos
          featuredGrid.innerHTML = getFallbackFeaturedCards();
          animateCards(featuredGrid);
          return;
        }

        featuredGrid.innerHTML = products.map(p => {
          const min = p.precio_minimo ? Number(p.precio_minimo) : null;
          const max = p.precio_maximo ? Number(p.precio_maximo) : null;
          const stores = p.precios?.length || 0;
          const savingPct = (max && min && max > min)
            ? Math.round(((max - min) / max) * 100) : 0;

          return `
            <div class="product-card">
              <div class="product-card-header">
                ${savingPct >= 5 ? `<span class="badge badge-success">↓ -${savingPct}%</span>` : ''}
                ${p.categoria?.nombre ? `<span class="badge badge-secondary">${p.categoria.nombre}</span>` : ''}
              </div>
              <div class="product-thumb">
                ${p.imagen
                  ? `<img src="${p.imagen}" alt="${p.nombre}" style="width:100%;height:80px;object-fit:contain;" loading="lazy" onerror="this.style.display='none';this.insertAdjacentHTML('afterend','<span>📦</span>')" />`
                  : '📦'}
              </div>
              <h4 class="product-name">${p.nombre}</h4>
              <div class="product-providers">
                <span class="text-muted" style="font-size:0.8rem">
                  ${stores > 0 ? `Disponible en ${stores} tienda${stores !== 1 ? 's' : ''}` : 'Sin precios'}
                </span>
              </div>
              <div class="product-price-range">
                <span class="price-main md price-best">${min ? formatPrice(min) : '—'}</span>
                ${max && max > min ? `<span class="price-sub">— ${formatPrice(max)}</span>` : ''}
              </div>
              <a href="pages/product.html?id=${p.id}" class="btn btn-primary" style="width:100%;justify-content:center;margin-top:var(--space-sm)">
                Ver comparativa
              </a>
            </div>`;
        }).join('');

        animateCards(featuredGrid);
      })
      .catch(() => {
        featuredGrid.innerHTML = getFallbackFeaturedCards();
        animateCards(featuredGrid);
      });
  }

  // ── 4. Cargar índice de precios (real) ───────────────────────────────────────
  const priceIndexTable = document.getElementById('price-index-table');
  if (priceIndexTable) {
    const tbody = priceIndexTable.querySelector('tbody');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px">
        <span class="material-icons" style="animation:spin 1s linear infinite;font-size:20px;color:var(--primary)">refresh</span>
        Cargando índice…</td></tr>`;

      fetch(`${API_BASE}/productos/indice?limit=8`, { signal: AbortSignal.timeout(10000) })
        .then(r => r.json())
        .then(items => {
          if (!Array.isArray(items) || items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--on-surface-variant)">Sin datos disponibles aún</td></tr>`;
            return;
          }

          tbody.innerHTML = items.map(item => {
            const min    = formatPrice(item.precio_minimo);
            const max    = formatPrice(item.precio_maximo);
            const cat    = item.categoria?.nombre || 'General';
            const stores = item.cantidad_tiendas || 0;

            return `
              <tr>
                <td class="font-mono" style="font-weight:600">${item.nombre}</td>
                <td><span class="badge badge-secondary">${cat}</span></td>
                <td class="price-best font-mono">${min}</td>
                <td class="font-mono">${max}</td>
                <td><span style="color:var(--on-surface-variant)">—</span></td>
                <td>${stores}</td>
                <td><a href="pages/product.html?id=${item.id}" class="btn btn-sm btn-secondary">Comparar</a></td>
              </tr>`;
          }).join('');
        })
        .catch(() => {
          tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:16px;color:var(--on-surface-variant)">No se pudo cargar el índice</td></tr>`;
        });
    }
  }

  // ── 5. Sugerencias en la barra hero ─────────────────────────────────────────
  if (heroInput) {
    let suggestionBox = null;
    const fetchSuggestions = debounce(async (val) => {
      if (val.length < 2) { suggestionBox?.remove(); suggestionBox = null; return; }
      try {
        const res  = await fetch(`${API_BASE}/productos/sugerencias?q=${encodeURIComponent(val)}&limit=6`);
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) { suggestionBox?.remove(); suggestionBox = null; return; }

        if (!suggestionBox) {
          suggestionBox = document.createElement('ul');
          suggestionBox.className = 'search-suggestions';
          heroInput.parentNode.style.position = 'relative';
          heroInput.parentNode.appendChild(suggestionBox);
        }
        suggestionBox.innerHTML = data.map(s =>
          `<li data-value="${s}"><span class="material-icons" style="font-size:14px;opacity:0.6">search</span> ${s}</li>`
        ).join('');
        suggestionBox.querySelectorAll('li').forEach(li => {
          li.addEventListener('click', () => {
            window.location.href = `pages/search.html?q=${encodeURIComponent(li.dataset.value)}`;
          });
        });
      } catch { /* silenciar */ }
    }, 300);

    heroInput.addEventListener('input', (e) => fetchSuggestions(e.target.value));
    document.addEventListener('click', (e) => {
      if (!heroInput.contains(e.target)) { suggestionBox?.remove(); suggestionBox = null; }
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const animateCards = (container) => {
    container.querySelectorAll('.product-card').forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = `opacity 0.4s ease ${i * 0.1}s, transform 0.4s ease ${i * 0.1}s`;
      requestAnimationFrame(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
    });
  };

  const getFallbackFeaturedCards = () => `
    <div class="product-card">
      <div class="product-card-header"><span class="badge badge-secondary">Estructurales</span></div>
      <div class="product-thumb">🧱</div>
      <h4 class="product-name">Cemento Portland 25kg</h4>
      <div class="product-providers"><span class="text-muted" style="font-size:0.8rem">Múltiples tiendas</span></div>
      <a href="pages/search.html?q=cemento" class="btn btn-primary" style="width:100%;justify-content:center;margin-top:var(--space-sm)">Ver precios</a>
    </div>
    <div class="product-card">
      <div class="product-card-header"><span class="badge badge-secondary">Herramientas</span></div>
      <div class="product-thumb">⚡</div>
      <h4 class="product-name">Taladro Percutor</h4>
      <div class="product-providers"><span class="text-muted" style="font-size:0.8rem">Múltiples marcas</span></div>
      <a href="pages/search.html?q=taladro" class="btn btn-primary" style="width:100%;justify-content:center;margin-top:var(--space-sm)">Ver precios</a>
    </div>
    <div class="product-card">
      <div class="product-card-header"><span class="badge badge-secondary">Estructurales</span></div>
      <div class="product-thumb">⚙️</div>
      <h4 class="product-name">Varilla Corrugada 12mm</h4>
      <div class="product-providers"><span class="text-muted" style="font-size:0.8rem">Comparar tiendas</span></div>
      <a href="pages/search.html?q=varilla+corrugada" class="btn btn-primary" style="width:100%;justify-content:center;margin-top:var(--space-sm)">Ver precios</a>
    </div>
    <div class="product-card">
      <div class="product-card-header"><span class="badge badge-secondary">Pinturas</span></div>
      <div class="product-thumb">🎨</div>
      <h4 class="product-name">Pintura Látex Interior</h4>
      <div class="product-providers"><span class="text-muted" style="font-size:0.8rem">Múltiples tiendas</span></div>
      <a href="pages/search.html?q=pintura+latex" class="btn btn-primary" style="width:100%;justify-content:center;margin-top:var(--space-sm)">Ver precios</a>
    </div>`;
});
