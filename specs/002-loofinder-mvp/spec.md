# Feature Specification: LooFinder MVP

**Feature Branch**: `002-loofinder-mvp`  
**Created**: 2025-03-10  
**Status**: Draft  
**Input**: User description: "Build a mobile-first web platform called LooFinder that helps users find toilets in Copenhagen."

## Clarifications

### Session 2025-03-10

- Q: Should unverified toilets be visible on the map, and if so, how? → A: Show unverified toilets with clear visual distinction (e.g., different marker style, "Unverified" label).
- Q: What authentication is required for user contributions (submissions, reports, edit suggestions)? → A: Fully anonymous—no identifier required.
- Q: Which map provider/technology for the interactive map? → A: Leaflet + OpenStreetMap (free, no API key, open source).
- Q: Which payment provider for MVP donation flow? → A: Placeholder only (mock/disabled flow; real payments deferred).
- Q: When a user submits a toilet that may already exist (same address/coordinates), how should the system behave? → A: Flag for review—store submission; moderators decide if duplicate or new.

## Overview

LooFinder is a mobile-first web platform that helps users quickly locate nearby toilets in Copenhagen. The platform displays toilets on an interactive map with clear access conditions (free, code-required, or purchase-required) and supports both public dataset imports and user-submitted contributions. The MVP delivers a landing page, interactive map, toilet detail views, donation page, and user contribution flows.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find a Nearby Toilet (Priority: P1)

A person in Copenhagen needs to find a toilet urgently. They open LooFinder on their phone, see the map with toilet markers, and tap "Find nearest toilet" to get the closest option. They tap a marker to view access conditions and opening hours before deciding where to go.

**Why this priority**: Core value proposition—users must be able to locate and evaluate toilets quickly when on the go.

**Independent Test**: Can be fully tested by loading the map, granting location permission, and using "Find nearest toilet" to receive a result with access details. Delivers immediate value without any other features.

**Acceptance Scenarios**:

1. **Given** a user on the map page with location permission granted, **When** they tap "Find nearest toilet", **Then** the map centers on the nearest toilet and displays its detail card with name, address, category, access conditions, and opening hours.
2. **Given** a user viewing the map, **When** they tap a toilet marker, **Then** a detail card or panel appears showing name, address, category, access conditions, opening hours, source type, verification status, last verified date, and temporary closed status.
3. **Given** a user on the map, **When** they load the page, **Then** all toilet markers appear with distinct styles or colors for each category (free, code_required, purchase_required).
4. **Given** a user with location permission, **When** they view the map, **Then** their current location is shown on the map.

---

### User Story 2 - Browse and Filter Toilets (Priority: P1)

A user wants to find only free public toilets or only verified entries. They use the map filters to narrow results by category and verification status. When zoomed out, markers cluster for readability; when zoomed in, individual markers appear.

**Why this priority**: Filtering and clustering are essential for usability when many toilets are displayed.

**Independent Test**: Can be tested by applying category and verification filters and verifying only matching toilets appear. Clustering can be verified by zooming in and out.

**Acceptance Scenarios**:

1. **Given** a user on the map, **When** they filter by category (e.g., free only), **Then** only toilets in that category are shown.
2. **Given** a user on the map, **When** they filter by verification status (e.g., verified only), **Then** only toilets with that status are shown.
3. **Given** many toilets visible on the map, **When** the user zooms out, **Then** markers are clustered; when zooming in, **Then** individual markers appear.
4. **Given** a user on the map, **When** they search by address, neighborhood, or location name, **Then** the map centers on matching results and displays relevant toilets.

---

### User Story 3 - Understand the Platform (Priority: P2)

A new user visits LooFinder and wants to understand what it offers. They land on the homepage, read about the concept, learn about toilet categories (free, code-required, purchase-required), and navigate to the map or donation page.

**Why this priority**: Onboarding and trust—users need to understand the value before using the map.

**Independent Test**: Can be tested by visiting the landing page and verifying all content and navigation links work.

**Acceptance Scenarios**:

1. **Given** a user visits the homepage, **When** they read the content, **Then** they see a clear explanation of LooFinder, how it helps find toilets in Copenhagen, and the three toilet categories.
2. **Given** a user on the landing page, **When** they tap navigation to the map, **Then** they reach the interactive map page.
3. **Given** a user on the landing page, **When** they tap navigation to the donation page, **Then** they reach the donation page.

---

### User Story 4 - Submit a New Toilet (Priority: P2)

A user discovers a toilet not yet in LooFinder. They submit it via a form. The submission is stored with source_type "user_submitted" and verification_status "unverified" or "needs_review". It does not appear as verified until an admin approves it.

