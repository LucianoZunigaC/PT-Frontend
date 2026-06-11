# Guías de Desarrollo Frontend (Developer Guidelines)

Bienvenido al Frontend de **ConstructCompare** (Plataforma de Precios).

Nuestra interfaz está construida deliberadamente de la forma más sencilla posible: **Vanilla Javascript y Bootstrap**. No hay bundlers, no hay compiladores, no hay Webpack. Lo que ves es lo que se ejecuta.

## 1. Estructura de Archivos
- Modifica `index.html`, `search.html`, etc. directamente para la estructura del DOM.
- Todos los estilos deben ir en la carpeta `/assets/css/`.
  - Los colores, fuentes y espaciados deben definirse como Variables CSS en `variables.css`. No "quemes" colores (hardcoding) como `#ff0000` directamente en las clases.
- Toda la lógica interactiva vive en `/assets/js/`.

## 2. Javascript: Manipulación del DOM
- Debido a que no usamos React o Vue, actualizar la vista es tu responsabilidad manual.
- **Evita InnerHTML Masivos:** Cuando inyectes las tarjetas de producto tras una llamada a la API, usa literales de plantilla (template literals) pero sanitiza o usa métodos de creación de nodos (`document.createElement`) si alguna vez permitimos al usuario ingresar texto que se renderice directo en pantalla para evitar ataques Cross-Site Scripting (XSS).
- **Ejemplo Correcto de Consumo de API:**
  ```javascript
  async function fetchProducts(query) {
      try {
          const res = await fetch(`http://localhost:3000/api/productos/busqueda?q=${query}`);
          if (!res.ok) throw new Error("Error HTTP");
          const data = await res.json();
          renderCards(data);
      } catch (err) {
          console.error("Fallo la red: ", err);
          showErrorUI("Hubo un problema contactando los servidores.");
      }
  }
  ```

## 3. Manejo de Estado
- Usa `localStorage` o `sessionStorage` para mantener preferencias del usuario (ej. modo oscuro, últimas búsquedas).
- Usa los parámetros de la URL (`URLSearchParams`) para el estado de navegación de las búsquedas (`?q=cemento&cat=obra`), esto permite que los usuarios compartan los enlaces.

## 4. Servidor de Desarrollo
Para probar no abras directamente el archivo `index.html` haciendo doble clic, porque tendrás bloqueos de CORS al hacer `fetch()`. Usa siempre un servidor local.
- Instala la extensión "Live Server" en VSCode.
- O usa Node.js: `npx http-server -p 8080`.
