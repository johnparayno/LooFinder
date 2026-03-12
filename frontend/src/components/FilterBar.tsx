/**
 * FilterBar - filter toilets by category and verification status
 */
import type { ToiletCategory, VerificationStatus } from '../services/api';

export interface FilterBarProps {
  category: ToiletCategory | '';
  verificationStatus: VerificationStatus | '';
  onCategoryChange: (category: ToiletCategory | '') => void;
  onVerificationStatusChange: (status: VerificationStatus | '') => void;
}

const CATEGORIES: { value: ToiletCategory | ''; label: string }[] = [
  { value: '', label: 'All categories' },
  { value: 'free', label: 'Free' },
  { value: 'code_required', label: 'Code required' },
  { value: 'purchase_required', label: 'Purchase required' },
];

const VERIFICATION_OPTIONS: { value: VerificationStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'verified', label: 'Verified only' },
  { value: 'unverified', label: 'Unverified only' },
  { value: 'needs_review', label: 'Needs review' },
];

export function FilterBar({
  category,
  verificationStatus,
  onCategoryChange,
  onVerificationStatusChange,
}: FilterBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        padding: 12,
        backgroundColor: 'var(--color-bg-soft)',
        borderBottom: '1px solid var(--color-border)',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label htmlFor="filter-category" style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-muted)' }}>
          Category:
        </label>
        <select
          id="filter-category"
          value={category}
          onChange={(e) => onCategoryChange((e.target.value || '') as ToiletCategory | '')}
          style={{
            padding: '6px 10px',
            fontSize: 14,
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'white',
            minWidth: 140,
          }}
        >
          {CATEGORIES.map((opt) => (
            <option key={opt.value || 'all'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label htmlFor="filter-status" style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-muted)' }}>
          Status:
        </label>
        <select
          id="filter-status"
          value={verificationStatus}
          onChange={(e) =>
            onVerificationStatusChange((e.target.value || '') as VerificationStatus | '')
          }
          style={{
            padding: '6px 10px',
            fontSize: 14,
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'white',
            minWidth: 140,
          }}
        >
          {VERIFICATION_OPTIONS.map((opt) => (
            <option key={opt.value || 'all'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
