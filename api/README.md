# Skorbord API

This is the backend for the Skorbord Card Scoring App. It uses Node.js, Express, Socket.IO, and SQLite, following best practices for real-time, mobile-first, and Raspberry Pi-optimized deployments.

## Structure

- `src/` – Main source code (Express app, Socket.IO, DB, routes, middleware)
- `migrations/` – SQLite migration scripts (idempotent)
- `seeds/` – Seed data scripts
- `openapi.yaml` – OpenAPI (Swagger) spec for REST API
- `skorbord-api.http` – HTTP file for manual API testing

## Running

```sh
npm install
npm run dev # or npm start
```

## Migrations

```sh
npm run migrate
```

## Real-time API

Socket.IO is available at `/` (default namespace). See `src/socket/` for event handlers.

## API Documentation & Testing

- **OpenAPI spec:** See `openapi.yaml` for a full description of REST endpoints. You can view this file in Swagger UI or compatible tools.
- **Manual testing:** Use `skorbord-api.http` with the REST Client VS Code extension or similar tools to manually test endpoints.

---

See the main project README for full details.
