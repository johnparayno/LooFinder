/**
 * Submit page - form to submit a new toilet (User Story 4)
 */
import { useState } from 'react';
import { submitToilet } from '../services/api';
import type { ToiletCategory, VenueTypeFilter } from '../services/api';

const CATEGORIES: { value: ToiletCategory; label: string }[] = [
  { value: 'free', label: 'Free' },
  { value: 'code_required', label: 'Code required' },
  { value: 'purchase_required', label: 'Purchase required' },
];

const VENUE_TYPES: { value: VenueTypeFilter; label: string }[] = [
  { value: 'supermarket', label: 'Supermarket' },
  { value: 'library', label: 'Library' },
  { value: 'museum', label: 'Museum' },
  { value: 'cafe_restaurant', label: 'Café / Restaurant' },
  { value: 'shopping_centre', label: 'Shopping centre' },
  { value: 'train_station', label: 'Train station' },
  { value: 'bus_station', label: 'Bus station' },
  { value: 'other', label: 'Other' },
];

export function SubmitPage() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [category, setCategory] = useState<ToiletCategory>('free');
  const [venueType, setVenueType] = useState<VenueTypeFilter | ''>('');
  const [accessNotes, setAccessNotes] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Name is required';
    if (!address.trim()) next.address = 'Address is required';
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (latitude === '' || isNaN(lat) || lat < -90 || lat > 90) {
      next.latitude = 'Latitude must be between -90 and 90';
    }
    if (longitude === '' || isNaN(lng) || lng < -180 || lng > 180) {
      next.longitude = 'Longitude must be between -180 and 180';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setErrors((e) => ({ ...e, latitude: 'Geolocation not supported' }));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setErrors((e) =>
          Object.fromEntries(Object.entries(e).filter(([k]) => k !== 'latitude' && k !== 'longitude'))
        );
      },
      () => { setErrors((e) => ({ ...e, latitude: 'Could not get location' })); }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await submitToilet({
        name: name.trim(),
        address: address.trim(),
        latitude: Number(latitude),
        longitude: Number(longitude),
        category,
        access_notes: accessNotes.trim() || null,
        opening_hours: openingHours.trim() || null,
        venue_type: venueType || null,
      });
      setSuccess(true);
      setName('');
      setAddress('');
      setLatitude('');
      setLongitude('');
      setAccessNotes('');
      setOpeningHours('');
      setVenueType('');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
  return (
    <div className="submit-page" style={{ maxWidth: 480, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1>Thank you!</h1>
      <p style={{ fontSize: 18, color: 'var(--color-text-muted)', marginTop: 8 }}>
          Your submission has been received. It will be reviewed by our team and appear on the map once verified.
        </p>
        <p style={{ marginTop: 24 }}>
          <button
            type="button"
            onClick={() => setSuccess(false)}
            style={{
              padding: '10px 20px',
              fontSize: 16,
              fontWeight: 600,
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
            }}
          >
            Submit another
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="submit-page" style={{ maxWidth: 480, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1>Submit a new toilet</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>
        Help others find toilets by adding a new location. Your submission will appear on the map with an "Unverified" label until reviewed.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="name" style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
            Name *
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Café Toilet"
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: 16,
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              boxSizing: 'border-box',
            }}
          />
          {errors.name && <p style={{ color: 'var(--color-error)', fontSize: 14, margin: '4px 0 0' }}>{errors.name}</p>}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="address" style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
            Address *
          </label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Strøget 1, 1100 København"
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: 16,
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              boxSizing: 'border-box',
            }}
          />
          {errors.address && <p style={{ color: 'var(--color-error)', fontSize: 14, margin: '4px 0 0' }}>{errors.address}</p>}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
            Coordinates *
          </label>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <input
              type="text"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="Latitude"
              style={{
                flex: 1,
                padding: '10px 12px',
                fontSize: 16,
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
              }}
            />
            <input
              type="text"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="Longitude"
              style={{
                flex: 1,
                padding: '10px 12px',
                fontSize: 16,
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
              }}
            />
          </div>
          <button
            type="button"
            onClick={handleUseMyLocation}
            style={{
              padding: '8px 16px',
              fontSize: 14,
              backgroundColor: 'var(--color-bg-soft)',
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
          >
            Use my location
          </button>
            {(errors.latitude || errors.longitude) && (
            <p style={{ color: 'var(--color-error)', fontSize: 14, margin: '4px 0 0' }}>
              {errors.latitude || errors.longitude}
            </p>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="category" style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
            Category *
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as ToiletCategory)}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: 16,
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              boxSizing: 'border-box',
            }}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="venue_type" style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
            Venue type (optional)
          </label>
          <select
            id="venue_type"
            value={venueType}
            onChange={(e) => setVenueType(e.target.value as VenueTypeFilter | '')}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: 16,
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              boxSizing: 'border-box',
            }}
          >
            <option value="">— Select venue type —</option>
            {VENUE_TYPES.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
            e.g. Supermarket, library, museum, café
          </p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="access_notes" style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
            Access notes (optional)
          </label>
          <textarea
            id="access_notes"
            value={accessNotes}
            onChange={(e) => setAccessNotes(e.target.value)}
            placeholder="e.g. Code at reception"
            rows={2}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: 16,
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              boxSizing: 'border-box',
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label htmlFor="opening_hours" style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
            Opening hours (optional)
          </label>
          <input
            id="opening_hours"
            type="text"
            value={openingHours}
            onChange={(e) => setOpeningHours(e.target.value)}
            placeholder="e.g. Mon–Fri 8–18, Sat 9–14"
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: 16,
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {submitError && (
          <p style={{ color: 'var(--color-error)', marginBottom: 16 }}>{submitError}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%',
            padding: '12px 24px',
            fontSize: 16,
            fontWeight: 600,
            backgroundColor: submitting ? 'var(--color-text-light)' : 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? 'Submitting…' : 'Submit'}
        </button>
      </form>
    </div>
  );
}
