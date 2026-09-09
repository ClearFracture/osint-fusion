export type RequestStatus = 'pending' | 'building' | 'ready' | 'failed';

export interface GeoJsonGeometry {
  type: string;
  coordinates: unknown;
}

export interface TopicTimeRange {
  start: string;
  end: string;
}

export interface CollectionTopic {
  narrative?: string;
  geofence?: GeoJsonGeometry;
  time_range?: TopicTimeRange;
}

export interface CollectionRequest {
  request_id: string;
  topic: CollectionTopic;
  created_at: string;
  status: RequestStatus;
  cube_s3_prefix: string;
}

export interface RegistryEntry {
  request_id: string;
  topic_summary: string;
  created_at: string;
  status: RequestStatus;
  record_count?: number;
}

export interface RequestRegistry {
  version: number;
  requests: RegistryEntry[];
}

export type NewRequestInput = CollectionTopic;
