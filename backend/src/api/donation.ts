/**
 * Donation API - placeholder/mock for MVP (User Story 7)
 */
import { Router, Request, Response } from 'express';

const router = Router();

// POST /api/donation - placeholder donation flow (mock response)
router.post('/', (req: Request, res: Response) => {
  const body = req.body;
  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: 'Request body must be a JSON object' });
    return;
  }

  const { amount, currency } = body;

  if (typeof amount !== 'number' || amount <= 0) {
    res.status(400).json({ error: 'amount must be a positive number' });
    return;
  }

  if (currency !== 'DKK') {
    res.status(400).json({ error: 'currency must be DKK' });
    return;
  }

  // Mock success - no payment processed
  res.status(200).json({
    success: true,
    message: 'Thank you for your support! (Demo mode - no payment processed)',
  });
});

export default router;
