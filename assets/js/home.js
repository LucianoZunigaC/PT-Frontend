/* home.js — Página principal — Con carga dinámica desde API */
'use strict';

// ── Configuración ──
const API_BASE = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', async () => {
  // Foco automático al input del hero
  const heroInput = document.getElementById('hero-main-input');
  if (heroInput) setTimeout(() => heroInput.focus(), 400);

  // Animación de entrada para cards
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.category-card, .product-card, .how-step').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = `opacity 0.4s ease ${i * 0.08}s, transform 0.4s ease ${i * 0.08}s`;
    observer.observe(el);
  });

  // Cargar datos dinámicos del backend (en paralelo, sin bloquear la UI)
  cargarProductosDestacados();
  cargarIndicePrecios();
  cargarAutocomplete();
});

// ── Autocompletado de la barra de búsqueda del hero ──
function cargarAutocomplete() {
  const inputs = [
    document.getElementById('hero-main-input'),
    document.getElementById('navbar-search-input'),
  ].filter(Boolean);

  inputs.forEach(input => {
    let timer;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      const q = input.value.trim();
      if (q.length < 2) return;
      timer = setTimeout(async () => {
        try {
          const resp = await fetch(`${API_BASE}/productos/sugerencias?q=${encodeURIComponent(q)}&limit=5`);
          if (!resp.ok) return;
          const sugerencias = await resp.json();
          mostrarSugerencias(input, sugerencias);
        } catch (e) { /* backend offline */ }
      }, 300);
    });

    input.addEventListener('blur', () => {
      setTimeout(() => ocultarSugerencias(input), 200);
    });
  });
}

function mostrarSugerencias(input, sugerencias) {
  ocultarSugerencias(input);
  if (!sugerencias.length) return;

  const wrapper = input.parentElement || input.closest('form') || input;
  const dropdown = document.createElement('ul');
  dropdown.className = 'autocomplete-dropdown';
  dropdown.style.cssText = `
    position:absolute; top:100%; left:0; right:0; z-index:9999;
    background:var(--surface); border:1px solid var(--outline-variant);
    border-radius:var(--radius-sm); box-shadow:var(--shadow-md);
    list-style:none; margin:4px 0; padding:4px 0; max-height:200px; overflow-y:auto;
  `;

  sugerencias.forEach(s => {
    const li = document.createElement('li');
    li.textContent = s;
    li.style.cssText = `
      padding:8px 16px; cursor:pointer; font-size:0.9rem;
      color:var(--on-surface); transition:background 0.15s;
    `;
    li.addEventListener('mouseover', () => li.style.background = 'var(--surface-variant)');
    li.addEventListener('mouseout', () => li.style.background = '');
    li.addEventListener('mousedown', () => {
      input.value = s;
      ocultarSugerencias(input);
      input.form?.submit();
    });
    dropdown.appendChild(li);
  });

  const relative = input.closest('.hero-search-input-wrap') || input.closest('form') || input.parentElement;
  if (relative) {
    relative.style.position = 'relative';
    relative.appendChild(dropdown);
    input._dropdown = dropdown;
  }
}

function ocultarSugerencias(input) {
  if (input._dropdown) {
    input._dropdown.remove();
    input._dropdown = null;
  }
}

// ── Cargar productos destacados ──
async function cargarProductosDestacados() {
  const grid = document.getElementById('featured-products');
  if (!grid) return;

  try {
    const resp = await fetch(`${API_BASE}/productos/destacados?limit=4`);
    if (!resp.ok) return; // Mantener datos estáticos si falla

    const productos = await resp.json();
    if (!productos.length) return;

    grid.innerHTML = productos.map((p, idx) => {
      const emoji = getCategoryEmoji(p.categoria?.nombre);
      const precioMin = p.precio_minimo ? formatPrice(p.precio_minimo) : '—';
      const precioMax = p.precio_maximo && p.precio_maximo !== p.precio_minimo
        ? `— ${formatPrice(p.precio_maximo)}` : '';
      const prov = p.proveedor?.nombre || 'Varias tiendas';

      return `
        <div class="product-card" id="prod-dyn-${p.id}">
          <div class="product-card-header">
            ${p.ahorro_potencial > 0 ? `<span class="badge badge-success">↓ Ahorro ${formatPrice(p.ahorro_potencial)}</span>` : ''}
            ${p.categoria ? `<span class="badge badge-secondary">${p.categoria.nombre}</span>` : ''}
          </div>
          <div class="product-thumb">
            ${p.imagen ? `<img src="${p.imagen}" alt="${escapeHtml(p.nombre)}" style="width:100%; height:100%; object-fit:contain; max-height:80px;">` : emoji}
          </div>
          <h4 class="product-name">${escapeHtml(p.nombre)}</h4>
          <div class="product-providers">
            <span class="text-muted" style="font-size:0.8rem">${prov}</span>
          </div>
          <div class="product-price-range">
            <span class="price-main md price-best">${precioMin}</span>
            ${precioMax ? `<span class="price-sub">${precioMax}</span>` : ''}
          </div>
          <a href="pages/product.html?id=${p.id}" class="btn btn-primary" style="width:100%;justify-content:center;margin-top:var(--space-sm)">
            Ver comparativa
          </a>
        </div>
      `;
    }).join('');

    // Re-aplicar animaciones
    grid.querySelectorAll('.product-card').forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(16px)';
      el.style.transition = `opacity 0.4s ease ${i * 0.1}s, transform 0.4s ease ${i * 0.1}s`;
      setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, 50);
    });

  } catch (e) {
    // Backend offline — mantener datos estáticos del HTML
  }
}

// ── Cargar índice de precios ──
async function cargarIndicePrecios() {
  const tbody = document.querySelector('#price-index-table tbody');
  if (!tbody) return;

  try {
    const resp = await fetch(`${API_BASE}/productos/indice?limit=8`);
    if (!resp.ok) return; // Mantener datos estáticos si falla

    const indice = await resp.json();
    if (!indice.length) return;

    tbody.innerHTML = indice.map(p => {
      const cat = p.categoria?.nombre || '—';
      const badgeClass = cat.toLowerCase().includes('herramienta') ? 'badge-info' : 'badge-secondary';
      const min = formatPrice(p.precio_minimo);
      const max = formatPrice(p.precio_maximo);
      const fecha = new Date(p.ultima_actualizacion).toLocaleDateString('es-CL');

      return `
        <tr>
          <td class="font-mono" style="font-weight:600">${escapeHtml(p.nombre)}</td>
          <td><span class="badge ${badgeClass}">${escapeHtml(cat)}</span></td>
          <td class="price-best font-mono">${min}</td>
          <td class="font-mono">${max}</td>
          <td><span class="text-muted" style="font-size:0.85rem">${fecha}</span></td>
          <td>${p.cantidad_tiendas}</td>
          <td><a href="pages/product.html?id=${p.id}" class="btn btn-sm btn-secondary">Comparar</a></td>
        </tr>
      `;
    }).join('');

  } catch (e) {
    // Backend offline — mantener datos estáticos
  }
}

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
