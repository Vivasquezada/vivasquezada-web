# Constructora Quezada Vivas SRL — Website

Sitio web institucional + página de proyecto Viva Tower II.

## Estructura

- `index.html` — Landing de la empresa
- `viva-tower-ii.html` — Proyecto Viva Tower II
- `viva-tower-i.html` — Proyecto Viva Tower I (entregado, en construcción de contenido)
- `assets/site.css` — Sistema de diseño (paletas, tipografía, componentes)
- `assets/site.js` — Comportamiento (nav, scroll reveal, i18n)
- `brand_assets/` — Logo y renders del proyecto

## Configuración de diseño

El tema, paleta, layout de hero/nav/footer/teaser e idioma por defecto están fijados en
`TWEAK_DEFAULTS` al inicio de `assets/site.js`. Editar ese objeto y volver a publicar
para cambiar el diseño — ya no hay panel visible en el sitio en vivo.

## Deploy

Sitio estático — funciona en cualquier hosting (Vercel, Netlify, GitHub Pages, etc).
No requiere build step.
