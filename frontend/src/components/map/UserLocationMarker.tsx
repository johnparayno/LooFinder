/**
 * UserLocationMarker - Animated geolocation marker with pulse effect.
 * Central dot + soft expanding ring; elegant, not gimmicky.
 */
import { Marker } from 'react-leaflet';
import { divIcon } from 'leaflet';

interface UserLocationMarkerProps {
  position: [number, number];
}

const userLocationIcon = divIcon({
  html: `
    <div class="user-location-marker">
      <span class="user-location-pulse user-location-pulse-1"></span>
      <span class="user-location-pulse user-location-pulse-2"></span>
      <span class="user-location-dot"></span>
    </div>
  `,
  className: 'user-location-marker-wrap',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

export function UserLocationMarker({ position }: UserLocationMarkerProps) {
  return <Marker position={position} icon={userLocationIcon} />;
}
