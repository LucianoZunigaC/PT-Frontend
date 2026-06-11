# ConstructCompare - Frontend

Frontend oficial de **ConstructCompare**, la plataforma líder de comparación de precios de materiales de construcción y ferretería.
Esta aplicación web proporciona una interfaz intuitiva para que los usuarios puedan cotizar, buscar y comparar productos a través de diferentes proveedores en tiempo real, conectándose con el backend principal.

## Key Features

- **Búsqueda Dinámica:** Interfaz rápida para buscar materiales (cemento, herramientas, etc.).
- **Fichas de Comparación:** Visualización unificada del precio de un mismo producto en distintas tiendas (Ej. Sodimac, MercadoLibre, Imperial).
- **Categorización Intuitiva:** Exploración por rubros: estructurales, herramientas eléctricas, fijaciones, pinturas.
- **Panel Administrativo:** Interfaz para el administrador para gestionar las métricas del comparador.
- **Diseño Responsive:** Adaptado para móviles y computadoras usando Bootstrap 5 y Vanilla CSS.

## Tech Stack

- **Language**: HTML5, CSS3, JavaScript (Vanilla ES6)
- **Framework CSS**: Bootstrap 5.3.3
- **Icons**: Google Material Icons
- **Fonts**: Inter (Google Fonts)
- **Deployment**: Estático (Vercel, Netlify, GitHub Pages, o servidor Nginx/Apache)

## Prerequisites

Dado que es una aplicación Vanilla HTML/JS, no requiere de Node.js ni bundlers complejos (Webpack/Vite) para funcionar en su modo básico. Solo se requiere:

- Un navegador web moderno (Chrome, Firefox, Safari, Edge).
- Un servidor local (como Live Server de VSCode, o `http-server` de Node) para evitar problemas de CORS al hacer peticiones a la API.

## Getting Started

### 1. Clonar el Repositorio

```bash
git clone https://github.com/LucianoZunigaC/PT-Frontend.git
cd PT-Frontend
```

### 2. Configurar el Backend

El frontend necesita comunicarse con la API del Backend de Plataforma de Precios.
Asegúrate de que el backend esté ejecutándose (por defecto en `http://localhost:3000`).

*(Nota: En los archivos `assets/js/*.js` puedes encontrar las URLs base configuradas que apuntan a la API local).*

### 3. Iniciar un Servidor de Desarrollo Local

Puedes usar cualquier servidor estático.

**Opción A: Usando Node.js (http-server)**
```bash
npx http-server .
```

**Opción B: Usando Python**
```bash
python -m http.server 8080
```

**Opción C: Extensión Live Server en VSCode**
Simplemente haz clic derecho en `index.html` y selecciona "Open with Live Server".

Abre tu navegador en [http://localhost:8080](http://localhost:8080) (o el puerto que te indique tu servidor).

## Architecture

### Directory Structure

```
├── index.html          # Página principal (Home)
├── 404.html            # Página de error
├── README.md           # Este archivo
├── assets/             # Recursos estáticos
│   ├── css/            # Hojas de estilo
│   │   ├── main.css      # Estilos globales y reset
│   │   ├── variables.css # Tokens de diseño (colores, fuentes)
│   │   └── home.css      # Estilos específicos de la home
│   ├── js/             # Lógica JavaScript Vanilla
│   │   ├── main.js       # Scripts globales (navbar, utilidades)
│   │   └── home.js       # Lógica de la página principal
│   └── img/            # Imágenes y logotipos
├── pages/              # Páginas secundarias del portal
│   ├── search.html     # Resultados de búsqueda
│   ├── compare.html    # Ficha comparativa del producto
│   └── categories.html # Navegación por catálogo
└── admin/              # Panel administrativo
    └── dashboard.html  # Dashboard de analíticas y control
```

### Data Flow

1. **Usuario realiza búsqueda:** En `index.html`, el usuario ingresa un término en el input de búsqueda.
2. **Redirección:** El formulario redirige a `pages/search.html?q=termino`.
3. **Petición a la API:** El script `search.js` captura el parámetro de la URL y hace un `fetch()` al backend (`http://localhost:3000/api/productos/busqueda?q=termino`).
4. **Renderizado:** La respuesta JSON unificada es parseada y renderizada en tarjetas HTML (`product-card`).
5. **Comparativa:** Al hacer clic en un producto, el usuario es llevado a `compare.html?id=...` donde se visualiza el detalle y la comparativa entre tiendas.

## Deployment

Al ser una aplicación completamente estática, su despliegue es muy sencillo.

### Vercel / Netlify
1. Conecta el repositorio de GitHub.
2. Establece el directorio raíz como ruta a servir.
3. No se requiere comando de compilación (Build command en blanco).

### Servidor Tradicional (Nginx / Apache)
Simplemente copia todo el contenido del directorio al `DocumentRoot` (ej. `/var/www/html`).

## Troubleshooting

### No se muestran los productos al buscar
**Error:** Al buscar un producto, la página de resultados se queda en blanco o muestra un error en la consola (`Failed to fetch`).
**Solución:**
- Verifica que el Backend de Plataforma de Precios esté ejecutándose localmente.
- Asegúrate de que el Backend tenga los CORS habilitados.
- Revisa las peticiones de red en la pestaña *Network* (Red) de las herramientas de desarrollador (F12) de tu navegador para confirmar a qué URL se está haciendo el `fetch`.
