/**
 * Edit suggestion modal - submit suggested edits for a toilet
 */
import { useState } from 'react';
import type { Toilet } from '../services/api';
import { submitEditSuggestion } from '../services/api';
import type { ToiletCategory } from '../services/api';

interface EditSuggestionModalProps {
  toilet: Toilet;
  onClose: () => void;
  onSuccess?: () => void;
}

const CATEGORY_OPTIONS: { value: ToiletCategory; label: string }[] = [
  { value: 'free', label: 'Free' },
  { value: 'code_required', label: 'Code required' },
  { value: 'purchase_required', label: 'Purchase required' },
];

export function EditSuggestionModal({ toilet, onClose, onSuccess }: EditSuggestionModalProps) {
  const [name, setName] = useState(toilet.name);
  const [address, setAddress] = useState(toilet.address);
  const [openingHours, setOpeningHours] = useState(toilet.opening_hours ?? '');
  const [accessNotes, setAccessNotes] = useState(toilet.access_notes ?? '');
  const [category, setCategory] = useState<ToiletCategory>(toilet.category);
  const [temporaryClosed, setTemporaryClosed] = useState(toilet.temporary_closed);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const buildSuggestedFields = (): Record<string, unknown> => {
    const fields: Record<string, unknown> = {};
    if (name.trim() !== toilet.name) fields.name = name.trim();
    if (address.trim() !== toilet.address) fields.address = address.trim();
    if (openingHours.trim() !== (toilet.opening_hours ?? '')) {
      fields.opening_hours = openingHours.trim() || null;
    }
    if (accessNotes.trim() !== (toilet.access_notes ?? '')) {
      fields.access_notes = accessNotes.trim() || null;
    }
    if (category !== toilet.category) fields.category = category;
    if (temporaryClosed !== toilet.temporary_closed) fields.temporary_closed = temporaryClosed;
    return fields;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const suggestedFields = buildSuggestedFields();

    if (Object.keys(suggestedFields).length === 0) {
      setError('Please change at least one field.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await submitEditSuggestion({
        toilet_id: toilet.id,
        suggested_fields: suggestedFields,
      });
      setSubmitted(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit suggestion');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={onClose}
      >
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 24,
            maxWidth: 360,
            width: '90%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <p style={{ margin: 0, fontSize: 16, color: 'var(--color-success)' }}>
            Thank you for your suggestion. It will be reviewed.
          </p>
          <button
            onClick={onClose}
            style={{
              marginTop: 16,
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const inputStyle = {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    fontSize: 14,
    boxSizing: 'border-box' as const,
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: 24,
          maxWidth: 400,
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>Suggest edit</h3>
        <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--color-text-muted)' }}>
          {toilet.name}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="edit-name" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
              Name
            </label>
            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label htmlFor="edit-address" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
              Address
            </label>
            <input
              id="edit-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={submitting}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label htmlFor="edit-opening-hours" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
              Opening hours
            </label>
            <input
              id="edit-opening-hours"
              type="text"
              value={openingHours}
              onChange={(e) => setOpeningHours(e.target.value)}
              placeholder="e.g. Mon–Fri 8–18"
              disabled={submitting}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label htmlFor="edit-access-notes" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
              Access notes
            </label>
            <textarea
              id="edit-access-notes"
              value={accessNotes}
              onChange={(e) => setAccessNotes(e.target.value)}
              placeholder="e.g. Code at reception"
              rows={2}
              disabled={submitting}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label htmlFor="edit-category" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
              Category
            </label>
            <select
              id="edit-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ToiletCategory)}
              disabled={submitting}
              style={inputStyle}
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={temporaryClosed}
                onChange={(e) => setTemporaryClosed(e.target.checked)}
                disabled={submitting}
              />
              <span style={{ fontSize: 14 }}>Temporarily closed</span>
            </label>
          </div>

          {error && (
            <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--color-error)' }}>{error}</p>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: '1px solid var(--color-border)',
                backgroundColor: '#fff',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? 'Submitting...' : 'Submit suggestion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
