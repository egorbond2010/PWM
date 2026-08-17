import { GeoJSONFeatureCollection, Source, TerritoryHistory } from '../types';

export const initialSources: Source[] = [];

export const initialMapFeatures: GeoJSONFeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

export const initialDiffs: TerritoryHistory[] = [];
