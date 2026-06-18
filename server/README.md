# DreamTwin Node API

This directory contains the first minimal DreamTwin backend skeleton.

It is intentionally small:

- Node + TypeScript
- local JSON storage in `.dreamtwin-local/`
- DeepSeek provider adapter behind server routes
- no real auth, friend graph, or chat backend yet

## Scripts

Build frontend and backend:

```bash
npm run build
```

Build only the backend:

```bash
npm run server:build
```

Start the backend after a build:

```bash
npm run server:start
```

Build and start the backend:

```bash
npm run server:dev
```

The default server URL is:

```text
http://127.0.0.1:8787
```

## Environment

DeepSeek is configured only through a server-side environment variable:

```bash
export DEEPSEEK_API_KEY="your-key"
npm run server:dev
```

Security rules:

- Never put the real key in frontend code.
- Never commit the real key.
- Never write the real key into docs, `.env` files, or build artifacts.
- Frontend code should call DreamTwin API routes, not DeepSeek directly.

## Current endpoints

```text
GET   /api/health
GET   /api/me/profile
PATCH /api/me/profile
GET   /api/me/twin
POST  /api/twins
POST  /api/ai/twin-summary
POST  /api/ai/relationship-simulation
```

## Quick checks

Health:

```bash
curl -sS http://127.0.0.1:8787/api/health
```

Profile:

```bash
curl -sS http://127.0.0.1:8787/api/me/profile
```

Create a local fallback twin:

```bash
curl -sS -X POST http://127.0.0.1:8787/api/twins \
  -H 'Content-Type: application/json' \
  -d '{}'
```

Generate a twin summary:

```bash
curl -sS -X POST http://127.0.0.1:8787/api/ai/twin-summary \
  -H 'Content-Type: application/json' \
  -d '{}'
```

Generate a relationship simulation:

```bash
curl -sS -X POST http://127.0.0.1:8787/api/ai/relationship-simulation \
  -H 'Content-Type: application/json' \
  -d '{"counterpartName":"Nora","scene":"雨夜便利店"}'
```

If `DEEPSEEK_API_KEY` is missing, AI routes return `missing_api_key` with a blocked generation job.
