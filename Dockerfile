# ---- Etapa 1: build de la SPA con Angular CLI --------------------------
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Configuración "development": no aplica el fileReplacement de
# environment.prod.ts, así que apiUrl queda en http://localhost:8000 (el
# backend publicado por docker-compose en el host). El build real para
# producción (Vercel) sigue siendo el `npm run build` normal, con
# environment.prod.ts apuntando al backend desplegado (ver README raíz).
RUN npm run build -- --configuration development

# ---- Etapa 2: servir los estáticos con nginx ----------------------------
FROM nginx:1.27-alpine
COPY --from=build /app/dist/postulare-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
