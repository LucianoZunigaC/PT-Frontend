/* redirect.js — Página de Redirección */
'use strict';

const API_BASE = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', async () => {
  const provider = getParam('provider') || getParam('nombre') || 'Proveedor';
  const productId = getParam('product_id');
  const providerId = getParam('proveedor_id');
  
  const providerDisplay = decodeURIComponent(provider);

  // Actualizar textos dinámicos
  const els = {
    title:   document.getElementById('provider-name'),
    btn:     document.getElementById('provider-btn-name'),
    legal:   document.getElementById('provider-legal-name'),
  };
  Object.values(els).forEach(el => { if (el) el.textContent = providerDisplay; });

  let destinationUrl = '#';

  if (productId && providerId) {
    try {
      // Registrar redirección asíncronamente
      fetch(`${API_BASE}/redirecciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ producto_id: productId, proveedor_id: providerId })
      }).catch(err => console.error('Error registrando redirección:', err));

      // Obtener URL destino real
      const res = await fetch(`${API_BASE}/redirecciones/url?producto_id=${productId}&proveedor_id=${providerId}`);
      const data = await res.json();
      
      if (!data.error && data.url_destino) {
        destinationUrl = data.url_destino;
      }
    } catch (err) {
      console.error('Error obteniendo URL:', err);
    }
  }

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
      if (destinationUrl !== '#') {
        window.location.href = destinationUrl;
      }
    }
  }, 1000);

  // Cancelar redirección
  document.getElementById('cancel-btn')?.addEventListener('click', (e) => {
    clearInterval(timer);
    if (countdownEl) countdownEl.textContent = '—';
  });
});
