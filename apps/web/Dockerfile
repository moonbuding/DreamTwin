# DreamTwins deployment image.
# Build on Mac, run on amd64 ECS. The frontend is served by nginx and /api is
# proxied to the Node API container in docker compose.

FROM public.ecr.aws/docker/library/node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM public.ecr.aws/docker/library/node:20-alpine AS builder
WORKDIR /app

ARG VITE_DREAMTWIN_API_URL=/
ENV VITE_DREAMTWIN_API_URL=${VITE_DREAMTWIN_API_URL}

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
RUN npm prune --omit=dev

FROM public.ecr.aws/docker/library/node:20-alpine AS api-runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8787

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist-server ./dist-server

EXPOSE 8787
CMD ["node", "dist-server/server/index.js"]

FROM public.ecr.aws/docker/library/nginx:1.27-alpine AS web-runner

COPY deploy/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
