/**
 * LooFinder MVP - Backend API
 */
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import { getDatabase, initSchema } from './db/schema.js';
import apiRouter from './api/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize database schema on startup
const db = getDatabase();
initSchema(db);

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors());
app.use(express.json());

app.use('/api', apiRouter);

// Production: serve frontend from backend/public (copied during build)
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '..', 'public');
  const indexPath = path.join(frontendPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error('[LooFinder] Frontend not found at', frontendPath, '- ensure build copies frontend/dist to backend/public');
  }
  app.use(express.static(frontendPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(indexPath, (err) => {
      if (err) next(err);
    });
  });
}

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('[LooFinder] 500 Error:', err.message);
    console.error('[LooFinder] Path:', req.method, req.path);
    console.error('[LooFinder] Stack:', err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
);

app.listen(PORT, () => {
  console.log(`LooFinder API listening on http://localhost:${PORT}`);
});
