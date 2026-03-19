/**
 * Map page - Airbnb-inspired full-screen map with floating UI
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import type { Toilet, ToiletCategory, VerificationStatus, VenueTypeFilter } from '../services/api';
import { listToilets, findNearestToilet } from '../services/api';
import {
  MapShell,
  MapSearchBar,
  FilterPills,
  ToiletMarker,
  UserLocationMarker,
  ToiletPreviewCard,
  BottomSheet,
  type BottomSheetSnap,
} from '../components/map';
import { getToiletImageUrl } from '../utils/toiletImage';
import { getToiletDisplayName } from '../utils/toiletDisplay';

import '../components/map/map.css';

const DEFAULT_CENTER: [number, number] = [55.6761, 12.5683];
const DEFAULT_ZOOM = 16;

function MapController({
  centerOn,
  onBoundsChange,
}: {
  centerOn: [number, number] | null;
  onBoundsChange: (bbox: string) => void;
}) {
  const map = useMap();

  // Don't flyTo on marker select - it causes map shake. User can pan/zoom manually.

  // Fix map display on mobile: invalidateSize when ready and on resize (address bar, orientation)
  useEffect(() => {
    const onResize = () => {
      map.invalidateSize();
    };
    map.whenReady(() => {
      map.invalidateSize();
      // Mobile Safari may need a short delay for layout to settle
      setTimeout(() => map.invalidateSize(), 100);
    });
    window.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
    };
  }, [map]);

  useEffect(() => {
    if (centerOn) {
      map.flyTo(centerOn, 16, { duration: 500 });
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
        : '55.6,12.4,55.8,12.7';
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
  const [venueType, setVenueType] = useState<VenueTypeFilter | ''>('');
  const [search, setSearch] = useState('');
  const [centerOn, setCenterOn] = useState<[number, number] | null>(null);
  const [locationUnavailable, setLocationUnavailable] = useState(false);
  const [bottomSheetSnap, setBottomSheetSnap] = useState<BottomSheetSnap>('half');
  const lastBboxRef = useRef<string>('55.6,12.4,55.8,12.7');

  const fetchToilets = useCallback(
    async (bbox: string, searchQuery?: string) => {
      try {
        const params: Parameters<typeof listToilets>[0] = { bbox };
        if (category) params.category = category;
        if (verificationStatus) params.verification_status = verificationStatus;
        if (venueType) params.venue_type = venueType;
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
    [category, verificationStatus, venueType, search]
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
        if (venueType) params.venue_type = venueType;
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
    [category, verificationStatus, venueType]
  );

  useEffect(() => {
    setLoading(true);
    fetchToilets(lastBboxRef.current);
  }, [category, verificationStatus, venueType, fetchToilets]);

  const handleFindNearest = useCallback(async () => {
    const latLng = userLocation ?? DEFAULT_CENTER;
    try {
      const nearest = await findNearestToilet({ lat: latLng[0], lng: latLng[1] });
      setSelectedToilet(nearest);
      setBottomSheetSnap('half');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No toilet found');
    }
  }, [userLocation]);

  const handleLocateMe = useCallback(() => {
    if (userLocation) {
      setCenterOn(userLocation);
      setTimeout(() => setCenterOn(null), 500);
    } else {
      setLocationUnavailable(true);
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
    <MapShell>
      <div className="map-wrapper">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png"
          />
          {userLocation && <UserLocationMarker position={userLocation} />}
          <ToiletMarker
            toilets={toilets}
            selectedToilet={selectedToilet}
            onSelect={setSelectedToilet}
          />
          <MapController
            centerOn={centerOn}
            onBoundsChange={handleBoundsChange}
          />
        </MapContainer>

        {/* Floating top: search + filters */}
        <div className="map-floating-top">
          <MapSearchBar
            onSearch={handleSearch}
            onLocateMe={handleLocateMe}
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
          <FilterPills
            category={category}
            verificationStatus={verificationStatus}
            venueType={venueType}
            onCategoryChange={setCategory}
            onVerificationStatusChange={setVerificationStatus}
            onVenueTypeChange={setVenueType}
          />
        </div>

        {/* Floating actions */}
        <div className="map-floating-actions">
          <button
            type="button"
            className="map-floating-btn primary"
            onClick={handleFindNearest}
          >
            <ToiletIcon />
            <span>Nearest toilet</span>
          </button>
        </div>

        {locationUnavailable && (
          <div className="map-location-banner" role="status">
            Location unavailable – using map center
          </div>
        )}

        {/* Selected toilet detail overlay */}
        {selectedToilet && (
          <div className="map-toilet-overlay" role="dialog" aria-label="Toilet details">
            <div className="map-toilet-overlay-inner">
              <button
                className="map-toilet-overlay-close"
                onClick={() => setSelectedToilet(null)}
                aria-label="Close"
              >
                ×
              </button>
              <div className="map-toilet-overlay-image-wrap">
                <img
                  src={getToiletImageUrl(selectedToilet, 400, 160)}
                  alt=""
                  className="map-toilet-overlay-image"
                />
              </div>
              <div className="map-toilet-overlay-body">
                <h4 className="map-toilet-overlay-title">{getToiletDisplayName(selectedToilet.name)}</h4>
                <p className="map-toilet-overlay-address">{selectedToilet.address}</p>
                <p className="map-toilet-overlay-meta">
                  {selectedToilet.opening_hours ?? 'Hours not specified'}
                </p>
                <Link
                  to={`/toilet/${selectedToilet.id}`}
                  className="map-toilet-overlay-cta"
                >
                  View full details & directions →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Bottom sheet with toilet preview cards */}
        {!selectedToilet && (
          <BottomSheet
            snap={bottomSheetSnap}
            onSnapChange={setBottomSheetSnap}
            collapsedHeight={24}
            halfHeight={42}
            expandedHeight={75}
          >
            <div className="map-bottom-sheet-content">
              <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600, color: 'var(--color-text)' }}>
                Nearby toilets
              </h3>
              {loading && (
                <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-muted)' }}>
                  Loading…
                </p>
              )}
              {error && (
                <p style={{ margin: 0, fontSize: 14, color: 'var(--color-error)' }}>
                  {error}
                </p>
              )}
              {!loading && !error && toilets.length === 0 && (
                <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-muted)' }}>
                  No toilets in this area. Try moving the map or adjusting filters.
                </p>
              )}
              {!loading && !error && toilets.length > 0 && (
                <div className="toilet-preview-cards">
                  {toilets.slice(0, 10).map((toilet) => (
                    <ToiletPreviewCard
                      key={toilet.id}
                      toilet={toilet}
                      userLocation={userLocation}
                      isSelected={false}
                      onSelect={setSelectedToilet}
                    />
                  ))}
                </div>
              )}
            </div>
          </BottomSheet>
        )}
      </div>
    </MapShell>
  );
}

function ToiletIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 22v-4H6v-2h3v-2H6v-2h3V8a4 4 0 0 1 6 0v4h3v2h-3v2h3v2h-3v4" />
    </svg>
  );
}
