# =====================================================================
# Superleap CRM — Frontend production image
# Multi-stage: Node build → nginx runtime
# =====================================================================

# ---------- 1. Build stage ----------
FROM node:20-alpine AS build

WORKDIR /app

# Copy manifests first for better layer caching
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# Copy source and build
COPY tsconfig.json vite.config.ts index.html ./
COPY src ./src
COPY scripts ./scripts

# Build-time env vars (override at build time: --build-arg VITE_SUPABASE_URL=...)
ARG VITE_USE_MOCK_DATA=false
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_C24_VEHICLE_URL
ARG VITE_C24_PARTNERS_LEAD_URL
ARG VITE_OLA_MAPS_API_KEY
ENV VITE_USE_MOCK_DATA=$VITE_USE_MOCK_DATA \
    VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_C24_VEHICLE_URL=$VITE_C24_VEHICLE_URL \
    VITE_C24_PARTNERS_LEAD_URL=$VITE_C24_PARTNERS_LEAD_URL \
    VITE_OLA_MAPS_API_KEY=$VITE_OLA_MAPS_API_KEY

RUN npm run build

# ---------- 2. Runtime stage ----------
FROM nginx:1.27-alpine AS runtime

# Non-root user already exists in nginx image as `nginx`
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 8080

# Healthcheck hits nginx status
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1

# nginx runs in foreground
CMD ["nginx", "-g", "daemon off;"]
