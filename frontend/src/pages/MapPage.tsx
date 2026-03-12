/**
 * Map page - Leaflet map with toilet markers, find nearest, filters, search, user location
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import type { Toilet, ToiletCategory, VerificationStatus } from '../services/api';
import { listToilets, findNearestToilet } from '../services/api';
import { ToiletMarkers } from '../components/ToiletMarkers';
import { ToiletCard } from '../components/ToiletCard';
import { FilterBar } from '../components/FilterBar';
import { SearchBar } from '../components/SearchBar';

// Copenhagen center
const DEFAULT_CENTER: [number, number] = [55.6761, 12.5683];
const DEFAULT_ZOOM = 14;

function MapController({
  selectedToilet,
  centerOn,
  onBoundsChange,
}: {
  selectedToilet: Toilet | null;
  centerOn: [number, number] | null;
  onBoundsChange: (bbox: string) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedToilet) {
      map.flyTo([selectedToilet.latitude, selectedToilet.longitude], 16);
    }
  }, [map, selectedToilet]);

  useEffect(() => {
    if (centerOn) {
      map.flyTo(centerOn, 14);
    }
  }, [map, centerOn]);

  useEffect(() => {
    const handler = () => {
      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      const minLat = sw.lat;
      const minLng = sw.lng;
      const maxLat = ne.lat;
      const maxLng = ne.lng;
      // Validate bbox: map may have invalid bounds (e.g. 0 height) on initial load
      const latSpan = maxLat - minLat;
      const lngSpan = maxLng - minLng;
      const isValid =
        latSpan > 0.001 &&
        lngSpan > 0.001 &&
        minLat >= -90 &&
        maxLat <= 90 &&
        minLng >= -180 &&
        maxLng <= 180;
      const bbox = isValid
        ? `${minLat},${minLng},${maxLat},${maxLng}`
        : '55.6,12.4,55.8,12.7'; // fallback Copenhagen
      onBoundsChange(bbox);
    };
    map.whenReady(handler);
    map.on('moveend', handler);
    return () => {
      map.off('moveend', handler);
    };
  }, [map, onBoundsChange]);

  return null;
}

export function MapPage() {
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [selectedToilet, setSelectedToilet] = useState<Toilet | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<ToiletCategory | ''>('');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | ''>('');
  const [search, setSearch] = useState('');
  const [centerOn, setCenterOn] = useState<[number, number] | null>(null);
  const [locationUnavailable, setLocationUnavailable] = useState(false);
  const lastBboxRef = useRef<string>('55.6,12.4,55.8,12.7');

  const fetchToilets = useCallback(
    async (bbox: string, searchQuery?: string) => {
      try {
        const params: Parameters<typeof listToilets>[0] = { bbox };
        if (category) params.category = category;
        if (verificationStatus) params.verification_status = verificationStatus;
        if (searchQuery !== undefined ? searchQuery : search) {
          params.search = searchQuery !== undefined ? searchQuery : search;
        }
        const data = await listToilets(params);
        setToilets(data);
        setError(null);
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load toilets');
        setToilets([]);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [category, verificationStatus, search]
  );

  const handleBoundsChange = useCallback(
    (bbox: string) => {
      lastBboxRef.current = bbox;
      setLoading(true);
      fetchToilets(bbox);
    },
    [fetchToilets]
  );

  const handleSearch = useCallback(
    async (query: string) => {
      setSearch(query);
      setLoading(true);
      try {
        const params: Parameters<typeof listToilets>[0] = {};
        if (category) params.category = category;
        if (verificationStatus) params.verification_status = verificationStatus;
        if (query) params.search = query;
        const data = await listToilets(params);
        setToilets(data);
        setError(null);
        if (data.length > 0) {
          const avgLat = data.reduce((s, t) => s + t.latitude, 0) / data.length;
          const avgLng = data.reduce((s, t) => s + t.longitude, 0) / data.length;
          setCenterOn([avgLat, avgLng]);
          setTimeout(() => setCenterOn(null), 500);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setToilets([]);
      } finally {
        setLoading(false);
      }
    },
    [category, verificationStatus]
  );

  useEffect(() => {
    setLoading(true);
    fetchToilets(lastBboxRef.current);
  }, [category, verificationStatus, fetchToilets]);

  const handleFindNearest = useCallback(async () => {
    const latLng = userLocation ?? DEFAULT_CENTER;
    try {
      const nearest = await findNearestToilet({ lat: latLng[0], lng: latLng[1] });
      setSelectedToilet(nearest);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No toilet found');
    }
  }, [userLocation]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationUnavailable(true);
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setLocationUnavailable(false);
      },
      () => setLocationUnavailable(true)
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 400 }}>
      <FilterBar
        category={category}
        verificationStatus={verificationStatus}
        onCategoryChange={setCategory}
        onVerificationStatusChange={setVerificationStatus}
      />
      <SearchBar
        onSearch={handleSearch}
        onAddressSelect={(address, lat, lng) => {
          setSearch(address);
          setCenterOn([lat, lng]);
          setTimeout(() => setCenterOn(null), 500);
          const bbox = `${lat - 0.02},${lng - 0.02},${lat + 0.02},${lng + 0.02}`;
          lastBboxRef.current = bbox;
          setLoading(true);
          fetchToilets(bbox);
        }}
      />
      <div style={{ flex: 1, position: 'relative', minHeight: 400 }}>
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%', minHeight: 400 }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ToiletMarkers
            toilets={toilets}
            selectedToilet={selectedToilet}
            userLocation={userLocation}
            onSelect={setSelectedToilet}
          />
          <MapController
            selectedToilet={selectedToilet}
            centerOn={centerOn}
            onBoundsChange={handleBoundsChange}
          />
        </MapContainer>

        <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          {locationUnavailable && (
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)', backgroundColor: 'rgba(255,255,255,0.9)', padding: '4px 8px', borderRadius: 4 }}>
              Location unavailable – using map center
            </span>
          )}
          <button
            onClick={handleFindNearest}
            style={{
              padding: '12px 24px',
              fontSize: 16,
              fontWeight: 600,
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            Find nearest toilet
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ padding: 16, textAlign: 'center' }}>Loading toilets…</div>
      )}
      {error && (
        <div style={{ padding: 16, color: 'var(--color-error)', textAlign: 'center' }}>
          {error}
        </div>
      )}
      {!loading && !error && toilets.length === 0 && (
        <div
          style={{
            padding: 24,
            textAlign: 'center',
            color: 'var(--color-text-muted)',
            backgroundColor: 'var(--color-bg-soft)',
            borderTop: '1px solid var(--color-border)',
          }}
        >
            <strong style={{ display: 'block', marginBottom: 8, color: 'var(--color-text)' }}>
            No results
          </strong>
          {search
            ? 'No toilets match your search. Try different keywords or adjust filters.'
            : 'No toilets match your filters. Try adjusting category or verification status.'}
          {!search && (
            <p style={{ marginTop: 8, fontSize: 13 }}>
              If you just started, run <code>npm run seed</code> in the backend folder to load toilet data.
            </p>
          )}
        </div>
      )}
      {selectedToilet && (
        <div style={{ padding: 16, borderTop: '1px solid var(--color-border)' }}>
          <ToiletCard toilet={selectedToilet} onClose={() => setSelectedToilet(null)} />
        </div>
      )}
    </div>
  );
}
