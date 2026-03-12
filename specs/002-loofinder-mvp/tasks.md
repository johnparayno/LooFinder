---
description: "Task list for LooFinder MVP implementation"
---

# Tasks: LooFinder MVP

**Input**: Design documents from `/specs/002-loofinder-mvp/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US7)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`, `backend/tests/`
- **Frontend**: `frontend/src/`, `frontend/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create project structure: `backend/`, `frontend/`, `backend/src/`, `frontend/src/` per plan.md
- [X] T002 Initialize backend with TypeScript 5.x, Node 20, Express, better-sqlite3 in `backend/package.json`
- [X] T003 Initialize frontend with Vite, React 18, TypeScript in `frontend/package.json`
- [X] T004 [P] Configure ESLint and Prettier for backend in `backend/`
- [X] T005 [P] Configure ESLint and Prettier for frontend in `frontend/`
- [X] T006 Configure frontend Vite proxy to backend API in `frontend/vite.config.ts`
- [X] T007 Add npm scripts: backend `dev`, `build`, `start`, `seed`, `test`; frontend `dev`, `build`, `test`, `test:e2e` per quickstart.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T008 Create SQLite schema: toilets, user_submissions, reports, edit_suggestions tables in `backend/src/db/schema.ts`
- [X] T009 [P] Create Toilet model with validation in `backend/src/models/toilet.ts`
- [X] T010 [P] Create UserSubmission model in `backend/src/models/userSubmission.ts`
- [X] T011 [P] Create Report model in `backend/src/models/report.ts`
- [X] T012 [P] Create EditSuggestion model in `backend/src/models/editSuggestion.ts`
- [X] T013 Implement seed service to load Copenhagen toilet data (opendata.dk or FindToilet API) in `backend/src/services/seedService.ts`
- [X] T014 Create Express app with CORS, JSON middleware, error handling in `backend/src/index.ts`
- [X] T015 Setup API routing structure and base `/api` prefix in `backend/src/api/`
- [X] T016 Configure environment: PORT, DATABASE_PATH in `backend/` per quickstart.md

**Checkpoint**: Foundation ready—user story implementation can now begin

---

## Phase 3: User Story 1 – Find a Nearby Toilet (Priority: P1) 🎯 MVP

**Goal**: User can open the map, see toilet markers, tap "Find nearest toilet" to get the closest option, and view access details in a detail card.

**Independent Test**: Load map, grant location permission, tap "Find nearest toilet" → receive result with access details. View marker tap → detail card appears.

- [X] T017 [US1] Implement toiletService: list (with bbox), getById, findNearest in `backend/src/services/toiletService.ts`
- [X] T018 [US1] Implement GET /api/toilets, GET /api/toilets/:id, GET /api/toilets/nearest in `backend/src/api/toilets.ts`
- [X] T019 [US1] Create API client for toilets endpoints in `frontend/src/services/api.ts`
- [X] T020 [US1] Create Map page with Leaflet, TileLayer (OSM) in `frontend/src/pages/MapPage.tsx`
- [X] T021 [US1] Add toilet markers with distinct styles per category (free, code_required, purchase_required) in `frontend/src/components/ToiletMarkers.tsx`
- [X] T022 [US1] Add ToiletCard component showing name, address, category, access conditions, opening hours, source, verification status in `frontend/src/components/ToiletCard.tsx`
- [X] T023 [US1] Implement marker click → show ToiletCard; "Find nearest toilet" button → center map and show nearest toilet card in `frontend/src/pages/MapPage.tsx`
- [X] T024 [US1] Add user location display on map when permission granted in `frontend/src/pages/MapPage.tsx`
- [X] T025 [US1] Style unverified toilets with distinct marker/label per FR-006a in `frontend/src/components/ToiletMarkers.tsx`

**Checkpoint**: User Story 1 fully functional—map, markers, find nearest, detail card, user location

---

## Phase 4: User Story 2 – Browse and Filter Toilets (Priority: P1)

**Goal**: User can filter by category and verification status, see clustered markers when zoomed out, and search by address/neighborhood.

**Independent Test**: Apply category filter → only matching toilets shown. Apply verification filter → only matching toilets. Zoom out → clusters; zoom in → individual markers. Search → map centers on results.

- [X] T026 [US2] Add category and verification_status query params to GET /api/toilets in `backend/src/api/toilets.ts`
- [X] T027 [US2] Add search (address, neighborhood, location name) support to toiletService in `backend/src/services/toiletService.ts`
- [X] T028 [US2] Add search query param to GET /api/toilets in `backend/src/api/toilets.ts`
- [X] T029 [US2] Create FilterBar component (category, verification status) in `frontend/src/components/FilterBar.tsx`
- [X] T030 [US2] Integrate FilterBar with MapPage; pass filters to API client in `frontend/src/pages/MapPage.tsx`
- [X] T031 [US2] Add leaflet.markercluster (or react-leaflet-cluster) for marker clustering in `frontend/src/components/ToiletMarkers.tsx`
- [X] T032 [US2] Create SearchBar component; wire to API and center map on results in `frontend/src/components/SearchBar.tsx`
- [X] T033 [US2] Add empty state when no toilets match filters in `frontend/src/pages/MapPage.tsx`

**Checkpoint**: User Stories 1 and 2 both work—map with filters, clustering, search

---

## Phase 5: User Story 3 – Understand the Platform (Priority: P2)

**Goal**: New user visits landing page, reads about LooFinder, toilet categories, and navigates to map or donation page.

**Independent Test**: Visit landing page → see explanation, categories, navigation links. Tap map → map page. Tap donation → donation page.

- [X] T034 [US3] Create Landing page with LooFinder concept, how it helps, three toilet categories in `frontend/src/pages/LandingPage.tsx`
- [X] T035 [US3] Add navigation (map, donation) to Landing page in `frontend/src/pages/LandingPage.tsx`
- [X] T036 [US3] Setup client-side routing (React Router) with routes: /, /map, /donate in `frontend/src/App.tsx`
- [X] T037 [US3] Add shared layout/nav component linking Landing, Map, Donation in `frontend/src/components/Layout.tsx`

**Checkpoint**: Landing page and navigation functional

---

## Phase 6: User Story 4 – Submit a New Toilet (Priority: P2)

**Goal**: User can submit a new toilet via form; stored with source_type user_submitted, verification_status unverified/needs_review; appears on map with distinct style until approved.

**Independent Test**: Submit new toilet → stored correctly. View map → unverified toilet visible with distinct style.

- [X] T038 [US4] Implement submission service: create UserSubmission, optional duplicate check in `backend/src/services/submissionService.ts`
- [X] T039 [US4] Implement POST /api/submissions in `backend/src/api/submissions.ts`
- [X] T040 [US4] Create Submit page with form (name, address, lat/lng, category, access_notes, opening_hours) in `frontend/src/pages/SubmitPage.tsx`
- [X] T041 [US4] Add form validation and API call to POST /api/submissions in `frontend/src/pages/SubmitPage.tsx`
- [X] T042 [US4] Add navigation link to Submit page from map/detail view in `frontend/src/components/Layout.tsx` or ToiletCard
- [X] T043 [US4] Ensure GET /api/toilets returns user_submitted toilets with unverified/needs_review for map display in `backend/src/services/toiletService.ts`

**Checkpoint**: User can submit toilets; they appear on map as unverified

---

## Phase 7: User Story 5 – Report Incorrect Information (Priority: P2)

**Goal**: User can report incorrect info for a toilet; report stored for admin review.

**Independent Test**: View toilet detail → tap "Report incorrect information" → submit report → stored and linked to toilet.

- [X] T044 [US5] Implement report service: create Report linked to toilet in `backend/src/services/reportService.ts`
- [X] T045 [US5] Implement POST /api/reports in `backend/src/api/reports.ts`
- [X] T046 [US5] Add "Report incorrect information" button to ToiletCard in `frontend/src/components/ToiletCard.tsx`
- [X] T047 [US5] Create ReportModal or inline form; submit to POST /api/reports in `frontend/src/components/ReportModal.tsx`

**Checkpoint**: User can report incorrect toilet info

---

## Phase 8: User Story 6 – Suggest Edits to a Toilet (Priority: P2)

**Goal**: User can suggest edits; suggestion stored; live record unchanged until admin approval.

**Independent Test**: View toilet detail → tap "Suggest edit" → submit suggested fields → stored; live toilet unchanged.

- [X] T048 [US6] Implement editSuggestion service: create EditSuggestion, validate suggested_fields in `backend/src/services/editSuggestionService.ts`
- [X] T049 [US6] Implement POST /api/edit-suggestions in `backend/src/api/editSuggestions.ts`
- [X] T050 [US6] Add "Suggest edit" button to ToiletCard in `frontend/src/components/ToiletCard.tsx`
- [X] T051 [US6] Create EditSuggestionModal with form for suggested fields (opening_hours, access_notes, etc.) in `frontend/src/components/EditSuggestionModal.tsx`

**Checkpoint**: User can suggest edits; suggestions queued for review

---

## Phase 9: User Story 7 – Support the Project (Priority: P3)

**Goal**: User visits donation page, reads about donations, completes placeholder donation flow (mock/disabled).

**Independent Test**: Visit donation page → read content → complete placeholder flow → see demo success message.

- [X] T052 [US7] Implement POST /api/donation placeholder (mock response) in `backend/src/api/donation.ts`
- [X] T053 [US7] Create Donation page with explanation and placeholder form in `frontend/src/pages/DonationPage.tsx`
- [X] T054 [US7] Wire donation form to POST /api/donation; show demo success message in `frontend/src/pages/DonationPage.tsx`

**Checkpoint**: Donation page and placeholder flow work

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T055 [P] Add location permission denied fallback: map still loads; "Find nearest" prompts or uses map center in `frontend/src/pages/MapPage.tsx`
- [X] T056 [P] Add "no results" message for search and empty filters in `frontend/src/pages/MapPage.tsx`
- [X] T057 Configure Express to serve frontend build from `frontend/dist/` in production in `backend/src/index.ts`
- [X] T058 Run quickstart.md validation: dev setup, seed, production build, single-server deploy

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies—can start immediately
- **Foundational (Phase 2)**: Depends on Setup—BLOCKS all user stories
- **User Stories (Phase 3–9)**: All depend on Foundational
  - US1, US2: Can proceed in parallel after Foundational (both need map/toilets)
  - US3: Independent (landing, routing)
  - US4, US5, US6: Depend on US1 (need map/detail view for context)
  - US7: Independent (donation page)
- **Polish (Phase 10)**: Depends on desired user stories complete

### User Story Dependencies

- **US1 (P1)**: After Foundational—no other story dependencies
- **US2 (P1)**: After Foundational—extends US1 map
- **US3 (P2)**: After Foundational—independent
- **US4 (P2)**: After US1 (needs map and detail view)
- **US5 (P2)**: After US1 (needs ToiletCard)
- **US6 (P2)**: After US1 (needs ToiletCard)
- **US7 (P3)**: After Foundational—independent

### Parallel Opportunities

- T004, T005: Linting setup in parallel
- T009–T012: All models in parallel
- US1 + US2: Can overlap (map work shared)
- US3 + US7: Landing and Donation can be built in parallel
- T055, T056: Polish tasks in parallel

---

## Parallel Example: User Story 1

```bash
# After T016–T018 (API ready), frontend tasks can proceed:
# T019–T020: API client + Map page
# T021, T022: ToiletMarkers + ToiletCard (can build in parallel)
# T023–T025: Integration in MapPage
```

---

## Implementation Strategy

### MVP First (User Stories 1–2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Complete Phase 4: User Story 2
5. **STOP and VALIDATE**: Test map, find nearest, filters, clustering, search
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Test independently → MVP core
3. Add US2 → Test independently → Full map experience
4. Add US3 → Landing + navigation
5. Add US4, US5, US6 → User contributions
6. Add US7 → Donation placeholder
7. Polish → Edge cases, production config

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to user story for traceability
- Each user story independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
