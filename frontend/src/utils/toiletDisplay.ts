/**
 * Display helpers for toilet names.
 * OSM-sourced toilets without a proper name show "Toilet (OSM node/123)" - we display "Unverified toilet" instead.
 */
const OSM_NAME_PATTERN = /^Toilet \(OSM (node|way)\/\d+\)$/i;

export function getToiletDisplayName(name: string): string {
  return OSM_NAME_PATTERN.test(name.trim()) ? 'Unverified toilet' : name;
}
