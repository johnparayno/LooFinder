/**
 * Seed script - loads Denmark toilet data via seedService
 */
import { seedDatabase } from '../services/seedService.js';

const dbPath = process.env.DATABASE_PATH;

seedDatabase(dbPath)
  .then(({ count, source }) => {
    console.log(`Seeded ${count} toilets (source: ${source})`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