**Why this priority**: Crowdsourcing expands coverage; submissions must be tracked and moderated.

**Independent Test**: Can be tested by submitting a new toilet and verifying it is stored with correct source and verification status, and does not appear as verified on the public map until approved.

**Acceptance Scenarios**:

1. **Given** a user on the submission form, **When** they submit a new toilet with required fields (name, address, coordinates, category, etc.), **Then** the system stores it with source_type "user_submitted" and verification_status "unverified" or "needs_review".
2. **Given** a newly submitted toilet, **When** a user views the public map, **Then** the toilet appears with clear visual distinction (e.g., different marker style, "Unverified" label) so users can distinguish it from verified entries.
3. **Given** a user submission, **When** stored, **Then** the system preserves the origin (user_submitted) for the record.

---

### User Story 5 - Report Incorrect Information (Priority: P2)

A user finds wrong information for a toilet (e.g., wrong address or closed). They use the "report incorrect information" flow to submit a report. The report is stored for admin review.

**Why this priority**: Data quality depends on user feedback; reports enable corrections.

**Independent Test**: Can be tested by reporting an issue on an existing toilet and verifying the report is stored for moderation.

**Acceptance Scenarios**:

1. **Given** a user viewing a toilet detail, **When** they tap "Report incorrect information", **Then** they can submit a report describing the issue.
2. **Given** a submitted report, **When** stored, **Then** it is available for admin review and linked to the toilet record.

---

### User Story 6 - Suggest Edits to a Toilet (Priority: P2)

A user notices an error in a toilet's details (e.g., wrong opening hours). They suggest an edit. The suggestion is stored and does not change the live record until an admin approves it.

**Why this priority**: Enables incremental improvements without immediate publication.

**Independent Test**: Can be tested by suggesting an edit and verifying the suggestion is stored and the live record remains unchanged until approval.

**Acceptance Scenarios**:

1. **Given** a user viewing a toilet detail, **When** they tap "Suggest edit", **Then** they can submit suggested changes.
2. **Given** a submitted edit suggestion, **When** stored, **Then** the live toilet record is unchanged; the suggestion is queued for admin review.

---

### User Story 7 - Support the Project (Priority: P3)

A user wants to support LooFinder. They visit the donation page, read how donations help maintain and improve the toilet database, and complete a placeholder donation flow (mock/disabled; real payments deferred post-MVP).

**Why this priority**: Sustainability; lower than core map functionality.

**Independent Test**: Can be tested by visiting the donation page and completing the placeholder donation flow.

**Acceptance Scenarios**:

1. **Given** a user on the donation page, **When** they read the content, **Then** they see an explanation that donations help maintain and improve the toilet database and platform.
2. **Given** a user on the donation page, **When** they choose to donate, **Then** they can complete a placeholder donation flow (mock/disabled; real payments deferred post-MVP).

---

### Edge Cases

- What happens when the user denies location permission? The map still loads; "Find nearest toilet" either prompts for permission again or uses a fallback (e.g., map center or search).
- What happens when no toilets match the current filters? The map shows an empty state with a clear message; filters can be adjusted.
- What happens when search returns no results? The system displays a clear "no results" message and suggests broadening the search.
- What happens when the map loads with many toilets? Markers are clustered to avoid overlap; zooming in reveals individual markers.
- What happens when a toilet has missing optional fields (e.g., no opening hours)? The detail view shows available fields; missing fields are omitted or shown as "Not specified".
- What happens when a user submits a form with invalid or incomplete data? The system validates and returns clear error messages; submission is not stored until valid.
- What happens when a user submits a toilet that may already exist (same address/coordinates)? The submission is stored and flagged for moderator review; moderators decide if it is a duplicate or a new toilet.
- What happens when the donation payment fails? The user sees a clear error message and can retry or contact support.

## Requirements *(mandatory)*

### Functional Requirements

**Landing Page**

- **FR-001**: System MUST provide a landing page that explains the LooFinder concept in clear, lightweight language.
- **FR-002**: Landing page MUST describe how the platform helps people find toilets in Copenhagen.
- **FR-003**: Landing page MUST explain the three toilet categories: free public, code-required, and purchase-required.
- **FR-004**: Landing page MUST include navigation to the map and donation page.

**Interactive Map**

