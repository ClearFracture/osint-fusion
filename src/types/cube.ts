export type ManifestStatus = 'building' | 'ready' | 'failed';

export interface CubeManifest {
  status: ManifestStatus;
  error_message?: string;
  athena_table?: string;
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

export const SOURCE_TYPE_LABELS = {
  Infrastructure: 'Infrastructure',
  SocialMedia: 'Social Media',
  EntityTracks: 'Entity Tracks',
  EarthObservations: 'Earth Observations',
  Demographics: 'Demographics',
} as const;

export type SourceType = keyof typeof SOURCE_TYPE_LABELS;

export const CANONICAL_SOURCE_TYPES = Object.keys(SOURCE_TYPE_LABELS) as SourceType[];

export function sourceTypeLabel(sourceType: string): string {
  if (sourceType in SOURCE_TYPE_LABELS) {
    return SOURCE_TYPE_LABELS[sourceType as SourceType];
  }
  return sourceType;
}
