/* product.js — Ficha de Producto */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // Leer URL params del producto
  const productId = getParam('id');
  console.log('Producto cargado:', productId);

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

  // Confirmar redirección con el mejor precio
  document.getElementById('goto-best-price')?.addEventListener('click', (e) => {
    const href = e.currentTarget.getAttribute('href');
    if (href && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      window.location.href = href;
    }
  });
});
