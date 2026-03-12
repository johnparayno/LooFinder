/**
 * Report modal - submit report for incorrect toilet information
 */
import { useState } from 'react';
import type { Toilet } from '../services/api';
import { submitReport } from '../services/api';

interface ReportModalProps {
  toilet: Toilet;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ReportModal({ toilet, onClose, onSuccess }: ReportModalProps) {
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = description.trim();
    if (!trimmed) {
      setError('Please describe what is incorrect.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await submitReport({
        toilet_id: toilet.id,
        description: trimmed,
      });
      setSubmitted(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report');
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
            Thank you for your report. It will be reviewed.
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
        <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>Report incorrect information</h3>
          <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--color-text-muted)' }}>
          {toilet.name}
        </p>

        <form onSubmit={handleSubmit}>
          <label
            htmlFor="report-description"
            style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}
          >
            What is incorrect?
          </label>
          <textarea
            id="report-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Opening hours have changed, address is wrong..."
            rows={4}
            disabled={submitting}
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              fontSize: 14,
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />

          {error && (
            <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--color-error)' }}>{error}</p>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
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
              {submitting ? 'Submitting...' : 'Submit report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
