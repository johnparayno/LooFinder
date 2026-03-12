/**
 * SQLite schema for LooFinder MVP
 * Tables: toilets, user_submissions, reports, edit_suggestions
 */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DEFAULT_DB_PATH = path.resolve(process.cwd(), 'data', 'loofinder.db');

export function getDatabase(dbPath?: string): Database.Database {
  const resolvedPath = dbPath ?? process.env.DATABASE_PATH ?? DEFAULT_DB_PATH;
  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const db = new Database(resolvedPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS toilets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      category TEXT NOT NULL CHECK (category IN ('free', 'code_required', 'purchase_required')),
      access_notes TEXT,
      access_code TEXT,
      opening_hours TEXT,
      source_type TEXT NOT NULL CHECK (source_type IN ('public_dataset', 'user_submitted')),
      verification_status TEXT NOT NULL CHECK (verification_status IN ('verified', 'unverified', 'needs_review')),
      last_verified_at TEXT,
      temporary_closed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_toilets_lat_lng ON toilets(latitude, longitude);
    CREATE INDEX IF NOT EXISTS idx_toilets_category ON toilets(category);
    CREATE INDEX IF NOT EXISTS idx_toilets_verification_status ON toilets(verification_status);

    CREATE TABLE IF NOT EXISTS user_submissions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      category TEXT NOT NULL CHECK (category IN ('free', 'code_required', 'purchase_required')),
      access_notes TEXT,
      opening_hours TEXT,
      status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'duplicate')),
      toilet_id TEXT REFERENCES toilets(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      reviewed_at TEXT,
      review_notes TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_user_submissions_status ON user_submissions(status);
    CREATE INDEX IF NOT EXISTS idx_user_submissions_created_at ON user_submissions(created_at);

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      toilet_id TEXT NOT NULL REFERENCES toilets(id),
      description TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'resolved', 'dismissed')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      resolved_at TEXT,
      resolution_notes TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_reports_toilet_id ON reports(toilet_id);
    CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

    CREATE TABLE IF NOT EXISTS edit_suggestions (
      id TEXT PRIMARY KEY,
      toilet_id TEXT NOT NULL REFERENCES toilets(id),
      suggested_fields TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      reviewed_at TEXT,
      review_notes TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_edit_suggestions_toilet_id ON edit_suggestions(toilet_id);
    CREATE INDEX IF NOT EXISTS idx_edit_suggestions_status ON edit_suggestions(status);
  `);

  // Migration: add access_code column if missing (for existing databases)
  const tableInfo = db.prepare("PRAGMA table_info(toilets)").all() as { name: string }[];
  const hasAccessCode = tableInfo.some((c) => c.name === 'access_code');
  if (!hasAccessCode) {
    db.exec('ALTER TABLE toilets ADD COLUMN access_code TEXT');
  }
}
