# QR Permanente

> Generador de códigos QR **permanentes**, **artísticos** y **personalizables**.
> 100% estático · Sin servidores · Sin caducidad · Sin registro.

Hecho con [Astro](https://astro.build/) + [Tailwind CSS v4](https://tailwindcss.com/) + [`qr-code-styling`](https://github.com/kozakdenys/qr-code-styling). Listo para deploy en Cloudflare Pages.

---

## ✨ Características

- **10 plantillas pre-cargadas** con presets de diseño:
  🔗 URL · 🍽️ Menú restaurante · 📶 WiFi · 👤 vCard · 📱 Redes sociales
  · 📍 Google Maps · 💳 Pago (PayPal/Bizum/Yape/Plin) · ✉️ Email/SMS/Llamada
  · 📅 Evento de calendario · 📝 Texto plano

- **Personalización avanzada**
  - 6 estilos de puntos (cuadrado, redondeado, extra-redondeado, puntos, classy, classy-rounded)
  - 3 estilos de esquinas + estilos para el punto interno
  - Gradientes lineales y radiales
  - Logo embebido en el SVG (no overlay) con margen y oculta-puntos
  - 4 niveles de corrección de errores (L · M · Q · H)
  - 8 paletas de colores rápidas

- **Exportación:** SVG vectorial, PNG, JPEG, WebP

- **SEO + Performance**
  - Meta tags, Open Graph, Twitter Cards
  - JSON-LD: `WebApplication` + `FAQPage`
  - Sitemap.xml automático, robots.txt, canonical URLs
  - Manifest PWA
  - HTML estático puro, **~20 KB JS gzip**, 100 % en Lighthouse

- **Privacidad total:** todo se ejecuta en el navegador. Cero tracking, cero cookies, cero servidores.

---

## 🚀 Quick start

```bash
git clone https://github.com/DrewGGM/QR-Generator.git
cd QR-Generator
npm install
npm run dev          # http://localhost:4321
```

| Comando            | Acción                          |
| ------------------ | ------------------------------- |
| `npm run dev`      | Servidor de desarrollo          |
| `npm run build`    | Genera `dist/` listo para producción |
| `npm run preview`  | Sirve la build localmente       |

---

## ☁️ Deploy en Cloudflare Pages

### Opción A — Conectar repo (auto-deploy en cada push)

1. [Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git](https://dash.cloudflare.com/?to=/:account/workers-and-pages/create/pages)
2. Selecciona este repositorio.
3. Configuración de build:
   - **Framework preset:** `Astro`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Variable de entorno:** `NODE_VERSION = 20`
4. Deploy.

### Opción B — Deploy manual con Wrangler

```bash
npm install -g wrangler
npm run build
wrangler pages deploy dist --project-name=qr-permanente
```

### Dominio personalizado

En Cloudflare Pages → **Custom domains** añade tu dominio. Después actualiza:

- `site` en [`astro.config.mjs`](./astro.config.mjs)
- La línea `Sitemap:` en [`public/robots.txt`](./public/robots.txt)

---

## 📐 Estructura del proyecto

```
.
├── astro.config.mjs         # Config + sitemap + Tailwind
├── wrangler.toml            # Config Cloudflare Pages
├── public/
│   ├── _headers             # Cache + security headers
│   ├── favicon.svg
│   ├── manifest.webmanifest
│   └── robots.txt
└── src/
    ├── data/
    │   └── templates.ts     # 10 plantillas con encoders + presets
    ├── layouts/
    │   └── Layout.astro     # SEO, OG, JSON-LD, fuentes
    ├── pages/
    │   └── index.astro      # UI principal + contenido SEO
    ├── scripts/
    │   └── qr-generator.ts  # Lógica cliente (qr-code-styling)
    └── styles/
        └── global.css       # Tailwind v4 + design tokens
```

---

## 💡 Sobre la "permanencia" de los QR

Los QR generados son **estáticos**: la información va dentro de la imagen, no en un servidor.

- ✅ Funcionarán **para siempre** mientras el dato (URL, contacto, WiFi, etc.) siga siendo válido.
- ⚠️ Si codificas una URL externa y esa URL cae, el QR ya no llevará a ningún sitio.

**Truco pro:** apunta el QR a una URL de **tu propio dominio** (ej. `tudominio.com/menu`) y desde ahí redirige al destino real. Así puedes cambiar el destino sin reimprimir el QR.

---

## 🛠️ Cómo añadir una nueva plantilla

Edita [`src/data/templates.ts`](./src/data/templates.ts) y añade un objeto:

```ts
{
  id: "mi-plantilla",
  name: "Mi plantilla",
  emoji: "🎯",
  description: "Descripción corta",
  fields: [
    { key: "valor", label: "Valor", type: "text", required: true },
  ],
  encode: (d) => `mi-protocolo:${d.valor}`,
  preset: {
    dotsType: "rounded",
    cornersSquareType: "extra-rounded",
    cornersDotType: "dot",
    dotsColor: "#000000",
    cornersColor: "#000000",
    backgroundColor: "#ffffff",
    errorCorrection: "H",
  },
},
```

La UI la detecta automáticamente.

---

## 📜 Licencia

[MIT](./LICENSE) — úsalo para lo que quieras, comercial incluido.
