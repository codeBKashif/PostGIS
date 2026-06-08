export interface LocationSearchResult {
  id: string;
  name: string;
  type: string;
  radius: number;  
  x: number;
  y: number;
  created_at: Date;
  updated_at: Date;
  distance: number;
}

export interface LocationInput {
  id?: string;
  name: string;
  type: string;
  radius: number;
  x: number;
  y: number;
}

export interface SearchQuery {
  x: number;
  y: number;
  limit?: number;
}

export interface SearchResponse {
  userLocation: string;
  locations: LocationSearchResult[];
}

export interface LocationImportResult {
  inserted: number;
  errors: number;
}

export interface RawLocationRecord {
  id?: string;
  name: string;
  type: string;
  coordinates: string;
  radius: number;
}
