/* redirect.js — Página de Redirección — Conectado al Backend Real */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const provider  = getParam('provider')  || 'Proveedor';
  const productId = getParam('product')   || '';
  const price     = getParam('price')     || '';
  const directUrl = getParam('url')       || ''; // URL directa pasada como parámetro

  // Mapa de nombres amigables de proveedores
  const PROVIDER_NAMES = {
    sodimac:     'Sodimac',
    easy:        'Easy',
    construmart: 'Construmart',
    homedepot:   'HomeDepot Professional',
    imperial:    'Imperial Ferretería',
    mercadolibre:'MercadoLibre',
  };

  // URLs de homepage (fallback si no hay link directo del producto)
  const PROVIDER_URLS = {
    sodimac:     'https://www.sodimac.cl',
    easy:        'https://www.easy.cl',
    construmart: 'https://www.construmart.cl',
    homedepot:   'https://www.homedepot.cl',
    imperial:    'https://www.imperial.cl',
    mercadolibre:'https://www.mercadolibre.cl',
  };

  const providerKey     = provider.toLowerCase().replace(/\s+/g, '');
  const providerDisplay = PROVIDER_NAMES[providerKey] || provider;

  // Actualizar textos dinámicos
  const els = {
    title:  document.getElementById('provider-name'),
    btn:    document.getElementById('provider-btn-name'),
    legal:  document.getElementById('provider-legal-name'),
  };
  Object.values(els).forEach(el => { if (el) el.textContent = providerDisplay; });

  if (price) {
    const el = document.getElementById('product-price');
    if (el) el.textContent = formatPrice(price);
  }

  // ── Determinar URL de destino ─────────────────────────────────────────────
  // Prioridad: 1) URL directa del link del producto, 2) API de redirecciones, 3) homepage del proveedor
  let destinationUrl = directUrl || PROVIDER_URLS[providerKey] || '#';

  const gotoBtn = document.getElementById('goto-now-btn');
  if (gotoBtn) gotoBtn.setAttribute('href', destinationUrl);

  // Si hay URL directa, registrar la redirección en el backend para estadísticas
  if (directUrl && productId) {
    fetch(`${API_BASE}/redirecciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        producto_id: productId,
        proveedor:   providerDisplay,
        url:         directUrl,
        precio:      price ? Number(price) : null,
      }),
    }).catch(() => { /* No bloquear si falla el registro */ });
  }

  // ── Countdown y redirección automática ───────────────────────────────────
  let seconds    = 5;
  const countdownEl = document.getElementById('countdown');
  const timer = setInterval(() => {
    seconds--;
    if (countdownEl) countdownEl.textContent = seconds;
    if (seconds <= 0) {
      clearInterval(timer);
      if (destinationUrl && destinationUrl !== '#') {
        window.location.href = destinationUrl;
      }
    }
  }, 1000);

  // Cancelar redirección
  document.getElementById('cancel-btn')?.addEventListener('click', () => {
    clearInterval(timer);
    if (countdownEl) countdownEl.textContent = '—';
    const cancelMsg = document.getElementById('cancel-msg');
    if (cancelMsg) cancelMsg.style.display = 'block';
  });
});
