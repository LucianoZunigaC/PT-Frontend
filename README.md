# ConstructCompare — Frontend

Comparador de precios para materiales de construcción, ferretería y herramientas.

## Estructura de Carpetas

```
Frontend/
│
├── index.html                      # Home y Buscador (Desktop)
├── 404.html                        # Página de error estándar
├── README.md
│
├── pages/
│   ├── search.html                 # Resultados de Búsqueda
│   ├── product.html                # Ficha de Producto / Comparativa de Precios
│   ├── redirect.html               # Redirección a Proveedor
│   ├── categories.html             # Catálogo de Categorías (con filtros por chip)
│   └── compare.html                # Comparador lado a lado (hasta 4 productos)
│
├── admin/
│   ├── dashboard.html              # Panel Administrativo — KPIs y resumen
│   ├── sources.html                # Gestión de Fuentes de Datos
│   ├── scraping.html               # Log de Ejecución de Scraping en vivo
│   ├── products.html               # Gestión de Productos indexados
│   ├── matching.html               # Revisión de Matching / Normalización
│   ├── categories-admin.html       # Gestión de Categorías (árbol expandible)
│   └── errors.html                 # Errores de Extracción con stack trace
│
├── components/                     # (futuro) Componentes reutilizables HTML
│
├── assets/
│   ├── css/
│   │   ├── variables.css           # Design tokens (colores, tipografía, spacing)
│   │   ├── main.css                # Estilos globales: navbar, botones, cards, footer
│   │   ├── home.css                # Estilos del Home
│   │   ├── search.css              # Estilos de resultados de búsqueda
│   │   ├── product.css             # Estilos de la ficha de producto
│   │   ├── redirect.css            # Estilos de la página de redirección
│   │   ├── categories.css          # Estilos del catálogo de categorías
│   │   ├── compare.css             # Estilos del comparador lado a lado
│   │   └── admin.css               # Estilos del panel administrativo
│   │
│   ├── js/
│   │   ├── main.js                 # Funciones globales (URL params, helpers)
│   │   ├── home.js                 # Lógica del Home
│   │   ├── search.js               # Lógica de búsqueda y filtros
│   │   ├── product.js              # Lógica de la ficha de producto
│   │   ├── redirect.js             # Countdown y redirección automática
│   │   ├── categories.js           # Filtros de categorías
│   │   ├── compare.js              # Lógica del comparador
│   │   └── admin.js                # Lógica del panel admin
│   │
│   ├── images/                     # Imágenes estáticas
│   └── icons/                      # Íconos personalizados
```

## Inventario de Páginas — 14 páginas

| # | Página | Archivo | Descripción |
|---|--------|---------|-------------|
| 1 | Home | `index.html` | Hero con buscador, categorías, productos destacados, índice de precios |
| 2 | Resultados de Búsqueda | `pages/search.html` | Sidebar de filtros + grid de productos comparables |
| 3 | Ficha de Producto | `pages/product.html` | Specs técnicas + tabla comparativa por tienda + historial |
| 4 | Redirección | `pages/redirect.html` | Countdown 5s + aviso legal + alternativas |
| 5 | Catálogo de Categorías | `pages/categories.html` | 4 categorías, 22 subcategorías, filtro por chip |
| 6 | Comparador | `pages/compare.html` | Comparador lado a lado: specs, precios, disponibilidad |
| 7 | 404 | `404.html` | Página de error con diseño Industrial Precision |
| 8 | Dashboard Admin | `admin/dashboard.html` | KPIs + fuentes + errores + matching |
| 9 | Fuentes de Datos | `admin/sources.html` | CRUD de fuentes de scraping + modal |
| 10 | Scraping | `admin/scraping.html` | Log en vivo con barra de progreso animada |
| 11 | Productos | `admin/products.html` | Gestión con búsqueda, filtros y paginación |
| 12 | Matching | `admin/matching.html` | Revisión de pares con barra de confianza |
| 13 | Categorías Admin | `admin/categories-admin.html` | Árbol expandible de categorías/subcategorías |
| 14 | Errores | `admin/errors.html` | Detalle de errores con stack trace expandible |

## Design System — Industrial Precision

- **Color primario**: Safety Orange `#F57C00`
- **Fondo**: Clean White `#f7fafc`
- **Tipografía**: Inter (Google Fonts)
- **Grid**: 12 columnas, máx. 1280px
- **Spacing base**: 8px
- **Border radius**: 4px (botones/inputs) — 8px (cards)

## Stack Tecnológico (Frontend)

- HTML5 semántico
- CSS3 con Custom Properties (sin frameworks CSS externos)
- Bootstrap 5.3 (grid y utilidades de layout)
- JavaScript vanilla (ES2021)
- Google Fonts + Material Icons
- (futuro) Chart.js para historial de precios
- (futuro) API REST FastAPI/Node.js para datos dinámicos

## Convención de Nomenclatura

- IDs únicos descriptivos en todos los elementos interactivos
- Clases BEM-like para componentes
- Prefijos por sección: `kpi-`, `cat-`, `compare-`, `match-`, `error-`, etc.
