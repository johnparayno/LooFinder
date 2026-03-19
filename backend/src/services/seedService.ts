/**
 * Seed service - loads Denmark toilet data from multiple sources
 * Sources: FindToilet API (all Denmark), opendata.dk GeoJSON; falls back to embedded sample + cafés + McDonald's
 */
import path from 'path';
import { getDatabase, initSchema } from '../db/schema.js';
import type { ToiletInsert } from '../models/toilet.js';
import { randomUUID } from 'crypto';

const FINDTOILET_API = 'https://beta.findtoilet.dk/api/v3/toilets';
const FINDTOILET_API_BY_TID = (tid: number) => `${FINDTOILET_API}?tid=${tid}`;

/** All Danish municipality term IDs (1–98); used when full API fetch fails */
const MUNICIPALITY_TERM_IDS = Array.from({ length: 98 }, (_, i) => i + 1);

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url);
    if (res.ok) return res;
    if (i < retries - 1) await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
  }
  throw new Error(`Failed to fetch ${url} after ${retries} retries`);
}

function random4DigitCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/** Fill default values for extended model fields when not provided */
function withExtendedDefaults(
  t: Omit<ToiletInsert, 'id'> & Partial<Pick<ToiletInsert, 'year_round' | 'round_the_clock' | 'payment' | 'venue_type'>>
): Omit<ToiletInsert, 'id'> {
  const roundTheClock =
    t.round_the_clock ?? /24\/7|24-7|døgn|round.the.clock/i.test(t.opening_hours || '');
  return {
    ...t,
    findtoilet_nid: t.findtoilet_nid ?? null,
    toilet_type: t.toilet_type ?? null,
    payment: t.payment ?? t.category === 'purchase_required',
    manned: t.manned ?? false,
    changing_table: t.changing_table ?? false,
    tap: t.tap ?? false,
    needle_container: t.needle_container ?? false,
    contact: t.contact ?? null,
    image_url: t.image_url ?? null,
    placement: t.placement ?? null,
    year_round: t.year_round ?? true,
    round_the_clock: roundTheClock,
    venue_type: t.venue_type ?? null,
  };
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
    venue_type: 'train_station',
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
    venue_type: 'train_station',
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
    venue_type: 'museum',
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

/** Cafés and restaurants in Copenhagen - purchase_required (a buy is required) */
const CAFES_AND_RESTAURANTS: Omit<ToiletInsert, 'id'>[] = [
  // Cafés
  { name: 'Café Norden', address: 'Østergade 61, 1100 København', latitude: 55.6789, longitude: 12.5792, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Fri 9–22, Sat–Sun 10–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Victor', address: 'Ny Østergade 8, 1101 København', latitude: 55.6794, longitude: 12.5838, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Fri 9–24, Sat–Sun 10–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Europa', address: 'Amagertorv 1, 1160 København', latitude: 55.6789, longitude: 12.5798, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 10–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Sommersko', address: 'Kronprinsensgade 6, 1114 København', latitude: 55.6812, longitude: 12.5792, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Fri 9–22, Sat–Sun 10–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Palæ', address: 'Ny Adelgade 5, 1104 København', latitude: 55.6798, longitude: 12.5812, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Fri 8–20, Sat 9–18', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Dan Turèll', address: 'Store Kongensgade 46, 1264 København', latitude: 55.6867, longitude: 12.5892, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 9–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Wilder', address: 'Wildersgade 56, 1408 København', latitude: 55.6734, longitude: 12.6012, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 9–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Blågårds Apotek', address: 'Blågårdsgade 19, 2200 København', latitude: 55.6892, longitude: 12.5512, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 9–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Munk', address: 'Møntergade 2, 1116 København', latitude: 55.6792, longitude: 12.5789, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Fri 8–22, Sat–Sun 9–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Retro', address: 'Store Strandstræde 18, 1255 København', latitude: 55.6812, longitude: 12.5923, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 10–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Det Røde Hus', address: 'Rømersgade 18, 1362 København', latitude: 55.6845, longitude: 12.5712, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 9–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Absalon', address: 'Sønder Blvd 73, 1720 København', latitude: 55.6689, longitude: 12.5412, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 8–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Dyrehaven', address: 'Sankt Hans Torv 5, 2200 København', latitude: 55.6878, longitude: 12.5523, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 9–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Kaffebar', address: 'Blågårdsgade 27, 2200 København', latitude: 55.6898, longitude: 12.5501, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 8–20', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Lillebro', address: 'Lille Kongensgade 16, 1074 København', latitude: 55.6812, longitude: 12.5856, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Fri 8–22, Sat–Sun 9–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Bastard', address: 'Rantzausgade 19, 2200 København', latitude: 55.6912, longitude: 12.5489, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 9–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Oven Vande', address: 'Overgaden Neden Vandet 45, 1414 København', latitude: 55.6723, longitude: 12.5989, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 10–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Klaptræet', address: 'Vesterbrogade 72, 1620 København', latitude: 55.6789, longitude: 12.5512, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 9–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Halvvejen', address: 'Istedgade 106, 1650 København', latitude: 55.6712, longitude: 12.5589, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 9–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Mellemrum', address: 'Flæsketorvet 56, 1711 København', latitude: 55.6689, longitude: 12.5523, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 10–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Kaf', address: 'Krystalgade 12, 1172 København', latitude: 55.6798, longitude: 12.5745, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Fri 8–22, Sat–Sun 9–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Café Laundromat', address: 'Elmegade 15, 2200 København', latitude: 55.6889, longitude: 12.5498, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 8–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  // Restaurants
  { name: 'Noma', address: 'Refshalevej 96, 1432 København', latitude: 55.6829, longitude: 12.6105, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Wed–Sat 17–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Conditori La Glace', address: 'Skoubougade 3, 1158 København', latitude: 55.6786, longitude: 12.5735, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Tue–Sun 8:30–18', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Restaurant Kødbyen', address: 'Flæsketorvet 56, 1711 København', latitude: 55.6689, longitude: 12.5523, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 11–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Restaurant Kanalen', address: 'Wildersgade 2, 1408 København', latitude: 55.6734, longitude: 12.6012, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 11–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Restaurant Höst', address: 'Nørre Farimagsgade 41, 1364 København', latitude: 55.6812, longitude: 12.5689, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 17:30–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Restaurant Schønnemann', address: 'Hauser Plads 16, 1127 København', latitude: 55.6823, longitude: 12.5723, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 11:30–17', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Restaurant Kødbyens Fiskebar', address: 'Flæsketorvet 100, 1711 København', latitude: 55.6689, longitude: 12.5523, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 17–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Restaurant Pluto', address: 'Gammel Kongevej 98, 1850 Frederiksberg', latitude: 55.6789, longitude: 12.5312, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Fri 11:30–22, Sat–Sun 10–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Restaurant Bæst', address: 'Guldbergsgade 29, 2200 København', latitude: 55.6892, longitude: 12.5512, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 17–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Restaurant Barr', address: 'Strandgade 93, 1401 København', latitude: 55.6794, longitude: 12.5989, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 12–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Restaurant Kadeau', address: 'Wildersgade 10B, 1408 København', latitude: 55.6734, longitude: 12.6012, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Tue–Sat 18–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Restaurant Relæ', address: 'Jægersborggade 41, 2200 København', latitude: 55.6892, longitude: 12.5512, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Tue–Sat 18–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Restaurant 108', address: 'Strandgade 108, 1401 København', latitude: 55.6794, longitude: 12.5989, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 12–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Restaurant Kadeau Bornholm', address: 'Baunevej 18, 3720 Aakirkeby', latitude: 55.0692, longitude: 14.9212, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Wed–Sun 18–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Restaurant Almanak', address: 'Havnegade 44, 1058 København', latitude: 55.6734, longitude: 12.5923, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 12–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Restaurant Kadeau Copenhagen', address: 'Dronningens Tværgade 2, 1302 København', latitude: 55.6845, longitude: 12.5712, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Tue–Sat 18–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Restaurant Sanchez', address: 'Teglgårdsstræde 2, 1452 København', latitude: 55.6723, longitude: 12.5989, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 10–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Restaurant Mielcke & Hurtigkarl', address: 'Frederiksberg Runddel 1, 2000 Frederiksberg', latitude: 55.6789, longitude: 12.5312, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Tue–Sat 18–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
];

/** Hotel lobbies in Copenhagen - free toilets */
const HOTEL_LOBBIES: Omit<ToiletInsert, 'id'>[] = [
  { name: '1 Hotel Copenhagen – Lobby', address: 'Krystalgade 22, 1172 København', latitude: 55.6798, longitude: 12.5745, category: 'free', access_notes: 'Lobby toilet', access_code: null, opening_hours: '24/7', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'The Square Hotel – Lobby', address: 'Rådhuspladsen 14, 1550 København', latitude: 55.6762, longitude: 12.5654, category: 'free', access_notes: 'Lobby toilet', access_code: null, opening_hours: '24/7', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Hotel Danmark – Lobby', address: 'Vester Voldgade 89, 1552 København', latitude: 55.6789, longitude: 12.5712, category: 'free', access_notes: 'Lobby toilet', access_code: null, opening_hours: '24/7', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Tivoli Hotel – Lobby', address: 'Arni Magnussons Gade 2, 1577 København', latitude: 55.6723, longitude: 12.5645, category: 'free', access_notes: 'Lobby toilet', access_code: null, opening_hours: '24/7', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: '71 Nyhavn Hotel – Lobby', address: 'Nyhavn 71, 1051 København', latitude: 55.6797, longitude: 12.5901, category: 'free', access_notes: 'Lobby toilet', access_code: null, opening_hours: '24/7', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Scandic Palace Hotel – Lobby', address: 'Rådhuspladsen 57, 1550 København', latitude: 55.6762, longitude: 12.5654, category: 'free', access_notes: 'Lobby toilet', access_code: null, opening_hours: '24/7', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Hotel Alexandra – Lobby', address: 'H.C. Andersens Blvd 8, 1553 København', latitude: 55.6759, longitude: 12.5649, category: 'free', access_notes: 'Lobby toilet', access_code: null, opening_hours: '24/7', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Best Western Hotel Hebron – Lobby', address: 'Helgolandsgade 4, 1653 København', latitude: 55.6723, longitude: 12.5623, category: 'free', access_notes: 'Lobby toilet', access_code: null, opening_hours: '24/7', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Copenhagen Marriott Hotel – Lobby', address: 'Kalvebod Brygge 5, 1560 København', latitude: 55.6712, longitude: 12.5623, category: 'free', access_notes: 'Lobby toilet', access_code: null, opening_hours: '24/7', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Radisson Blu Royal Hotel – Lobby', address: 'Hammerichsgade 1, 1611 København', latitude: 55.6745, longitude: 12.5612, category: 'free', access_notes: 'Lobby toilet', access_code: null, opening_hours: '24/7', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Scandic Front – Lobby', address: 'Skt. Annæ Plads 21, 1250 København', latitude: 55.6823, longitude: 12.5923, category: 'free', access_notes: 'Lobby toilet', access_code: null, opening_hours: '24/7', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Hotel Kong Arthur – Lobby', address: 'Nørre Søgade 11, 1370 København', latitude: 55.6845, longitude: 12.5689, category: 'free', access_notes: 'Lobby toilet', access_code: null, opening_hours: '24/7', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Wakeup Copenhagen – Lobby', address: 'Carsten Niebuhrs Gade 11, 1577 København', latitude: 55.6723, longitude: 12.5645, category: 'free', access_notes: 'Lobby toilet', access_code: null, opening_hours: '24/7', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Hotel Skt. Petri – Lobby', address: 'Krystalgade 22, 1172 København', latitude: 55.6798, longitude: 12.5745, category: 'free', access_notes: 'Lobby toilet', access_code: null, opening_hours: '24/7', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Nimb Hotel – Lobby', address: 'Bernstorffsgade 5, 1577 København', latitude: 55.6736, longitude: 12.5649, category: 'free', access_notes: 'Lobby toilet', access_code: null, opening_hours: '24/7', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Admiral Hotel – Lobby', address: 'Toldbodgade 24-28, 1253 København', latitude: 55.6823, longitude: 12.5923, category: 'free', access_notes: 'Lobby toilet', access_code: null, opening_hours: '24/7', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Copenhagen Strand – Lobby', address: 'Havnegade 37, 1058 København', latitude: 55.6734, longitude: 12.5923, category: 'free', access_notes: 'Lobby toilet', access_code: null, opening_hours: '24/7', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Hotel SP34 – Lobby', address: 'Sankt Peders Stræde 34, 1453 København', latitude: 55.6792, longitude: 12.5789, category: 'free', access_notes: 'Lobby toilet', access_code: null, opening_hours: '24/7', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Absalon Hotel – Lobby', address: 'Helgolandsgade 15, 1653 København', latitude: 55.6712, longitude: 12.5589, category: 'free', access_notes: 'Lobby toilet', access_code: null, opening_hours: '24/7', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Cabinn Copenhagen – Lobby', address: 'Mitchellsgade 14, 1568 København', latitude: 55.6689, longitude: 12.5523, category: 'free', access_notes: 'Lobby toilet', access_code: null, opening_hours: '24/7', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Scandic Webers – Lobby', address: 'Vesterbrogade 11, 1630 København', latitude: 55.6734, longitude: 12.5612, category: 'free', access_notes: 'Lobby toilet', access_code: null, opening_hours: '24/7', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Hotel Ottilia – Lobby', address: 'Bryggernes Plads 7, 1799 København', latitude: 55.6689, longitude: 12.5523, category: 'free', access_notes: 'Lobby toilet', access_code: null, opening_hours: '24/7', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Manon Les Suites – Lobby', address: 'Gyldenløvesgade 19, 1600 København', latitude: 55.6789, longitude: 12.5789, category: 'free', access_notes: 'Lobby toilet', access_code: null, opening_hours: '24/7', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
];

/** McDonald's locations in Denmark - purchase_required (a buy is required) */
const MCDONALDS: Omit<ToiletInsert, 'id'>[] = [
  { name: 'McDonald\'s Rådhuspladsen', address: 'Rådhuspladsen 14, 1599 København', latitude: 55.6789, longitude: 12.5654, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 7–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'McDonald\'s Strøget', address: 'Strøget 1, 1100 København', latitude: 55.6789, longitude: 12.5792, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 7–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'McDonald\'s Nørreport', address: 'Nørre Voldgade 1, 1358 København', latitude: 55.6835, longitude: 12.5712, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 6–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'McDonald\'s Hovedbanegården', address: 'Bernstorffsgade 16, 1577 København', latitude: 55.6723, longitude: 12.5645, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 6–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'McDonald\'s Vesterbrogade', address: 'Vesterbrogade 72, 1620 København', latitude: 55.6789, longitude: 12.5512, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 7–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'McDonald\'s Østerbrogade', address: 'Østerbrogade 145, 2100 København', latitude: 55.7012, longitude: 12.5792, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 7–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'McDonald\'s Frederiksberg', address: 'Frederiksberg Allé 15, 1820 Frederiksberg', latitude: 55.6789, longitude: 12.5312, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 7–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'McDonald\'s Fields', address: 'Arne Jacobsens Allé 12, 2300 København', latitude: 55.6289, longitude: 12.5892, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 10–21', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
];

/** Burger King locations in Denmark - purchase_required */
const BURGER_KING: Omit<ToiletInsert, 'id'>[] = [
  { name: 'Burger King Rådhuspladsen', address: 'Rådhuspladsen 55, 1550 København', latitude: 55.6762, longitude: 12.5689, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: '24/7', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Burger King Vesterbrogade', address: 'Vesterbrogade 2, 1550 København', latitude: 55.6761, longitude: 12.5612, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 7–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Burger King Kastrup Airport', address: 'Lufthavnsboulevarden 6, 2770 Kastrup', latitude: 55.6306, longitude: 12.6419, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: '24/7', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Burger King Lyngby', address: 'Klampenborgvej 215J, 2800 Kongens Lyngby', latitude: 55.771, longitude: 12.505, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 10–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Burger King Aarhus Banegårdspladsen', address: 'Banegårdspladsen 10, 8000 Aarhus', latitude: 56.1498, longitude: 10.2044, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 9:30–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Burger King Aarhus Ormslevvej', address: 'Ormslevvej 40, 8270 Højbjerg', latitude: 56.1892, longitude: 10.2431, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 10–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Burger King Roskilde', address: 'Køgevej 101, 4000 Roskilde', latitude: 55.6415, longitude: 12.0803, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 10–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Burger King Odense', address: 'Ørbækvej 232, 5220 Odense', latitude: 55.4038, longitude: 10.4024, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 10–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Burger King Køge', address: 'Nordhøj 4, 4600 Køge', latitude: 55.4584, longitude: 12.1811, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 10–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Burger King Fredericia', address: 'Snaremosevej 180-182, 7000 Fredericia', latitude: 55.5657, longitude: 9.7526, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 10–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Burger King Holstebro', address: 'Nyholmvej 3, 7500 Holstebro', latitude: 56.3631, longitude: 8.6203, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 10–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Burger King Horsens', address: 'Vrøndingvej 1C, 8700 Horsens', latitude: 55.8607, longitude: 9.8501, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 10–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Burger King Nyborg', address: 'Slipshavnsvej 11, 5800 Nyborg', latitude: 55.3126, longitude: 10.7894, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 10–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
];

/** KFC locations in Denmark - purchase_required */
const KFC: Omit<ToiletInsert, 'id'>[] = [
  { name: 'KFC Rådhuspladsen', address: 'Rådhuspladsen 55, 1550 København', latitude: 55.6762, longitude: 12.5689, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Wed 11–01, Thu 11–05, Fri–Sat 11–06, Sun 11–01', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'KFC Amagerbrogade', address: 'Amagerbrogade 95, 2300 København', latitude: 55.6545, longitude: 12.6112, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 11–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'KFC Fields', address: 'Arne Jacobsens Allé 12, 2300 København S', latitude: 55.631, longitude: 12.5759, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Fri 11–22, Sat 11–18', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'KFC Rødovre', address: 'Tårnvej 3, 2610 Rødovre', latitude: 55.6806, longitude: 12.4537, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 11–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'KFC Ishøj', address: 'Ishøj Østergade 31, 2635 Ishøj', latitude: 55.6133, longitude: 12.3555, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 11–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'KFC Greve', address: 'Mosede Landevej 60, 2670 Greve', latitude: 55.5667, longitude: 12.2833, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 11–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'KFC Odense Ejbygade', address: 'Ejbygade 2, 5220 Odense', latitude: 55.4038, longitude: 10.4024, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 11–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'KFC Odense Rosengårdcentret', address: 'Ørbækvej 75, 5220 Odense', latitude: 55.4156, longitude: 10.3923, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 10–20', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'KFC Vejle', address: 'Dtc Torvet 20, 7100 Vejle', latitude: 55.7089, longitude: 9.5357, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 11–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'KFC Horsens', address: 'Lilli Gyldenkildes Torv 11f, 8700 Horsens', latitude: 55.8607, longitude: 9.8501, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 11–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'KFC Aarhus Tilst', address: 'Blomstervej 2k, 8210 Aarhus', latitude: 56.1892, longitude: 10.1692, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 11–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'KFC Herning', address: 'Åvænget 12, 7400 Herning', latitude: 56.1396, longitude: 8.9756, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 11–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
];

/** Subway locations in Denmark - purchase_required (coordinates from subway.dk) */
const SUBWAY: Omit<ToiletInsert, 'id'>[] = [
  { name: 'Subway Amager Centret', address: 'Reberbanegade 3, 2300 København S', latitude: 55.66262, longitude: 12.604094, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 9–20', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Subway Aalborg Storcenter', address: 'Hobrovej 452, 9200 Aalborg', latitude: 57.00477, longitude: 9.87414, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 9–20', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Subway Nørrebro Bycenter', address: 'Lygten 2L, 2400 København NV', latitude: 55.702796, longitude: 12.538034, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 10–21', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Subway Randers Storcenter', address: 'Merkurvej 55, 8960 Randers', latitude: 56.42967, longitude: 10.063987, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 9–20', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Subway Lyngby Storcenter', address: 'Lyngby Storcenter 1, 2800 Kongens Lyngby', latitude: 55.771046, longitude: 12.504976, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 9–20', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Subway Aalborg City', address: 'Østerågade 16, 9000 Aalborg', latitude: 57.0488, longitude: 9.9217, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 9–20', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Subway Fields', address: 'Arne Jacobsens Allé 12, 2300 København S', latitude: 55.630999, longitude: 12.575893, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 9–21', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Subway City 2', address: 'Cityringen 4, 2630 Tåstrup', latitude: 55.64461, longitude: 12.277633, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 9–20', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Subway Glostrup Shoppingcenter', address: 'Hovedvejen 81, 2600 Glostrup', latitude: 55.665798, longitude: 12.395463, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 9–20', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Subway Ishøj Bycenter', address: 'Ishøj Store Torv 24, 2635 Ishøj', latitude: 55.613338, longitude: 12.355502, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 9–20', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Subway Kolding', address: 'Skovvangen 42C, 6000 Kolding', latitude: 55.506474, longitude: 9.469544, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 10–20', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
];

/** Restaurant chains in Denmark - purchase_required (customer must buy something) */
const RESTAURANT_CHAINS: Omit<ToiletInsert, 'id'>[] = [
  // Sticks'n'Sushi
  { name: "Sticks'n'Sushi Nansensgade", address: 'Nansensgade 59, 1366 København', latitude: 55.6845, longitude: 12.5712, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 11–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: "Sticks'n'Sushi Borgergade", address: 'Borgergade 13, 1300 København', latitude: 55.6823, longitude: 12.5856, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 11–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: "Sticks'n'Sushi Istedgade", address: 'Istedgade 62, 1650 København', latitude: 55.6712, longitude: 12.5589, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 11–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: "Sticks'n'Sushi Østerbro", address: 'Øster Farimagsgade 16, 2100 København', latitude: 55.7012, longitude: 12.5792, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 11–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: "Sticks'n'Sushi Amager Strandvej", address: 'Amager Strandvej 110, 2300 København S', latitude: 55.6545, longitude: 12.6112, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 11–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: "Sticks'n'Sushi Tivoli Hotel", address: 'Arni Magnussons Gade 2, 1577 København', latitude: 55.6723, longitude: 12.5645, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 11–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: "Sticks'n'Sushi Tivoli Haven", address: 'Bernstorffsgade 3, 1577 København', latitude: 55.6736, longitude: 12.5649, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 11–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: "Sticks'n'Sushi Frederiksberg", address: 'Gl. Kongevej 120, 1850 Frederiksberg', latitude: 55.6789, longitude: 12.5312, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 11–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: "Sticks'n'Sushi Lyngby", address: 'Lyngby Hovedgade 43, 2800 Kongens Lyngby', latitude: 55.771, longitude: 12.505, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 11–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: "Sticks'n'Sushi Valby", address: 'Valby Tingsted 4, 2500 Valby', latitude: 55.6589, longitude: 12.5123, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 11–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: "Sticks'n'Sushi Hellerup", address: 'Strandvejen 195, 2900 Hellerup', latitude: 55.7312, longitude: 12.5789, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 11–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: "Sticks'n'Sushi Rungsted", address: 'Rungsted Havn 32, 2960 Rungsted Kyst', latitude: 55.8812, longitude: 12.5312, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 11–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  // Lagkagehuset
  { name: 'Lagkagehuset Vesterbrogade', address: 'Vesterbrogade 4A, 1620 København', latitude: 55.6761, longitude: 12.5612, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 7–19', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Lagkagehuset Bernstorffsgade', address: 'Bernstorffsgade 16, 1577 København', latitude: 55.6723, longitude: 12.5645, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 6–21', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Lagkagehuset Frederiksberggade', address: 'Frederiksberggade 23, 1459 København', latitude: 55.6792, longitude: 12.5789, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 7–19', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Lagkagehuset Ny Østergade', address: 'Ny Østergade 12, 1101 København', latitude: 55.6794, longitude: 12.5838, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 7–19', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Lagkagehuset Frederiksborggade', address: 'Frederiksborggade 6, 1360 København', latitude: 55.6845, longitude: 12.5689, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 7–19', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Lagkagehuset Torvegade', address: 'Torvegade 45, 1400 København', latitude: 55.6734, longitude: 12.5989, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 7–19', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Lagkagehuset Nørrebrogade', address: 'Nørrebrogade 120, 2200 København', latitude: 55.6892, longitude: 12.5512, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 7–19', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Lagkagehuset Værnedamsvej', address: 'Værnedamsvej 1, 1819 Frederiksberg', latitude: 55.6789, longitude: 12.5389, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 7–19', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Lagkagehuset Strandvejen', address: 'Strandvejen 100, 2900 Hellerup', latitude: 55.7312, longitude: 12.5789, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 7–19', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Lagkagehuset Lyngby', address: 'Lyngby Hovedgade 43, 2800 Kongens Lyngby', latitude: 55.771, longitude: 12.505, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 7–19', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Lagkagehuset Aarhus', address: 'M.P. Bruuns Gade 34, 8000 Aarhus', latitude: 56.1498, longitude: 10.2044, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 7–19', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  // Ole & Steen
  { name: 'Ole & Steen Kastrup', address: 'Arkadevej 4, 2770 Kastrup', latitude: 55.6306, longitude: 12.6419, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 6–21', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  // Joe and the Juice
  { name: 'Joe and the Juice Frederiksborggade', address: 'Frederiksborggade 9, 1360 København', latitude: 55.6845, longitude: 12.5689, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Thu 6:30–21, Sat 8–21, Sun 9–19', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Joe and the Juice Kongens Nytorv', address: 'Kongens Nytorv 13, 1095 København', latitude: 55.6794, longitude: 12.5881, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Thu 10–19, Fri 10–20, Sat 10–17', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Joe and the Juice Købmagergade', address: 'Købmagergade 30, 1150 København', latitude: 55.6798, longitude: 12.5745, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 7–19', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Joe and the Juice Sankt Annæ Plads', address: 'Sankt Annæ Plads 13, 1250 København', latitude: 55.6823, longitude: 12.5923, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Fri 7–19, Sat–Sun 8–19', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  // MASH Steakhouse
  { name: 'MASH Bredgade', address: 'Bredgade 20, 1260 København', latitude: 55.6823, longitude: 12.5923, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 17–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'MASH Frederiksberg', address: 'Gammel Kongevej 116, 1850 Frederiksberg', latitude: 55.6789, longitude: 12.5312, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 17–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'MASH Rungsted', address: 'Charlottelundvej 1, 2960 Rungsted Kyst', latitude: 55.8812, longitude: 12.5312, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 17–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'MASH Aarhus', address: 'Banegårdspladsen 14, 8000 Aarhus', latitude: 56.1498, longitude: 10.2044, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 17–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'MASH Odense', address: 'Vestergade 11, 5000 Odense', latitude: 55.4038, longitude: 10.4024, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 17–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'MASH Copenhagen Airport', address: 'Lufthavnsboulevarden 6, 2770 Kastrup', latitude: 55.6306, longitude: 12.6419, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: '24/7', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  // A Hereford Beefstouw
  { name: 'A Hereford Beefstouw Aarhus', address: 'Kannikegade 10, 8000 Aarhus', latitude: 56.1498, longitude: 10.2044, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 17–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'A Hereford Beefstouw Herning Lund', address: 'Lundvej 8, 7400 Herning', latitude: 56.1396, longitude: 8.9756, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 17–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'A Hereford Beefstouw Herning Boxen', address: 'Jyske Bank Boxen, 7400 Herning', latitude: 56.1396, longitude: 8.9756, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 17–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'A Hereford Beefstouw Kolding', address: 'Skovvangen 42, 6000 Kolding', latitude: 55.506474, longitude: 9.469544, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 17–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'A Hereford Beefstouw Skive', address: 'Torvet 1, 7800 Skive', latitude: 56.5667, longitude: 9.0333, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 17–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'A Hereford Beefstouw Odense', address: 'Vestergade 68, 5000 Odense', latitude: 55.4038, longitude: 10.4024, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 17–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  // Jensen's Bøfhus
  { name: "Jensen's Bøfhus København Axeltorv", address: 'Axeltorv 1, 1609 København', latitude: 55.6723, longitude: 12.5645, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 11:30–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: "Jensen's Bøfhus København Vesterbrogade", address: 'Vesterbrogade 124, 1620 København', latitude: 55.6789, longitude: 12.5512, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 11:30–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: "Jensen's Bøfhus Greve Waves", address: 'Waves Shopping, 2670 Greve', latitude: 55.5667, longitude: 12.2833, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 11:30–21', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: "Jensen's Bøfhus Holbæk", address: 'Torvet 1, 4300 Holbæk', latitude: 55.7167, longitude: 11.7167, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 11:30–21', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: "Jensen's Bøfhus Aalborg Nytorv", address: 'Østerågade 19, 9000 Aalborg', latitude: 57.0488, longitude: 9.9217, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 11:30–21', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: "Jensen's Bøfhus Aalborg City Syd", address: 'Storcenter Nord, 9200 Aalborg', latitude: 57.0488, longitude: 9.9217, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 11:30–21', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: "Jensen's Bøfhus Aarhus Tilst", address: 'Tilst Storcenter, 8381 Tilst', latitude: 56.1892, longitude: 10.1692, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 11:30–21', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: "Jensen's Bøfhus Esbjerg Nord", address: 'Nordvest 1, 6715 Esbjerg N', latitude: 55.4667, longitude: 8.4500, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 11:30–21', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: "Jensen's Bøfhus Herning", address: 'Sønderbrogade 1, 7400 Herning', latitude: 56.1396, longitude: 8.9756, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 11:30–21', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: "Jensen's Bøfhus Kolding", address: 'Kolding Storcenter, 6000 Kolding', latitude: 55.506474, longitude: 9.469544, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 11:30–21', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: "Jensen's Bøfhus Odense Læssøegade", address: 'Læssøegade 1, 5230 Odense M', latitude: 55.4038, longitude: 10.4024, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 11:30–21', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: "Jensen's Bøfhus Odense Rosengårdcentret", address: 'Rosengårdcentret, 5220 Odense', latitude: 55.4156, longitude: 10.3923, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sun 10–20', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
];

/** Michelin and notable restaurants in Denmark - purchase_required */
const MICHELIN_RESTAURANTS: Omit<ToiletInsert, 'id'>[] = [
  { name: 'Geranium', address: 'Per Henrik Lings Allé 4, 2100 København Ø', latitude: 55.7012, longitude: 12.5792, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Wed–Sat 18–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Alchemist', address: 'Refshalevej 173, 1432 København', latitude: 55.6829, longitude: 12.6105, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Tue–Sat 18:30–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Kong Hans Kælder', address: 'Vingårdstræde 6, 1070 København', latitude: 55.6792, longitude: 12.5789, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Mon–Sat 18–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Søllerød Kro', address: 'Søllerødvej 35, 2840 Holte', latitude: 55.8167, longitude: 12.4667, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Tue–Sun 12–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'formel B', address: 'Vesterbrogade 182, 1800 Frederiksberg', latitude: 55.6789, longitude: 12.5312, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Tue–Sat 18–24', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Jordnær', address: 'Strandvejen 1, 2920 Charlottenlund', latitude: 55.7512, longitude: 12.5789, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Wed–Sat 18–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Frederikshøj', address: 'Oddervej 19, 8000 Aarhus', latitude: 56.1498, longitude: 10.2044, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Tue–Sat 18–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Domestic', address: 'Skt. Clemens Torv 7, 8000 Aarhus', latitude: 56.1498, longitude: 10.2044, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Tue–Sat 18–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Substans', address: 'Aboulevarden 22, 8000 Aarhus', latitude: 56.1498, longitude: 10.2044, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Tue–Sat 18–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Henne Kirkeby Kro', address: 'Hennevej 2, 6854 Henne', latitude: 55.7167, longitude: 8.2167, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Wed–Sun 12–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Dragsholm Slot Gourmet', address: 'Dragsholm Allé 1, 4534 Hørve', latitude: 55.8167, longitude: 11.3833, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Wed–Sun 12–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Hotel Frederiksminde', address: 'Præstøvej 151, 4720 Præstø', latitude: 55.1167, longitude: 12.0500, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Wed–Sun 12–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'LYST', address: 'Dæmningen 6, 7100 Vejle', latitude: 55.7089, longitude: 9.5357, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Tue–Sat 18–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Ti Trin Ned', address: 'Skt. Knuds Torv 1, 7000 Fredericia', latitude: 55.5657, longitude: 9.7526, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Tue–Sat 18–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Syttende', address: 'Rådhuspladsen 1, 6400 Sønderborg', latitude: 54.9092, longitude: 9.7892, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Tue–Sat 18–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'ARO', address: 'Vestergade 68, 5000 Odense', latitude: 55.4038, longitude: 10.4024, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Tue–Sat 18–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Kiin Kiin', address: 'Guldbergsgade 21, 2200 København', latitude: 55.6892, longitude: 12.5512, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Tue–Sat 17:30–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Sushi Anaba', address: 'Gothersgade 8, 1123 København', latitude: 55.6823, longitude: 12.5723, category: 'purchase_required', access_notes: 'A purchase is required', access_code: null, opening_hours: 'Tue–Sat 17:30–22', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
];

/** Gyms (PureGym, FitnessX, CrossFit) - membership required for access */
const GYMS: Omit<ToiletInsert, 'id'>[] = [
  // PureGym
  { name: 'PureGym Købmagergade', address: 'Købmagergade, 1150 København', latitude: 55.6798, longitude: 12.5745, category: 'purchase_required', venue_type: 'gym', access_notes: 'Membership required', access_code: null, opening_hours: '24/7', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'PureGym Tomsgårdsvej', address: 'Tomsgårdsvej 15, 2400 København NV', latitude: 55.7028, longitude: 12.538, category: 'purchase_required', venue_type: 'gym', access_notes: 'Membership required', access_code: null, opening_hours: '24/7', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'PureGym Vesterbrogade', address: 'Vesterbrogade, 1620 København', latitude: 55.6789, longitude: 12.5512, category: 'purchase_required', venue_type: 'gym', access_notes: 'Membership required', access_code: null, opening_hours: '24/7', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'PureGym Oslo Plads', address: 'Oslo Plads, 2100 København Ø', latitude: 55.6912, longitude: 12.5878, category: 'purchase_required', venue_type: 'gym', access_notes: 'Membership required', access_code: null, opening_hours: '24/7', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'PureGym Albertslund', address: 'Roskildevej 14, 2620 Albertslund', latitude: 55.6589, longitude: 12.3512, category: 'purchase_required', venue_type: 'gym', access_notes: 'Membership required', access_code: null, opening_hours: '24/7', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'PureGym Aarhus Dalgas Avenue', address: 'Dalgas Avenue 2A, 8000 Aarhus C', latitude: 56.1498, longitude: 10.2044, category: 'purchase_required', venue_type: 'gym', access_notes: 'Membership required', access_code: null, opening_hours: '24/7', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'PureGym Aalborg Dannebrogsgade', address: 'Dannebrogsgade 58, 9000 Aalborg', latitude: 57.0488, longitude: 9.9217, category: 'purchase_required', venue_type: 'gym', access_notes: 'Membership required', access_code: null, opening_hours: '24/7', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'PureGym Odense', address: 'Odense C, 5000 Odense', latitude: 55.4038, longitude: 10.4024, category: 'purchase_required', venue_type: 'gym', access_notes: 'Membership required', access_code: null, opening_hours: '24/7', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  // FitnessX
  { name: 'FitnessX Frederiksberg', address: 'Nordre Fasanvej 27, 2000 Frederiksberg', latitude: 55.6789, longitude: 12.5312, category: 'purchase_required', venue_type: 'gym', access_notes: 'Membership required', access_code: null, opening_hours: 'Mon–Fri 6–22, Sat–Sun 8–18', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'FitnessX Amager Strand', address: 'Amager Strandvej 112a, 2300 København S', latitude: 55.6545, longitude: 12.6112, category: 'purchase_required', venue_type: 'gym', access_notes: 'Membership required', access_code: null, opening_hours: 'Mon–Fri 6–22, Sat–Sun 8–18', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'FitnessX Femøren', address: 'Engvej 163, 2300 København S', latitude: 55.6489, longitude: 12.5892, category: 'purchase_required', venue_type: 'gym', access_notes: 'Membership required', access_code: null, opening_hours: 'Mon–Fri 6–22, Sat–Sun 8–18', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'FitnessX Carlsberg Byen', address: 'Thorvald Bindesbølls Pl. 1, 1799 København V', latitude: 55.6689, longitude: 12.5323, category: 'purchase_required', venue_type: 'gym', access_notes: 'Membership required', access_code: null, opening_hours: 'Mon–Fri 6–22, Sat–Sun 8–18', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'FitnessX Valby Vigerslevvej', address: 'Centerparken 34, 2500 Valby', latitude: 55.6589, longitude: 12.5123, category: 'purchase_required', venue_type: 'gym', access_notes: 'Membership required', access_code: null, opening_hours: 'Mon–Fri 6–22, Sat–Sun 8–18', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'FitnessX Aarhus Ankersgade', address: 'Ankersgade 12, 8000 Aarhus C', latitude: 56.1498, longitude: 10.2044, category: 'purchase_required', venue_type: 'gym', access_notes: 'Membership required', access_code: null, opening_hours: 'Mon–Fri 6–22, Sat–Sun 8–18', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'FitnessX Aarhus Viby', address: 'Viby Ringvej 10, 8260 Viby', latitude: 56.1298, longitude: 10.1844, category: 'purchase_required', venue_type: 'gym', access_notes: 'Membership required', access_code: null, opening_hours: 'Mon–Fri 6–22, Sat–Sun 8–18', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'FitnessX Lyngby', address: 'Jernbanepladsen 6, 2800 Lyngby', latitude: 55.771, longitude: 12.505, category: 'purchase_required', venue_type: 'gym', access_notes: 'Membership required', access_code: null, opening_hours: 'Mon–Fri 6–22, Sat–Sun 8–18', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'FitnessX Roskilde', address: 'Holbækvej 7, 4000 Roskilde', latitude: 55.6415, longitude: 12.0803, category: 'purchase_required', venue_type: 'gym', access_notes: 'Membership required', access_code: null, opening_hours: 'Mon–Fri 6–22, Sat–Sun 8–18', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'FitnessX Viborg', address: 'Tingvej 7, 8800 Viborg', latitude: 56.4531, longitude: 9.4023, category: 'purchase_required', venue_type: 'gym', access_notes: 'Membership required', access_code: null, opening_hours: 'Mon–Fri 6–22, Sat–Sun 8–18', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  // CrossFit
  { name: 'CrossFit Roskilde', address: 'Rådmandshaven 4B, 4000 Roskilde', latitude: 55.6415, longitude: 12.0803, category: 'purchase_required', venue_type: 'gym', access_notes: 'Membership required', access_code: null, opening_hours: 'Mon–Fri 6–21, Sat–Sun 8–14', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'CrossFit 3450 Allerød', address: 'Nymøllevej 2, 3450 Allerød', latitude: 55.8712, longitude: 12.3812, category: 'purchase_required', venue_type: 'gym', access_notes: 'Membership required', access_code: null, opening_hours: 'Mon–Fri 6–21, Sat–Sun 8–14', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'CrossFit 8800 Viborg', address: 'Vævervej 21, 8800 Viborg', latitude: 56.4531, longitude: 9.4023, category: 'purchase_required', venue_type: 'gym', access_notes: 'Membership required', access_code: null, opening_hours: 'Mon–Fri 6–21, Sat–Sun 8–14', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Aarhus CrossFit', address: 'Aarhus C, 8000 Aarhus', latitude: 56.1498, longitude: 10.2044, category: 'purchase_required', venue_type: 'gym', access_notes: 'Membership required', access_code: null, opening_hours: 'Mon–Thu 6–21, Fri 6–19, Sat–Sun 8:30–18', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
];

/** Swimming pools - paid access (entry fee / membership) */
const SWIMMING_POOLS: Omit<ToiletInsert, 'id'>[] = [
  { name: 'Øbro-Hallen Svømmehal', address: 'Gunnar Nu Hansens Plads 3, 2100 København Ø', latitude: 55.7012, longitude: 12.5792, category: 'purchase_required', venue_type: 'swimming_pool', access_notes: 'Entry fee required', access_code: null, opening_hours: 'Mon–Tue 7–20, Wed 8–20, Thu 6:30–20, Fri 7–20, Sat–Sun 9–15', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Aarhus Svømmestadion', address: 'F. Vestergaards Gade 5, 8000 Aarhus C', latitude: 56.1498, longitude: 10.2044, category: 'purchase_required', venue_type: 'swimming_pool', access_notes: 'Entry fee required', access_code: null, opening_hours: 'Mon–Sun 6–21', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Gellerupbadet', address: 'Karen Blixens Boulevard 41A, 8220 Brabrand', latitude: 56.1598, longitude: 10.1244, category: 'purchase_required', venue_type: 'swimming_pool', access_notes: 'Entry fee required', access_code: null, opening_hours: 'Mon–Sun 6–21', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Frederiksberg Svømmehal', address: 'Falkoner Allé 9, 2000 Frederiksberg', latitude: 55.6789, longitude: 12.5312, category: 'purchase_required', venue_type: 'swimming_pool', access_notes: 'Entry fee required', access_code: null, opening_hours: 'Mon–Fri 6:30–21, Sat–Sun 8–16', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Bellahøj Svømmehal', address: 'Bellahøjvej 1, 2700 Brønshøj', latitude: 55.7012, longitude: 12.5012, category: 'purchase_required', venue_type: 'swimming_pool', access_notes: 'Entry fee required', access_code: null, opening_hours: 'Mon–Fri 6:30–21, Sat–Sun 8–16', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Vesterbro Svømmehal', address: 'Enghavevej 6, 1670 København V', latitude: 55.6689, longitude: 12.5412, category: 'purchase_required', venue_type: 'swimming_pool', access_notes: 'Entry fee required', access_code: null, opening_hours: 'Mon–Fri 6:30–21, Sat–Sun 8–16', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Sundby Svømmehal', address: 'Sundbyvester Plads 1, 2300 København S', latitude: 55.6545, longitude: 12.6112, category: 'purchase_required', venue_type: 'swimming_pool', access_notes: 'Entry fee required', access_code: null, opening_hours: 'Mon–Fri 6:30–21, Sat–Sun 8–16', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Odense Svømmehal', address: 'H.C. Andersens Boulevard 50, 5000 Odense', latitude: 55.4038, longitude: 10.4024, category: 'purchase_required', venue_type: 'swimming_pool', access_notes: 'Entry fee required', access_code: null, opening_hours: 'Mon–Sun 6–21', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Aalborg Svømmehal', address: 'Vesterbro 77, 9000 Aalborg', latitude: 57.0488, longitude: 9.9217, category: 'purchase_required', venue_type: 'swimming_pool', access_notes: 'Entry fee required', access_code: null, opening_hours: 'Mon–Sun 6–21', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Vejle Svømmehal', address: 'Dæmningen 6, 7100 Vejle', latitude: 55.7089, longitude: 9.5357, category: 'purchase_required', venue_type: 'swimming_pool', access_notes: 'Entry fee required', access_code: null, opening_hours: 'Mon–Sun 6–21', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
];

/** Sports halls - free access */
const SPORTS_HALLS: Omit<ToiletInsert, 'id'>[] = [
  { name: 'Agoraen Idrætshal', address: 'Nyløkke 26, 6200 Aabenraa', latitude: 55.0442, longitude: 9.4192, category: 'free', venue_type: 'sports_hall', access_notes: 'Free access', access_code: null, opening_hours: 'Mon–Fri 8–22, Sat–Sun 9–18', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Arena Aabenraa', address: 'Hjelmallé 3, 6200 Aabenraa', latitude: 55.0442, longitude: 9.4192, category: 'free', venue_type: 'sports_hall', access_notes: 'Free access', access_code: null, opening_hours: 'Mon–Fri 8–22, Sat–Sun 9–18', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Ballerup Super Arena', address: 'Brøndbyvestervej 20, 2750 Ballerup', latitude: 55.7189, longitude: 12.3566, category: 'free', venue_type: 'sports_hall', access_notes: 'Free access during opening hours', access_code: null, opening_hours: 'Mon–Fri 8–22, Sat–Sun 9–18', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Frederiksberg Idrætscenter', address: 'Falkoner Allé 9, 2000 Frederiksberg', latitude: 55.6789, longitude: 12.5312, category: 'free', venue_type: 'sports_hall', access_notes: 'Free access', access_code: null, opening_hours: 'Mon–Fri 6:30–22, Sat–Sun 8–18', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Valby Idrætspark', address: 'Valby Langgade 86, 2500 Valby', latitude: 55.6589, longitude: 12.5123, category: 'free', venue_type: 'sports_hall', access_notes: 'Free access', access_code: null, opening_hours: 'Mon–Fri 8–22, Sat–Sun 9–18', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Nørrebro Idrætscenter', address: 'Nørrebrogade 210, 2200 København N', latitude: 55.6892, longitude: 12.5512, category: 'free', venue_type: 'sports_hall', access_notes: 'Free access', access_code: null, opening_hours: 'Mon–Fri 8–22, Sat–Sun 9–18', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Aarhus Idrætscenter', address: 'Møllevangs Allé 50, 8000 Aarhus C', latitude: 56.1498, longitude: 10.2044, category: 'free', venue_type: 'sports_hall', access_notes: 'Free access', access_code: null, opening_hours: 'Mon–Fri 8–22, Sat–Sun 9–18', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Odense Idrætshal', address: 'H.C. Andersens Boulevard 50, 5000 Odense', latitude: 55.4038, longitude: 10.4024, category: 'free', venue_type: 'sports_hall', access_notes: 'Free access', access_code: null, opening_hours: 'Mon–Fri 8–22, Sat–Sun 9–18', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Aalborg Idrætscenter', address: 'Mølleparkvej 50, 9000 Aalborg', latitude: 57.0488, longitude: 9.9217, category: 'free', venue_type: 'sports_hall', access_notes: 'Free access', access_code: null, opening_hours: 'Mon–Fri 8–22, Sat–Sun 9–18', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
  { name: 'Viborg Idrætshal', address: 'Tingvej 7, 8800 Viborg', latitude: 56.4531, longitude: 9.4023, category: 'free', venue_type: 'sports_hall', access_notes: 'Free access', access_code: null, opening_hours: 'Mon–Fri 8–22, Sat–Sun 9–18', source_type: 'public_dataset', verification_status: 'verified', last_verified_at: null, temporary_closed: false },
];

// FindToilet API response format - matches findtoilet.dk data structure
interface FindToiletFeature {
  id?: string;
  title?: string;
  description?: string;
  location?: {
    lat?: string;
    long?: string;
    street?: string;
    additional?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  };
  region?: { term_id?: string; name?: string };
  payment?: string | number;
  manned?: string | number;
  changing_table?: string | number;
  tap?: string | number;
  needle_container?: string | number;
  type?: string;
  kontakt?: string;
  images?: Array<{ mime_type?: string; url?: string }>;
}

interface FindToiletResponse {
  toilets?: FindToiletFeature[];
}

function parseDescription(desc: string | undefined): {
  placement: string | null;
  opening_hours: string | null;
  year_round: boolean;
  round_the_clock: boolean;
} {
  const result = {
    placement: null as string | null,
    opening_hours: null as string | null,
    year_round: true,
    round_the_clock: false,
  };
  if (!desc || typeof desc !== 'string') return result;
  const text = desc
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const placeringMatch = text.match(/Placering:\s*([^.]+?)(?=Åbningstider|Ændrede|$)/i);
  if (placeringMatch) result.placement = placeringMatch[1].trim();
  const helaarsMatch = text.match(/(?:helaarsaabent|helårsåbent):\s*(Ja|Nej|ja|nej)/i);
  result.year_round = helaarsMatch ? /ja/i.test(helaarsMatch[1]) : true;
  const doegnMatch = text.match(/(?:doegnaabent|døgnåbent):\s*(Ja|Nej|ja|nej)/i);
  result.round_the_clock = doegnMatch ? /ja/i.test(doegnMatch[1]) : false;
  const aabningMatch = text.match(/Åbningstider:\s*([^.]+?)(?=Ændrede|$)/i);
  if (aabningMatch) {
    const hours = aabningMatch[1]
      .replace(/(?:helaarsaabent|helårsåbent):[^,]+/gi, '')
      .replace(/(?:doegnaabent|døgnåbent):[^,]+/gi, '')
      .replace(/aabent_april_sept:[^,]+/gi, '')
      .replace(/Vinterlukket[^,]+/gi, '')
      .trim();
    if (hours) result.opening_hours = hours;
  }
  if (!result.opening_hours && result.round_the_clock) result.opening_hours = '24/7';
  if (!result.opening_hours && result.year_round) result.opening_hours = 'Open year-round';
  return result;
}

function mapFindToiletToInsert(item: FindToiletFeature): ToiletInsert | null {
  const loc = item?.location;
  const lat = typeof loc?.lat === 'string' ? parseFloat(loc.lat) : NaN;
  const lng = typeof loc?.long === 'string' ? parseFloat(loc.long) : NaN;
  if (isNaN(lat) || isNaN(lng)) return null;

  let category: ToiletInsert['category'] = 'free';
  const paymentVal = item?.payment;
  const paymentBool =
    paymentVal === '1' ||
    paymentVal === 1 ||
    String(paymentVal).toLowerCase() === 'true' ||
    String(paymentVal).toLowerCase().includes('ja');
  if (paymentBool) category = 'purchase_required';
  else if (
    String(paymentVal) === '2' ||
    String(paymentVal).toLowerCase().includes('code') ||
    String(paymentVal).toLowerCase().includes('pinkode')
  ) {
    category = 'code_required';
  }

  const street = loc?.street?.trim() || '';
  const city = loc?.city?.trim() || 'Danmark';
  const postal = loc?.postal_code?.trim() || '';
  const address = [street, postal, city].filter(Boolean).join(', ');

  const parsed = parseDescription(item?.description);
  const toiletType = (item?.type?.toLowerCase() || '') as ToiletInsert['toilet_type'];
  const validType =
    toiletType === 'handicap' ||
    toiletType === 'pissoir' ||
    toiletType === 'unisex' ||
    toiletType === 'changingplace'
      ? toiletType
      : null;

  const firstImage = item?.images?.[0]?.url;
  const manned = ['1', 1, 'true', 'ja'].includes(String(item?.manned ?? '').toLowerCase());
  const changingTable = ['1', 1, 'true', 'ja'].includes(String(item?.changing_table ?? '').toLowerCase());
  const tap = ['1', 1, 'true', 'ja'].includes(String(item?.tap ?? '').toLowerCase());
  const needleContainer = ['1', 1, 'true', 'ja'].includes(String(item?.needle_container ?? '').toLowerCase());

  return {
    id: randomUUID(),
    name: (item?.title?.trim() || 'Unnamed Toilet'),
    address: address || `${lat}, ${lng}`,
    latitude: lat,
    longitude: lng,
    category,
    access_notes: null,
    access_code: null,
    opening_hours: parsed.opening_hours,
    source_type: 'public_dataset',
    verification_status: 'verified',
    last_verified_at: null,
    temporary_closed: false,
    findtoilet_nid: item?.id ? String(item.id) : null,
    toilet_type: validType,
    payment: paymentBool,
    manned,
    changing_table: changingTable,
    tap,
    needle_container: needleContainer,
    contact: item?.kontakt?.trim() || null,
    image_url: firstImage || null,
    placement: parsed.placement,
    year_round: parsed.year_round,
    round_the_clock: parsed.round_the_clock,
  };
}

async function fetchFromFindToilet(): Promise<ToiletInsert[]> {
  const seenNids = new Set<string>();
  const toilets: ToiletInsert[] = [];

  function addItems(items: FindToiletFeature[]): void {
    for (const item of items) {
      if (!item) continue;
      const nid = item?.id ? String(item.id) : '';
      if (nid && seenNids.has(nid)) continue;
      const t = mapFindToiletToInsert(item);
      if (t) {
        toilets.push(t);
        if (t.findtoilet_nid) seenNids.add(t.findtoilet_nid);
      }
    }
  }

  // 1. Fetch full API (all 98 municipalities in one request)
  try {
    const res = await fetchWithRetry(FINDTOILET_API);
    const data = (await res.json()) as FindToiletResponse;
    const items = data?.toilets ?? [];
    addItems(items);
  } catch {
    // Continue to municipality crawl
  }

  // 2. Supplement: crawl each municipality individually for maximum ALL DENMARK coverage
  // (some municipalities may have data not included in bulk response)
  for (const tid of MUNICIPALITY_TERM_IDS) {
    try {
      const res = await fetchWithRetry(FINDTOILET_API_BY_TID(tid), 2);
      const data = (await res.json()) as FindToiletResponse;
      const items = data?.toilets ?? [];
      addItems(items);
      if (items.length > 0) {
        await new Promise((r) => setTimeout(r, 100)); // small delay to avoid hammering
      }
    } catch {
      // Skip this municipality, continue with others
    }
  }

  return toilets;
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

/** Copenhagen TMF + other administrations WFS (datavejviser.dk) */
const COPENHAGEN_WFS_TMF =
  'https://wfs-kbhkort.kk.dk/k101/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=k101:toilet_puma_agg_tmf_kk&srsname=EPSG:4326&outputFormat=application/json';
const COPENHAGEN_WFS_ANDRE =
  'https://wfs-kbhkort.kk.dk/k101/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=k101:toilet_puma_agg_andre_kk&srsname=EPSG:4326&outputFormat=application/json';

function extractLatLngFromGeometry(geom: GeoJsonFeature['geometry']): [number, number] | null {
  const coords = geom?.coordinates;
  if (!coords) return null;
  if (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
    const first = (coords as number[][][])[0]?.[0];
    return first && first.length >= 2 ? [first[0], first[1]] : null;
  }
  if (Array.isArray(coords[0]) && typeof coords[0][0] === 'number') {
    const first = (coords as number[][])[0];
    return first && first.length >= 2 ? [first[0], first[1]] : null;
  }
  if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
    return [coords[0] as number, coords[1] as number];
  }
  return null;
}

function mapOpendataFeatureToToilet(f: GeoJsonFeature): ToiletInsert | null {
  const extracted = extractLatLngFromGeometry(f?.geometry);
  if (!extracted) return null;
  const [lng, lat] = extracted;
  const props = f?.properties ?? {};
  // Copenhagen WFS: toilet_lokalitet, vejnavn_husnummer, postnummer | Frederiksberg: adresse, navn | Vejle: facilitetTekst, adresse
  const name =
    (props.toilet_lokalitet as string) ||
    (props.navn as string) ||
    (props.name as string) ||
    (props.title as string) ||
    (props.facilitetTekst as string) ||
    (props.toilet_betegnelse as string) ||
    'Unnamed Toilet';
  const street =
    (props.vejnavn_husnummer as string) ||
    (props.adresse as string) ||
    (props.vejnavn as string) ||
    '';
  const postal = (props.postnummer as string) || (props.postnr as string) || '';
  const address = [street, postal].filter(Boolean).join(', ') || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  let openingHours =
    (props.aabningstider as string) ||
    (props.opening_hours as string) ||
    (props.aabningstid as string) ||
    null;
  const aabningDoegn = String(props.aabningstid_doegn ?? props.aabningstid ?? '');
  const roundTheClock = /døgn|24|hele døgnet/i.test(aabningDoegn) && !/natlukket/i.test(aabningDoegn);
  if (roundTheClock && !openingHours) openingHours = '24/7';
  const aabningsperiode = String(props.aabningsperiode ?? '');
  const yearRound = !/vinterlukket|sommerlukket|seasonal/i.test(aabningsperiode);
  const handicap = String(props.handicapadgang ?? props.handicap ?? props.handicapvenlig ?? '').toLowerCase();
  const toiletType = /ja|yes|true|1/i.test(handicap) ? ('handicap' as const) : null;
  const status = props.status as string;
  const accessNotes = toiletType ? 'Handicap accessible' : null;
  return {
    id: randomUUID(),
    name: String(name).trim(),
    address: String(address).trim(),
    latitude: lat,
    longitude: lng,
    category: 'free',
    access_notes: accessNotes,
    access_code: null,
    opening_hours: openingHours,
    source_type: 'public_dataset',
    verification_status: status === 'IDrift' ? 'verified' : 'unverified',
    last_verified_at: null,
    temporary_closed: false,
    findtoilet_nid: null,
    toilet_type: toiletType,
    payment: false,
    manned: false,
    changing_table: false,
    tap: false,
    needle_container: false,
    contact: null,
    image_url: null,
    placement: null,
    year_round: yearRound,
    round_the_clock: roundTheClock,
  };
}

async function fetchFromOpendataCopenhagen(): Promise<ToiletInsert[]> {
  const toilets: ToiletInsert[] = [];
  for (const url of [COPENHAGEN_WFS_TMF, COPENHAGEN_WFS_ANDRE]) {
    try {
      const res = await fetchWithRetry(url, 2);
      if (!res.ok) continue;
      const data = (await res.json()) as GeoJsonResponse;
      const features = data?.features ?? [];
      for (const f of features) {
        const t = mapOpendataFeatureToToilet(f);
        if (t) toilets.push(t);
      }
    } catch {
      // Skip this dataset
    }
  }
  return toilets;
}

/** Aarhus GeoJSON - Offentlige toiletter + Bytoiletter (portal.opendata.dk) */
const AARHUS_GEOJSON_ANDRE =
  'https://webkort.aarhuskommune.dk/spatialmap?page=get_geojson_opendata&datasource=andre_toiletter';
const AARHUS_GEOJSON_BY = 'https://webkort.aarhuskommune.dk/spatialmap?page=get_geojson_opendata&datasource=by_toiletter';

async function fetchFromOpendataAarhus(): Promise<ToiletInsert[]> {
  const urls = [AARHUS_GEOJSON_ANDRE, AARHUS_GEOJSON_BY];
  const toilets: ToiletInsert[] = [];
  for (const url of urls) {
    try {
      const res = await fetchWithRetry(url, 2);
      if (!res.ok) continue;
      const data = (await res.json()) as GeoJsonResponse;
      const features = data?.features ?? [];
      for (const f of features) {
        const t = mapOpendataFeatureToToilet(f);
        if (t) toilets.push(t);
      }
    } catch {
      // Skip
    }
  }
  return toilets;
}

/** Frederiksberg GeoJSON (portal.opendata.dk - gc2 API) */
const FREDERIKSBERG_GEOJSON =
  'https://gc2ekstern.frederiksberg.dk/api/v2/sql/frederiksberg?format=geojson&q=select%20*%20from%20byrum.toiletter_offentlige&srs=4326';

async function fetchFromOpendataFrederiksberg(): Promise<ToiletInsert[]> {
  try {
    const res = await fetchWithRetry(FREDERIKSBERG_GEOJSON, 2);
    if (!res.ok) return [];
    const data = (await res.json()) as GeoJsonResponse;
    const features = data?.features ?? [];
    const toilets: ToiletInsert[] = [];
    for (const f of features) {
      const t = mapOpendataFeatureToToilet(f);
      if (t) toilets.push(t);
    }
    return toilets;
  } catch {
    return [];
  }
}

/** Vejle ArcGIS REST API - returns GeoJSON (portal.opendata.dk) */
const VEJLE_GEOJSON =
  'https://kortservice.vejle.dk/gis/rest/services/OPENDATA/Vejle/MapServer/4/query?where=facilitetTekst%3D%27Toilet%27&outFields=*&returnGeometry=true&f=geojson';

async function fetchFromOpendataVejle(): Promise<ToiletInsert[]> {
  try {
    const res = await fetchWithRetry(VEJLE_GEOJSON, 2);
    if (!res.ok) return [];
    const data = (await res.json()) as GeoJsonResponse;
    const features = data?.features ?? [];
    const toilets: ToiletInsert[] = [];
    for (const f of features) {
      const t = mapOpendataFeatureToToilet(f);
      if (t) toilets.push(t);
    }
    return toilets;
  } catch {
    return [];
  }
}

/** Fallback: legacy opendata URLs (used when WFS fails) */
async function fetchFromOpendataLegacy(): Promise<ToiletInsert[]> {
  try {
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
        const t = mapOpendataFeatureToToilet(f);
        if (t) toilets.push(t);
      }
      if (toilets.length > 0) return toilets;
    }
  } catch {
    // ignore
  }
  return [];
}

/** OpenStreetMap Overpass API - amenity=toilets in Denmark (bbox: 54.55,8.0,57.75,15.2) */
const OVERPASS_API = 'https://overpass-api.de/api/interpreter';
const DENMARK_BBOX = '(54.55,8.0,57.75,15.2)';
const OVERPASS_TIMEOUT = 60;

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id?: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements?: OverpassElement[];
}

async function fetchFromOpenStreetMap(): Promise<ToiletInsert[]> {
  const query = `[out:json][timeout:${OVERPASS_TIMEOUT}];
(
  node["amenity"="toilets"]${DENMARK_BBOX};
  way["amenity"="toilets"]${DENMARK_BBOX};
  node["building"="toilets"]${DENMARK_BBOX};
  way["building"="toilets"]${DENMARK_BBOX};
);
out center;`;
  try {
    const res = await fetch(OVERPASS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!res.ok) return [];
    const data = (await res.json()) as OverpassResponse;
    const elements = data?.elements ?? [];
    const toilets: ToiletInsert[] = [];
    for (const el of elements) {
      let lat: number;
      let lon: number;
      if (el.type === 'node' && el.lat != null && el.lon != null) {
        lat = el.lat;
        lon = el.lon;
      } else if (el.type === 'way' && el.center) {
        lat = el.center.lat;
        lon = el.center.lon;
      } else continue;
      const tags = el.tags ?? {};
      const name = tags.name || tags.operator || `Toilet (OSM ${el.type}/${el.id})`;
      const street = tags['addr:street'] || '';
      const housenumber = tags['addr:housenumber'] || '';
      const city = tags['addr:city'] || tags['addr:place'] || '';
      const postal = tags['addr:postcode'] || '';
      const address = [street, housenumber, postal, city].filter(Boolean).join(', ') || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
      const fee = tags.fee?.toLowerCase();
      const access = tags.access?.toLowerCase();
      let category: ToiletInsert['category'] = 'free';
      if (fee === 'yes' || access === 'customers' || access === 'private') category = 'purchase_required';
      const wheelchair = tags.wheelchair === 'yes';
      toilets.push({
        id: randomUUID(),
        name: String(name).trim(),
        address: String(address).trim(),
        latitude: lat,
        longitude: lon,
        category,
        access_notes: wheelchair ? 'Wheelchair accessible' : null,
        access_code: null,
        opening_hours: tags.opening_hours || null,
        source_type: 'public_dataset',
        verification_status: 'unverified',
        last_verified_at: null,
        temporary_closed: false,
        findtoilet_nid: null,
        toilet_type: wheelchair ? 'handicap' : null,
        payment: category === 'purchase_required',
        manned: false,
        changing_table: false,
        tap: false,
        needle_container: false,
        contact: null,
        image_url: null,
        placement: null,
        year_round: true,
        round_the_clock: /24|0-24|round_the_clock/i.test(tags.opening_hours || '') || false,
      });
    }
    return toilets;
  } catch {
    return [];
  }
}

/** Deduplicate by location (within ~11m): keep first occurrence */
function deduplicateByLocation(toilets: ToiletInsert[]): ToiletInsert[] {
  const seen = new Set<string>();
  return toilets.filter((t) => {
    const key = `${Math.round(t.latitude * 10000) / 10000},${Math.round(t.longitude * 10000) / 10000}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
  const sources: string[] = [];

  // 1. FindToilet API (all Denmark - primary source)
  toilets = await fetchFromFindToilet();
  if (toilets.length > 0) sources.push('findtoilet_api');

  // 2. opendata.dk Copenhagen (WFS) - supplement with municipal detail
  const cph = await fetchFromOpendataCopenhagen();
  if (cph.length > 0) {
    toilets = deduplicateByLocation([...toilets, ...cph]);
    sources.push('opendata_copenhagen');
  }

  // 3. opendata.dk Aarhus - supplement
  const aarhus = await fetchFromOpendataAarhus();
  if (aarhus.length > 0) {
    toilets = deduplicateByLocation([...toilets, ...aarhus]);
    sources.push('opendata_aarhus');
  }

  // 3b. opendata.dk Frederiksberg - supplement
  const frb = await fetchFromOpendataFrederiksberg();
  if (frb.length > 0) {
    toilets = deduplicateByLocation([...toilets, ...frb]);
    sources.push('opendata_frederiksberg');
  }

  // 3c. opendata.dk Vejle - supplement
  const vejle = await fetchFromOpendataVejle();
  if (vejle.length > 0) {
    toilets = deduplicateByLocation([...toilets, ...vejle]);
    sources.push('opendata_vejle');
  }

  // 4. If no data yet, try legacy opendata URLs
  if (toilets.length === 0) {
    toilets = await fetchFromOpendataLegacy();
    if (toilets.length > 0) sources.push('opendata_legacy');
  }

  // 5. OpenStreetMap Overpass API - amenity=toilets in Denmark
  const osm = await fetchFromOpenStreetMap();
  if (osm.length > 0) {
    toilets = deduplicateByLocation([...toilets, ...osm]);
    sources.push('osm');
  }

  // 6. Fallback: embedded sample when no API data
  if (toilets.length === 0) {
    toilets = SAMPLE_TOILETS.map((t) => ({ ...withExtendedDefaults(t), id: randomUUID() }));
    sources.push('embedded_sample');
  }

  const source = sources.length > 0 ? sources.join('+') : 'unknown';

  // 7. Always add hotel lobbies (free), cafés, restaurants, fast food chains, restaurant chains, gyms, swimming pools, sports halls (purchase_required / free)
  const embedded = [
    ...HOTEL_LOBBIES.map((t) => withExtendedDefaults(t)),
    ...CAFES_AND_RESTAURANTS.map((t) => withExtendedDefaults(t)),
    ...MCDONALDS.map((t) => withExtendedDefaults(t)),
    ...BURGER_KING.map((t) => withExtendedDefaults(t)),
    ...KFC.map((t) => withExtendedDefaults(t)),
    ...SUBWAY.map((t) => withExtendedDefaults(t)),
    ...RESTAURANT_CHAINS.map((t) => withExtendedDefaults(t)),
    ...MICHELIN_RESTAURANTS.map((t) => withExtendedDefaults(t)),
    ...GYMS.map((t) => withExtendedDefaults(t)),
    ...SWIMMING_POOLS.map((t) => withExtendedDefaults(t)),
    ...SPORTS_HALLS.map((t) => withExtendedDefaults(t)),
  ].map((t) => ({ ...t, id: randomUUID() }));
  toilets = [...toilets, ...embedded];

  const insert = db.prepare(`
    INSERT INTO toilets (
      id, name, address, latitude, longitude, category,
      access_notes, access_code, opening_hours, source_type, verification_status,
      last_verified_at, temporary_closed, created_at, updated_at,
      findtoilet_nid, toilet_type, payment, manned, changing_table, tap, needle_container,
      contact, image_url, placement, year_round, round_the_clock, venue_type
    ) VALUES (
      @id, @name, @address, @latitude, @longitude, @category,
      @access_notes, @access_code, @opening_hours, @source_type, @verification_status,
      @last_verified_at, @temporary_closed, datetime('now'), datetime('now'),
      @findtoilet_nid, @toilet_type, @payment, @manned, @changing_table, @tap, @needle_container,
      @contact, @image_url, @placement, @year_round, @round_the_clock, @venue_type
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
        findtoilet_nid: row.findtoilet_nid ?? null,
        toilet_type: row.toilet_type ?? null,
        payment: row.payment ? 1 : 0,
        manned: row.manned ? 1 : 0,
        changing_table: row.changing_table ? 1 : 0,
        tap: row.tap ? 1 : 0,
        needle_container: row.needle_container ? 1 : 0,
        contact: row.contact ?? null,
        image_url: row.image_url ?? null,
        placement: row.placement ?? null,
        year_round: (row.year_round ?? true) ? 1 : 0,
        round_the_clock: (row.round_the_clock ?? false) ? 1 : 0,
        venue_type: row.venue_type ?? null,
      });
    }
  });

  insertMany(toilets);

  console.log(`Database: ${resolvedPath}`);
  return { count: toilets.length, source };
}
