/**
 * Submissions API routes
 */
import { Router, Request, Response } from 'express';
import {
  createSubmission,
  type VenueType,
  type ToiletType,
} from '../services/submissionService.js';

const router = Router();

// POST /api/submissions - submit a new toilet (anonymous)
router.post('/', (req: Request, res: Response) => {
  const body = req.body;
  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: 'Request body must be a JSON object' });
    return;
  }

  const {
    name,
    address,
    latitude,
    longitude,
    category,
    access_notes,
    access_code,
    opening_hours,
    venue_type,
    toilet_type,
    payment,
    manned,
    changing_table,
    tap,
    needle_container,
    contact,
    image_url,
    placement,
    year_round,
    round_the_clock,
    temporary_closed,
  } = body;

  if (typeof name !== 'string' || typeof address !== 'string') {
    res.status(400).json({ error: 'name and address are required' });
    return;
  }

  const lat = Number(latitude);
  const lng = Number(longitude);
  if (isNaN(lat) || isNaN(lng)) {
    res.status(400).json({ error: 'latitude and longitude must be valid numbers' });
    return;
  }

  const validCategories = ['free', 'code_required', 'purchase_required'];
  if (!validCategories.includes(category)) {
    res.status(400).json({
      error: `category must be one of: ${validCategories.join(', ')}`,
    });
    return;
  }

  const validVenueTypes = [
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
  ];
  const venueTypeValue: VenueType | null =
    typeof venue_type === 'string' && validVenueTypes.includes(venue_type)
      ? (venue_type as VenueType)
      : null;
  const validToiletTypes = ['handicap', 'pissoir', 'unisex', 'changingplace'];
  const toiletTypeValue: ToiletType =
    typeof toilet_type === 'string' && validToiletTypes.includes(toilet_type)
      ? (toilet_type as ToiletType)
      : null;

  try {
    const result = createSubmission({
      name,
      address,
      latitude: lat,
      longitude: lng,
      category,
      access_notes: access_notes ?? null,
      access_code: access_code ?? null,
      opening_hours: opening_hours ?? null,
      venue_type: venueTypeValue,
      toilet_type: toiletTypeValue,
      payment: Boolean(payment),
      manned: Boolean(manned),
      changing_table: Boolean(changing_table),
      tap: Boolean(tap),
      needle_container: Boolean(needle_container),
      contact: contact ?? null,
      image_url: image_url ?? null,
      placement: placement ?? null,
      year_round: year_round !== false,
      round_the_clock: Boolean(round_the_clock),
      temporary_closed: Boolean(temporary_closed),
    });

    res.status(201).json({
      id: result.id,
      status: result.status,
      message: 'Thank you for your submission. It will be reviewed by our team.',
      ...(result.possible_duplicate && { possible_duplicate: true }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Validation failed';
    res.status(400).json({ error: message });
  }
});

export default router;
