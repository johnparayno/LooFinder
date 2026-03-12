/**
 * UserSubmission model
 */
import type { ToiletCategory } from './toilet.js';

export type UserSubmissionStatus = 'pending' | 'approved' | 'rejected' | 'duplicate';

export interface UserSubmission {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: ToiletCategory;
  access_notes: string | null;
  opening_hours: string | null;
  status: UserSubmissionStatus;
  toilet_id: string | null;
  created_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
}

export interface UserSubmissionInsert {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: ToiletCategory;
  access_notes?: string | null;
  opening_hours?: string | null;
}

const CATEGORIES: ToiletCategory[] = ['free', 'code_required', 'purchase_required'];

export function validateUserSubmission(data: Partial<UserSubmissionInsert>): string[] {
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

  return errors;
}

export function rowToUserSubmission(row: Record<string, unknown>): UserSubmission {
  return {
    id: row.id as string,
    name: row.name as string,
    address: row.address as string,
    latitude: row.latitude as number,
    longitude: row.longitude as number,
    category: row.category as ToiletCategory,
    access_notes: (row.access_notes as string) ?? null,
    opening_hours: (row.opening_hours as string) ?? null,
    status: row.status as UserSubmissionStatus,
    toilet_id: (row.toilet_id as string) ?? null,
    created_at: row.created_at as string,
    reviewed_at: (row.reviewed_at as string) ?? null,
    review_notes: (row.review_notes as string) ?? null,
  };
}
