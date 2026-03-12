/**
 * Submission service - create UserSubmission and Toilet for new toilet submissions
 */
import { randomUUID } from 'crypto';
import { getDatabase } from '../db/schema.js';
import { validateUserSubmission } from '../models/userSubmission.js';

export interface CreateSubmissionInput {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: 'free' | 'code_required' | 'purchase_required';
  access_notes?: string | null;
  opening_hours?: string | null;
}

export interface CreateSubmissionResult {
  id: string;
  status: 'pending';
  possible_duplicate?: boolean;
}

/**
 * Create a UserSubmission and corresponding Toilet (for display on map).
 * Toilet is created with source_type=user_submitted, verification_status=unverified.
 * Optional duplicate check: if same address or coords exist, still stores but flags possible_duplicate.
 */
export function createSubmission(input: CreateSubmissionInput): CreateSubmissionResult {
  const errors = validateUserSubmission(input);
  if (errors.length > 0) {
    throw new Error(errors.join('; '));
  }

  const db = getDatabase();
  const submissionId = randomUUID();
  const toiletId = randomUUID();

  // Optional duplicate check
  let possibleDuplicate = false;
  const existingByAddress = db
    .prepare('SELECT id FROM toilets WHERE LOWER(TRIM(address)) = LOWER(TRIM(@address))')
    .get({ address: input.address.trim() });
  const existingByCoords = db
    .prepare(
      'SELECT id FROM toilets WHERE latitude = @lat AND longitude = @lng'
    )
    .get({ lat: input.latitude, lng: input.longitude });
  if (existingByAddress || existingByCoords) {
    possibleDuplicate = true;
  }

  const insertToilet = db.prepare(`
    INSERT INTO toilets (
      id, name, address, latitude, longitude, category,
      access_notes, access_code, opening_hours, source_type, verification_status,
      temporary_closed
    ) VALUES (
      @id, @name, @address, @latitude, @longitude, @category,
      @access_notes, NULL, @opening_hours, 'user_submitted', 'unverified',
      0
    )
  `);

  const insertSubmission = db.prepare(`
    INSERT INTO user_submissions (
      id, name, address, latitude, longitude, category,
      access_notes, opening_hours, status, toilet_id
    ) VALUES (
      @id, @name, @address, @latitude, @longitude, @category,
      @access_notes, @opening_hours, 'pending', @toilet_id
    )
  `);

  const toiletData: Record<string, unknown> = {
    id: toiletId,
    name: input.name.trim(),
    address: input.address.trim(),
    latitude: input.latitude,
    longitude: input.longitude,
    category: input.category,
    access_notes: input.access_notes?.trim() || null,
    opening_hours: input.opening_hours?.trim() || null,
  };

  const submissionData: Record<string, unknown> = {
    id: submissionId,
    name: input.name.trim(),
    address: input.address.trim(),
    latitude: input.latitude,
    longitude: input.longitude,
    category: input.category,
    access_notes: input.access_notes?.trim() || null,
    opening_hours: input.opening_hours?.trim() || null,
    toilet_id: toiletId,
  };

  const transaction = db.transaction(() => {
    insertToilet.run(toiletData);
    insertSubmission.run(submissionData);
  });

  transaction();

  const result: CreateSubmissionResult = {
    id: submissionId,
    status: 'pending',
  };
  if (possibleDuplicate) {
    result.possible_duplicate = true;
  }
  return result;
}
