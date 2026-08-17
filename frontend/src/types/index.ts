export type TerritoryStatus = 'side_a' | 'side_b' | 'contested' | 'unconfirmed' | 'neutral' | 'diff_gain' | 'diff_loss';

export type ConfidenceLevel = 'confirmed_high' | 'medium' | 'low' | 'unconfirmed';

export type SourceType = 'video' | 'geolocated_photo' | 'sat_imagery' | 'official_report' | 'analyst';

export interface Source {
  id: string;
  url: string;
  archive_url?: string;
  source_type: SourceType;
  confidence: ConfidenceLevel;
  title: string;
  description?: string;
  media_url?: string;
  coordinates?: [number, number];
  author_name?: string;
  created_at: string;
}

export interface Territory {
  id: string;
  name: string;
  status: TerritoryStatus;
  color_hex: string;
  geometry: {
    type: 'Polygon' | 'MultiPolygon' | 'Point';
    coordinates: any;
  };
  area_sqkm: number;
  last_source_id?: string;
  last_source?: Source;
  created_at: string;
  updated_at: string;
}

export interface TerritoryHistory {
  id: string;
  territory_id: string;
  change_type: 'advance' | 'retreat' | 'correction' | 'initial' | 'split' | 'merge' | 'kml_sync';
  old_geometry?: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: any;
  };
  new_geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: any;
  };
  diff_gain?: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: any;
  };
  diff_loss?: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: any;
  };
  delta_area_sqkm: number;
  author_name: string;
  moderator_name?: string;
  moderation_status: 'pending' | 'approved' | 'rejected';
  sources?: Source[];
  valid_from: string;
  valid_to?: string;
  notes?: string;
  created_at: string;
}

export interface GeoJSONFeature {
  type: 'Feature';
  id?: string;
  geometry: any;
  properties: {
    id: string;
    name: string;
    status: TerritoryStatus | string;
    color_hex: string;
    area_sqkm: number;
    updated_at: string;
    last_source_id?: string;
    last_source_title?: string;
    last_source_type?: SourceType;
    confidence?: ConfidenceLevel;
    [key: string]: any;
  };
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export interface WSMessage {
  event: 'territory_updated' | 'diff_alert' | 'proposal_submitted' | 'map_reloaded';
  timestamp: string;
  payload: any;
}
