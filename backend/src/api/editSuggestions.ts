/**
 * Edit suggestions API routes
 */
import { Router, Request, Response } from 'express';
import { createEditSuggestion } from '../services/editSuggestionService.js';

const router = Router();

// POST /api/edit-suggestions - suggest edits to a toilet (anonymous)
router.post('/', (req: Request, res: Response) => {
  const body = req.body;
  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: 'Request body must be a JSON object' });
    return;
  }

  const { toilet_id, suggested_fields } = body;

  if (typeof toilet_id !== 'string') {
    res.status(400).json({ error: 'toilet_id is required and must be a string' });
    return;
  }

  if (typeof suggested_fields !== 'object' || suggested_fields === null || Array.isArray(suggested_fields)) {
    res.status(400).json({ error: 'suggested_fields is required and must be an object' });
    return;
  }

  try {
    const result = createEditSuggestion({
      toilet_id,
      suggested_fields: suggested_fields as Record<string, unknown>,
    });

    res.status(201).json({
      id: result.id,
      message: 'Thank you for your suggestion. It will be reviewed.',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Validation failed';
    const status = message === 'Toilet not found' ? 404 : 400;
    res.status(status).json({ error: message });
  }
});

export default router;
