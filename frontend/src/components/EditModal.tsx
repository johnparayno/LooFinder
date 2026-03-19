/**
 * Edit modal - edit toilet directly (no login required)
 */
import { useState, useRef } from 'react';
import type { Toilet } from '../services/api';
import { getToiletDisplayName } from '../utils/toiletDisplay';
import { updateToilet } from '../services/api';
import type { ToiletCategory, VenueTypeFilter, ToiletType } from '../services/api';
import { VENUE_TYPE_OPTIONS } from '../utils/venueDisplay';

interface EditModalProps {
  toilet: Toilet;
  onClose: () => void;
  onSuccess?: (toilet: Toilet) => void;
}

const CATEGORY_OPTIONS: { value: ToiletCategory; label: string }[] = [
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

export function EditModal({ toilet, onClose, onSuccess }: EditModalProps) {
  const [name, setName] = useState(toilet.name);
  const [address, setAddress] = useState(toilet.address);
  const [latitude, setLatitude] = useState(String(toilet.latitude));
  const [longitude, setLongitude] = useState(String(toilet.longitude));
  const [category, setCategory] = useState<ToiletCategory>(toilet.category);
  const [venueType, setVenueType] = useState<VenueTypeFilter | ''>(
    (toilet.venue_type as VenueTypeFilter) || ''
  );
  const [toiletType, setToiletType] = useState<ToiletType | ''>(
    (toilet.toilet_type as ToiletType) || ''
  );
  const [accessNotes, setAccessNotes] = useState(toilet.access_notes ?? '');
  const [accessCode, setAccessCode] = useState(toilet.access_code ?? '');
  const [openingHours, setOpeningHours] = useState(toilet.opening_hours ?? '');
  const [placement, setPlacement] = useState(toilet.placement ?? '');
  const [contact, setContact] = useState(toilet.contact ?? '');
  const [temporaryClosed, setTemporaryClosed] = useState(toilet.temporary_closed);
  const [payment, setPayment] = useState(toilet.payment ?? false);
  const [manned, setManned] = useState(toilet.manned ?? false);
  const [changingTable, setChangingTable] = useState(toilet.changing_table ?? false);
  const [tap, setTap] = useState(toilet.tap ?? false);
  const [needleContainer, setNeedleContainer] = useState(toilet.needle_container ?? false);
  const [yearRound, setYearRound] = useState(toilet.year_round !== false);
  const [roundTheClock, setRoundTheClock] = useState(toilet.round_the_clock ?? false);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(toilet.image_url ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImageDataUrl(toilet.image_url ?? null);
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError('Image must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const lat = Number(latitude);
    const lng = Number(longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setError('Latitude must be between -90 and 90');
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setError('Longitude must be between -180 and 180');
      return;
    }

    setSubmitting(true);

    try {
      const updated = await updateToilet(toilet.id, {
        name: name.trim(),
        address: address.trim(),
        latitude: lat,
        longitude: lng,
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
      setSubmitted(true);
      onSuccess?.(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    fontSize: 14,
    boxSizing: 'border-box' as const,
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
            Changes saved.
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
          maxWidth: 420,
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>Edit</h3>
        <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--color-text-muted)' }}>
          {getToiletDisplayName(toilet.name)}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="edit-name" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Name</label>
            <input id="edit-name" type="text" value={name} onChange={(e) => setName(e.target.value)} disabled={submitting} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="edit-address" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Address</label>
            <input id="edit-address" type="text" value={address} onChange={(e) => setAddress(e.target.value)} disabled={submitting} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Coordinates</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="Lat" disabled={submitting} style={{ ...inputStyle, flex: 1 }} />
              <input type="text" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="Lng" disabled={submitting} style={{ ...inputStyle, flex: 1 }} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="edit-category" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Category</label>
            <select id="edit-category" value={category} onChange={(e) => setCategory(e.target.value as ToiletCategory)} disabled={submitting} style={inputStyle}>
              {CATEGORY_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="edit-venue-type" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Venue type</label>
            <select id="edit-venue-type" value={venueType} onChange={(e) => setVenueType((e.target.value || '') as VenueTypeFilter | '')} disabled={submitting} style={inputStyle}>
              <option value="">— Not specified —</option>
              {VENUE_TYPE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="edit-toilet-type" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Toilet type</label>
            <select id="edit-toilet-type" value={toiletType} onChange={(e) => setToiletType((e.target.value || '') as ToiletType | '')} disabled={submitting} style={inputStyle}>
              <option value="">— Not specified —</option>
              {TOILET_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="edit-opening-hours" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Opening hours</label>
            <input id="edit-opening-hours" type="text" value={openingHours} onChange={(e) => setOpeningHours(e.target.value)} disabled={submitting} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="edit-access-notes" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Access notes</label>
            <textarea id="edit-access-notes" value={accessNotes} onChange={(e) => setAccessNotes(e.target.value)} rows={2} disabled={submitting} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="edit-access-code" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Access code</label>
            <input id="edit-access-code" type="text" value={accessCode} onChange={(e) => setAccessCode(e.target.value)} disabled={submitting} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="edit-placement" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Placement</label>
            <input id="edit-placement" type="text" value={placement} onChange={(e) => setPlacement(e.target.value)} disabled={submitting} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="edit-contact" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Contact</label>
            <input id="edit-contact" type="text" value={contact} onChange={(e) => setContact(e.target.value)} disabled={submitting} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Photo</label>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} style={{ fontSize: 14 }} />
            {imageDataUrl && (
              <div style={{ marginTop: 8 }}>
                <img src={imageDataUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 8, objectFit: 'cover' }} />
                <button type="button" onClick={() => { setImageDataUrl(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} style={{ marginTop: 4, fontSize: 12, color: 'var(--color-text-muted)' }}>Remove</button>
              </div>
            )}
          </div>
          <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><input type="checkbox" checked={payment} onChange={(e) => setPayment(e.target.checked)} disabled={submitting} /><span style={{ fontSize: 14 }}>Payment</span></label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><input type="checkbox" checked={manned} onChange={(e) => setManned(e.target.checked)} disabled={submitting} /><span style={{ fontSize: 14 }}>Staffed</span></label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><input type="checkbox" checked={changingTable} onChange={(e) => setChangingTable(e.target.checked)} disabled={submitting} /><span style={{ fontSize: 14 }}>Changing table</span></label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><input type="checkbox" checked={tap} onChange={(e) => setTap(e.target.checked)} disabled={submitting} /><span style={{ fontSize: 14 }}>Tap</span></label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><input type="checkbox" checked={needleContainer} onChange={(e) => setNeedleContainer(e.target.checked)} disabled={submitting} /><span style={{ fontSize: 14 }}>Needle container</span></label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><input type="checkbox" checked={yearRound} onChange={(e) => setYearRound(e.target.checked)} disabled={submitting} /><span style={{ fontSize: 14 }}>Year-round</span></label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><input type="checkbox" checked={roundTheClock} onChange={(e) => setRoundTheClock(e.target.checked)} disabled={submitting} /><span style={{ fontSize: 14 }}>24/7</span></label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><input type="checkbox" checked={temporaryClosed} onChange={(e) => setTemporaryClosed(e.target.checked)} disabled={submitting} /><span style={{ fontSize: 14 }}>Temporarily closed</span></label>
          </div>

          {error && <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--color-error)' }}>{error}</p>}

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--color-border)', backgroundColor: '#fff', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
            <button type="submit" disabled={submitting} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', backgroundColor: 'var(--color-primary)', color: '#fff', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
