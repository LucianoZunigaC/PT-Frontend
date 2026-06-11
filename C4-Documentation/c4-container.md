# C4 Container-Level Documentation (Frontend)

## 1. Containers
- **Name:** Single Page Web Application
  - **Type:** Web Browser Application
  - **Technology:** HTML5, CSS3, Vanilla JavaScript ES6
  - **Deployment:** Servidor de archivos estáticos (Nginx, Vercel, etc.)
  - **Description:** Entrega todo el contenido estático y lógica de cliente (Vanilla JS) al navegador del usuario, que a su vez consume la API REST del backend.

## 2. Container Diagram

```mermaid
C4Container
    title Container diagram for ConstructCompare Frontend

    Person(user, "Usuario", "Busca materiales")

    System_Boundary(frontend_boundary, "ConstructCompare") {
        Container(spa, "Web Application", "HTML/CSS/Vanilla JS", "Entrega la interfaz principal y maneja el enrutamiento visual.")
    }

    System_Ext(api, "Backend REST API", "Node.js / Express")

    Rel(user, spa, "Visita constructcompare.com", "HTTPS")
    Rel(spa, api, "Llama endpoints de búsqueda (/api/productos)", "JSON/HTTPS")
```
