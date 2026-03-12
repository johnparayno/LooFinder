/**
 * Report model
 */
export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface Report {
  id: string;
  toilet_id: string;
  description: string;
  status: ReportStatus;
  created_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
}

export interface ReportInsert {
  id: string;
  toilet_id: string;
  description: string;
}

export function validateReport(data: Partial<ReportInsert>): string[] {
  const errors: string[] = [];

  if (!data.toilet_id || typeof data.toilet_id !== 'string') {
    errors.push('toilet_id is required and must be a string');
  } else if (!data.toilet_id.trim()) {
    errors.push('toilet_id cannot be empty');
  }

  if (!data.description || typeof data.description !== 'string') {
    errors.push('description is required and must be a string');
  } else if (!data.description.trim()) {
    errors.push('description cannot be empty');
  }

  return errors;
}

export function rowToReport(row: Record<string, unknown>): Report {
  return {
    id: row.id as string,
    toilet_id: row.toilet_id as string,
    description: row.description as string,
    status: row.status as ReportStatus,
    created_at: row.created_at as string,
    resolved_at: (row.resolved_at as string) ?? null,
    resolution_notes: (row.resolution_notes as string) ?? null,
  };
}
