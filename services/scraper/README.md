# Scraper Service

Internal Facebook Marketplace scraping service.

## Endpoints

- `GET /health`
- `POST /v1/listing/fetch`
- `POST /v1/similar/enqueue`

All non-health endpoints require `Authorization: Bearer <SCRAPER_INTERNAL_TOKEN>`.

## Scripts

```bash
npm run api
npm run worker
npm run build
```

## Environment

- `SCRAPER_INTERNAL_TOKEN`
- `SCRAPER_PORT` (default `4010`)
- `REDIS_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SCRAPER_MAX_CONCURRENCY` (default `2`)
- `SCRAPER_MAX_ATTEMPTS` (default `3`)
- `SIMILAR_CACHE_TTL_HOURS` (default `12`)
- `SCRAPER_LOG_LEVEL` (default `info`)
