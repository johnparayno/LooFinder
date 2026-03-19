/**
 * ToiletMarker - Product-grade toilet marker with rounded, elevated design.
 * Selected state animates; supports clustering.
 */
import { Marker } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { divIcon } from 'leaflet';
import type { Toilet } from '../../services/api';

import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css';

const CATEGORY_COLORS: Record<Toilet['category'], string> = {
  free: '#059669',
  code_required: '#d97706',
  purchase_required: '#2563eb',
};

function getMarkerColor(toilet: Toilet): string {
  const base = CATEGORY_COLORS[toilet.category];
  if (
    toilet.verification_status === 'unverified' ||
    toilet.verification_status === 'needs_review'
  ) {
    return '#94a3b8';
  }
  return base;
}

function createToiletIcon(toilet: Toilet, isSelected: boolean) {
  const color = getMarkerColor(toilet);
  const isUnverified =
    toilet.verification_status === 'unverified' ||
    toilet.verification_status === 'needs_review';

  return divIcon({
    html: `
      <div class="toilet-marker-wrap ${isSelected ? 'selected' : ''} ${isUnverified ? 'unverified' : ''}">
        <div class="toilet-marker-dot" style="background: ${color};"></div>
      </div>
    `,
    className: 'toilet-marker-custom',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

interface ToiletMarkerProps {
  toilets: Toilet[];
  selectedToilet: Toilet | null;
  onSelect: (toilet: Toilet) => void;
}

export function ToiletMarker({ toilets, selectedToilet, onSelect }: ToiletMarkerProps) {
  return (
    <MarkerClusterGroup
      disableClusteringAtZoom={15}
      maxClusterRadius={60}
      spiderfyOnMaxZoom={false}
      zoomToBoundsOnClick={true}
      showCoverageOnHover={false}
      chunkedLoading={true}
    >
      {toilets.map((toilet) => (
        <Marker
          key={toilet.id}
          position={[toilet.latitude, toilet.longitude]}
          icon={createToiletIcon(toilet, selectedToilet?.id === toilet.id)}
          eventHandlers={{
            click: () => onSelect(toilet),
          }}
        />
      ))}
    </MarkerClusterGroup>
  );
}
