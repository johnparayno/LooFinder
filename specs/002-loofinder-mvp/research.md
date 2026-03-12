# Research: LooFinder MVP

**Branch**: `002-loofinder-mvp` | **Date**: 2025-03-10

## 1. Copenhagen Public Toilet Data Source

**Decision**: Use Copenhagen Toilets TMF dataset from opendata.dk (GeoJSON/CSV) for initial seed data. Alternative: FindToilet API (`https://beta.findtoilet.dk/api/v3/toilets`, term ID 2 for Copenhagen) for programmatic fetch.

**Rationale**: Official municipal dataset (CC0 license) on opendata.dk provides structured, authoritative data. GeoJSON format maps directly to our coordinate model. FindToilet API offers broader coverage (98 municipalities) if we expand later.

**Alternatives considered**: Scraping findtoilet.dk (rejected: brittle, violates ToS); manual CSV entry (rejected: not scalable).

---

## 2. Map Technology: Leaflet + React

**Decision**: react-leaflet v4 with Leaflet for the interactive map. TypeScript throughout. Vite for build (no SSR).

**Rationale**: Spec explicitly requires Leaflet + OpenStreetMap (free, no API key). react-leaflet is the standard React binding for Leaflet. MapContainer/TileLayer/Marker components; useMap() for imperative access. Leaflet does not support SSR—Vite SPA is appropriate.

**Alternatives considered**: Mapbox (rejected: API key, cost); Google Maps (rejected: API key, cost); vanilla Leaflet without React (rejected: harder to integrate with React state for filters/clustering).

---

## 3. Marker Clustering

**Decision**: Use leaflet.markercluster (react-leaflet-cluster or leaflet.markercluster) for clustering when many toilets are visible.

**Rationale**: Spec FR-014 requires clustering when many toilets in viewport. Standard Leaflet plugin; well-maintained; React integration available.

**Alternatives considered**: Custom clustering (rejected: reinventing wheel); no clustering (rejected: violates FR-014).

---

## 4. Storage: SQLite vs PostgreSQL

**Decision**: SQLite with better-sqlite3 for MVP.

**Rationale**: Constitution favors simplicity. SQLite: single file, no daemon, fast iteration, portable. better-sqlite3 is synchronous and performant for read-heavy workloads. MVP has low write concurrency (anonymous submissions). PostgreSQL can be adopted later if scaling or multi-server deployment is needed.

**Alternatives considered**: PostgreSQL (rejected for MVP: extra setup, overkill for MVP scale); in-memory (rejected: data loss on restart).

---

## 5. Web Framework: Vite vs Next.js

**Decision**: Vite + React for frontend; Express for backend.

**Rationale**: simpler than Next.js for this use case. No SSR needed (map is client-only). Clear separation: frontend SPA, backend API. Single deploy: Express serves built frontend from static folder. Vite is fast and minimal.

**Alternatives considered**: Next.js (rejected: heavier for SPA-only; Leaflet SSR issues); Create React App (rejected: deprecated, Vite is preferred).

---

## 6. Testing: Vitest + Playwright

**Decision**: Vitest for unit tests; Playwright for e2e tests.

**Rationale**: Vitest is Vite-native, fast, TypeScript-first. Playwright is standard for browser e2e; supports mobile viewport. Aligns with success criteria (SC-1 through SC-7) for automated verification.

**Alternatives considered**: Jest (rejected: slower, Vite integration less seamless); Cypress (rejected: Playwright has better mobile support).

---

## 7. Anonymous Contributions

**Decision**: No user identifier (email, account) required. Store submissions, reports, and edit suggestions with no auth.

**Rationale**: Spec clarification: "Fully anonymous—no identifier required." Reduces friction; aligns with constitution simplicity. Moderation is queue-based; admin reviews by content, not by user.

**Alternatives considered**: Optional email (rejected: adds complexity, spec says fully anonymous); CAPTCHA (deferred: can add if spam becomes an issue).
