# ── Build stage ──────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Runtime stage ────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
# Uploaded files live here (ephemeral on Cloud Run — use a GCS
# bucket or volume later if uploads must survive redeploys).
RUN mkdir -p uploads
EXPOSE 8080
CMD ["node", "dist/main.js"]
