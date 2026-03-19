/**
 * Submission service - create UserSubmission and Toilet for new toilet submissions
 */
import { randomUUID } from 'crypto';
import { getDatabase } from '../db/schema.js';
import { validateUserSubmission } from '../models/userSubmission.js';

export type VenueType =
  | 'supermarket'
  | 'library'
  | 'museum'
  | 'cafe_restaurant'
  | 'shopping_centre'
  | 'train_station'
  | 'bus_station'
  | 'gym'
  | 'swimming_pool'
  | 'sports_hall'
  | 'other';

export type ToiletType = 'handicap' | 'pissoir' | 'unisex' | 'changingplace' | null;

export interface CreateSubmissionInput {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: 'free' | 'code_required' | 'purchase_required';
  access_notes?: string | null;
  access_code?: string | null;
  opening_hours?: string | null;
  venue_type?: VenueType | null;
  toilet_type?: ToiletType;
  payment?: boolean;
  manned?: boolean;
  changing_table?: boolean;
  tap?: boolean;
  needle_container?: boolean;
  contact?: string | null;
  image_url?: string | null;
  placement?: string | null;
  year_round?: boolean;
  round_the_clock?: boolean;
  temporary_closed?: boolean;
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

  const validVenueTypes = [
    'supermarket',
    'library',
    'museum',
    'cafe_restaurant',
    'shopping_centre',
    'train_station',
    'bus_station',
    'gym',
    'swimming_pool',
    'sports_hall',
    'other',
  ];
  const venueType =
    input.venue_type && validVenueTypes.includes(input.venue_type) ? input.venue_type : null;

  const validToiletTypes = ['handicap', 'pissoir', 'unisex', 'changingplace'];
  const toiletType =
    input.toilet_type && validToiletTypes.includes(input.toilet_type) ? input.toilet_type : null;

  const insertToilet = db.prepare(`
    INSERT INTO toilets (
      id, name, address, latitude, longitude, category,
      access_notes, access_code, opening_hours, source_type, verification_status,
      temporary_closed, venue_type, toilet_type, payment, manned, changing_table,
      tap, needle_container, contact, image_url, placement, year_round, round_the_clock
    ) VALUES (
      @id, @name, @address, @latitude, @longitude, @category,
      @access_notes, @access_code, @opening_hours, 'user_submitted', 'unverified',
      @temporary_closed, @venue_type, @toilet_type, @payment, @manned, @changing_table,
      @tap, @needle_container, @contact, @image_url, @placement, @year_round, @round_the_clock
    )
  `);

  const insertSubmission = db.prepare(`
    INSERT INTO user_submissions (
      id, name, address, latitude, longitude, category,
      access_notes, opening_hours, status, toilet_id, venue_type
    ) VALUES (
      @id, @name, @address, @latitude, @longitude, @category,
      @access_notes, @opening_hours, 'pending', @toilet_id, @venue_type
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
    access_code: input.access_code?.trim() || null,
    opening_hours: input.opening_hours?.trim() || null,
    temporary_closed: input.temporary_closed ? 1 : 0,
    venue_type: venueType,
    toilet_type: toiletType,
    payment: input.payment ? 1 : 0,
    manned: input.manned ? 1 : 0,
    changing_table: input.changing_table ? 1 : 0,
    tap: input.tap ? 1 : 0,
    needle_container: input.needle_container ? 1 : 0,
    contact: input.contact?.trim() || null,
    image_url: input.image_url || null,
    placement: input.placement?.trim() || null,
    year_round: input.year_round !== false ? 1 : 0,
    round_the_clock: input.round_the_clock ? 1 : 0,
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
    venue_type: venueType,
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
