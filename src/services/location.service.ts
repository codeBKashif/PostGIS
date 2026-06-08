import { randomUUID } from 'node:crypto';
import type { Readable } from 'node:stream';
import type { FastifyBaseLogger } from 'fastify';
import type { DataSource } from 'typeorm';
import { iterateLocationRecords } from '../utils/location.js';
import { Location } from '../database/entities/location.entity.js';
import type {
  LocationImportResult,
  LocationInput,
  LocationSearchResult,
  RawLocationRecord,
  SearchQuery,
  SearchResponse,
} from './types/index.js';
import { IMPORT_BATCH_SIZE, LOCATIONS_IMPORT_KEY, MAX_RADIUS } from '../constants.js';
import { formatUserLocation, parseCoordinates } from '../utils/index.js';

export class LocationService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly log: FastifyBaseLogger,
  ) {}

  /**
   * This method searches for locations near a given point.
   * It uses the PostGIS function ST_Distance to calculate the distance between the point and the location.
   * @param query - The search query
   * @returns The search response
   */
  async search(query: SearchQuery): Promise<SearchResponse> {

    const locations = await this.dataSource.query<LocationSearchResult[]>(
      `SELECT 
        id, 
        name, 
        type,
        radius,
        x,
        y,
        created_at,
        updated_at,
        (geom <-> ST_MakePoint($1, $2)) AS distance
        FROM locations

        WHERE geom && ST_MakeEnvelope($3, $4, $5, $6)
        AND (geom <-> ST_MakePoint($1, $2)) <= radius

        ORDER BY distance ASC
      `,
      [
        query.x, 
        query.y, 
        Math.max(0, query.x - MAX_RADIUS), // minX
        Math.max(0, query.y - MAX_RADIUS), // minY
        query.x + MAX_RADIUS,              // maxX
        query.y + MAX_RADIUS               // maxY
      ],
    );

    return {
      userLocation: formatUserLocation(query.x, query.y),
      locations,
    };
  }

  /**
   * This method gets a location by its ID from the database.
   * @param id - The ID of the location
   * @returns The location if found, undefined otherwise
   */
  async getById(id: string): Promise<LocationInput | undefined> {
    const location = await this.dataSource.getRepository(Location).findOne({
      where: { id },
    });
    if(!location) {
      return undefined;
    }
    return location;
  }

  /**
   * This method updates a location in the database.
   * @param id - The ID of the location
   * @param input - The input to update the location with
   * @returns The updated location if found, undefined otherwise
   */
  async update(id: string, input: Partial<LocationInput>): Promise<LocationInput | undefined> {
    const existing = await this.getById(id);
    if(!existing) {
      return undefined;
    }

    await this.dataSource.getRepository(Location).update(id, {
      ...input,
      updated_at: new Date(),
    });

    return {...existing, ...input};

  }

  /**
   * This method imports locations from a JSON array stream into the database.
   * It uses batch processing to import locations into the database.
   * @param stream - The stream to import locations from
   * @returns The import result
   */
  async importJsonArrayStream(stream: Readable): Promise<LocationImportResult> {
    let batch: LocationInput[] = [];
    const totals = { inserted: 0, errors: 0 };

    for await (const { value } of iterateLocationRecords(stream, LOCATIONS_IMPORT_KEY)) {
      try {
        const location = this.parseRawLocation(value);
        batch.push(location);

        if (batch.length >= IMPORT_BATCH_SIZE) {
          await this.processImportBatch(batch, totals);
          batch = [];
        }
      } catch (error) {
        totals.errors += 1;
        this.log.warn({ err: error, record: value }, 'Failed to parse location record');
      }
    }

    if (batch.length > 0) {
      await this.processImportBatch(batch, totals);
    }

    this.log.info(totals, 'Location import finished');
    return totals;
  }

  private async processImportBatch(
    batch: LocationInput[],
    totals: { inserted: number; errors: number },
  ): Promise<void> {
    if (batch.length === 0) {
      return;
    }

    const result = await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(Location)
      .values(batch)
      .orIgnore()
      .returning(['id'])
      .execute();

    const insertedRows = result.raw as Array<{ id: string }>;
    const inserted = insertedRows.length;
    const errors = batch.length - inserted;

    totals.inserted += inserted;
    totals.errors += errors;

    if (errors > 0) {
      this.log.warn({ skipped: errors }, 'Skipped duplicate location records');
    }

    this.log.info({ inserted, skipped: errors }, 'Processed location batch');
  }

  private parseRawLocation(raw: RawLocationRecord): LocationInput {
    const { x, y } = parseCoordinates(raw.coordinates);

    return {
      id: raw.id ?? randomUUID(),
      name: raw.name,
      type: raw.type,
      radius: raw.radius,
      x,
      y,
    };
  }

}
