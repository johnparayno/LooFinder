/**
 * Toilets API routes
 */
import { Router, Request, Response } from 'express';
import {
  listToilets,
  countToilets,
  getToiletById,
  findNearestToilet,
  updateToilet,
} from '../services/toiletService.js';

const router = Router();

const VALID_VENUE_TYPES = [
  'supermarket',
  'library',
  'museum',
  'cafe_restaurant',
  'shopping_centre',
  'train_station',
  'bus_station',
  'gym',
  'swimming_pool',
  'sports_hall',
  'other',
] as const;

// GET /api/toilets - list with optional bbox, category, verification_status, venue_type, search
router.get('/', (req: Request, res: Response) => {
  const { bbox, category, verification_status, venue_type, search } = req.query;
  const params: Parameters<typeof listToilets>[0] = {};

  if (typeof bbox === 'string') params.bbox = bbox;
  if (category === 'free' || category === 'code_required' || category === 'purchase_required') {
    params.category = category;
  }
  if (
    verification_status === 'verified' ||
    verification_status === 'unverified' ||
    verification_status === 'needs_review'
  ) {
    params.verification_status = verification_status;
  }
  if (typeof venue_type === 'string' && VALID_VENUE_TYPES.includes(venue_type as (typeof VALID_VENUE_TYPES)[number])) {
    params.venue_type = venue_type as (typeof VALID_VENUE_TYPES)[number];
  }
  if (typeof search === 'string' && search.trim()) params.search = search.trim();

  const toilets = listToilets(params);
  res.json({ toilets });
});

// GET /api/toilets/nearest - must be before /:id
router.get('/nearest', (req: Request, res: Response) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);

  if (typeof lat !== 'number' || isNaN(lat) || typeof lng !== 'number' || isNaN(lng)) {
    res.status(400).json({ error: 'lat and lng query params are required' });
    return;
  }

  const category =
    req.query.category === 'free' ||
    req.query.category === 'code_required' ||
    req.query.category === 'purchase_required'
      ? req.query.category
      : undefined;
  const verification_status =
    req.query.verification_status === 'verified' ||
    req.query.verification_status === 'unverified' ||
    req.query.verification_status === 'needs_review'
      ? req.query.verification_status
      : undefined;

  const toilet = findNearestToilet(lat, lng, { category, verification_status });
  if (!toilet) {
    res.status(404).json({ error: 'No toilet found' });
    return;
  }
  res.json(toilet);
});

// GET /api/toilets/count - must be before /:id
router.get('/count', (req: Request, res: Response) => {
  const bbox = typeof req.query.bbox === 'string' ? req.query.bbox : undefined;
  const count = countToilets({ bbox });
  res.json({ count });
});

// GET /api/toilets/:id
router.get('/:id', (req: Request, res: Response) => {
  const toilet = getToiletById(req.params.id);
  if (!toilet) {
    res.status(404).json({ error: 'Toilet not found' });
    return;
  }
  res.json(toilet);
});

// PUT /api/toilets/:id - update toilet (anonymous, no login required)
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body;
  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: 'Request body must be a JSON object' });
    return;
  }

  const validCategories = ['free', 'code_required', 'purchase_required'];
  const validVenueTypes = [
    'supermarket',
    'library',
    'museum',
    'cafe_restaurant',
    'shopping_centre',
    'train_station',
    'bus_station',
    'other',
  ];
  const validToiletTypes = ['handicap', 'pissoir', 'unisex', 'changingplace'];

  const input: Parameters<typeof updateToilet>[1] = {};

  if (body.name !== undefined) input.name = String(body.name);
  if (body.address !== undefined) input.address = String(body.address);
  if (body.latitude !== undefined) {
    const lat = Number(body.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      res.status(400).json({ error: 'latitude must be between -90 and 90' });
      return;
    }
    input.latitude = lat;
  }
  if (body.longitude !== undefined) {
    const lng = Number(body.longitude);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      res.status(400).json({ error: 'longitude must be between -180 and 180' });
      return;
    }
    input.longitude = lng;
  }
  if (body.category !== undefined) {
    if (!validCategories.includes(body.category)) {
      res.status(400).json({ error: `category must be one of: ${validCategories.join(', ')}` });
      return;
    }
    input.category = body.category;
  }
  if (body.access_notes !== undefined) input.access_notes = body.access_notes ?? null;
  if (body.access_code !== undefined) input.access_code = body.access_code ?? null;
  if (body.opening_hours !== undefined) input.opening_hours = body.opening_hours ?? null;
  if (body.temporary_closed !== undefined) input.temporary_closed = Boolean(body.temporary_closed);
  if (body.venue_type !== undefined) {
    input.venue_type =
      body.venue_type && validVenueTypes.includes(body.venue_type) ? body.venue_type : null;
  }
  if (body.toilet_type !== undefined) {
    input.toilet_type =
      body.toilet_type && validToiletTypes.includes(body.toilet_type) ? body.toilet_type : null;
  }
  if (body.payment !== undefined) input.payment = Boolean(body.payment);
  if (body.manned !== undefined) input.manned = Boolean(body.manned);
  if (body.changing_table !== undefined) input.changing_table = Boolean(body.changing_table);
  if (body.tap !== undefined) input.tap = Boolean(body.tap);
  if (body.needle_container !== undefined) input.needle_container = Boolean(body.needle_container);
  if (body.contact !== undefined) input.contact = body.contact ?? null;
  if (body.image_url !== undefined) input.image_url = body.image_url ?? null;
  if (body.placement !== undefined) input.placement = body.placement ?? null;
  if (body.year_round !== undefined) input.year_round = Boolean(body.year_round);
  if (body.round_the_clock !== undefined) input.round_the_clock = Boolean(body.round_the_clock);

  try {
    const toilet = updateToilet(id, input);
    if (!toilet) {
      res.status(404).json({ error: 'Toilet not found' });
      return;
    }
    res.json(toilet);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update failed';
    res.status(400).json({ error: message });
  }
});

export default router;
