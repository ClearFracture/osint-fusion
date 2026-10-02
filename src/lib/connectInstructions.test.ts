import { describe, expect, it } from 'vitest';
import { getConfig } from '../config/env';
import { buildConnectInstructions, buildQgisVrt } from './connectInstructions';

describe('buildQgisVrt', () => {
  it('targets the configured Athena database and table for this request', () => {
    const { region, athenaDatabase, athenaTable, athenaOutput } = getConfig();
    const vrt = buildQgisVrt('req-1');

    expect(vrt).toContain(`AwsRegion=${region}`);
    expect(vrt).toContain(`S3OutputLocation=${athenaOutput}`);
    expect(vrt).toContain(`FROM ${athenaDatabase}.${athenaTable}`);
    expect(vrt).toContain("request_id = 'req-1'");
    expect(vrt).toContain("payload_schema_ref = 'geojson-feature'");
    expect(vrt).toContain("json_extract(json_parse(payload_json), '$.geometry')");
    expect(vrt).toContain('from_geojson_geometry');
    expect(vrt).toContain('ST_AsText');
    expect(vrt).toContain('encoding="WKT" field="geom"');
    expect(vrt).toContain('<LayerSRS>EPSG:4326</LayerSRS>');
    expect(vrt).toContain('record_id');
    expect(vrt).toContain('source_type');
    expect(vrt).toContain('source_producer');
    expect(vrt).not.toContain('ST_GeometryFromGeoJSON');
  });

  it('escapes request ids that contain quotes', () => {
    const vrt = buildQgisVrt("req'1");
    expect(vrt).toContain("request_id = 'req''1'");
  });
});

describe('buildConnectInstructions', () => {
  it('includes the VRT and request id in the QGIS steps', () => {
    const result = buildConnectInstructions('req-1', ['geojson-feature'], null);
    expect(result.qgisVrt).toContain("request_id = 'req-1'");
    expect(result.qgis.some((step) => step.includes('osint-cube-req-1.vrt'))).toBe(true);
    expect(result.qgis.some((step) => step.includes('geojson-feature'))).toBe(true);
  });

  it('includes Athena filter for Tableau', () => {
    const { athenaTable } = getConfig();
    const result = buildConnectInstructions('req-1', [], null);
    expect(result.tableau.some((step) => step.includes("request_id = 'req-1'"))).toBe(true);
    expect(result.tableau.some((step) => step.includes(athenaTable))).toBe(true);
  });
});
