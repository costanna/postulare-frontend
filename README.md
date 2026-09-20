# Postulare — Frontend

🇪🇸 Español · [🇬🇧 English](README.en.md)

Aplicación web de **Postulare**, para organizar tu búsqueda de empleo: guarda tus candidaturas, encuentra ofertas afines a tu perfil, puntúa cuánto encajan contigo y te ayuda a escribir la carta de presentación.

- 🌐 Demo en vivo: <https://postulare.vercel.app> (pulsa **«Prueba la demo»**, no hace falta registrarse)
- ⚙️ Backend (FastAPI): [postulare-backend](https://github.com/costanna/postulare-backend)

> El backend corre en el plan gratuito de Render, que duerme el servicio tras un rato sin uso: la primera carga puede tardar ~30 s.

**Stack:** Angular 18 (componentes standalone y signals) · Angular Material · ngx-translate · Lucide · Karma/Jasmine

## Qué puedes hacer

- **Seguir tus candidaturas** en un tablero Kanban (arrastrando entre estados) o en una tabla con filtros y paginación. Cada cambio de estado queda en una línea de tiempo, junto con entrevistas, seguimientos y notas.
- **Encontrar ofertas** afines a tu perfil, con filtros editables (palabras clave, ubicación, radio, exclusiones, antigüedad, empresas que mencionan la discapacidad, puntuación mínima) y un **listado de palabras clave habituales en programación** para añadirlas con un clic (también en las skills del perfil). Las ofertas llegan de Adzuna y, si el servidor lo activa, de InfoJobs. Cada oferta muestra su afinidad y por qué encaja, y se puede **guardar**, **marcar como ya aplicada** o **descartar**. Avisa si ya la tienes entre tus candidaturas.
- **Escribir la carta de presentación** de cada oferta: con IA (si el servidor la tiene activada) o con una plantilla gratuita, en catalán, castellano o inglés. Es editable y se copia con un clic.
- **Importar tu CV en PDF** para rellenar el perfil; revisas los datos antes de guardar.
- **No perder el hilo**: el dashboard te recuerda las candidaturas que llevan días sin novedades y muestra gráficos por estado, mes y origen. Puedes **exportar todo a CSV**.
- **Probar sin registrarte** con la cuenta demo.
- Tema **claro/oscuro**, interfaz en **catalán, castellano e inglés** y diseño **responsive** desde ~360 px.

## Capturas

<p>
  <img src="docs/screenshots/dashboard.png" alt="Dashboard con seguimientos pendientes" width="49%">
  <img src="docs/screenshots/matches.png" alt="Ofertas recomendadas" width="49%">
  <img src="docs/screenshots/cover-letter.png" alt="Carta de presentación" width="49%">
  <img src="docs/screenshots/profile-cv-import.png" alt="Importar CV" width="49%">
</p>

<p>
  <img src="docs/screenshots/dashboard-dark.png" alt="Dashboard en tema oscuro" width="49%">
</p>

## Puesta en marcha local

Requisitos: Node.js 20+ y el [backend](https://github.com/costanna/postulare-backend) corriendo en `http://localhost:8000` (ver su README).

```bash
npm install
npm start          # http://localhost:4200, con recarga en caliente
```

La URL de la API está en `src/environments/environment.ts` (desarrollo) y `environment.prod.ts` (producción). Se compila dentro del bundle: si cambia la URL del backend hay que actualizarla ahí y volver a desplegar.

| Comando | Qué hace |
|---|---|
| `npm start` | Servidor de desarrollo |
| `npm test` | Tests unitarios (Karma + Jasmine, 111 tests) |
| `npm run build` | Build de producción en `dist/postulare-frontend/browser` |

### Docker

El [`Dockerfile`](Dockerfile) compila la SPA y la sirve con nginx ([`nginx.conf`](nginx.conf), con fallback a `index.html` para el router). Está pensado para levantarse junto al backend con el `docker-compose.yml` de la carpeta raíz del proyecto. Para construir solo esta imagen:

```bash
docker build -t postulare-frontend .
docker run -p 4200:80 postulare-frontend
```

## Despliegue

Se despliega en **Vercel** con el build de producción de Angular (`npm run build`, directorio de salida `dist/postulare-frontend/browser`), que usa `environment.prod.ts`. El backend vive en Render y la base de datos en Neon: ver el [README del backend](https://github.com/costanna/postulare-backend#readme).

## Tema e idiomas

- **Tema**: variables CSS en `src/styles.scss`, alternadas por `ThemeService` con el atributo `[data-theme]` en `<body>`. Respeta `prefers-color-scheme` la primera vez y recuerda la elección.
- **Idiomas**: `src/assets/i18n/{ca,es,en}.json`. Se detecta el idioma del navegador la primera vez y luego se recuerda; el idioma guardado en el perfil se aplica al iniciar sesión desde cualquier dispositivo. Castellano es el idioma de respaldo si falta una clave.

## Estructura del proyecto

```text
src/app/
├── core/           servicios (auth, tema, idioma, API), guards, interceptor HTTP, modelos y utilidades
├── layout/         shell con barra superior, menú responsive y aviso de cuenta demo
├── features/
│   ├── auth/           login, registro, recuperar contraseña y botón «Prueba la demo»
│   ├── dashboard/      resumen, seguimientos pendientes y gráficos
│   ├── kanban/         tablero de candidaturas con drag & drop
│   ├── applications/   tabla con filtros, formulario y detalle con línea de tiempo
│   ├── matches/        ofertas recomendadas, filtros y carta de presentación
│   └── profile/        perfil editable e importación de CV
├── shared/         pipes y componentes reutilizables
└── app.routes.ts
src/assets/i18n/   traducciones
docs/screenshots/  capturas para este README
```

## Licencia

[MIT](LICENSE) © 2026 Anna Costa
