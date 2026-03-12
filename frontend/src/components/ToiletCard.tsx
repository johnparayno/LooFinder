/**
 * Toilet detail card - name, address, category, access conditions, opening hours, source, verification
 */
import { useState } from 'react';
import type { Toilet } from '../services/api';
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

export function ToiletCard({ toilet, onClose }: ToiletCardProps) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [showEditSuggestionModal, setShowEditSuggestionModal] = useState(false);
  const isUnverified =
    toilet.verification_status === 'unverified' || toilet.verification_status === 'needs_review';

  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-soft)',
        borderRadius: 'var(--radius-lg)',
        padding: 16,
        border: '1px solid var(--color-border)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{toilet.name}</h3>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              padding: 0,
              lineHeight: 1,
            }}
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>

      <p style={{ margin: '8px 0', color: 'var(--color-text-muted)', fontSize: 14 }}>{toilet.address}</p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <span
          style={{
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 12,
            fontWeight: 600,
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
          }}
        >
          {CATEGORY_LABELS[toilet.category]}
        </span>
        {isUnverified && (
          <span
            style={{
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: 'var(--color-bg-soft)',
              color: 'var(--color-text-muted)',
              border: '1px dashed var(--color-text-light)',
            }}
          >
            Unverified
          </span>
        )}
        {toilet.temporary_closed && (
          <span
            style={{
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: '#fee2e2',
              color: 'var(--color-error)',
            }}
          >
            Temporarily closed
          </span>
        )}
      </div>

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

      {toilet.opening_hours && (
        <p style={{ margin: '8px 0', fontSize: 14 }}>
          <strong>Hours:</strong> {toilet.opening_hours}
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
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            backgroundColor: '#fff',
            fontSize: 14,
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
          }}
        >
          Suggest edit
        </button>
        <button
          onClick={() => setShowReportModal(true)}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            backgroundColor: '#fff',
            fontSize: 14,
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
          }}
        >
          Report incorrect information
        </button>
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
