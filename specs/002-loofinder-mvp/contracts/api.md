# API Contract: LooFinder MVP

**Branch**: `002-loofinder-mvp` | **Date**: 2025-03-10

Base URL: `/api` (e.g., `http://localhost:3000/api`)

All responses use JSON. Errors return `{ "error": string }` with appropriate HTTP status.

---

## Toilets

### GET /api/toilets

List toilets with optional filters.

**Query params**:
- `category` (optional): `free` | `code_required` | `purchase_required`
- `verification_status` (optional): `verified` | `unverified` | `needs_review`
- `bbox` (optional): `minLat,minLng,maxLat,maxLng` for map viewport
- `search` (optional): address, neighborhood, or location name (text search)

**Response 200**:
```json
{
  "toilets": [
    {
      "id": "uuid",
      "name": "string",
      "address": "string",
      "latitude": number,
      "longitude": number,
      "category": "free" | "code_required" | "purchase_required",
      "access_notes": "string | null",
      "opening_hours": "string | null",
      "source_type": "public_dataset" | "user_submitted",
      "verification_status": "verified" | "unverified" | "needs_review",
      "last_verified_at": "ISO8601 | null",
      "temporary_closed": boolean
    }
  ]
}
```

---

### GET /api/toilets/:id

Get a single toilet by ID.

**Response 200**: Single toilet object (same shape as above).

**Response 404**: `{ "error": "Toilet not found" }`

---

### GET /api/toilets/nearest

Find nearest toilet to user location.

**Query params**:
- `lat` (required): number
- `lng` (required): number
- `category` (optional): filter by category
- `verification_status` (optional): filter by status

**Response 200**: Single toilet object (nearest by straight-line distance).

**Response 404**: `{ "error": "No toilet found" }` when no matches.

---

## User Submissions

### POST /api/submissions

Submit a new toilet (anonymous).

**Request body**:
```json
{
  "name": "string",
  "address": "string",
  "latitude": number,
  "longitude": number,
  "category": "free" | "code_required" | "purchase_required",
  "access_notes": "string | null",
  "opening_hours": "string | null"
}
```

**Response 201**:
```json
{
  "id": "uuid",
  "status": "pending",
  "message": "Thank you for your submission. It will be reviewed by our team."
}
```

**Response 400**: Validation errors.

---

## Reports

### POST /api/reports

Report incorrect information for a toilet (anonymous).

**Request body**:
```json
{
  "toilet_id": "uuid",
  "description": "string"
}
```

**Response 201**:
```json
{
  "id": "uuid",
  "message": "Thank you for your report. It will be reviewed."
}
```

**Response 400**: Validation errors. **Response 404**: Toilet not found.

---

## Edit Suggestions

### POST /api/edit-suggestions

Suggest edits to an existing toilet (anonymous).

**Request body**:
```json
{
  "toilet_id": "uuid",
  "suggested_fields": {
    "opening_hours": "24/7",
    "access_notes": "Code at reception"
  }
}
```

`suggested_fields` keys must be valid Toilet field names. Values must pass validation.

**Response 201**:
```json
{
  "id": "uuid",
  "message": "Thank you for your suggestion. It will be reviewed."
}
```

**Response 400**: Validation errors. **Response 404**: Toilet not found.

---

## Donation (Placeholder)

### POST /api/donation

Placeholder donation flow. Mock/disabled for MVP.

**Request body**:
```json
{
  "amount": number,
  "currency": "DKK"
}
```

**Response 200** (mock):
```json
{
  "success": true,
  "message": "Thank you for your support! (Demo mode - no payment processed)"
}
```

---

## CORS

API allows requests from frontend origin. No authentication required for public and contribution endpoints.
