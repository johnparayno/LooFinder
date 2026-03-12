/**
 * Reports API routes
 */
import { Router, Request, Response } from 'express';
import { createReport } from '../services/reportService.js';

const router = Router();

// POST /api/reports - report incorrect information for a toilet (anonymous)
router.post('/', (req: Request, res: Response) => {
  const body = req.body;
  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: 'Request body must be a JSON object' });
    return;
  }

  const { toilet_id, description } = body;

  if (typeof toilet_id !== 'string' || typeof description !== 'string') {
    res.status(400).json({ error: 'toilet_id and description are required' });
    return;
  }

  try {
    const result = createReport({
      toilet_id,
      description,
    });

    res.status(201).json({
      id: result.id,
      message: 'Thank you for your report. It will be reviewed.',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Validation failed';
    const status = message === 'Toilet not found' ? 404 : 400;
    res.status(status).json({ error: message });
  }
});

export default router;
