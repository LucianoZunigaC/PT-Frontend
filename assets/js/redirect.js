/* redirect.js — Página de Redirección */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const provider = getParam('provider') || 'Proveedor';
  const product  = getParam('product')  || '';
  const price    = getParam('price')    || '';

  // Mapa de nombres amigables de proveedores
  const PROVIDER_NAMES = {
    sodimac:    'Sodimac',
    easy:       'Easy',
    construmart:'Construmart',
    homedepot:  'HomeDepot Professional',
    imperial:   'Imperial Ferretería',
  };
  const providerDisplay = PROVIDER_NAMES[provider.toLowerCase()] || provider;

  // Actualizar textos dinámicos
  const els = {
    title:   document.getElementById('provider-name'),
    btn:     document.getElementById('provider-btn-name'),
    legal:   document.getElementById('provider-legal-name'),
  };
  Object.values(els).forEach(el => { if (el) el.textContent = providerDisplay; });

  if (price) {
    const el = document.getElementById('product-price');
    if (el) el.textContent = formatPrice(price);
  }

  // URL destino (en producción vendría del backend)
  const PROVIDER_URLS = {
    sodimac:    'https://www.sodimac.cl',
    easy:       'https://www.easy.cl',
    construmart:'https://www.construmart.cl',
    homedepot:  'https://www.homedepot.cl',
    imperial:   'https://www.imperial.cl',
  };
  const destinationUrl = PROVIDER_URLS[provider.toLowerCase()] || '#';

  const gotoBtn = document.getElementById('goto-now-btn');
  if (gotoBtn) gotoBtn.setAttribute('href', destinationUrl);

  // Countdown y redirección automática
  let seconds = 5;
  const countdownEl = document.getElementById('countdown');
  const timer = setInterval(() => {
    seconds--;
    if (countdownEl) countdownEl.textContent = seconds;
    if (seconds <= 0) {
      clearInterval(timer);
      window.location.href = destinationUrl;
    }
  }, 1000);

  // Cancelar redirección
  document.getElementById('cancel-btn')?.addEventListener('click', (e) => {
    clearInterval(timer);
    if (countdownEl) countdownEl.textContent = '—';
  });
});
