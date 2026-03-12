/**
 * API routing - base /api prefix
 */
import { Router } from 'express';
import toiletsRouter from './toilets.js';
import submissionsRouter from './submissions.js';
import reportsRouter from './reports.js';
import editSuggestionsRouter from './editSuggestions.js';
import donationRouter from './donation.js';

const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'LooFinder API' });
});

apiRouter.use('/toilets', toiletsRouter);
apiRouter.use('/submissions', submissionsRouter);
apiRouter.use('/reports', reportsRouter);
apiRouter.use('/edit-suggestions', editSuggestionsRouter);
apiRouter.use('/donation', donationRouter);

export default apiRouter;
