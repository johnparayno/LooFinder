/**
 * ToiletPreviewCard - Airbnb-quality listing preview for bottom sheet.
 * Name, distance, status, category, accessibility, clean typography.
 */
import { Link } from 'react-router-dom';
import type { Toilet } from '../../services/api';
import { getToiletImageUrl } from '../../utils/toiletImage';
import { formatDistance, haversineMeters } from '../../utils/distance';

const CATEGORY_LABELS: Record<Toilet['category'], string> = {
  free: 'Free',
  code_required: 'Code required',
  purchase_required: 'Paid',
};

interface ToiletPreviewCardProps {
  toilet: Toilet;
  userLocation: [number, number] | null;
  isSelected?: boolean;
  onSelect?: (toilet: Toilet) => void;
}

export function ToiletPreviewCard({
  toilet,
  userLocation,
  isSelected = false,
  onSelect,
}: ToiletPreviewCardProps) {
  const distanceM = userLocation
    ? haversineMeters(
        userLocation[0],
        userLocation[1],
        toilet.latitude,
        toilet.longitude
      )
    : null;
  const distanceStr = distanceM !== null ? formatDistance(distanceM) : null;

  const isUnverified =
    toilet.verification_status === 'unverified' ||
    toilet.verification_status === 'needs_review';

  const facilities: string[] = [];
  if (toilet.changing_table) facilities.push('Changing table');
  if (toilet.tap) facilities.push('Water');
  if (toilet.toilet_type === 'handicap') facilities.push('Accessible');

  return (
    <div
      role="button"
      tabIndex={0}
      className={`toilet-preview-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect?.(toilet)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect?.(toilet)}
    >
      <div className="toilet-preview-card-image-wrap">
        <img
          src={getToiletImageUrl(toilet, 320, 120)}
          alt=""
          className="toilet-preview-card-image"
        />
        <div className="toilet-preview-card-badges">
          <span className="toilet-preview-card-badge toilet-preview-card-badge-category">
            {CATEGORY_LABELS[toilet.category]}
          </span>
          {toilet.temporary_closed && (
            <span className="toilet-preview-card-badge toilet-preview-card-badge-closed">
              Closed
            </span>
          )}
          {isUnverified && (
            <span className="toilet-preview-card-badge toilet-preview-card-badge-unverified">
              Unverified
            </span>
          )}
        </div>
      </div>
      <div className="toilet-preview-card-body">
        <h4 className="toilet-preview-card-name">{toilet.name}</h4>
        <div className="toilet-preview-card-meta">
          {distanceStr && (
            <span className="toilet-preview-card-distance">{distanceStr}</span>
          )}
          {toilet.opening_hours && (
            <span className="toilet-preview-card-hours" title={toilet.opening_hours}>
              {toilet.opening_hours.length > 30
                ? toilet.opening_hours.slice(0, 30) + '…'
                : toilet.opening_hours}
            </span>
          )}
        </div>
        {facilities.length > 0 && (
          <div className="toilet-preview-card-facilities">
            {facilities.map((f) => (
              <span key={f} className="toilet-preview-card-facility">
                {f}
              </span>
            ))}
          </div>
        )}
        <Link to={`/toilet/${toilet.id}`} className="toilet-preview-card-cta" onClick={(e) => e.stopPropagation()}>
          View details →
        </Link>
      </div>
    </div>
  );
}
