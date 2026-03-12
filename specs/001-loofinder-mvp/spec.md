# Feature Specification: LooFinder MVP

**Feature Branch**: `001-loofinder-mvp`  
**Created**: 2025-03-10  
**Status**: Draft  
**Input**: User description: "Build a mobile-first web platform called LooFinder that helps users find toilets in Copenhagen"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find a Nearby Toilet (Priority: P1)

A person in Copenhagen needs to find a toilet quickly. They open LooFinder on their phone, see their location on a map with nearby toilet markers, tap a marker to view details, and choose one that fits their needs (free, code-required, or purchase-required).

**Why this priority**: Core value proposition—users must be able to locate toilets quickly when on the go.

**Independent Test**: Can be fully tested by loading the map, viewing toilet markers, and opening a detail card. Delivers immediate value even without other features.

**Acceptance Scenarios**:

1. **Given** a user on the map page, **When** the page loads, **Then** all toilet markers appear on the map with distinct styles per category (free, code_required, purchase_required).
2. **Given** a user viewing the map, **When** they tap a toilet marker, **Then** a detail card or panel appears showing name, address, category, access conditions, opening hours, and verification status.
3. **Given** a user who has granted location permission, **When** they view the map, **Then** their current location is shown.
4. **Given** a user on the map, **When** they use "find nearest toilet", **Then** the map focuses on the closest toilet and shows its details.
5. **Given** many toilets visible on the map, **When** the user zooms out, **Then** markers are clustered for readability.
6. **Given** a user on the map, **When** they filter by category or verification status, **Then** only matching toilets are shown.

---

### User Story 2 - Understand the Platform (Priority: P2)

A visitor discovers LooFinder and wants to understand what it offers before using the map. They land on the homepage, read about the concept and toilet categories, and navigate to the map or donation page.

**Why this priority**: Users need context before trusting the platform; clear navigation enables discovery.

**Independent Test**: Can be tested by visiting the landing page, reading content, and verifying navigation links work.

**Acceptance Scenarios**:

1. **Given** a user visits the homepage, **When** they land on the page, **Then** they see a clear explanation of LooFinder and how it helps find toilets in Copenhagen.
2. **Given** a user on the landing page, **When** they read the content, **Then** they understand the three toilet categories: free public, code-required, and purchase-required.
3. **Given** a user on the landing page, **When** they want to use the map, **Then** they can navigate to the map via a clear link.
4. **Given** a user on the landing page, **When** they want to support the project, **Then** they can navigate to the donation page via a clear link.

---

### User Story 3 - Search for a Toilet by Location (Priority: P2)

A user knows they will be near a specific address, neighborhood, or landmark. They search for that location or name, and the map shows relevant toilets in that area.

**Why this priority**: Search reduces friction when users plan ahead or know their destination.

**Independent Test**: Can be tested by entering an address, neighborhood, or location name and verifying the map updates and shows relevant results.

**Acceptance Scenarios**:

1. **Given** a user on the map page, **When** they search by address, neighborhood, or location name, **Then** the map updates to show toilets in that area.
2. **Given** a user on the map page, **When** the search returns results, **Then** the map centers on the search area and displays matching toilets.

---

### User Story 4 - Submit a New Toilet (Priority: P3)

A user discovers a toilet that is not listed. They submit a new toilet with details (name, address, category, access notes, etc.). The submission is stored but not shown as verified until reviewed.

**Why this priority**: Crowdsourcing expands the database; lower priority than core discovery.

**Independent Test**: Can be tested by completing the submission form and verifying the submission is stored with unverified or needs_review status.

**Acceptance Scenarios**:

1. **Given** a user on the platform, **When** they access the submission form, **Then** they can enter toilet details: name, address, coordinates, category, access notes, opening hours.
2. **Given** a user submits a new toilet, **When** the submission is saved, **Then** it is stored with source_type user_submitted and verification_status unverified or needs_review.
3. **Given** a user who submitted a toilet, **When** the submission is not yet approved, **Then** the toilet does not appear as verified on the map (or does not appear until approved, depending on moderation policy).

---

### User Story 5 - Report Incorrect Information (Priority: P3)

