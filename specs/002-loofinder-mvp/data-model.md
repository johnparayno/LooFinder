# Data Model: LooFinder MVP

**Branch**: `002-loofinder-mvp` | **Date**: 2025-03-10

## Entities

### Toilet

Primary entity representing a toilet location.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (UUID) | ✓ | Primary key |
| name | string | ✓ | Display name |
| address | string | ✓ | Street address |
| latitude | number | ✓ | WGS84 |
| longitude | number | ✓ | WGS84 |
| category | enum | ✓ | `free` \| `code_required` \| `purchase_required` |
| access_notes | string | | Optional notes (e.g., code location) |
| opening_hours | string | | Human-readable (e.g., "Mon–Fri 8–18") |
| source_type | enum | ✓ | `public_dataset` \| `user_submitted` |
| verification_status | enum | ✓ | `verified` \| `unverified` \| `needs_review` |
| last_verified_at | datetime | | When last verified |
| temporary_closed | boolean | ✓ | Default false |
| created_at | datetime | ✓ | Record creation |
| updated_at | datetime | ✓ | Last update |

**Validation**:
- latitude: -90 to 90
- longitude: -180 to 180
- name, address: non-empty, trimmed
- category, source_type, verification_status: enum values only

**State transitions**: verification_status may change from `unverified`/`needs_review` → `verified` (or back) via admin approval.

---

### UserSubmission

Proposed new toilet submitted by a user. Becomes a Toilet when approved.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (UUID) | ✓ | Primary key |
| name | string | ✓ | |
| address | string | ✓ | |
| latitude | number | ✓ | |
| longitude | number | ✓ | |
| category | enum | ✓ | Same as Toilet |
| access_notes | string | | |
| opening_hours | string | | |
| status | enum | ✓ | `pending` \| `approved` \| `rejected` \| `duplicate` |
| toilet_id | string (UUID) | | Set when approved; links to Toilet |
| created_at | datetime | ✓ | |
| reviewed_at | datetime | | When moderator acted |
| review_notes | string | | Moderator notes |

**Validation**: Same as Toilet for shared fields.

**Relationship**: When approved, a new Toilet is created with source_type=`user_submitted`, verification_status=`verified`. toilet_id references that Toilet.

---

### Report

User report of incorrect information for an existing toilet.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (UUID) | ✓ | Primary key |
| toilet_id | string (UUID) | ✓ | FK to Toilet |
| description | string | ✓ | User's report text |
| status | enum | ✓ | `pending` \| `resolved` \| `dismissed` |
| created_at | datetime | ✓ | |
| resolved_at | datetime | | |
| resolution_notes | string | | Moderator notes |

**Validation**: description non-empty, trimmed; toilet_id must exist.

---

### EditSuggestion

User-suggested change to an existing toilet. Does not modify Toilet until approved.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (UUID) | ✓ | Primary key |
| toilet_id | string (UUID) | ✓ | FK to Toilet |
| suggested_fields | JSON | ✓ | Object with field names and new values (e.g., `{ "opening_hours": "24/7" }`) |
| status | enum | ✓ | `pending` \| `approved` \| `rejected` |
| created_at | datetime | ✓ | |
| reviewed_at | datetime | | |
| review_notes | string | | |

**Validation**: toilet_id must exist; suggested_fields must only contain valid Toilet field names; values must pass Toilet validation for those fields.

**Relationship**: When approved, Toilet is updated with approved fields. Live record unchanged until then.

---

## Duplicate Detection

When a UserSubmission has same address or coordinates as an existing Toilet:
- Store the submission as normal
- Set status=`pending` and optionally flag `possible_duplicate` (boolean or metadata)
- Moderator decides: approve as new Toilet, reject as duplicate, or merge

---

## Indexes (SQLite)

- Toilet: (latitude, longitude) for spatial queries; (category, verification_status) for filters
- UserSubmission: (status), (created_at)
- Report: (toilet_id), (status)
- EditSuggestion: (toilet_id), (status)
