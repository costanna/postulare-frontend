# Postulare — Frontend

Frontend del proyecto **Postulare**: seguimiento de candidaturas de empleo con
búsqueda y scoring automático de ofertas afines a tu perfil.

Stack: **Angular 18 (standalone) · TypeScript · Angular Material · ngx-charts · ngx-translate · @lucide/angular**.

> Backend (FastAPI) en un repositorio hermano: [postulare-backend](https://github.com/costanna/postulare-backend).

## Estado del proyecto

Este frontend se construye de forma incremental, en ramas por funcionalidad:

- [x] `feature/scaffold` — proyecto Angular 18 standalone + Angular Material, ngx-charts, ngx-translate, @lucide/angular
- [x] `feature/layout-auth` — tema claro/oscuro (CSS custom properties + `ThemeService`), i18n CA/ES/EN con `ngx-translate`, layout con barra superior responsive, autenticación (login/registro/recuperar contraseña) con guards e interceptor HTTP
- [x] `feature/profile` — perfil editable (skills como chips, ubicación, puesto deseado, seniority, salario mínimo, idioma preferido); el idioma guardado en el backend se sincroniza al iniciar sesión
- [x] `feature/applications` — tablero Kanban con drag & drop (`@angular/cdk`) entre estados, alta/edición de candidaturas en un diálogo compartido, vista de tabla con filtros (empresa, estado, rango de fechas) y paginación, y detalle de candidatura con línea de tiempo de eventos (entrevistas, seguimientos, notas)
- [x] `feature/dashboard` — resumen numérico (candidaturas totales, enviadas, entrevistas, ofertas, tasa de respuesta) y gráficos de candidaturas por estado, por mes y por origen, consumiendo los endpoints `/stats/*` del backend
- [x] `feature/matches` — ofertas recomendadas: buscar ofertas (Adzuna + scoring del backend), filtro por nuevas/convertidas/descartadas, tarjeta con score de afinidad y motivo, convertir en candidatura o descartar
- [x] `feat/improvements-pack` — **carta de presentación** por oferta (IA con Claude si el backend la tiene activada; si no, plantilla gratuita en CA/ES/EN, editable y con botón de copiar), **importar CV en PDF** al perfil (se rellena el formulario y la usuaria revisa antes de guardar), **recordatorios de seguimiento** en el dashboard, **exportar candidaturas a CSV**, aviso de **ofertas repetidas / ya en tus candidaturas**, y **"Prueba la demo"** (cuenta temporal con datos de ejemplo, con banner y sin búsqueda real ni IA)
- [x] `feature/docker` — `Dockerfile` + nginx para servir la SPA en contenedor; junto al backend se orquestan desde el [`docker-compose.yml`](../docker-compose.yml) de la carpeta raíz (ver ahí para levantar todo el stack local)

## Puesta en marcha local

### Requisitos

- Node.js 20+
- El [backend](https://github.com/costanna/postulare-backend) corriendo en `http://localhost:8000` (ver su propio README)

### Instalación

```bash
npm install
```

### Variables de entorno

La URL de la API se configura en `src/environments/environment.ts` (desarrollo)
y `environment.prod.ts` (producción, sustituido en el build de producción vía
`fileReplacements` en `angular.json`).

### Arrancar en desarrollo

```bash
npm start
```

Sirve la app en http://localhost:4200 con recarga en caliente.

### Tests

```bash
npm test
```

### Build de producción

```bash
npm run build
```

### Docker

El [`Dockerfile`](Dockerfile) compila la SPA (configuración `development`,
para que `apiUrl` apunte a `http://localhost:8000`) y la sirve con nginx
([`nginx.conf`](nginx.conf), con fallback a `index.html` para el router de
Angular). Pensado para levantarse junto al backend desde el
[`docker-compose.yml`](../docker-compose.yml) de la carpeta raíz — ver ahí
las instrucciones para todo el stack. Para construir solo esta imagen:

```bash
docker build -t postulare-frontend .
docker run -p 4200:80 postulare-frontend
```

(el backend debe estar accesible en `http://localhost:8000` desde el navegador)

## Tema claro/oscuro e internacionalización

- **Tema**: variables CSS (`custom properties`) definidas en `src/styles.scss`,
  alternadas por `ThemeService` mediante el atributo `[data-theme]` en `<body>`.
  Respeta `prefers-color-scheme` en la primera visita y persiste la elección en
  `localStorage`.
- **Idiomas**: catalán, castellano e inglés en `src/assets/i18n/{ca,es,en}.json`.
  `ngx-translate` cambia de idioma en caliente. Castellano es el idioma de
  fallback si falta una clave. El idioma se detecta del navegador la primera
  vez y luego se recuerda (ver `core/i18n/supported-languages.ts`).

## Estructura del proyecto

```
src/app/
├── core/            # servicios (auth, tema, idioma), guards, interceptor HTTP, modelos
├── layout/          # shell con la barra superior y el menú responsive
├── features/
│   ├── auth/        # login, registro, recuperar/restablecer contraseña, botón «Prueba la demo»
│   ├── dashboard/    resumen y gráficos (estado, mes, origen)
│   ├── kanban/        tablero de candidaturas con drag & drop
│   ├── applications/  tabla con filtros, formulario y detalle con eventos
│   ├── matches/       ofertas recomendadas con score y acciones, y diálogo de carta de presentación
│   └── profile/       perfil editable e importación de CV (PDF)
├── shared/          # componentes/páginas reutilizables
└── app.routes.ts
src/assets/i18n/      # ca.json, es.json, en.json
```

## Diseño responsive

Mobile-first: el listado, los formularios y la barra de navegación se adaptan
desde ~360px de ancho. La navegación superior se colapsa en un menú lateral
(`mat-sidenav`) por debajo de 900px de ancho.
