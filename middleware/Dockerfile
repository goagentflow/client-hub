# ── Stage 1: Build ──────────────────────────────────────────────
FROM node:20-alpine AS build

RUN corepack enable && corepack prepare pnpm@10.24.0 --activate

WORKDIR /app

# Copy lockfile + manifests first for layer caching
COPY pnpm-lock.yaml package.json ./
COPY prisma ./prisma/

RUN pnpm install --frozen-lockfile

# Copy source and build (prisma generate + tsup)
COPY tsup.config.ts tsconfig.json ./
COPY src ./src/

RUN pnpm run build

# Prune dev dependencies — @prisma/client is a prod dep so the
# generated client (inside the pnpm store) survives the prune
RUN pnpm prune --prod

# ── Stage 2: Runtime ───────────────────────────────────────────
FROM node:20-alpine AS runtime

RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

WORKDIR /app

# Copy production artifacts
COPY --from=build /app/dist ./dist/
COPY --from=build /app/node_modules ./node_modules/
COPY --from=build /app/prisma/schema.prisma ./prisma/schema.prisma
COPY --from=build /app/package.json ./

ENV NODE_ENV=production
EXPOSE 3001

USER appuser

CMD ["node", "dist/server.js"]