A user finds incorrect information for an existing toilet (wrong address, closed, wrong category). They report the issue and the system records it for review.

**Why this priority**: Data quality matters; lower priority than discovery and contribution.

**Independent Test**: Can be tested by reporting an issue on an existing toilet and verifying the report is stored for moderation.

**Acceptance Scenarios**:

1. **Given** a user viewing a toilet detail, **When** they tap "report incorrect information", **Then** they can describe the issue and submit.
2. **Given** a user submits a report, **When** the report is saved, **Then** it is stored and associated with the toilet for admin review.

---

### User Story 6 - Suggest Edits to an Existing Toilet (Priority: P3)

A user notices incorrect or missing details for a toilet (e.g., wrong opening hours). They suggest an edit. The edit is stored but not applied until approved.

**Why this priority**: Improves data quality; same tier as contribution and reporting.

**Independent Test**: Can be tested by suggesting an edit for an existing toilet and verifying the suggestion is stored with needs_review status.

**Acceptance Scenarios**:

1. **Given** a user viewing a toilet detail, **When** they tap "suggest edit", **Then** they can propose changes to the toilet details.
2. **Given** a user submits an edit suggestion, **When** the suggestion is saved, **Then** the original toilet data is unchanged until an admin approves; the suggestion is stored for review.

---

### User Story 7 - Support the Project (Priority: P3)

A user wants to support LooFinder. They visit the donation page, read about how donations help maintain the database, and complete a donation (or use a placeholder flow if MVP is not yet integrated).

**Why this priority**: Sustainability; lower priority than core discovery and contribution.

**Independent Test**: Can be tested by visiting the donation page, reading the content, and completing the donation flow (or placeholder).

**Acceptance Scenarios**:

1. **Given** a user visits the donation page, **When** they land on the page, **Then** they see an explanation that donations help maintain and improve the toilet database and platform.
2. **Given** a user on the donation page, **When** they choose to donate, **Then** they can complete a donation via Stripe, MobilePay, PayPal, or a placeholder flow (MVP may use placeholder).
3. **Given** a user completes a donation, **When** the flow finishes, **Then** they receive confirmation (or placeholder confirmation).

---

### Edge Cases

- What happens when the user denies location permission? The map still loads and shows toilets; "find nearest toilet" and current-location features are disabled or show a prompt to enable.
- What happens when no toilets match the current filters? The map shows an empty state with a message and option to clear filters.
- What happens when search returns no results? The map shows an empty state or message indicating no toilets found for that query.
- What happens when the user submits a form with invalid or missing required fields? The system shows validation errors and does not submit until valid.
- What happens when many toilets are in view and markers overlap? Markers are clustered; tapping a cluster expands to show individual markers.
- What happens when a toilet is temporarily closed? The detail view shows this status clearly; optionally the marker style can indicate temporary closure.
- What happens when opening hours are unknown? The detail view shows "unknown" or equivalent; the field is optional.

## Requirements *(mandatory)*

### Functional Requirements

**Landing Page**

- **FR-001**: The platform MUST provide a landing page that explains the LooFinder concept and how it helps users find toilets in Copenhagen.
- **FR-002**: The landing page MUST describe the three toilet categories: free public, code-required, and purchase-required.
- **FR-003**: The landing page MUST include clear navigation to the map page.
- **FR-004**: The landing page MUST include clear navigation to the donation page.
- **FR-005**: The landing page MUST be lightweight and simple.

**Interactive Map**

- **FR-006**: The platform MUST display an interactive map of Copenhagen showing toilet locations.
- **FR-007**: Each toilet MUST support the following fields: id, name, address, latitude, longitude, category (free, code_required, purchase_required), access_notes, opening_hours, source_type (public_dataset, user_submitted), verification_status (verified, unverified, needs_review), last_verified_at, temporary_closed (true/false).
- **FR-008**: The map MUST show all toilet markers with distinct styles or colors per category.
- **FR-009**: The map MUST allow filtering by toilet category.
- **FR-010**: The map MUST allow filtering by verification status.
- **FR-011**: When a marker is clicked, the map MUST show a detail card or panel.
- **FR-012**: The map MUST support mobile usage with fast loading and simple interaction.
- **FR-013**: The map MUST show the user's current location when permission is granted.
- **FR-014**: The map MUST include a "find nearest toilet" action.
- **FR-015**: The map MUST support search by address, neighborhood, or location name.
- **FR-016**: The map MUST cluster markers when many toilets are visible.
- **FR-017**: The toilet detail view MUST show: name, address, category, access conditions, opening hours, source type, verification status, last verified date, and temporary closed status.

