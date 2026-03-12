/**
 * Donation page - User Story 7: Support the project
 * Placeholder donation flow with demo success message.
 */
import { useState } from 'react';
import { submitDonation } from '../services/api';

const PRESET_AMOUNTS = [25, 50, 100, 200];

export function DonationPage() {
  const [amount, setAmount] = useState<number | ''>(50);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const value = amount === '' ? 0 : amount;
    if (value <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setSubmitting(true);
    try {
      await submitDonation({ amount: value, currency: 'DKK' });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Donation failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="donation-page">
        <h1>Thank you!</h1>
        <p className="donation-success-message">
          Thank you for your support! (Demo mode - no payment processed)
        </p>
        <p className="donation-success-note">
          This is a placeholder flow. In a future version, real donations will
          help maintain and improve the toilet database and platform.
        </p>
        <button
          type="button"
          onClick={() => setSuccess(false)}
          className="donation-btn donation-btn-primary"
        >
          Donate again
        </button>
      </div>
    );
  }

  return (
    <div className="donation-page">
      <h1>Support LooFinder</h1>

      <section className="donation-section">
        <h2>Why donate?</h2>
        <p>
          LooFinder is a free, community-driven platform. Donations help us
          maintain and improve the toilet database, keep the map up to date, and
          add new features. Every contribution helps more people find toilets
          when they need them.
        </p>
      </section>

      <section className="donation-section">
        <h2>How your donation helps</h2>
        <ul className="donation-list">
          <li>Maintain and verify toilet data across Copenhagen</li>
          <li>Improve the map and search experience</li>
          <li>Support moderation of user submissions</li>
          <li>Keep the platform free for everyone</li>
        </ul>
      </section>

      <section className="donation-section donation-form-section">
        <h2>Make a donation</h2>
        <p className="donation-form-note">
          This is a demo flow. No payment will be processed.
        </p>

        <form onSubmit={handleSubmit} className="donation-form">
          <div className="donation-form-group">
            <label htmlFor="amount">Amount (DKK)</label>
            <div className="donation-presets">
              {PRESET_AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  className={`donation-preset-btn ${amount === a ? 'active' : ''}`}
                  onClick={() => setAmount(a)}
                >
                  {a} kr
                </button>
              ))}
            </div>
            <input
              id="amount"
              type="number"
              min="1"
              step="1"
              value={amount === '' ? '' : amount}
              onChange={(e) =>
                setAmount(e.target.value === '' ? '' : Number(e.target.value))
              }
              placeholder="Enter amount"
              className="donation-input"
            />
          </div>

          {error && <p className="donation-error">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="donation-btn donation-btn-primary donation-btn-submit"
          >
            {submitting ? 'Processing…' : 'Donate (demo)'}
          </button>
        </form>
      </section>
    </div>
  );
}
