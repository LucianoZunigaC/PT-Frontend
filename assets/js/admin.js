/* admin.js — Panel Administrativo — Conectado al Backend Real */
'use strict';

document.addEventListener('DOMContentLoaded', () => {

  // ── 1. Actualizar hora del último refresco ──────────────────────────────────
  const updateTimestamp = () => {
    const now = new Date();
    const updateEl = document.getElementById('last-update');
    if (updateEl) {
      updateEl.textContent = `Última actualización: ${now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`;
    }
  };
  updateTimestamp();

  // ── 2. Cargar estadísticas del dashboard ────────────────────────────────────
  const loadDashboardStats = async () => {
    try {
      // Cargar proveedores
      const provRes = await fetch(`${API_BASE}/proveedores`, { signal: AbortSignal.timeout(8000) });
      if (provRes.ok) {
        const provs = await provRes.json();
        const provCountEl = document.getElementById('stat-proveedores');
        if (provCountEl) provCountEl.textContent = provs.length || 0;

        // Rellenar tabla de fuentes si existe
        const sourcesTable = document.getElementById('sources-table');
        if (sourcesTable && Array.isArray(provs)) {
          const tbody = sourcesTable.querySelector('tbody');
          if (tbody && provs.length > 0) {
            tbody.innerHTML = provs.map(prov => `
              <tr>
                <td>${prov.nombre || '—'}</td>
                <td>${prov.sitio_web ? `<a href="${prov.sitio_web}" target="_blank">${prov.sitio_web}</a>` : '—'}</td>
                <td><span class="badge badge-success">Activo</span></td>
                <td class="text-muted font-mono" style="font-size:0.8rem">—</td>
              </tr>`).join('');
          }
        }
      }

      // Cargar categorías
      const catRes = await fetch(`${API_BASE}/categorias`, { signal: AbortSignal.timeout(8000) });
      if (catRes.ok) {
        const cats = await catRes.json();
        const catCountEl = document.getElementById('stat-categorias');
        if (catCountEl) catCountEl.textContent = cats.length || 0;
      }

      // Cargar productos (via búsqueda general)
      const prodRes = await fetch(`${API_BASE}/productos/indice?limit=1`, { signal: AbortSignal.timeout(8000) });
      if (prodRes.ok) {
        // Sólo es para verificar que el endpoint responde
      }

    } catch (err) {
      console.warn('[Admin] No se pudieron cargar estadísticas:', err.message);
    }
  };

  loadDashboardStats();

  // ── 3. Botón Actualizar ──────────────────────────────────────────────────────
  document.getElementById('refresh-btn')?.addEventListener('click', () => {
    const btn  = document.getElementById('refresh-btn');
    const icon = btn?.querySelector('.material-icons');
    if (icon) icon.style.animation = 'spin 0.8s linear infinite';
    setTimeout(() => {
      if (icon) icon.style.animation = '';
      updateTimestamp();
      loadDashboardStats();
    }, 1200);
  });

  // ── 4. Botón Ejecutar Scraping (conectado al backend) ───────────────────────
  document.getElementById('run-scraping-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('run-scraping-btn');
    if (!btn) return;

    btn.disabled = true;
    btn.innerHTML = '<span class="material-icons" style="animation:spin 0.8s linear infinite">sync</span> Iniciando…';

    try {
      // El backend inicia scraping dinámico en background al recibir cualquier búsqueda.
      // Disparamos una búsqueda de un término común para forzar el ciclo.
      const res = await fetch(`${API_BASE}/productos/busqueda?q=cemento&limit=1`, { signal: AbortSignal.timeout(30000) });
      if (res.ok) {
        btn.innerHTML = '<span class="material-icons">check_circle</span> Scraping iniciado';
        setTimeout(() => {
          btn.disabled = false;
          btn.innerHTML = '<span class="material-icons">play_arrow</span> Ejecutar Scraping';
        }, 4000);
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      btn.innerHTML = '<span class="material-icons">error</span> Error — Backend no disponible';
      btn.style.background = 'var(--error)';
      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = '<span class="material-icons">play_arrow</span> Ejecutar Scraping';
        btn.style.background = '';
      }, 4000);
    }
  });

  // ── 5. Matching: confirmar / separar ────────────────────────────────────────
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

  // ── 6. Añadir fuente ────────────────────────────────────────────────────────
  document.getElementById('add-source-btn')?.addEventListener('click', () => {
    alert('Funcionalidad de agregar fuente — disponible en próxima versión.');
  });

  // ── 7. Cerrar errores ────────────────────────────────────────────────────────
  document.querySelectorAll('.error-actions .btn').forEach(btn => {
    btn.addEventListener('click', () => btn.closest('.error-item')?.remove());
  });
});

// ── Keyframe spin global ──────────────────────────────────────────────────────
const styleEl = document.createElement('style');
styleEl.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
document.head.appendChild(styleEl);
