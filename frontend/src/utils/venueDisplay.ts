/**
 * Display helpers for venue types.
 */
import type { VenueType } from '../services/api';

export const VENUE_TYPE_LABELS: Record<NonNullable<VenueType>, string> = {
  supermarket: 'Supermarket',
  library: 'Library',
  museum: 'Museum',
  cafe_restaurant: 'Café / Restaurant',
  shopping_centre: 'Shopping centre',
  train_station: 'Train station',
  bus_station: 'Bus station',
  other: 'Other',
};

export function getVenueTypeLabel(venueType: VenueType): string | null {
  return venueType ? VENUE_TYPE_LABELS[venueType] ?? null : null;
}

export const VENUE_TYPE_OPTIONS = [
  { value: 'supermarket' as const, label: 'Supermarket' },
  { value: 'library' as const, label: 'Library' },
  { value: 'museum' as const, label: 'Museum' },
  { value: 'cafe_restaurant' as const, label: 'Café / Restaurant' },
  { value: 'shopping_centre' as const, label: 'Shopping centre' },
  { value: 'train_station' as const, label: 'Train station' },
  { value: 'bus_station' as const, label: 'Bus station' },
  { value: 'other' as const, label: 'Other' },
];
