import 'reflect-metadata';
import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import { closeDb, createDb } from '../index.js';
import { seedAdminUser } from './seed-admin-user.js';
import { loadAppConfig } from '../../utils/index.js';

export async function runSeeds(databaseUrl?: string): Promise<void> {
  const db = await createDb(databaseUrl ?? loadAppConfig().databaseUrl);

  try {
    await seedAdminUser(db);
  } finally {
    await closeDb();
  }
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  runSeeds()
    .then(() => {
      console.log('Seed data applied successfully');
    })
    .catch((error: unknown) => {
      console.error('Failed to apply seed data:', error);
      process.exit(1);
    });
}
