import pick from 'stream-json/filters/pick.js';
import { COORDINATES_XY_PATTERN, LOCATIONS_IMPORT_KEY } from '../constants.js';
import type { Readable } from 'node:stream';
import { chain } from 'stream-chain';
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/stream-array.js';
import type { RawLocationRecord } from '../types/index.js';

interface LocationStreamValue {
  key: number;
  value: RawLocationRecord;
}

/**
 * @param x - The x coordinate
 * @param y - The y coordinate
 * @returns The requiredformatted user location
 */
export const formatUserLocation = (x: number, y: number): string => {
  return `x=${x},y=${y}`;
};

/**
 * This method parses the coordinates from a string.
 * @param coordinates - The coordinates string
 * @returns The x and y coordinates
 */
export const parseCoordinates = (coordinates: string): { x: number; y: number } => {
  const match = COORDINATES_XY_PATTERN.exec(coordinates);
  if (!match) {
    throw new Error(`Invalid coordinates format: ${coordinates}`);
  }

  return { x: Number(match[1]), y: Number(match[2]) };
};

/**
 * Streams location records from a JSON upload without loading the full file into memory.
 * Expects a top-level object with a `"locations"` array.
 */
// utils/location-stream.ts

export async function* iterateLocationRecords(
  stream: Readable,
  filter: string = LOCATIONS_IMPORT_KEY,
): AsyncGenerator<LocationStreamValue> {
  let foundLocations = false;

  const jsonStream = chain([
    stream,
    parser(),
    pick({
      filter: (stack) => {
        if (stack.length >= 1 && stack[0] === filter) {
          foundLocations = true;
          return true;
        }
        return false;
      },
    }),
    streamArray(),
  ]) as AsyncIterable<LocationStreamValue>;

  try {
    for await (const item of jsonStream) {
      yield item;
    }
  } catch (error) {
    throw new Error('Invalid JSON file', { cause: error });
  }

  if (!foundLocations) {
    throw new Error(`JSON file must contain a "${filter}" array`);
  }
}
