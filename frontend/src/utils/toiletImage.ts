/**
 * Resolves the best available image for a toilet:
 * 1. Toilet's own image_url (from database)
 * 2. Google Street View static image (if VITE_GOOGLE_MAPS_API_KEY is set)
 * 3. Fallback placeholder (same toilet icon for all)
 */
import type { Toilet } from '../services/api';

/** SVG placeholder with toilet icon - same for all toilets without image/streetview */
const TOILET_PLACEHOLDER_SVG = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" fill="none"><rect width="120" height="80" fill="%23e2e8f0"/><g fill="%2394a3b8" opacity="0.6"><ellipse cx="60" cy="48" rx="18" ry="14"/><rect x="54" y="28" width="12" height="20" rx="2"/><circle cx="60" cy="22" r="5"/></g><text x="60" y="72" text-anchor="middle" font-size="9" fill="%2394a3b8" opacity="0.6" font-family="system-ui,sans-serif">picture on the way</text></svg>'
)}`;

export type ToiletImageType = 'image' | 'streetview' | 'placeholder';

export function getToiletImageType(toilet: Toilet): ToiletImageType {
  if (toilet.image_url) return 'image';
  if (import.meta.env.VITE_GOOGLE_MAPS_API_KEY) return 'streetview';
  return 'placeholder';
}

export function getToiletImageUrl(toilet: Toilet, width = 400, height = 250): string {
  if (toilet.image_url) {
    return toilet.image_url;
  }
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (apiKey) {
    return `https://maps.googleapis.com/maps/api/streetview?size=${width}x${height}&location=${toilet.latitude},${toilet.longitude}&key=${apiKey}`;
  }
  return TOILET_PLACEHOLDER_SVG;
}
