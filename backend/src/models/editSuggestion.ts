/**
 * EditSuggestion model
 */
export type EditSuggestionStatus = 'pending' | 'approved' | 'rejected';

export const VALID_TOILET_FIELDS = new Set([
  'name',
  'address',
  'latitude',
  'longitude',
  'category',
  'access_notes',
  'opening_hours',
  'temporary_closed',
]);

export interface EditSuggestion {
  id: string;
  toilet_id: string;
  suggested_fields: Record<string, unknown>;
  status: EditSuggestionStatus;
  created_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
}

export interface EditSuggestionInsert {
  id: string;
  toilet_id: string;
  suggested_fields: Record<string, unknown>;
}

export function validateEditSuggestion(data: Partial<EditSuggestionInsert>): string[] {
  const errors: string[] = [];

  if (!data.toilet_id || typeof data.toilet_id !== 'string') {
    errors.push('toilet_id is required and must be a string');
  } else if (!data.toilet_id.trim()) {
    errors.push('toilet_id cannot be empty');
  }

  if (data.suggested_fields === undefined || data.suggested_fields === null) {
    errors.push('suggested_fields is required');
  } else if (typeof data.suggested_fields !== 'object' || Array.isArray(data.suggested_fields)) {
    errors.push('suggested_fields must be an object');
  } else {
    const fields = data.suggested_fields as Record<string, unknown>;
    for (const key of Object.keys(fields)) {
      if (!VALID_TOILET_FIELDS.has(key)) {
        errors.push(`suggested_fields contains invalid field: ${key}`);
      }
    }
    if (Object.keys(fields).length === 0) {
      errors.push('suggested_fields must contain at least one field');
    }
  }

  return errors;
}

export function rowToEditSuggestion(row: Record<string, unknown>): EditSuggestion {
  const suggestedFields = row.suggested_fields;
  let parsed: Record<string, unknown> = {};
  if (typeof suggestedFields === 'string') {
    try {
      parsed = JSON.parse(suggestedFields) as Record<string, unknown>;
    } catch {
      parsed = {};
    }
  } else if (typeof suggestedFields === 'object' && suggestedFields !== null) {
    parsed = suggestedFields as Record<string, unknown>;
  }

  return {
    id: row.id as string,
    toilet_id: row.toilet_id as string,
    suggested_fields: parsed,
    status: row.status as EditSuggestionStatus,
    created_at: row.created_at as string,
    reviewed_at: (row.reviewed_at as string) ?? null,
    review_notes: (row.review_notes as string) ?? null,
  };
}
