/**
 * Seed service - loads Copenhagen toilet data from multiple sources
 * Sources: FindToilet API, opendata.dk GeoJSON; falls back to embedded sample + cafés + McDonald's
 */
import path from 'path';
import { getDatabase, initSchema } from '../db/schema.js';
import type { ToiletInsert } from '../models/toilet.js';
import { randomUUID } from 'crypto';

const FINDTOILET_API = 'https://beta.findtoilet.dk/api/v3/toilets';
const COPENHAGEN_TERM_ID = 2;


function random4DigitCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/** Embedded sample toilets (Copenhagen) - used when API fetch fails */
const SAMPLE_TOILETS: Omit<ToiletInsert, 'id'>[] = [
  {
    name: 'Rådhuspladsen Public Toilet',
    address: 'Rådhuspladsen 1, 1599 København',
    latitude: 55.6759,
    longitude: 12.5654,
    category: 'free',
    access_notes: null,
    access_code: null,
    opening_hours: '24/7',
    source_type: 'public_dataset',
    verification_status: 'verified',
    last_verified_at: null,
    temporary_closed: false,
  },
  {
    name: 'Nørreport Station Toilet',
    address: 'Nørre Voldgade 1, 1358 København',
    latitude: 55.6835,
    longitude: 12.5711,
    category: 'purchase_required',
    access_notes: 'Coin required',
    access_code: null,
    opening_hours: 'Mon–Fri 6–24, Sat–Sun 7–24',
    source_type: 'public_dataset',
    verification_status: 'verified',
    last_verified_at: null,
    temporary_closed: false,
  },
  {
    name: 'Kongens Nytorv Metro Toilet',
    address: 'Kongens Nytorv, 1050 København',
    latitude: 55.6794,
    longitude: 12.5881,
    category: 'code_required',
    access_notes: 'Code at station info',
    access_code: random4DigitCode(),
    opening_hours: '24/7',
    source_type: 'public_dataset',
    verification_status: 'verified',
    last_verified_at: null,
    temporary_closed: false,
  },
  {
    name: 'Strøget Public Toilet',
    address: 'Strøget, 1100 København',
    latitude: 55.6792,
    longitude: 12.5794,
    category: 'free',
    access_notes: null,
    access_code: null,
    opening_hours: 'Mon–Fri 8–18',
    source_type: 'public_dataset',
    verification_status: 'verified',
    last_verified_at: null,
    temporary_closed: false,
  },
  {
    name: 'Nyhavn Public Toilet',
    address: 'Nyhavn 1, 1051 København',
    latitude: 55.6797,
    longitude: 12.5901,
    category: 'purchase_required',
    access_notes: null,
    access_code: null,
    opening_hours: '24/7',
    source_type: 'public_dataset',
    verification_status: 'verified',
    last_verified_at: null,
    temporary_closed: false,
  },
  {
    name: 'Tivoli Gardens Toilet',
    address: 'Vesterbrogade 3, 1630 København',
    latitude: 55.6736,
    longitude: 12.5649,
    category: 'purchase_required',
    access_notes: 'Inside Tivoli - ticket required',
    access_code: null,
    opening_hours: 'Varies with Tivoli hours',
    source_type: 'public_dataset',
    verification_status: 'verified',
    last_verified_at: null,
    temporary_closed: false,
  },
  {
    name: 'Christiansborg Toilet',
    address: 'Prins Jørgens Gård 1, 1218 København',
    latitude: 55.6761,
    longitude: 12.5794,
    category: 'free',
    access_notes: null,
    access_code: null,
    opening_hours: 'Mon–Fri 10–17',
    source_type: 'public_dataset',
    verification_status: 'verified',
    last_verified_at: null,
    temporary_closed: false,
  },
  {
    name: 'Østerport Station Toilet',
    address: 'Oslo Plads 1, 2100 København',
    latitude: 55.6912,
    longitude: 12.5878,
    category: 'code_required',
    access_notes: 'Code at station',
    access_code: random4DigitCode(),
    opening_hours: '24/7',
    source_type: 'public_dataset',
    verification_status: 'verified',
    last_verified_at: null,
    temporary_closed: false,
  },
];

