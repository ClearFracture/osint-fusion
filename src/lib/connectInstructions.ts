import { getConfig } from '../config/env';
import type { PayloadSchemaRegistry } from '../types/cube';
import { resolveSchemaLabel } from './schemaService';

/** Payload schema id whose `payload_json` value is an RFC 7946 GeoJSON Feature. */
const GEOJSON_FEATURE_SCHEMA_REF = 'geojson-feature';

export interface ConnectInstructions {
  qgis: string[];
  qgisVrt: string;
  tableau: string[];
}

/** Escape text placed in XML element content or attribute values. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Escape a string literal for Athena SQL, then for XML text. */
function sqlStringLiteral(value: string): string {
  return escapeXml(value.replace(/'/g, "''"));
}

/**
 * Quote an Athena identifier when it is not a plain name.
 * Plain names are emitted unquoted so the VRT matches typical Glue catalog ids.
 */
function athenaIdent(value: string): string {
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    return value;
  }
  return `"${value.replace(/"/g, '""')}"`;
}

/**
 * OGR VRT that opens this request as a QGIS vector layer through the Athena JDBC driver.
 * Geometry is WKT derived from `payload_json` on `geojson-feature` rows. Athena engine 3
 * accepts a GeoJSON geometry object, so the Feature wrapper is removed before conversion.
 * `try` drops rows whose payload is not valid JSON instead of failing the whole layer.
 */
export function buildQgisVrt(requestId: string): string {
  const { region, athenaDatabase, athenaTable, athenaOutput } = getConfig();
  const jdbcUrl = [
    `jdbc:awsathena://AwsRegion=${region}`,
    `S3OutputLocation=${athenaOutput}`,
    'AwsCredentialsProviderClass=com.simba.athena.amazonaws.auth.DefaultAWSCredentialsProviderChain',
  ].join(';');
  const srcDataSource = escapeXml(
    `JDBC:com.simba.athena.jdbc.Driver:${jdbcUrl};`,
  );
  const tableRef = `${athenaIdent(athenaDatabase)}.${athenaIdent(athenaTable)}`;
  const requestLiteral = sqlStringLiteral(requestId);
  const schemaLiteral = sqlStringLiteral(GEOJSON_FEATURE_SCHEMA_REF);

  const srcSql = `
            SELECT
                record_id,
                request_id,
                source_type,
                source_producer,
                observed_at,
                ingested_at,
                payload_schema_ref,
                title,
                summary,
                confidence,
                lat,
                lon,
                payload_json,
                ST_AsText(to_geometry(from_geojson_geometry(
                    try(json_format(json_extract(json_parse(payload_json), '$.geometry')))
                ))) AS geom
            FROM ${tableRef}
            WHERE request_id = '${requestLiteral}'
              AND payload_schema_ref = '${schemaLiteral}'
              AND try(json_extract(json_parse(payload_json), '$.geometry')) IS NOT NULL`.trim();

  return `<OGRVRTDataSource>
    <OGRVRTLayer name="osint_cube">
        <SrcDataSource>${srcDataSource}</SrcDataSource>
        <SrcSQL>
            ${srcSql}
        </SrcSQL>
        <LayerSRS>EPSG:4326</LayerSRS>
        <GeometryType>wkbUnknown</GeometryType>
        <GeometryField encoding="WKT" field="geom"/>
    </OGRVRTLayer>
</OGRVRTDataSource>
`;
}

/** Connection steps for QGIS (Athena VRT) and Tableau. */
export function buildConnectInstructions(
  requestId: string,
  payloadSchemaRefs: string[],
  registry: PayloadSchemaRegistry | null,
): ConnectInstructions {
  const { athenaDatabase, athenaTable, athenaOutput, region } = getConfig();
  const qgisVrt = buildQgisVrt(requestId);

  const geoSchemas = payloadSchemaRefs
    .filter((ref) => ref === GEOJSON_FEATURE_SCHEMA_REF || ref.includes('geojson'))
    .map((ref) => resolveSchemaLabel(registry, ref));

  const qgis: string[] = [
    `Save the layer definition below as osint-cube-${requestId}.vrt.`,
    'Use a QGIS build whose GDAL includes the JDBC driver (ogrinfo --formats lists JDBC). Put the Athena JDBC 2.x jar (class com.simba.athena.jdbc.Driver) on CLASSPATH before starting QGIS.',
    'Start QGIS from a shell where the default AWS credential chain can see your keys:',
    '  AWS_ACCESS_KEY_ID=...',
    '  AWS_SECRET_ACCESS_KEY=...',
    `  AWS_DEFAULT_REGION=${region}`,
    'In QGIS choose Layer → Add Layer → Add Vector Layer, set the source type to File, and select the .vrt.',
    `The query reads ${athenaDatabase}.${athenaTable} for request_id = '${requestId}' and builds geometry from payload_json where payload_schema_ref is ${GEOJSON_FEATURE_SCHEMA_REF}. Query results are written to ${athenaOutput}.`,
  ];

  if (geoSchemas.length > 0) {
    qgis.push(`This cube uses geo payload schemas: ${geoSchemas.join(', ')}`);
  }

  const tableau: string[] = [
    'Open Tableau → Connect → Amazon Athena.',
    `Region: ${region}`,
    `Database: ${athenaDatabase}`,
    `Staging directory: ${athenaOutput}`,
    `Select the ${athenaTable} table.`,
    `Add filter: request_id = '${requestId}'`,
    'Use payload_schema_ref to interpret payload_json fields in worksheets.',
  ];

  return { qgis, qgisVrt, tableau };
}