- **FR-005**: System MUST display an interactive map of Copenhagen with all toilet markers.
- **FR-006**: System MUST use distinct marker styles or colors for each toilet category (free, code_required, purchase_required).
- **FR-006a**: System MUST display unverified toilets on the map with clear visual distinction (e.g., different marker style or "Unverified" label) from verified toilets.
- **FR-007**: System MUST allow filtering by toilet category.
- **FR-008**: System MUST allow filtering by verification status.
- **FR-009**: System MUST show a detail card or panel when a marker is clicked.
- **FR-010**: System MUST support mobile usage with fast loading and simple interaction.
- **FR-011**: System MUST show the user's current location on the map when permission is granted.
- **FR-012**: System MUST provide a "Find nearest toilet" action.
- **FR-013**: System MUST support search by address, neighborhood, or location name.
- **FR-014**: System MUST cluster markers when many toilets are visible in the viewport.

**Toilet Detail View**

- **FR-015**: Toilet detail view MUST display: name, address, category, access conditions, opening hours, source type, verification status, last verified date, and temporary closed status.

**Toilet Data Model**

- **FR-016**: Each toilet MUST support: id, name, address, latitude, longitude, category (free, code_required, purchase_required), access_notes, opening_hours, source_type (public_dataset, user_submitted), verification_status (verified, unverified, needs_review), last_verified_at, temporary_closed (true/false).

**Donation Page**

- **FR-017**: System MUST provide a donation page explaining that donations help maintain and improve the toilet database and platform.
- **FR-018**: Donation page MUST provide a placeholder donation flow (mock/disabled); real payment integration is deferred post-MVP.

**User Contributions**

- **FR-019**: Users MUST be able to submit new toilets.
- **FR-020**: Users MUST be able to report incorrect information for existing toilets.
- **FR-021**: Users MUST be able to suggest edits to existing toilets.
- **FR-022**: User submissions and edits MUST NOT go live as verified automatically; they MUST be marked unverified or needs_review until approved.
- **FR-023**: System MUST preserve the origin (source_type) of each toilet record.
- **FR-023a**: System MUST allow fully anonymous contributions; no user identifier (email, account, etc.) is required for submissions, reports, or edit suggestions.

**Data Sources**

- **FR-024**: System MUST support public dataset entries as initial seed data.
- **FR-025**: System MUST support user-submitted entries stored in the same system with source tracking.
- **FR-026**: System MUST preserve the origin of each record.

**Moderation**

- **FR-027**: System MUST include a data model that supports moderation workflows (review submissions, edits, reports).
- **FR-028**: Admins MUST be able to review submitted toilets, edits, and reports; full admin dashboard UI is optional for MVP.
- **FR-029**: When a user submits a toilet that may match an existing record (same address or coordinates), the system MUST store the submission and flag it for moderator review; moderators decide whether it is a duplicate or a new toilet.

### Key Entities

- **Toilet**: A toilet location with id, name, address, latitude, longitude, category, access_notes, opening_hours, source_type, verification_status, last_verified_at, temporary_closed. Represents a single toilet record in the system.

- **User Submission**: A proposed new toilet submitted by a user. Linked to Toilet when approved; stored with source_type user_submitted and verification_status unverified or needs_review.

- **Report**: A user report of incorrect information for an existing toilet. Linked to a Toilet; stored for admin review.

- **Edit Suggestion**: A user-suggested change to an existing toilet. Linked to a Toilet; does not modify the live record until approved.

- **Admin/Moderator**: A role that can review submissions, edits, and reports. Data model supports this role; full UI optional for MVP.

## Assumptions

- Public toilet datasets for Copenhagen are available (e.g., municipal open data) and can be imported as seed data.
- The map will use Leaflet with OpenStreetMap tiles (free, no API key, open source); the system will be structured to support expansion beyond Copenhagen later.
- Donation flow uses a placeholder (mock/disabled) for MVP; real payment providers (Stripe, MobilePay, PayPal, etc.) can be added post-MVP.
- "Find nearest toilet" uses straight-line or simple distance; route-based navigation is out of scope for MVP.
- User contributions (submissions, reports, edit suggestions) are fully anonymous; no identifier (email, account, etc.) is required for MVP.
- Admin moderation can be performed via backend tools or a minimal UI; a full dashboard is not required for MVP launch.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can locate a nearby toilet and view its access conditions within 30 seconds of opening the map (with location permission).
- **SC-002**: Map page loads and displays toilet markers in under 3 seconds on a typical mobile connection.
- **SC-003**: Users can complete "Find nearest toilet" and view the detail card in under 3 taps from map load.
- **SC-004**: Users can filter by category and verification status and see filtered results update immediately.
- **SC-005**: Users can submit a new toilet, report incorrect information, or suggest an edit and receive confirmation that their contribution was received.
- **SC-006**: 95% of map interactions (tap marker, filter, search) respond within 1 second.
- **SC-007**: Platform supports both public dataset and user-submitted toilets with correct source tracking and verification status displayed to users.
