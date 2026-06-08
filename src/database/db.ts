import 'reflect-metadata';
import type { DataSource } from 'typeorm';
import { createAppDataSource } from './data-source.js';

let dataSource: DataSource | null = null;

export async function createDb(connectionString: string): Promise<DataSource> {
  if (dataSource?.isInitialized) {
    return dataSource;
  }

  dataSource = createAppDataSource(connectionString);
  await dataSource.initialize();
  return dataSource;
}


export async function closeDb(): Promise<void> {
  if (dataSource?.isInitialized) {
    await dataSource.destroy();
    dataSource = null;
  }
}