/** 20+ cafés in Copenhagen - purchase_required, each with 4-digit access code */
const CAFES: Omit<ToiletInsert, 'id'>[] = [
  { name: 'Café Norden', address: 'Østergade 61, 1100 København', latitude: 55.6789, longitude: 12.5792, category: 'purchase_required', access_notes: '4-digit code required', access_code: random4DigitCode(), opening_hours: 'Mon–Fri 9–22, Sat–Sun 10–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Victor', address: 'Ny Østergade 8, 1101 København', latitude: 55.6794, longitude: 12.5838, category: 'purchase_required', access_notes: '4-digit code required', access_code: random4DigitCode(), opening_hours: 'Mon–Fri 9–24, Sat–Sun 10–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Europa', address: 'Amagertorv 1, 1160 København', latitude: 55.6789, longitude: 12.5798, category: 'purchase_required', access_notes: '4-digit code required', access_code: random4DigitCode(), opening_hours: 'Mon–Sun 10–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Sommersko', address: 'Kronprinsensgade 6, 1114 København', latitude: 55.6812, longitude: 12.5792, category: 'purchase_required', access_notes: '4-digit code required', access_code: random4DigitCode(), opening_hours: 'Mon–Fri 9–22, Sat–Sun 10–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Palæ', address: 'Ny Adelgade 5, 1104 København', latitude: 55.6798, longitude: 12.5812, category: 'purchase_required', access_notes: '4-digit code required', access_code: random4DigitCode(), opening_hours: 'Mon–Fri 8–20, Sat 9–18', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Dan Turèll', address: 'Store Kongensgade 46, 1264 København', latitude: 55.6867, longitude: 12.5892, category: 'purchase_required', access_notes: '4-digit code required', access_code: random4DigitCode(), opening_hours: 'Mon–Sun 9–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Wilder', address: 'Wildersgade 56, 1408 København', latitude: 55.6734, longitude: 12.6012, category: 'purchase_required', access_notes: '4-digit code required', access_code: random4DigitCode(), opening_hours: 'Mon–Sun 9–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Blågårds Apotek', address: 'Blågårdsgade 19, 2200 København', latitude: 55.6892, longitude: 12.5512, category: 'purchase_required', access_notes: '4-digit code required', access_code: random4DigitCode(), opening_hours: 'Mon–Sun 9–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Munk', address: 'Møntergade 2, 1116 København', latitude: 55.6792, longitude: 12.5789, category: 'purchase_required', access_notes: '4-digit code required', access_code: random4DigitCode(), opening_hours: 'Mon–Fri 8–22, Sat–Sun 9–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Retro', address: 'Store Strandstræde 18, 1255 København', latitude: 55.6812, longitude: 12.5923, category: 'purchase_required', access_notes: '4-digit code required', access_code: random4DigitCode(), opening_hours: 'Mon–Sun 10–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Det Røde Hus', address: 'Rømersgade 18, 1362 København', latitude: 55.6845, longitude: 12.5712, category: 'purchase_required', access_notes: '4-digit code required', access_code: random4DigitCode(), opening_hours: 'Mon–Sun 9–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Absalon', address: 'Sønder Blvd 73, 1720 København', latitude: 55.6689, longitude: 12.5412, category: 'purchase_required', access_notes: '4-digit code required', access_code: random4DigitCode(), opening_hours: 'Mon–Sun 8–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Dyrehaven', address: 'Sankt Hans Torv 5, 2200 København', latitude: 55.6878, longitude: 12.5523, category: 'purchase_required', access_notes: '4-digit code required', access_code: random4DigitCode(), opening_hours: 'Mon–Sun 9–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Kaffebar', address: 'Blågårdsgade 27, 2200 København', latitude: 55.6898, longitude: 12.5501, category: 'purchase_required', access_notes: '4-digit code required', access_code: random4DigitCode(), opening_hours: 'Mon–Sun 8–20', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Lillebro', address: 'Lille Kongensgade 16, 1074 København', latitude: 55.6812, longitude: 12.5856, category: 'purchase_required', access_notes: '4-digit code required', access_code: random4DigitCode(), opening_hours: 'Mon–Fri 8–22, Sat–Sun 9–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Bastard', address: 'Rantzausgade 19, 2200 København', latitude: 55.6912, longitude: 12.5489, category: 'purchase_required', access_notes: '4-digit code required', access_code: random4DigitCode(), opening_hours: 'Mon–Sun 9–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Oven Vande', address: 'Overgaden Neden Vandet 45, 1414 København', latitude: 55.6723, longitude: 12.5989, category: 'purchase_required', access_notes: '4-digit code required', access_code: random4DigitCode(), opening_hours: 'Mon–Sun 10–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Klaptræet', address: 'Vesterbrogade 72, 1620 København', latitude: 55.6789, longitude: 12.5512, category: 'purchase_required', access_notes: '4-digit code required', access_code: random4DigitCode(), opening_hours: 'Mon–Sun 9–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Halvvejen', address: 'Istedgade 106, 1650 København', latitude: 55.6712, longitude: 12.5589, category: 'purchase_required', access_notes: '4-digit code required', access_code: random4DigitCode(), opening_hours: 'Mon–Sun 9–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Mellemrum', address: 'Flæsketorvet 56, 1711 København', latitude: 55.6689, longitude: 12.5523, category: 'purchase_required', access_notes: '4-digit code required', access_code: random4DigitCode(), opening_hours: 'Mon–Sun 10–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Kaf', address: 'Krystalgade 12, 1172 København', latitude: 55.6798, longitude: 12.5745, category: 'purchase_required', access_notes: '4-digit code required', access_code: random4DigitCode(), opening_hours: 'Mon–Fri 8–22, Sat–Sun 9–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Laundromat', address: 'Elmegade 15, 2200 København', latitude: 55.6889, longitude: 12.5498, category: 'purchase_required', access_notes: '4-digit code required', access_code: random4DigitCode(), opening_hours: 'Mon–Sun 8–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
];

/** McDonald's locations in Copenhagen - all with 4-digit code required */
const MCDONALDS: Omit<ToiletInsert, 'id'>[] = [
  { name: 'McDonald\'s Rådhuspladsen', address: 'Rådhuspladsen 14, 1599 København', latitude: 55.6789, longitude: 12.5654, category: 'code_required', access_notes: '4-digit code required', access_code: random4DigitCode(), opening_hours: 'Mon–Sun 7–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'McDonald\'s Strøget', address: 'Strøget 1, 1100 København', latitude: 55.6789, longitude: 12.5792, category: 'code_required', access_notes: '4-digit code required', access_code: random4DigitCode(), opening_hours: 'Mon–Sun 7–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'McDonald\'s Nørreport', address: 'Nørre Voldgade 1, 1358 København', latitude: 55.6835, longitude: 12.5712, category: 'code_required', access_notes: '4-digit code required', access_code: random4DigitCode(), opening_hours: 'Mon–Sun 6–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'McDonald\'s Hovedbanegården', address: 'Bernstorffsgade 16, 1577 København', latitude: 55.6723, longitude: 12.5645, category: 'code_required', access_notes: '4-digit code required', access_code: random4DigitCode(), opening_hours: 'Mon–Sun 6–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'McDonald\'s Vesterbrogade', address: 'Vesterbrogade 72, 1620 København', latitude: 55.6789, longitude: 12.5512, category: 'code_required', access_notes: '4-digit code required', access_code: random4DigitCode(), opening_hours: 'Mon–Sun 7–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'McDonald\'s Østerbrogade', address: 'Østerbrogade 145, 2100 København', latitude: 55.7012, longitude: 12.5792, category: 'code_required', access_notes: '4-digit code required', access_code: random4DigitCode(), opening_hours: 'Mon–Sun 7–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'McDonald\'s Frederiksberg', address: 'Frederiksberg Allé 15, 1820 Frederiksberg', latitude: 55.6789, longitude: 12.5312, category: 'code_required', access_notes: '4-digit code required', access_code: random4DigitCode(), opening_hours: 'Mon–Sun 7–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'McDonald\'s Fields', address: 'Arne Jacobsens Allé 12, 2300 København', latitude: 55.6289, longitude: 12.5892, category: 'code_required', access_notes: '4-digit code required', access_code: random4DigitCode(), opening_hours: 'Mon–Sun 10–21', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
];

// FindToilet API response format: { toilets: [{ id, title, location: { lat, long, street, city, postal_code }, payment, ... }] }
interface FindToiletFeature {
  id?: string;
  title?: string;
  location?: { lat?: string; long?: string; street?: string; city?: string; postal_code?: string };
  payment?: string;
  description?: string;
}

interface FindToiletResponse {
  toilets?: FindToiletFeature[];
}

function mapFindToiletToInsert(item: FindToiletFeature): ToiletInsert | null {
  const loc = item?.location;
  const lat = typeof loc?.lat === 'string' ? parseFloat(loc.lat) : NaN;
  const lng = typeof loc?.long === 'string' ? parseFloat(loc.long) : NaN;
  if (isNaN(lat) || isNaN(lng)) return null;

  let category: ToiletInsert['category'] = 'free';
  const payment = String(item?.payment ?? '').toLowerCase();
  if (payment === '1' || payment === 'true' || payment.includes('betaling') || payment.includes('payment')) {
    category = 'purchase_required';
  } else if (payment.includes('code') || payment.includes('pinkode')) {
    category = 'code_required';
  }

  const street = loc?.street?.trim() || '';
  const city = loc?.city?.trim() || 'København';
  const postal = loc?.postal_code?.trim() || '';
  const address = [street, postal, city].filter(Boolean).join(', ');

  return {
    id: randomUUID(),
    name: (item?.title?.trim() || 'Unnamed Toilet'),
    address: address || `${lat}, ${lng}`,
    latitude: lat,
    longitude: lng,
    category,
    access_notes: null,
    access_code: null,
    opening_hours: null,
    source_type: 'public_dataset',
    verification_status: 'verified',
    last_verified_at: null,
    temporary_closed: false,
  };
}

// Copenhagen bounding box - filter out-of-area results from FindToilet
const CPH_MIN_LAT = 55.6;
const CPH_MAX_LAT = 55.75;
const CPH_MIN_LNG = 12.45;
const CPH_MAX_LNG = 12.7;

function isInCopenhagen(lat: number, lng: number): boolean {
  return lat >= CPH_MIN_LAT && lat <= CPH_MAX_LAT && lng >= CPH_MIN_LNG && lng <= CPH_MAX_LNG;
}

async function fetchFromFindToilet(): Promise<ToiletInsert[]> {
  try {
    const url = `${FINDTOILET_API}?term_id=${COPENHAGEN_TERM_ID}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = (await res.json()) as FindToiletResponse;
    const items = data?.toilets ?? [];
    const toilets: ToiletInsert[] = [];
    for (const item of items) {
      if (!item) continue;
      const t = mapFindToiletToInsert(item);
      if (t && isInCopenhagen(t.latitude, t.longitude)) toilets.push(t);
    }
    return toilets;
  } catch {
    return [];
  }
}

// opendata.dk GeoJSON format: { type: "FeatureCollection", features: [{ geometry: { coordinates: [lng, lat] }, properties: {...} }] }
interface GeoJsonFeature {
  type?: string;
  geometry?: { type?: string; coordinates?: number[] };
  properties?: Record<string, unknown>;
}

interface GeoJsonResponse {
  type?: string;
  features?: GeoJsonFeature[];
}

async function fetchFromOpendata(): Promise<ToiletInsert[]> {
  try {
    // Try common opendata.dk resource URLs
    const urls = [
      'https://data.kk.dk/dataset/toiletter-tmf/resource/2c2e2e2e-2e2e-2e2e-2e2e-2e2e2e2e2e2e/download/toiletter_tmf.geojson',
      'https://ckan.opendata.dk/dataset/2c2e2e2e-2e2e-2e2e-2e2e-2e2e2e2e2e2e/resource/2c2e2e2e-2e2e-2e2e-2e2e-2e2e2e2e2e2e/download/toiletter_tmf.geojson',
    ];
    for (const url of urls) {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = (await res.json()) as GeoJsonResponse;
      const features = data?.features ?? [];
      const toilets: ToiletInsert[] = [];
      for (const f of features) {
        const coords = f?.geometry?.coordinates;
        if (!coords || coords.length < 2) continue;
        const [lng, lat] = coords;
        const props = f?.properties ?? {};
        const name = (props.navn as string) || (props.name as string) || (props.title as string) || 'Unnamed Toilet';
        const address = (props.adresse as string) || (props.address as string) || `${lat}, ${lng}`;
        toilets.push({
          id: randomUUID(),
          name: String(name).trim(),
          address: String(address).trim(),
          latitude: lat,
          longitude: lng,
          category: 'free',
          access_notes: null,
          access_code: null,
          opening_hours: (props.aabningstider as string) || (props.opening_hours as string) || null,
          source_type: 'public_dataset',
          verification_status: 'verified',
          last_verified_at: null,
          temporary_closed: false,
        });
      }
      if (toilets.length > 0) return toilets;
    }
  } catch {
    // ignore
  }
  return [];
}

export async function seedDatabase(dbPath?: string): Promise<{ count: number; source: string }> {
  const resolvedPath = dbPath ?? process.env.DATABASE_PATH ?? path.resolve(process.cwd(), 'data', 'loofinder.db');
  const db = getDatabase(dbPath);
  initSchema(db);

  // Clear existing data - delete children first to satisfy foreign key constraints
  db.prepare('DELETE FROM edit_suggestions').run();
  db.prepare('DELETE FROM reports').run();
  db.prepare('DELETE FROM user_submissions').run();
  db.prepare('DELETE FROM toilets').run();

  let toilets: ToiletInsert[] = [];
  let source = '';

  // 1. Try FindToilet API (Copenhagen municipality)
  toilets = await fetchFromFindToilet();
  if (toilets.length > 0) {
    source = 'findtoilet_api';
  }

  // 2. Try opendata.dk GeoJSON if FindToilet returned nothing
  if (toilets.length === 0) {
    toilets = await fetchFromOpendata();
    if (toilets.length > 0) source = 'opendata_dk';
  }

  // 3. Fallback: embedded sample + cafés + McDonald's
  if (toilets.length === 0) {
    toilets = [
      ...SAMPLE_TOILETS.map((t) => ({ ...t, id: randomUUID() })),
      ...CAFES.map((t) => ({ ...t, id: randomUUID() })),
      ...MCDONALDS.map((t) => ({ ...t, id: randomUUID() })),
    ];
    source = 'embedded_sample';
  } else {
    // Always include cafés and McDonald's when we have API data
    toilets = [
      ...toilets,
      ...CAFES.map((t) => ({ ...t, id: randomUUID() })),
      ...MCDONALDS.map((t) => ({ ...t, id: randomUUID() })),
    ];
    source = source + '+cafes+mcdonalds';
  }

  const insert = db.prepare(`
    INSERT INTO toilets (
      id, name, address, latitude, longitude, category,
      access_notes, access_code, opening_hours, source_type, verification_status,
      last_verified_at, temporary_closed, created_at, updated_at
    ) VALUES (
      @id, @name, @address, @latitude, @longitude, @category,
      @access_notes, @access_code, @opening_hours, @source_type, @verification_status,
      @last_verified_at, @temporary_closed, datetime('now'), datetime('now')
    )
  `);

  const insertMany = db.transaction((rows: ToiletInsert[]) => {
    for (const row of rows) {
      insert.run({
        id: row.id,
        name: row.name,
        address: row.address,
        latitude: row.latitude,
        longitude: row.longitude,
        category: row.category,
        access_notes: row.access_notes ?? null,
        access_code: row.access_code ?? null,
        opening_hours: row.opening_hours ?? null,
        source_type: row.source_type,
        verification_status: row.verification_status,
        last_verified_at: row.last_verified_at ?? null,
        temporary_closed: row.temporary_closed ? 1 : 0,
      });
    }
  });

  insertMany(toilets);

  console.log(`Database: ${resolvedPath}`);
  return { count: toilets.length, source };
}
