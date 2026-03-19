/**
 * MapShell - Full-screen map canvas with floating overlay layout.
 * Airbnb-inspired: map is the main canvas, UI floats on top.
 */
import { ReactNode } from 'react';

interface MapShellProps {
  children: ReactNode;
}

export function MapShell({ children }: MapShellProps) {
  return (
    <div className="map-shell">
      {children}
    </div>
  );
}
