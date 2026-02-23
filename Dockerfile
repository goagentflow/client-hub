# Standalone Dockerfile for local/independent Docker builds.
# Production deploys via the afv2-temp assembler pipeline (cloudbuild.yaml),
# which clones this repo, runs npm build, and copies dist/ into a shared nginx image.

# ── Stage 1: Build ──────────────────────────────────────────────
FROM node:20-alpine AS build

RUN corepack enable && corepack prepare pnpm@10.24.0 --activate

WORKDIR /app

# Copy lockfile + manifests first for layer caching
COPY pnpm-lock.yaml package.json ./

RUN pnpm install --frozen-lockfile

# Build args — Vite bakes these into the bundle at build time
ARG VITE_BASE_PATH=/
ARG VITE_API_BASE_URL
ARG VITE_USE_MOCK_API=false
ARG VITE_AZURE_CLIENT_ID
ARG VITE_AZURE_TENANT_ID
ARG VITE_AZURE_BACKEND_CLIENT_ID

# Copy source and build
COPY index.html vite.config.ts tsconfig*.json postcss.config.js tailwind.config.ts ./
COPY public ./public/
COPY src ./src/

RUN pnpm build

# ── Stage 2: Runtime ───────────────────────────────────────────
FROM nginxinc/nginx-unprivileged:alpine AS runtime

# Copy nginx template (uses $PORT variable)
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

# Cloud Run injects PORT (default 8080)
ENV PORT=8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
