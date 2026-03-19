/**
 * Toilet detail page - full info, navigate buttons, share, etc.
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Toilet } from '../services/api';
import { getToiletById } from '../services/api';
import { getToiletImageUrl } from '../utils/toiletImage';
import { getToiletDisplayName } from '../utils/toiletDisplay';
import { getVenueTypeLabel } from '../utils/venueDisplay';
import { EditModal } from '../components/EditModal';

const CATEGORY_LABELS: Record<Toilet['category'], string> = {
  free: 'Free',
  code_required: 'Code required',
  purchase_required: 'Purchase required',
};

function shouldShowCategoryBadge(category: Toilet['category']): boolean {
  return category === 'free';
}

const TOILET_TYPE_LABELS: Record<NonNullable<Toilet['toilet_type']>, string> = {
  handicap: 'Handicap',
  pissoir: 'Pissoir',
  unisex: 'Unisex',
  changingplace: 'Changing Place',
};

function getMapsUrl(toilet: Toilet, mode: 'directions' | 'place'): string {
  const { latitude, longitude, address } = toilet;
  const dest = `${latitude},${longitude}`;
  if (mode === 'directions') {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address || dest)}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dest)}`;
}

function getAppleMapsUrl(toilet: Toilet): string {
  const { latitude, longitude } = toilet;
  return `https://maps.apple.com/?daddr=${latitude},${longitude}`;
}

function getWazeUrl(toilet: Toilet): string {
  const { latitude, longitude } = toilet;
  return `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
}

export function ToiletDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [toilet, setToilet] = useState<Toilet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('Invalid toilet ID');
      setLoading(false);
      return;
    }
    getToiletById(id)
      .then(setToilet)
      .catch(() => setError('Toilet not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCopyAddress = () => {
    if (!toilet?.address) return;
    navigator.clipboard.writeText(toilet.address);
    // Could add a toast - for now just copy
  };

  const handleShare = async () => {
    if (!toilet) return;
    const displayName = getToiletDisplayName(toilet.name);
    const shareData: ShareData = {
      title: displayName,
      text: `${displayName} - ${toilet.address}`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') handleCopyAddress();
      }
    } else {
      handleCopyAddress();
    }
  };

  if (loading) {
    return (
      <div className="toilet-detail-page">
        <div className="toilet-detail-loading">Loading…</div>
      </div>
    );
  }

  if (error || !toilet) {
    return (
      <div className="toilet-detail-page">
        <div className="toilet-detail-error">
          <p>{error ?? 'Toilet not found'}</p>
          <Link to="/map" className="btn-primary">Back to map</Link>
        </div>
      </div>
    );
  }

  const imageUrl = getToiletImageUrl(toilet, 1200, 500);
  const isUnverified =
    toilet.verification_status === 'unverified' || toilet.verification_status === 'needs_review';

  return (
    <div className="toilet-detail-page">
      <div className="toilet-detail-hero">
        <img src={imageUrl} alt={getToiletDisplayName(toilet.name)} className="toilet-detail-hero-image" />
        <div className="toilet-detail-hero-overlay">
          <Link to="/map" className="toilet-detail-back" aria-label="Back to map">
            ← Back to map
          </Link>
          <div className="toilet-detail-badges">
            {shouldShowCategoryBadge(toilet.category) && (
              <span className="toilet-detail-badge toilet-detail-badge-primary">
                {CATEGORY_LABELS[toilet.category]}
              </span>
            )}
            {toilet.venue_type && getVenueTypeLabel(toilet.venue_type) && (
              <span className="toilet-detail-badge toilet-detail-badge-secondary">
                {getVenueTypeLabel(toilet.venue_type)}
              </span>
            )}
            {toilet.toilet_type && TOILET_TYPE_LABELS[toilet.toilet_type] && (
              <span className="toilet-detail-badge toilet-detail-badge-secondary">
                {TOILET_TYPE_LABELS[toilet.toilet_type]}
              </span>
            )}
            {isUnverified && (
              <span className="toilet-detail-badge toilet-detail-badge-muted">Unverified</span>
            )}
            {toilet.temporary_closed && (
              <span className="toilet-detail-badge toilet-detail-badge-error">Temporarily closed</span>
            )}
          </div>
        </div>
      </div>

      <div className="toilet-detail-content">
        <h1 className="toilet-detail-title">{getToiletDisplayName(toilet.name)}</h1>
        <p className="toilet-detail-address">{toilet.address}</p>

        <div className="toilet-detail-actions">
          <a
            href={getMapsUrl(toilet, 'directions')}
            target="_blank"
            rel="noopener noreferrer"
            className="toilet-detail-btn toilet-detail-btn-primary"
          >
            Navigate with Google Maps
          </a>
          <a
            href={getAppleMapsUrl(toilet)}
            target="_blank"
            rel="noopener noreferrer"
            className="toilet-detail-btn toilet-detail-btn-secondary"
          >
            Open in Apple Maps
          </a>
          <a
            href={getWazeUrl(toilet)}
            target="_blank"
            rel="noopener noreferrer"
            className="toilet-detail-btn toilet-detail-btn-secondary"
          >
            Open in Waze
          </a>
          <button
            onClick={handleShare}
            className="toilet-detail-btn toilet-detail-btn-secondary"
          >
            Share
          </button>
        </div>

        <div className="toilet-detail-info">
          {(toilet.access_code || toilet.access_notes) && (
            <p>
              <strong>Access:</strong>{' '}
              {toilet.access_code ? (
                <>Code: <strong>{toilet.access_code}</strong>{toilet.access_notes ? ` — ${toilet.access_notes}` : ''}</>
              ) : (
                toilet.access_notes
              )}
            </p>
          )}
          {toilet.venue_type && getVenueTypeLabel(toilet.venue_type) && (
            <p><strong>Venue:</strong> {getVenueTypeLabel(toilet.venue_type)}</p>
          )}
          {toilet.placement && (
            <p><strong>Placement:</strong> {toilet.placement}</p>
          )}
          {toilet.opening_hours && (
            <p><strong>Hours:</strong> {toilet.opening_hours}</p>
          )}
          {(toilet.changing_table || toilet.tap || toilet.needle_container || toilet.manned) && (
            <p>
              <strong>Facilities:</strong>{' '}
              {[
                toilet.changing_table && 'Changing table',
                toilet.tap && 'Water tap',
                toilet.needle_container && 'Needle container',
                toilet.manned && 'Staffed',
              ]
                .filter(Boolean)
                .join(', ')}
            </p>
          )}
          {!toilet.opening_hours && !toilet.access_notes && (
            <p className="toilet-detail-muted">Opening hours and access notes not specified</p>
          )}
        </div>

        <div className="toilet-detail-footer-actions">
          <button
            onClick={() => setShowEditModal(true)}
            className="toilet-detail-btn toilet-detail-btn-outline"
          >
            Edit
          </button>
        </div>
      </div>

      {showEditModal && (
        <EditModal
          toilet={toilet}
          onClose={() => setShowEditModal(false)}
          onSuccess={(updated) => setToilet(updated)}
        />
      )}
    </div>
  );
}
