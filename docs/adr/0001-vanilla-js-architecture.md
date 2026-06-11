# ADR-0001: Uso de Vanilla JS y Bootstrap sin Bundlers

## Status
Aceptado

## Context
El proyecto requería levantar un Frontend rápidamente para consumir la API de la Plataforma de Precios y renderizar resultados. Históricamente, las aplicaciones web modernas usan React, Vue o Angular emparejados con herramientas de compilación pesadas como Vite, Webpack o Next.js.
Sin embargo, el equipo de desarrollo para esta capa necesitaba iterar velozmente diseños estáticos (mockups) a código funcional sin lidiar con *node_modules*, estados complejos y tiempos de transpilación.

## Decision
Se ha decidido construir el frontend exclusivamente con **HTML5, CSS3, Vanilla JavaScript (ES6+) y Bootstrap 5** mediante CDNs, sin requerir pasos de compilación (Build Step).

## Rationale
- La aplicación, por ahora, es sencilla y puramente de visualización de datos: consume un JSON y lo renderiza en formato "tarjetas". No hay estados globales complejos (como carritos de compra o flujos transaccionales multi-paso) que requieran el control estricto que ofrece React/Redux.
- **Despliegue Inmediato:** Cualquier cambio en el CSS o HTML es visible con solo recargar la página, acelerando el desarrollo en 10x.
- **Portabilidad:** La carpeta del proyecto puede ser arrastrada literalmente a un servidor Nginx o a GitHub Pages y funcionará de inmediato.
- Se ha estructurado el CSS usando "Custom Properties" (variables CSS nativas) y el JS se ha modularizado, mitigando el "código espagueti" tradicional de aplicaciones Vanilla.

## Consequences

### Positivas
- 0 dependencias (no hay `package.json`, ni NPM).
- Performance de carga rápida (nada que hidratar).
- Accesible para cualquier desarrollador sin necesidad de enseñar un framework específico.

### Negativas
- Mayor verbosidad en el DOM. Actualizar la interfaz (DOM manipulation) es manual (`document.createElement`, `.innerHTML`) lo que es más propenso a bugs visuales y ataques XSS si no se sanitiza la data.
- Si la aplicación crece para incorporar cuentas de usuario, listas de deseados, carritos y checkout, escalar la arquitectura Vanilla se volverá insostenible y requerirá una refactorización hacia React/Vue.
