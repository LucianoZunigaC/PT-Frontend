/* redirect.js — Página de Redirección — Conectado a API real */
'use strict';

// ── Configuración ──
const API_BASE = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', async () => {
  const provider    = getParam('provider')    || 'Proveedor';
  const product     = getParam('product')     || '';
  const price       = getParam('price')       || '';
  const image       = getParam('image')       || '';
  const productoId  = getParam('producto_id') || '';
  const proveedorId = getParam('proveedor_id') || '';

  // Mapa de nombres amigables de proveedores
  const PROVIDER_NAMES = {
    sodimac:    'Sodimac',
    easy:       'Easy',
    construmart:'Construmart',
    homedepot:  'HomeDepot Professional',
    imperial:   'Imperial Ferretería',
    mercadolibre: 'MercadoLibre',
  };
  const providerDisplay = PROVIDER_NAMES[provider.toLowerCase()] || provider;

  // Actualizar textos dinámicos de proveedor
  const els = {
    title: document.getElementById('provider-name'),
    btn:   document.getElementById('provider-btn-name'),
    legal: document.getElementById('provider-legal-name'),
  };
  Object.values(els).forEach(el => { if (el) el.textContent = providerDisplay; });

  // Actualizar información real del producto
  if (product) {
    const nameEl = document.getElementById('product-display-name');
    if (nameEl) nameEl.textContent = product;
  }

  if (price) {
    const el = document.getElementById('product-price');
    if (el) el.textContent = formatPrice(price);
  }

  if (productoId) {
    const skuEl = document.getElementById('product-sku');
    if (skuEl) skuEl.textContent = productoId.substring(0, 8).toUpperCase();
  }

  if (image) {
    const iconEl = document.querySelector('.redirect-product-icon');
    if (iconEl) {
      iconEl.innerHTML = `<img src="${image}" alt="${product}" style="width: 40px; height: 40px; object-fit: contain; background: white; border-radius: 4px;" />`;
    }
  }

  // Obtener URL de destino real desde el backend (si tenemos IDs)
  let destinationUrl = getFallbackUrl(provider);

  if (productoId && proveedorId) {
    try {
      const resp = await fetch(`${API_BASE}/redirecciones/url?producto_id=${productoId}&proveedor_id=${proveedorId}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.url_destino && data.url_destino !== '#') {
          destinationUrl = data.url_destino;
        }
      }
    } catch (e) {
      console.warn('[Redirect] No se pudo obtener URL real, usando fallback:', e.message);
    }

    // Registrar la redirección en el backend (analytics)
    try {
      await fetch(`${API_BASE}/redirecciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ producto_id: productoId, proveedor_id: proveedorId }),
      });
    } catch (e) {
      // Silencioso
    }

    // Cargar y renderizar proveedores alternativos reales
    try {
      const prodResp = await fetch(`${API_BASE}/productos/${productoId}`);
      if (prodResp.ok) {
        const producto = await prodResp.json();
        const preciosOtros = (producto.precios || []).filter(p => p.proveedor?.id !== proveedorId);
        const altListEl = document.querySelector('.alternatives-list');
        const altSection = document.getElementById('redirect-alternatives');

        if (altListEl && altSection) {
          if (preciosOtros.length > 0) {
            altListEl.innerHTML = preciosOtros.map(pr => {
              const provNom = pr.proveedor?.nombre || 'Tienda';
              const params = new URLSearchParams({
                producto_id:  productoId,
                proveedor_id: pr.proveedor?.id || '',
                price:        pr.precio,
                provider:     provNom,
                product:      producto.nombre,
                image:        producto.imagen || '',
              });
              
              // Emoticono o logo tentativo del proveedor
              let emoji = '🏬';
              const nameLower = provNom.toLowerCase();
              if (nameLower.includes('mercado')) emoji = '🤝';
              else if (nameLower.includes('sodimac')) emoji = '🏠';
              else if (nameLower.includes('imperial')) emoji = '🏗️';

              return `
                <a href="redirect.html?${params}" class="alt-provider">
                  <span class="alt-logo">${emoji}</span>
                  <span class="alt-name">${provNom}</span>
                  <span class="price-main" style="font-size:1rem">${formatPrice(pr.precio)}</span>
                </a>
              `;
            }).join('');
            altSection.style.display = 'block';
          } else {
            altSection.style.display = 'none';
          }
        }
      }
    } catch (e) {
      console.warn('[Redirect] Error cargando alternativas:', e.message);
      const altSection = document.getElementById('redirect-alternatives');
      if (altSection) altSection.style.display = 'none';
    }
  } else {
    // Si no hay productoId, ocultamos la sección de alternativas hardcodeadas
    const altSection = document.getElementById('redirect-alternatives');
    if (altSection) altSection.style.display = 'none';
  }

  const gotoBtn = document.getElementById('goto-now-btn');
  if (gotoBtn) gotoBtn.setAttribute('href', destinationUrl);

  // Countdown y redirección automática
  let seconds = 5;
  const countdownEl = document.getElementById('countdown');
  let cancelled = false;

  const timer = setInterval(() => {
    if (cancelled) return;
    seconds--;
    if (countdownEl) countdownEl.textContent = seconds;
    if (seconds <= 0) {
      clearInterval(timer);
      if (!cancelled) window.location.href = destinationUrl;
    }
  }, 1000);

  // Cancelar redirección
  document.getElementById('cancel-btn')?.addEventListener('click', () => {
    cancelled = true;
    clearInterval(timer);
    if (countdownEl) countdownEl.textContent = '—';
  });
});

// ── URL fallback por nombre de proveedor ──
function getFallbackUrl(provider) {
  const PROVIDER_URLS = {
    sodimac:     'https://www.sodimac.cl',
    easy:        'https://www.easy.cl',
    construmart: 'https://www.construmart.cl',
    homedepot:   'https://www.homedepot.cl',
    imperial:    'https://www.imperial.cl',
    mercadolibre:'https://www.mercadolibre.cl',
  };
  return PROVIDER_URLS[provider.toLowerCase()] || '#';
}
