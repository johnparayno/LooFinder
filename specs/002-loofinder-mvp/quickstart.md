# Quickstart: LooFinder MVP

**Branch**: `002-loofinder-mvp` | **Date**: 2025-03-10

## Prerequisites

- Node.js 20 LTS
- npm or pnpm

## Setup

```bash
# Clone and navigate to project
cd /Users/johnparayno/LooFinder
git checkout 002-loofinder-mvp

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

## Database

SQLite database is created automatically on first run. Seed data can be loaded via:

```bash
cd backend
npm run seed
```

## Run Development

**Terminal 1 – Backend**:
```bash
cd backend
npm run dev
```
API: http://localhost:3000

**Terminal 2 – Frontend**:
```bash
cd frontend
npm run dev
```
App: http://localhost:5173 (Vite default)

Frontend proxies API requests to backend during development (configure in `vite.config.ts`).

## Run Production Build

```bash
# Build frontend
cd frontend && npm run build

# Build backend (serves frontend from dist/)
cd backend && npm run build && npm start
```

Single server: http://localhost:3000 serves both API and static frontend.

## Key Scripts

| Location | Script | Purpose |
|----------|--------|---------|
| backend | `npm run dev` | Start API with hot reload |
| backend | `npm run seed` | Load Copenhagen toilet seed data |
| backend | `npm run test` | Run Vitest unit tests |
| frontend | `npm run dev` | Start Vite dev server |
| frontend | `npm run build` | Build for production |
| frontend | `npm run test` | Run Vitest unit tests |
| frontend | `npm run test:e2e` | Run Playwright e2e tests |

## Environment

- `PORT` (backend): Server port (default 3000)
- `DATABASE_PATH` (backend): Path to SQLite file (default `./data/loofinder.db`)

## Troubleshooting: No Data on Map

1. **Run both servers**: Backend (port 3000) and frontend (port 5173). Visit **http://localhost:5173** (not 3000) during development.
2. **Seed the database**: From the `backend` folder: `npm run seed`. You should see "Seeded N toilets".
3. **Restart backend after seeding**: If the backend was running before the first seed, restart it: stop with Ctrl+C, then `npm run dev` again.
4. **Port conflict**: If port 3000 is in use, stop the other process or set `PORT=3001` in backend `.env`.
5. **Database path**: Ensure you run `npm run seed` and `npm run dev` from the `backend` directory so both use `./data/loofinder.db`.

## API Quick Reference

See [contracts/api.md](./contracts/api.md) for full API spec.
