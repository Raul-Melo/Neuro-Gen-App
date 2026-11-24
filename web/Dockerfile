# ── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Instala dependências primeiro (cache layer)
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

# Copia código-fonte
COPY . .

# Build de produção
# VITE_API_URL não é necessário aqui — em produção, o Nginx faz proxy de /api
ARG VITE_API_URL=/api
ARG VITE_APP_ENV=production
ARG VITE_MOCK=false

ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_APP_ENV=${VITE_APP_ENV}
ENV VITE_MOCK=${VITE_MOCK}

RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Remove config padrão do nginx
RUN rm /etc/nginx/conf.d/default.conf

# Config customizada: SPA routing + proxy para /api → backend
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copia o build
COPY --from=builder /app/dist /usr/share/nginx/html

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:80 || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
