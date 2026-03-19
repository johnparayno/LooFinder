/**
 * FilterPills - Horizontal filter pills below search bar.
 * Airbnb-inspired: rounded pills, premium spacing.
 */
import type { ToiletCategory, VerificationStatus, VenueTypeFilter } from '../../services/api';

export interface FilterPillsProps {
  category: ToiletCategory | '';
  verificationStatus: VerificationStatus | '';
  venueType: VenueTypeFilter | '';
  onCategoryChange: (category: ToiletCategory | '') => void;
  onVerificationStatusChange: (status: VerificationStatus | '') => void;
  onVenueTypeChange: (venueType: VenueTypeFilter | '') => void;
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

const VENUE_OPTIONS: { value: VenueTypeFilter | ''; label: string }[] = [
  { value: '', label: 'All venues' },
  { value: 'supermarket', label: 'Supermarket' },
  { value: 'library', label: 'Library' },
  { value: 'museum', label: 'Museum' },
  { value: 'cafe_restaurant', label: 'Café / Restaurant' },
  { value: 'shopping_centre', label: 'Shopping centre' },
  { value: 'train_station', label: 'Train station' },
  { value: 'bus_station', label: 'Bus station' },
  { value: 'gym', label: 'Gym / Fitness' },
  { value: 'swimming_pool', label: 'Swimming pool' },
  { value: 'sports_hall', label: 'Sports hall' },
  { value: 'other', label: 'Other' },
];

export function FilterPills({
  category,
  verificationStatus,
  venueType,
  onCategoryChange,
  onVerificationStatusChange,
  onVenueTypeChange,
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
        <span className="map-filter-pills-label">Venue</span>
        <select
          value={venueType}
          onChange={(e) => onVenueTypeChange((e.target.value || '') as VenueTypeFilter | '')}
          className="map-filter-pills-select"
          style={{
            padding: '6px 10px',
            fontSize: 14,
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'white',
            minWidth: 140,
          }}
        >
          {VENUE_OPTIONS.map((opt) => (
            <option key={opt.value || 'all'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
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