**Donation Page**

- **FR-018**: The platform MUST provide a donation page explaining that donations help maintain and improve the toilet database and platform.
- **FR-019**: The donation page MUST support a donation flow; the MVP MAY use Stripe, MobilePay, PayPal, or a placeholder flow.

**User Contribution**

- **FR-020**: Users MUST be able to submit new toilets.
- **FR-021**: Users MUST be able to report incorrect information for existing toilets.
- **FR-022**: Users MUST be able to suggest edits to existing toilets.
- **FR-023**: User submissions and edits MUST NOT go live as verified automatically; they MUST be marked unverified or needs_review until approved.
- **FR-024**: The system MUST preserve the origin (source_type) of each toilet record.

**Data & Moderation**

- **FR-025**: The platform MUST support both public dataset entries and crowdsourced user submissions.
- **FR-026**: Public dataset entries MAY be imported as initial seed data.
- **FR-027**: User-submitted entries MUST be stored in the same system with source tracking.
- **FR-028**: The system MUST include a basic admin-ready data model for moderation.
- **FR-029**: The data structure MUST support admins reviewing submitted toilets, edits, and reports; a full admin dashboard UI is optional for MVP.

**Technical Direction**

- **FR-030**: The platform MUST be built as a responsive web application with a strong mobile-first experience.
- **FR-031**: The platform MUST be optimized for users on the go who need fast access to toilet information.
- **FR-032**: The system MUST be structured so it can later expand beyond Copenhagen.

### Key Entities

- **Toilet**: A toilet location with id, name, address, latitude, longitude, category (free, code_required, purchase_required), access_notes, opening_hours, source_type (public_dataset, user_submitted), verification_status (verified, unverified, needs_review), last_verified_at, temporary_closed.
- **Toilet Submission**: A user-submitted new toilet; linked to Toilet when approved; has same fields as Toilet plus submission metadata.
- **Edit Suggestion**: A proposed change to an existing toilet; references the toilet and stores proposed values; has review status.
- **Report**: A user report of incorrect information; references a toilet and includes description of the issue; has review status.
- **Donation**: A donation record (if tracking); amount, method, timestamp; optional for MVP placeholder.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can find and view details of a nearby toilet within 30 seconds of opening the platform on a mobile device.
- **SC-002**: The map page loads and displays toilet markers in under 3 seconds on a typical mobile connection.
- **SC-003**: Users can complete the "find nearest toilet" flow in under 10 seconds when location permission is granted.
- **SC-004**: Users can submit a new toilet in under 2 minutes using the submission form.
- **SC-005**: The platform works on mobile viewports (320px width and up) without horizontal scrolling or broken layout.
- **SC-006**: Search by address or location name returns relevant results when matching toilets exist.
- **SC-007**: Filtering by category or verification status correctly shows only matching toilets.
- **SC-008**: User submissions and edit suggestions are stored with correct source and verification status and do not appear as verified until approved.

## Assumptions

- Copenhagen is the initial geographic scope; the data model and structure support future expansion to other cities.
- Public toilet datasets exist or can be obtained for Copenhagen (e.g., municipal open data).
- Location permission is optional; users can still use the map without it.
- No user accounts are required for MVP; submissions and reports may be anonymous.
- The donation flow may use a placeholder (e.g., "Coming soon" or a simple form) if payment integration is deferred.
- Admin moderation tools may be implemented as a minimal backend/data model; a full admin UI can be added later.
- Marker clustering is used when the user zooms out to a level where many toilets are visible (e.g., 10+ markers in view).

## Out of Scope (MVP)

- Full user accounts
- Comments and ratings/reviews
- Native mobile apps
- Advanced moderation tools
- Route navigation inside the app
