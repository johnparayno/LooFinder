/**
 * Toilet model with validation
 */
export type ToiletCategory = 'free' | 'code_required' | 'purchase_required';
export type SourceType = 'public_dataset' | 'user_submitted';
export type VerificationStatus = 'verified' | 'unverified' | 'needs_review';

export type ToiletType = 'handicap' | 'pissoir' | 'unisex' | 'changingplace' | null;

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
  | 'other'
  | null;

export interface Toilet {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: ToiletCategory;
  access_notes: string | null;
  access_code: string | null;
  opening_hours: string | null;
  source_type: SourceType;
  verification_status: VerificationStatus;
  last_verified_at: string | null;
  temporary_closed: boolean;
  created_at: string;
  updated_at: string;
  findtoilet_nid: string | null;
  toilet_type: ToiletType;
  payment: boolean;
  manned: boolean;
  changing_table: boolean;
  tap: boolean;
  needle_container: boolean;
  contact: string | null;
  image_url: string | null;
  placement: string | null;
  year_round: boolean;
  round_the_clock: boolean;
  venue_type: VenueType;
}

export interface ToiletInsert {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: ToiletCategory;
  access_notes?: string | null;
  access_code?: string | null;
  opening_hours?: string | null;
  source_type: SourceType;
  verification_status: VerificationStatus;
  last_verified_at?: string | null;
  temporary_closed?: boolean;
  findtoilet_nid?: string | null;
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
  venue_type?: VenueType;
}

const CATEGORIES: ToiletCategory[] = ['free', 'code_required', 'purchase_required'];
const VENUE_TYPES: VenueType[] = [
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
const SOURCE_TYPES: SourceType[] = ['public_dataset', 'user_submitted'];
const VERIFICATION_STATUSES: VerificationStatus[] = ['verified', 'unverified', 'needs_review'];

export function validateToilet(data: Partial<ToiletInsert>): string[] {
  const errors: string[] = [];

  if (!data.name || typeof data.name !== 'string') {
    errors.push('name is required and must be a string');
  } else if (!data.name.trim()) {
    errors.push('name cannot be empty');
  }

  if (!data.address || typeof data.address !== 'string') {
    errors.push('address is required and must be a string');
  } else if (!data.address.trim()) {
    errors.push('address cannot be empty');
  }

  if (typeof data.latitude !== 'number' || data.latitude < -90 || data.latitude > 90) {
    errors.push('latitude must be a number between -90 and 90');
  }

  if (typeof data.longitude !== 'number' || data.longitude < -180 || data.longitude > 180) {
    errors.push('longitude must be a number between -180 and 180');
  }

  if (!data.category || !CATEGORIES.includes(data.category)) {
    errors.push(`category must be one of: ${CATEGORIES.join(', ')}`);
  }

  if (!data.source_type || !SOURCE_TYPES.includes(data.source_type)) {
    errors.push(`source_type must be one of: ${SOURCE_TYPES.join(', ')}`);
  }

  if (!data.verification_status || !VERIFICATION_STATUSES.includes(data.verification_status)) {
    errors.push(`verification_status must be one of: ${VERIFICATION_STATUSES.join(', ')}`);
  }

  return errors;
}

export function rowToToilet(row: Record<string, unknown>): Toilet {
  const t = row.toilet_type as string | null;
  const toiletType: ToiletType =
    t === 'handicap' || t === 'pissoir' || t === 'unisex' || t === 'changingplace' ? t : null;
  return {
    id: row.id as string,
    name: row.name as string,
    address: row.address as string,
    latitude: row.latitude as number,
    longitude: row.longitude as number,
    category: row.category as ToiletCategory,
    access_notes: (row.access_notes as string) ?? null,
    access_code: (row.access_code as string) ?? null,
    opening_hours: (row.opening_hours as string) ?? null,
    source_type: row.source_type as SourceType,
    verification_status: row.verification_status as VerificationStatus,
    last_verified_at: (row.last_verified_at as string) ?? null,
    temporary_closed: Boolean(row.temporary_closed),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    findtoilet_nid: (row.findtoilet_nid as string) ?? null,
    toilet_type: toiletType,
    payment: Boolean(row.payment),
    manned: Boolean(row.manned),
    changing_table: Boolean(row.changing_table),
    tap: Boolean(row.tap),
    needle_container: Boolean(row.needle_container),
    contact: (row.contact as string) ?? null,
    image_url: (row.image_url as string) ?? null,
    placement: (row.placement as string) ?? null,
    year_round: row.year_round != null ? Boolean(row.year_round) : true,
    round_the_clock: Boolean(row.round_the_clock),
    venue_type:
      row.venue_type && VENUE_TYPES.includes(row.venue_type as VenueType)
        ? (row.venue_type as VenueType)
        : null,
  };
}
