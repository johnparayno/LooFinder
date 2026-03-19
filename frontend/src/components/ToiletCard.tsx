/**
 * Toilet detail card - Airbnb-style with hero image (toilet → Street View → fallback)
 */
import { useState } from 'react';
import type { Toilet } from '../services/api';
import { getToiletImageUrl } from '../utils/toiletImage';
import { ReportModal } from './ReportModal';
import { EditSuggestionModal } from './EditSuggestionModal';

interface ToiletCardProps {
  toilet: Toilet;
  onClose?: () => void;
}

const CATEGORY_LABELS: Record<Toilet['category'], string> = {
  free: 'Free',
  code_required: 'Code required',
  purchase_required: 'Purchase required',
};

const TOILET_TYPE_LABELS: Record<NonNullable<Toilet['toilet_type']>, string> = {
  handicap: 'Handicap',
  pissoir: 'Pissoir',
  unisex: 'Unisex',
  changingplace: 'Changing Place',
};

export function ToiletCard({ toilet, onClose }: ToiletCardProps) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [showEditSuggestionModal, setShowEditSuggestionModal] = useState(false);
  const isUnverified =
    toilet.verification_status === 'unverified' || toilet.verification_status === 'needs_review';
  const imageUrl = getToiletImageUrl(toilet, 800, 400);

  return (
    <div className="toilet-card">
      <div className="toilet-card-header">
        <div className="toilet-card-hero">
          <img
            src={imageUrl}
            alt={toilet.name}
            className="toilet-card-hero-image"
          />
          <div className="toilet-card-badges">
            <span className="toilet-card-badge toilet-card-badge-primary">
              {CATEGORY_LABELS[toilet.category]}
            </span>
            {toilet.toilet_type && TOILET_TYPE_LABELS[toilet.toilet_type] && (
              <span className="toilet-card-badge toilet-card-badge-secondary">
                {TOILET_TYPE_LABELS[toilet.toilet_type]}
              </span>
            )}
            {isUnverified && (
              <span className="toilet-card-badge toilet-card-badge-muted">Unverified</span>
            )}
            {toilet.temporary_closed && (
              <span className="toilet-card-badge toilet-card-badge-error">Temporarily closed</span>
            )}
          </div>
        </div>
        <div className="toilet-card-title-row">
          <h3 className="toilet-card-title">{toilet.name}</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="toilet-card-close"
              aria-label="Close"
            >
              ×
            </button>
          )}
        </div>
        <p className="toilet-card-address">{toilet.address}</p>
      </div>

      <div className="toilet-card-body">
      {(toilet.access_code || toilet.access_notes) && (
        <p style={{ margin: '8px 0', fontSize: 14 }}>
          <strong>Access:</strong>{' '}
          {toilet.access_code ? (
            <>Code: <strong>{toilet.access_code}</strong>{toilet.access_notes ? ` — ${toilet.access_notes}` : ''}</>
          ) : (
            toilet.access_notes
          )}
        </p>
      )}

      {toilet.placement && (
        <p style={{ margin: '8px 0', fontSize: 14 }}>
          <strong>Placement:</strong> {toilet.placement}
        </p>
      )}

      {toilet.opening_hours && (
        <p style={{ margin: '8px 0', fontSize: 14 }}>
          <strong>Hours:</strong> {toilet.opening_hours}
        </p>
      )}

      {(toilet.changing_table || toilet.tap || toilet.needle_container || toilet.manned) && (
        <p style={{ margin: '8px 0', fontSize: 14 }}>
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
        <p style={{ margin: '8px 0', fontSize: 14, color: 'var(--color-text-light)' }}>
          Opening hours and access notes not specified
        </p>
      )}

      <p style={{ margin: '12px 0 0', fontSize: 12, color: 'var(--color-text-light)' }}>
        Source: {toilet.source_type.replace('_', ' ')}
        {toilet.last_verified_at && (
          <> • Last verified: {new Date(toilet.last_verified_at).toLocaleDateString()}</>
        )}
      </p>

      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <button
          onClick={() => setShowEditSuggestionModal(true)}
          className="toilet-card-btn toilet-card-btn-secondary"
        >
          Suggest edit
        </button>
        <button
          onClick={() => setShowReportModal(true)}
          className="toilet-card-btn toilet-card-btn-secondary"
        >
          Report incorrect information
        </button>
      </div>
      </div>

      {showEditSuggestionModal && (
        <EditSuggestionModal
          toilet={toilet}
          onClose={() => setShowEditSuggestionModal(false)}
        />
      )}

      {showReportModal && (
        <ReportModal
          toilet={toilet}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}
