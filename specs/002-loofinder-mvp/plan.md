# Implementation Plan: LooFinder MVP

**Branch**: `002-loofinder-mvp` | **Date**: 2025-03-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-loofinder-mvp/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

LooFinder MVP is a mobile-first web platform helping users find toilets in Copenhagen. It delivers an interactive map (Leaflet + OpenStreetMap) with toilet markers, filters, search, and "Find nearest toilet"; a landing page; toilet detail views; user contributions (submit, report, suggest edit); and a placeholder donation flow. Technical approach: TypeScript/Node.js full-stack with Vite+React frontend, Express API, SQLite storage, and react-leaflet for the map—aligned with constitution simplicity-first and minimal dependencies.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20 LTS  
**Primary Dependencies**: Vite, React 18, Express, react-leaflet, Leaflet, better-sqlite3  
**Storage**: SQLite (better-sqlite3) for MVP; portable file, no daemon, fast iteration  
**Testing**: Vitest (unit), Playwright (e2e)  
**Target Platform**: Modern browsers (mobile-first), Node.js server  
**Project Type**: web-service (frontend + backend)  
**Performance Goals**: Map loads &lt;3s on mobile; 95% interactions &lt;1s (SC-002, SC-006)  
**Constraints**: Map page &lt;3s load; &lt;30s to locate nearest toilet with location permission  
**Scale/Scope**: Copenhagen-only MVP; hundreds of toilets; anonymous contributions; single-server deploy

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Simplicity-First** | ✓ PASS | SQLite over PostgreSQL; Vite over Next.js; single backend; no auth for contributions |
| **II. Technology Stack** | ✓ PASS | TypeScript, Node.js. Web UI uses React (constitution's Ink is for CLI; this is web). Leaflet+OSM per spec. Minimal deps: Vite, React, Express, react-leaflet, better-sqlite3 |
| **III. Code Quality** | ✓ PASS | No premature abstraction; readable code; composition over inheritance |
| **IV. Error Handling** | ✓ PASS | Explicit error handling; no silent failures; surface errors to user |

## Project Structure

### Documentation (this feature)

```text
specs/002-loofinder-mvp/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/          # Toilet, Report, EditSuggestion, UserSubmission
│   ├── services/        # toiletService, moderationService, seedService
│   └── api/             # Express routes: toilets, submissions, reports, edits
└── tests/

frontend/
├── src/
│   ├── components/      # Map, MarkerCluster, ToiletCard, FilterBar, etc.
│   ├── pages/           # Landing, Map, Donation, Submit, etc.
│   └── services/        # API client
└── tests/
```

**Structure Decision**: Web application with separate frontend and backend. Backend provides REST API for toilets, submissions, reports, and edit suggestions. Frontend is a SPA (Vite+React) with react-leaflet for the map. SQLite database file lives in backend. Single-server deployment: serve frontend build from Express static middleware.

## Complexity Tracking

> No constitution violations. Table omitted.
