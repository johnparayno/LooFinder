/**
 * Report service - create Report linked to toilet for admin review
 */
import { randomUUID } from 'crypto';
import { getDatabase } from '../db/schema.js';
import { validateReport } from '../models/report.js';

export interface CreateReportInput {
  toilet_id: string;
  description: string;
}

export interface CreateReportResult {
  id: string;
  toilet_id: string;
  status: 'pending';
}

/**
 * Create a Report linked to a toilet. Validates toilet exists and description is non-empty.
 */
export function createReport(input: CreateReportInput): CreateReportResult {
  const errors = validateReport(input);
  if (errors.length > 0) {
    throw new Error(errors.join('; '));
  }

  const db = getDatabase();

  // Verify toilet exists
  const toilet = db.prepare('SELECT id FROM toilets WHERE id = @id').get({ id: input.toilet_id.trim() });
  if (!toilet) {
    throw new Error('Toilet not found');
  }

  const id = randomUUID();
  const insertReport = db.prepare(`
    INSERT INTO reports (id, toilet_id, description, status)
    VALUES (@id, @toilet_id, @description, 'pending')
  `);

  insertReport.run({
    id,
    toilet_id: input.toilet_id.trim(),
    description: input.description.trim(),
  });

  return {
    id,
    toilet_id: input.toilet_id.trim(),
    status: 'pending',
  };
}
