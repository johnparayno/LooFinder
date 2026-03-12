/**
 * Toilets API routes
 */
import { Router, Request, Response } from 'express';
import {
  listToilets,
  getToiletById,
  findNearestToilet,
} from '../services/toiletService.js';

const router = Router();

// GET /api/toilets - list with optional bbox, category, verification_status, search
router.get('/', (req: Request, res: Response) => {
  const { bbox, category, verification_status, search } = req.query;
  const params: {
    bbox?: string;
    category?: 'free' | 'code_required' | 'purchase_required';
    verification_status?: 'verified' | 'unverified' | 'needs_review';
    search?: string;
  } = {};

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

// GET /api/toilets/:id
router.get('/:id', (req: Request, res: Response) => {
  const toilet = getToiletById(req.params.id);
  if (!toilet) {
    res.status(404).json({ error: 'Toilet not found' });
    return;
  }
  res.json(toilet);
});

export default router;
