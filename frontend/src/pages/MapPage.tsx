/**
 * Map page - Airbnb-inspired full-screen map with floating UI
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import type { Toilet, ToiletCategory, VerificationStatus, VenueTypeFilter } from '../services/api';
import { listToilets } from '../services/api';
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
/** Initial zoom: two levels wider than previous default (16) for more context on entry */
const DEFAULT_ZOOM = 14;

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
      map.panTo(centerOn, { duration: 400 });
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
  const [filterOverlayOpen, setFilterOverlayOpen] = useState(false);
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
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setLocationUnavailable(false);
      },
      () => setLocationUnavailable(true)
    );

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation([lat, lng]);
        setLocationUnavailable(false);
        setCenterOn([lat, lng]);
        setTimeout(() => setCenterOn(null), 500);
      },
      () => setLocationUnavailable(true),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const listPanel = (
    <div className="map-list-panel">
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
          {toilets.map((toilet) => (
            <ToiletPreviewCard
              key={toilet.id}
              toilet={toilet}
              userLocation={userLocation}
              isSelected={selectedToilet?.id === toilet.id}
              onSelect={setSelectedToilet}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <MapShell>
      <div className="map-desktop-layout">
        <aside className="map-list-sidebar">{listPanel}</aside>
        <div className="map-wrapper">
        <div className="map-canvas-wrap">
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
        </div>

        {/* Floating top: search + filter button */}
        <div className="map-floating-top">
          <div className="map-search-row">
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
            <button
              type="button"
              className="map-filter-btn"
              onClick={() => setFilterOverlayOpen(true)}
              aria-label="Filters"
            >
              <FilterIcon />
            </button>
          </div>
        </div>

        {/* Filter overlay - full screen */}
        {filterOverlayOpen && (
          <div className="map-filter-overlay" role="dialog" aria-label="Filters">
            <div className="map-filter-overlay-inner">
              <div className="map-filter-overlay-header">
                <h2 className="map-filter-overlay-title">Filters</h2>
                <button
                  type="button"
                  className="map-filter-overlay-close"
                  onClick={() => setFilterOverlayOpen(false)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <FilterPills
                category={category}
                verificationStatus={verificationStatus}
                venueType={venueType}
                onCategoryChange={setCategory}
                onVerificationStatusChange={setVerificationStatus}
                onVenueTypeChange={setVenueType}
              />
            </div>
          </div>
        )}

        {/* Map marker - bottom right, center map on my location */}
        <div className="map-location-control">
          <button
            type="button"
            className="map-location-btn"
            onClick={handleLocateMe}
            aria-label="Find my location"
          >
            <MapMarkerIcon />
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
      </div>
    </MapShell>
  );
}

function FilterIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function MapMarkerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  );
}
