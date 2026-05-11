/* compare.js */
'use strict';
document.addEventListener('DOMContentLoaded', () => {
  // Quitar producto de un slot
  document.querySelectorAll('.slot-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const slot = btn.closest('.compare-slot');
      if (!slot) return;
      // Convertir a slot vacío
      const num = slot.dataset.slot;
      slot.classList.remove('filled');
      slot.classList.add('empty');
      slot.innerHTML = `
        <span class="material-icons" style="font-size:2rem;color:var(--outline)">add_circle_outline</span>
        <span style="font-size:0.8rem;color:var(--on-surface-variant)">Agregar producto</span>
        <a href="search.html" class="btn btn-secondary btn-sm" style="margin-top:var(--space-xs)">Buscar</a>
      `;
      // Ocultar columna correspondiente en tabla
      const col = document.getElementById(`col-${num}`);
      if (col) col.style.display = 'none';
      document.querySelectorAll(`.compare-full-table td:nth-child(${parseInt(num) + 1})`).forEach(td => td.style.display = 'none');

      // Mostrar estado vacío si no hay slots llenos
      const filledSlots = document.querySelectorAll('.compare-slot.filled').length;
      if (filledSlots === 0) {
        document.getElementById('compare-table-wrap')?.classList.add('hidden');
        document.getElementById('compare-empty')?.classList.remove('hidden');
      }
    });
  });

  // Limpiar todo
  document.getElementById('clear-compare-btn')?.addEventListener('click', () => {
    document.querySelectorAll('.compare-slot.filled .slot-remove').forEach(btn => btn.click());
  });
});
