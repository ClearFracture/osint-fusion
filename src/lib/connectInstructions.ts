import { getConfig, s3Uri } from '../config/env';
import type { PayloadSchemaRegistry } from '../types/cube';
import { resolveSchemaLabel } from './schemaService';

export interface ConnectInstructions {
  qgis: string[];
  tableau: string[];
}

/** Text-only connection steps for QGIS and Tableau. */
export function buildConnectInstructions(
  requestId: string,
  payloadSchemaRefs: string[],
  registry: PayloadSchemaRegistry | null,
): ConnectInstructions {
  const dataPath = s3Uri(`requests/${requestId}/cube/data/`);
  const vsis3Path = dataPath.replace('s3://', '/vsis3/');
  const { athenaDatabase, athenaOutput, region } = getConfig();

  const geoSchemas = payloadSchemaRefs
    .filter((ref) => ref.includes('geojson'))
    .map((ref) => resolveSchemaLabel(registry, ref));

  const qgis: string[] = [
    'Configure AWS credentials in your shell (QGIS inherits the environment):',
    '  export AWS_ACCESS_KEY_ID=...',
    '  export AWS_SECRET_ACCESS_KEY=...',
    '  export AWS_DEFAULT_REGION=' + region,
    'Open QGIS → Layer → Add Layer → Add Vector Layer.',
    `Set source type to Directory and path: ${vsis3Path}`,
    'Partition layout: source_type={type}/source_producer={producer}/*.parquet',
    'For geometry, parse payload_json when payload_schema_ref is geojson-feature.',
  ];

  if (geoSchemas.length > 0) {
    qgis.push(`This cube uses geo payload schemas: ${geoSchemas.join(', ')}`);
  }

  const tableau: string[] = [
    'Open Tableau → Connect → Amazon Athena.',
    `Region: ${region}`,
    `Database: ${athenaDatabase}`,
    `Staging directory: ${athenaOutput}`,
    'Select the osint_cube table.',
    `Add filter: request_id = '${requestId}'`,
    'Use payload_schema_ref to interpret payload_json fields in worksheets.',
  ];

  return { qgis, tableau };
}
