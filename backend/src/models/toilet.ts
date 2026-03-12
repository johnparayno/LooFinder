/**
 * Toilet model with validation
 */
export type ToiletCategory = 'free' | 'code_required' | 'purchase_required';
export type SourceType = 'public_dataset' | 'user_submitted';
export type VerificationStatus = 'verified' | 'unverified' | 'needs_review';

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
}

const CATEGORIES: ToiletCategory[] = ['free', 'code_required', 'purchase_required'];
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
  };
}
