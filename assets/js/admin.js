/* admin.js — Panel Administrativo */
'use strict';

document.addEventListener('DOMContentLoaded', () => {

  // Simular actualización de la hora del último refresco
  const updateEl = document.getElementById('last-update');
  if (updateEl) {
    const now = new Date();
    updateEl.textContent = `Última actualización: ${now.toLocaleTimeString('es-CL', {hour:'2-digit',minute:'2-digit'})}`;
  }

  // Botón Actualizar
  document.getElementById('refresh-btn')?.addEventListener('click', () => {
    const btn = document.getElementById('refresh-btn');
    const icon = btn?.querySelector('.material-icons');
    if (icon) {
      icon.style.animation = 'spin 0.8s linear infinite';
      setTimeout(() => { icon.style.animation = ''; }, 1500);
    }
    const upd = document.getElementById('last-update');
    if (upd) {
      const now = new Date();
      upd.textContent = `Última actualización: ${now.toLocaleTimeString('es-CL', {hour:'2-digit',minute:'2-digit'})}`;
    }
  });

  // Botón Ejecutar Scraping (simulado)
  document.getElementById('run-scraping-btn')?.addEventListener('click', () => {
    const btn = document.getElementById('run-scraping-btn');
    if (!btn) return;
    btn.disabled = true;
    btn.innerHTML = '<span class="material-icons" style="animation:spin 0.8s linear infinite">sync</span> Ejecutando…';
    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = '<span class="material-icons">play_arrow</span> Ejecutar Scraping';
      alert('Scraping completado. Se actualizaron 3 fuentes exitosamente.');
    }, 3000);
  });

  // Matching: confirmar / separar
  document.querySelectorAll('#matching-table .btn-primary').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('tr');
      if (row) { row.style.opacity = '0.4'; row.style.pointerEvents = 'none'; }
    });
  });
  document.querySelectorAll('#matching-table .btn-secondary').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('tr');
      if (row) row.remove();
    });
  });

  // Añadir fuente (placeholder)
  document.getElementById('add-source-btn')?.addEventListener('click', () => {
    alert('Formulario de nueva fuente — conectar con backend.');
  });

  // Cerrar errores
  document.querySelectorAll('.error-actions .btn').forEach(btn => {
    if (btn.title === 'Marcar resuelt') btn.addEventListener('click', () => btn.closest('.error-item')?.remove());
  });
});

// Inyectar keyframe spin globalmente (para el admin)
const styleEl = document.createElement('style');
styleEl.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
document.head.appendChild(styleEl);
