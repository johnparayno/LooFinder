/**
 * FilterPills - Horizontal filter pills below search bar.
 * Airbnb-inspired: rounded pills, premium spacing.
 */
import type { ToiletCategory, VerificationStatus } from '../../services/api';

export interface FilterPillsProps {
  category: ToiletCategory | '';
  verificationStatus: VerificationStatus | '';
  onCategoryChange: (category: ToiletCategory | '') => void;
  onVerificationStatusChange: (status: VerificationStatus | '') => void;
}

const CATEGORIES: { value: ToiletCategory | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'free', label: 'Free' },
  { value: 'code_required', label: 'Code required' },
  { value: 'purchase_required', label: 'Paid' },
];

const VERIFICATION_OPTIONS: { value: VerificationStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'verified', label: 'Verified' },
  { value: 'unverified', label: 'Unverified' },
];

export function FilterPills({
  category,
  verificationStatus,
  onCategoryChange,
  onVerificationStatusChange,
}: FilterPillsProps) {
  return (
    <div className="map-filter-pills">
      <div className="map-filter-pills-group">
        <span className="map-filter-pills-label">Type</span>
        <div className="map-filter-pills-row">
          {CATEGORIES.map((opt) => (
            <button
              key={opt.value || 'all'}
              type="button"
              onClick={() => onCategoryChange(opt.value)}
              className={`map-filter-pill ${category === opt.value ? 'active' : ''}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="map-filter-pills-group">
        <span className="map-filter-pills-label">Status</span>
        <div className="map-filter-pills-row">
          {VERIFICATION_OPTIONS.map((opt) => (
            <button
              key={opt.value || 'all'}
              type="button"
              onClick={() => onVerificationStatusChange(opt.value)}
              className={`map-filter-pill ${verificationStatus === opt.value ? 'active' : ''}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
