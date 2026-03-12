/**
 * Toilet markers with distinct styles per category and verification status.
 * Uses marker clustering when zoomed out.
 */
import { Marker, CircleMarker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { divIcon } from 'leaflet';
import type { Toilet } from '../services/api';

import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css';

const CATEGORY_COLORS: Record<Toilet['category'], string> = {
  free: '#22c55e',
  code_required: '#f59e0b',
  purchase_required: '#3b82f6',
};

function getMarkerColor(toilet: Toilet): string {
  const base = CATEGORY_COLORS[toilet.category];
  if (toilet.verification_status === 'unverified' || toilet.verification_status === 'needs_review') {
    return '#94a3b8'; // muted gray for unverified
  }
  return base;
}

function createToiletIcon(toilet: Toilet, isSelected: boolean) {
  const color = getMarkerColor(toilet);
  const isUnverified =
    toilet.verification_status === 'unverified' || toilet.verification_status === 'needs_review';

  return divIcon({
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
        <div style="
          width: 24px;
          height: 24px;
          background: ${color};
          border: 2px solid ${isSelected ? '#1e293b' : 'white'};
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          ${isUnverified ? 'border-style: dashed;' : ''}
        "></div>
        ${isUnverified ? '<span style="font-size:9px;color:#64748b;font-weight:600;white-space:nowrap;">Unverified</span>' : ''}
      </div>
    `,
    className: 'toilet-marker',
    iconSize: [24, isUnverified ? 36 : 24],
    iconAnchor: [12, 12],
  });
}

interface ToiletMarkersProps {
  toilets: Toilet[];
  selectedToilet: Toilet | null;
  userLocation: [number, number] | null;
  onSelect: (toilet: Toilet) => void;
}

export function ToiletMarkers({
  toilets,
  selectedToilet,
  userLocation,
  onSelect,
}: ToiletMarkersProps) {
  return (
    <>
      {userLocation && (
        <CircleMarker
          center={userLocation}
          radius={10}
          pathOptions={{
            color: '#2563eb',
            fillColor: '#3b82f6',
            fillOpacity: 0.6,
            weight: 2,
          }}
        >
          <Popup>Your location</Popup>
        </CircleMarker>
      )}
      <MarkerClusterGroup>
        {toilets.map((toilet) => (
          <Marker
            key={toilet.id}
            position={[toilet.latitude, toilet.longitude]}
            icon={createToiletIcon(toilet, selectedToilet?.id === toilet.id)}
            eventHandlers={{
              click: () => onSelect(toilet),
            }}
          >
            <Popup>
              {toilet.access_code && (
                <>
                  Code: {toilet.access_code}
                  <br />
                </>
              )}
              {toilet.address}
              <br />
              Hours: {toilet.opening_hours ?? '—'}
              <br />
              <strong>{toilet.name}</strong>
              {(toilet.verification_status === 'unverified' ||
                toilet.verification_status === 'needs_review') && (
                <>
                  <br />
                  <span style={{ color: '#64748b' }}>Unverified</span>
                </>
              )}
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </>
  );
}
