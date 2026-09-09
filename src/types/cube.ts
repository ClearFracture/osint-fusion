export type ManifestStatus = 'building' | 'ready' | 'failed';

export interface CubeManifest {
  status: ManifestStatus;
  error_message?: string;
  athena_table?: string;
}

export interface CubeProducer {
  id: string;
  label: string;
  record_count: number;
}

export interface CubeSourceType {
  id: string;
  label: string;
  producers: CubeProducer[];
}

export interface CubeSchema {
  version: number;
  request_id: string;
  source_types: CubeSourceType[];
  total_records: number;
  artifact_count: number;
  payload_schema_refs: string[];
  last_updated: string;
}

export interface PayloadSchemaEntry {
  id: string;
  label: string;
  description: string;
  s3_uri: string;
  media_type: string;
}

export interface PayloadSchemaRegistry {
  version: number;
  schemas: PayloadSchemaEntry[];
}

export const SOURCE_TYPE_LABELS: Record<string, string> = {
  Infrastructure: 'Infrastructure',
  SocialMedia: 'Social Media',
  EntityTracks: 'Entity Tracks',
  EarthObservations: 'Earth Observations',
  Demographics: 'Demographics',
};
