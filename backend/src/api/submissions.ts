/**
 * Submissions API routes
 */
import { Router, Request, Response } from 'express';
import { createSubmission } from '../services/submissionService.js';

const router = Router();

// POST /api/submissions - submit a new toilet (anonymous)
router.post('/', (req: Request, res: Response) => {
  const body = req.body;
  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: 'Request body must be a JSON object' });
    return;
  }

  const { name, address, latitude, longitude, category, access_notes, opening_hours, venue_type } =
    body;

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
    'other',
  ];
  const venueTypeValue =
    typeof venue_type === 'string' && validVenueTypes.includes(venue_type) ? venue_type : undefined;

  try {
    const result = createSubmission({
      name,
      address,
      latitude: lat,
      longitude: lng,
      category,
      access_notes: access_notes ?? null,
      opening_hours: opening_hours ?? null,
      venue_type: venueTypeValue ?? null,
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
