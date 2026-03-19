/**
 * Toilet service - list, getById, findNearest
 */
import { getDatabase } from '../db/schema.js';
import type { Toilet } from '../models/toilet.js';
import { rowToToilet } from '../models/toilet.js';

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

export interface ListToiletsParams {
  bbox?: string; // minLat,minLng,maxLat,maxLng
  category?: 'free' | 'code_required' | 'purchase_required';
  verification_status?: 'verified' | 'unverified' | 'needs_review';
  venue_type?: VenueType;
  search?: string; // address, neighborhood, location name (text search)
}

export function listToilets(params: ListToiletsParams = {}): Toilet[] {
  const db = getDatabase();
  const conditions: string[] = [];
  const values: Record<string, unknown> = {};

  if (params.bbox) {
    const parts = params.bbox.split(',').map((s) => s.trim());
    if (parts.length === 4) {
      const [minLat, minLng, maxLat, maxLng] = parts.map(Number);
      if (!parts.some((s) => isNaN(Number(s)))) {
        conditions.push(
          'latitude >= @minLat AND latitude <= @maxLat AND longitude >= @minLng AND longitude <= @maxLng'
        );
        values.minLat = minLat;
        values.minLng = minLng;
        values.maxLat = maxLat;
        values.maxLng = maxLng;
      }
    }
  }

  if (params.category) {
    conditions.push('category = @category');
    values.category = params.category;
  }

  if (params.verification_status) {
    conditions.push('verification_status = @verification_status');
    values.verification_status = params.verification_status;
  }

  if (params.venue_type) {
    conditions.push('venue_type = @venue_type');
    values.venue_type = params.venue_type;
  }

  if (params.search && params.search.trim()) {
    const term = `%${params.search.trim()}%`;
    conditions.push('(name LIKE @search OR address LIKE @search)');
    values.search = term;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `SELECT * FROM toilets ${where} ORDER BY name`;
  const stmt = db.prepare(sql);
  const rows = stmt.all(values) as Record<string, unknown>[];

  return rows.map(rowToToilet);
}

export function getToiletById(id: string): Toilet | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM toilets WHERE id = @id');
  const row = stmt.get({ id }) as Record<string, unknown> | undefined;
  if (!row) return null;
  return rowToToilet(row);
}

export function findNearestToilet(
  lat: number,
  lng: number,
  params?: { category?: string; verification_status?: string }
): Toilet | null {
  const db = getDatabase();
  const conditions: string[] = [];
  const values: Record<string, unknown> = { lat, lng };

  if (params?.category) {
    conditions.push('category = @category');
    values.category = params.category;
  }

  if (params?.verification_status) {
    conditions.push('verification_status = @verification_status');
    values.verification_status = params.verification_status;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Straight-line distance approximation (Haversine would be more accurate but slower)
  // For Copenhagen scale, simple Euclidean is acceptable
  const sql = `
    SELECT * FROM toilets ${where}
    ORDER BY (
      (latitude - @lat) * (latitude - @lat) +
      (longitude - @lng) * (longitude - @lng)
    )
    LIMIT 1
  `;
  const stmt = db.prepare(sql);
  const row = stmt.get(values) as Record<string, unknown> | undefined;
  if (!row) return null;
  return rowToToilet(row);
}

export interface UpdateToiletInput {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  category?: 'free' | 'code_required' | 'purchase_required';
  access_notes?: string | null;
  access_code?: string | null;
  opening_hours?: string | null;
  temporary_closed?: boolean;
  venue_type?: VenueType | null;
  toilet_type?: 'handicap' | 'pissoir' | 'unisex' | 'changingplace' | null;
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
}

export function updateToilet(id: string, input: UpdateToiletInput): Toilet | null {
  const db = getDatabase();
  const existing = getToiletById(id);
  if (!existing) return null;

  const updates: string[] = [];
  const values: Record<string, unknown> = { id };

  const setIfDefined = (
    key: string,
    value: unknown,
    dbKey?: string
  ) => {
    if (value === undefined) return;
    const k = dbKey ?? key;
    updates.push(`${k} = @${k}`);
    values[k] = value;
  };

  setIfDefined('name', input.name?.trim());
  setIfDefined('address', input.address?.trim());
  setIfDefined('latitude', input.latitude);
  setIfDefined('longitude', input.longitude);
  if (input.category) setIfDefined('category', input.category);
  if (input.access_notes !== undefined) setIfDefined('access_notes', input.access_notes);
  if (input.access_code !== undefined) setIfDefined('access_code', input.access_code);
  if (input.opening_hours !== undefined) setIfDefined('opening_hours', input.opening_hours);
  if (input.temporary_closed !== undefined) {
    updates.push('temporary_closed = @temporary_closed');
    values.temporary_closed = input.temporary_closed ? 1 : 0;
  }
  if (input.venue_type !== undefined) setIfDefined('venue_type', input.venue_type);
  if (input.toilet_type !== undefined) setIfDefined('toilet_type', input.toilet_type);
  if (input.payment !== undefined) {
    updates.push('payment = @payment');
    values.payment = input.payment ? 1 : 0;
  }
  if (input.manned !== undefined) {
    updates.push('manned = @manned');
    values.manned = input.manned ? 1 : 0;
  }
  if (input.changing_table !== undefined) {
    updates.push('changing_table = @changing_table');
    values.changing_table = input.changing_table ? 1 : 0;
  }
  if (input.tap !== undefined) {
    updates.push('tap = @tap');
    values.tap = input.tap ? 1 : 0;
  }
  if (input.needle_container !== undefined) {
    updates.push('needle_container = @needle_container');
    values.needle_container = input.needle_container ? 1 : 0;
  }
  if (input.contact !== undefined) setIfDefined('contact', input.contact);
  if (input.image_url !== undefined) setIfDefined('image_url', input.image_url);
  if (input.placement !== undefined) setIfDefined('placement', input.placement);
  if (input.year_round !== undefined) {
    updates.push('year_round = @year_round');
    values.year_round = input.year_round ? 1 : 0;
  }
  if (input.round_the_clock !== undefined) {
    updates.push('round_the_clock = @round_the_clock');
    values.round_the_clock = input.round_the_clock ? 1 : 0;
  }

  if (updates.length === 0) return existing;

  updates.push('updated_at = datetime(\'now\')');
  const sql = `UPDATE toilets SET ${updates.join(', ')} WHERE id = @id`;
  db.prepare(sql).run(values);
  return getToiletById(id);
}
