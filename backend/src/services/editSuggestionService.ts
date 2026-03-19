/**
 * Edit suggestion service - create EditSuggestion linked to toilet for admin review.
 * Live toilet record unchanged until admin approval.
 */
import { randomUUID } from 'crypto';
import { getDatabase } from '../db/schema.js';
import {
  validateEditSuggestion,
  VALID_TOILET_FIELDS,
} from '../models/editSuggestion.js';
import type { ToiletCategory } from '../models/toilet.js';

const CATEGORIES: ToiletCategory[] = ['free', 'code_required', 'purchase_required'];

export interface CreateEditSuggestionInput {
  toilet_id: string;
  suggested_fields: Record<string, unknown>;
}

export interface CreateEditSuggestionResult {
  id: string;
  toilet_id: string;
  status: 'pending';
}

function validateSuggestedFieldValues(fields: Record<string, unknown>): string[] {
  const errors: string[] = [];

  for (const [key, value] of Object.entries(fields)) {
    if (!VALID_TOILET_FIELDS.has(key)) continue;

    switch (key) {
      case 'name':
      case 'address':
        if (value !== null && value !== undefined) {
          if (typeof value !== 'string') {
            errors.push(`${key} must be a string`);
          } else if (!value.trim()) {
            errors.push(`${key} cannot be empty`);
          }
        }
        break;
      case 'latitude':
        if (value !== null && value !== undefined) {
          const n = Number(value);
          if (Number.isNaN(n) || n < -90 || n > 90) {
            errors.push('latitude must be a number between -90 and 90');
          }
        }
        break;
      case 'longitude':
        if (value !== null && value !== undefined) {
          const n = Number(value);
          if (Number.isNaN(n) || n < -180 || n > 180) {
            errors.push('longitude must be a number between -180 and 180');
          }
        }
        break;
      case 'category':
        if (value !== null && value !== undefined) {
          if (typeof value !== 'string' || !CATEGORIES.includes(value as ToiletCategory)) {
            errors.push(`category must be one of: ${CATEGORIES.join(', ')}`);
          }
        }
        break;
      case 'access_notes':
      case 'opening_hours':
        if (value !== null && value !== undefined && typeof value !== 'string') {
          errors.push(`${key} must be a string or null`);
        }
        break;
      case 'temporary_closed':
        if (value !== null && value !== undefined && typeof value !== 'boolean') {
          errors.push('temporary_closed must be a boolean');
        }
        break;
      case 'venue_type': {
        const validVenueTypes = [
          'supermarket',
          'library',
          'museum',
          'cafe_restaurant',
          'shopping_centre',
          'train_station',
          'bus_station',
          'other',
        ];
        if (value !== null && value !== undefined) {
          if (typeof value !== 'string' || !validVenueTypes.includes(value)) {
            errors.push(`venue_type must be one of: ${validVenueTypes.join(', ')} or null`);
          }
        }
        break;
      }
    }
  }

  return errors;
}

/**
 * Create an EditSuggestion linked to a toilet. Validates toilet exists and suggested_fields.
 * Live toilet record is unchanged until admin approval.
 */
export function createEditSuggestion(input: CreateEditSuggestionInput): CreateEditSuggestionResult {
  const errors = validateEditSuggestion(input);
  if (errors.length > 0) {
    throw new Error(errors.join('; '));
  }

  const valueErrors = validateSuggestedFieldValues(input.suggested_fields);
  if (valueErrors.length > 0) {
    throw new Error(valueErrors.join('; '));
  }

  const db = getDatabase();

  const toilet = db.prepare('SELECT id FROM toilets WHERE id = @id').get({ id: input.toilet_id.trim() });
  if (!toilet) {
    throw new Error('Toilet not found');
  }

  const id = randomUUID();
  const suggestedFieldsJson = JSON.stringify(input.suggested_fields);

  const insertEditSuggestion = db.prepare(`
    INSERT INTO edit_suggestions (id, toilet_id, suggested_fields, status)
    VALUES (@id, @toilet_id, @suggested_fields, 'pending')
  `);

  insertEditSuggestion.run({
    id,
    toilet_id: input.toilet_id.trim(),
    suggested_fields: suggestedFieldsJson,
  });

  return {
    id,
    toilet_id: input.toilet_id.trim(),
    status: 'pending',
  };
}
