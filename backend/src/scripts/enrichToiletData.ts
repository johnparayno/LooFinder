/**
 * Enrichment script - fills missing toilet data model fields in the database
 * Run after seed or on existing DB: npm run enrich
 */
import path from 'path';
import { getDatabase, initSchema } from '../db/schema.js';

const DEFAULT_DB_PATH = path.resolve(process.cwd(), 'data', 'loofinder.db');

function enrichToiletData(dbPath?: string): { updated: number; details: Record<string, number> } {
  const resolvedPath = dbPath ?? process.env.DATABASE_PATH ?? DEFAULT_DB_PATH;
  const db = getDatabase(dbPath);
  initSchema(db);

  const details: Record<string, number> = {};

  // 1. Set opening_hours='24/7' where round_the_clock=1 and opening_hours is null/empty
  const r1 = db
    .prepare(
      `UPDATE toilets SET opening_hours = '24/7', updated_at = datetime('now')
       WHERE round_the_clock = 1 AND (opening_hours IS NULL OR opening_hours = '')`
    )
    .run();
  details.opening_hours_from_round_the_clock = r1.changes;

  // 2. Set year_round=1 where year_round=0 and we have no explicit seasonal data (non-FindToilet rows)
  const r2 = db
    .prepare(
      `UPDATE toilets SET year_round = 1, updated_at = datetime('now')
       WHERE year_round = 0 AND (findtoilet_nid IS NULL OR findtoilet_nid = '')`
    )
    .run();
  details.year_round_default = r2.changes;

  // 3. Set toilet_type='handicap' where access_notes indicates wheelchair/handicap and toilet_type is null
  const r3 = db
    .prepare(
      `UPDATE toilets SET toilet_type = 'handicap', updated_at = datetime('now')
       WHERE (toilet_type IS NULL OR toilet_type = '')
         AND access_notes IS NOT NULL
         AND (LOWER(access_notes) LIKE '%handicap%' OR LOWER(access_notes) LIKE '%wheelchair%')`
    )
    .run();
  details.toilet_type_from_access_notes = r3.changes;

  // 4. Ensure payment matches category for purchase_required (payment=1) and code_required (payment can vary)
  const r4 = db
    .prepare(
      `UPDATE toilets SET payment = 1, updated_at = datetime('now')
       WHERE category = 'purchase_required' AND (payment IS NULL OR payment = 0)`
    )
    .run();
  details.payment_from_category = r4.changes;

  const total =
    details.opening_hours_from_round_the_clock +
    details.year_round_default +
    details.toilet_type_from_access_notes +
    details.payment_from_category;

  console.log(`Database: ${resolvedPath}`);
  console.log('Enrichment results:', details);
  return { updated: total, details };
}

const dbPath = process.env.DATABASE_PATH;
const { updated } = enrichToiletData(dbPath);
console.log(`Enriched ${updated} field(s) across toilets`);
process.exit(0);
