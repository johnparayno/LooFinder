/**
 * Submit page - form to submit a new toilet (no login required)
 */
import { useState, useRef } from 'react';
import { submitToilet } from '../services/api';
import type { ToiletCategory, VenueTypeFilter, ToiletType } from '../services/api';
import { VENUE_TYPE_OPTIONS } from '../utils/venueDisplay';

const CATEGORIES: { value: ToiletCategory; label: string }[] = [
  { value: 'free', label: 'Free' },
  { value: 'code_required', label: 'Code required' },
  { value: 'purchase_required', label: 'Purchase required' },
];

const TOILET_TYPES: { value: ToiletType; label: string }[] = [
  { value: 'handicap', label: 'Handicap' },
  { value: 'pissoir', label: 'Pissoir' },
  { value: 'unisex', label: 'Unisex' },
  { value: 'changingplace', label: 'Changing Place' },
];

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

export function SubmitPage() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [category, setCategory] = useState<ToiletCategory>('free');
  const [venueType, setVenueType] = useState<VenueTypeFilter | ''>('');
  const [toiletType, setToiletType] = useState<ToiletType | ''>('');
  const [accessNotes, setAccessNotes] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [placement, setPlacement] = useState('');
  const [contact, setContact] = useState('');
  const [temporaryClosed, setTemporaryClosed] = useState(false);
  const [payment, setPayment] = useState(false);
  const [manned, setManned] = useState(false);
  const [changingTable, setChangingTable] = useState(false);
  const [tap, setTap] = useState(false);
  const [needleContainer, setNeedleContainer] = useState(false);
  const [yearRound, setYearRound] = useState(true);
  const [roundTheClock, setRoundTheClock] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImageDataUrl(null);
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setErrors((e) => ({ ...e, image: 'Image must be under 2MB' }));
      setImageDataUrl(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(reader.result as string);
      setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => k !== 'image')));
    };
    reader.readAsDataURL(file);
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
        access_code: accessCode.trim() || null,
        opening_hours: openingHours.trim() || null,
        venue_type: venueType || null,
        toilet_type: toiletType || null,
        payment,
        manned,
        changing_table: changingTable,
        tap,
        needle_container: needleContainer,
        contact: contact.trim() || null,
        image_url: imageDataUrl,
        placement: placement.trim() || null,
        year_round: yearRound,
        round_the_clock: roundTheClock,
        temporary_closed: temporaryClosed,
      });
      setSuccess(true);
      setName('');
      setAddress('');
      setLatitude('');
      setLongitude('');
      setAccessNotes('');
      setAccessCode('');
      setOpeningHours('');
      setPlacement('');
      setContact('');
      setVenueType('');
      setToiletType('');
      setImageDataUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    fontSize: 16,
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    boxSizing: 'border-box' as const,
  };

  const labelStyle = { display: 'block', marginBottom: 4, fontWeight: 600 };

  if (success) {
    return (
      <div className="submit-page" style={{ maxWidth: 480, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1>Thank you!</h1>
        <p style={{ fontSize: 18, color: 'var(--color-text-muted)', marginTop: 8 }}>
          Your toilet has been added. It will appear on the map.
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
            Add another
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="submit-page" style={{ maxWidth: 480, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1>Add a toilet</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>
        Anyone can add toilets. No login required.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="name" style={labelStyle}>Name *</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Café Toilet"
            style={inputStyle}
          />
          {errors.name && <p style={{ color: 'var(--color-error)', fontSize: 14, margin: '4px 0 0' }}>{errors.name}</p>}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="address" style={labelStyle}>Address *</label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Strøget 1, 1100 København"
            style={inputStyle}
          />
          {errors.address && <p style={{ color: 'var(--color-error)', fontSize: 14, margin: '4px 0 0' }}>{errors.address}</p>}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Coordinates *</label>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <input
              type="text"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="Latitude"
              style={{ ...inputStyle, flex: 1 }}
            />
            <input
              type="text"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="Longitude"
              style={{ ...inputStyle, flex: 1 }}
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
          <label htmlFor="category" style={labelStyle}>Category *</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as ToiletCategory)}
            style={inputStyle}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="venue_type" style={labelStyle}>Venue type</label>
          <select
            id="venue_type"
            value={venueType}
            onChange={(e) => setVenueType(e.target.value as VenueTypeFilter | '')}
            style={inputStyle}
          >
            <option value="">— Select —</option>
            {VENUE_TYPE_OPTIONS.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="toilet_type" style={labelStyle}>Toilet type</label>
          <select
            id="toilet_type"
            value={toiletType}
            onChange={(e) => setToiletType((e.target.value || '') as ToiletType | '')}
            style={inputStyle}
          >
            <option value="">— Select —</option>
            {TOILET_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="access_notes" style={labelStyle}>Access notes</label>
          <textarea
            id="access_notes"
            value={accessNotes}
            onChange={(e) => setAccessNotes(e.target.value)}
            placeholder="e.g. Code at reception"
            rows={2}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="access_code" style={labelStyle}>Access code</label>
          <input
            id="access_code"
            type="text"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            placeholder="e.g. 1234"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="opening_hours" style={labelStyle}>Opening hours</label>
          <input
            id="opening_hours"
            type="text"
            value={openingHours}
            onChange={(e) => setOpeningHours(e.target.value)}
            placeholder="e.g. Mon–Fri 8–18, Sat 9–14"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="placement" style={labelStyle}>Placement</label>
          <input
            id="placement"
            type="text"
            value={placement}
            onChange={(e) => setPlacement(e.target.value)}
            placeholder="e.g. Ground floor, near entrance"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="contact" style={labelStyle}>Contact</label>
          <input
            id="contact"
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="e.g. Phone or email"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Photo</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            style={{ fontSize: 14 }}
          />
          {imageDataUrl && (
            <div style={{ marginTop: 8 }}>
              <img
                src={imageDataUrl}
                alt="Preview"
                style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, objectFit: 'cover' }}
              />
              <button
                type="button"
                onClick={() => { setImageDataUrl(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                style={{ marginTop: 4, fontSize: 12, color: 'var(--color-text-muted)' }}
              >
                Remove
              </button>
            </div>
          )}
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>Max 2MB (JPEG, PNG, WebP)</p>
          {errors.image && <p style={{ color: 'var(--color-error)', fontSize: 14, margin: '4px 0 0' }}>{errors.image}</p>}
        </div>

        <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={payment} onChange={(e) => setPayment(e.target.checked)} />
            <span>Payment required</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={manned} onChange={(e) => setManned(e.target.checked)} />
            <span>Staffed</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={changingTable} onChange={(e) => setChangingTable(e.target.checked)} />
            <span>Changing table</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={tap} onChange={(e) => setTap(e.target.checked)} />
            <span>Water tap</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={needleContainer} onChange={(e) => setNeedleContainer(e.target.checked)} />
            <span>Needle container</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={yearRound} onChange={(e) => setYearRound(e.target.checked)} />
            <span>Year-round</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={roundTheClock} onChange={(e) => setRoundTheClock(e.target.checked)} />
            <span>24/7</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={temporaryClosed} onChange={(e) => setTemporaryClosed(e.target.checked)} />
            <span>Temporarily closed</span>
          </label>
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
          {submitting ? 'Adding…' : 'Add toilet'}
        </button>
      </form>
    </div>
  );
}
