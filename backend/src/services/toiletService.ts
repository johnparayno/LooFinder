/**
 * Toilet service - list, getById, findNearest
 */
import { getDatabase } from '../db/schema.js';
import type { Toilet } from '../models/toilet.js';
import { rowToToilet } from '../models/toilet.js';

export interface ListToiletsParams {
  bbox?: string; // minLat,minLng,maxLat,maxLng
  category?: 'free' | 'code_required' | 'purchase_required';
  verification_status?: 'verified' | 'unverified' | 'needs_review';
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
