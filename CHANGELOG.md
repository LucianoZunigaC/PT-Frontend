# Changelog

Todos los cambios notables en el Frontend de la Plataforma de Precios serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

## [Unreleased]

### Añadido
- Documentación C4 extensiva y Arquitectural de la vista del cliente.
- Guías de Desarrollo para mantener el código JS Vanilla organizado.
- Integración oficial con el endpoint unificado `/api/productos/busqueda`.

## [1.2.0] - 2026-05-24

### Añadido
- Páginas satélite para categorías (`categories.html`) y para la vista detallada de comparativa (`compare.html`).
- Implementación de lógica `fetch()` para consumir dinámicamente los datos vivos extraídos por los scrapers.

### Modificado
- `index.html`: Se actualizó la barra de búsqueda y los *Trending topics* para apuntar al sistema de rutas con variables GET (Ej: `search.html?q=cemento`).

## [1.0.0] - 2026-05-20

### Añadido
- Estructura base HTML/CSS para el Portal ConstructCompare.
- Integración de sistema de diseño (tokens) a través de `variables.css`.
- Integración de framework UI Bootstrap 5.
- Componentes base de tarjetas de producto (*Product Cards*) maquetados en estático para pruebas visuales.
