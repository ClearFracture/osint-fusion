import { describe, expect, it } from 'vitest';
import { buildConnectInstructions } from './connectInstructions';

describe('buildConnectInstructions', () => {
  it('includes vsis3 path for QGIS', () => {
    const result = buildConnectInstructions('req-1', ['geojson-feature'], null);
    expect(result.qgis.some((step) => step.includes('/vsis3/'))).toBe(true);
    expect(result.qgis.some((step) => step.includes('req-1'))).toBe(true);
  });

  it('includes Athena filter for Tableau', () => {
    const result = buildConnectInstructions('req-1', [], null);
    expect(result.tableau.some((step) => step.includes("request_id = 'req-1'"))).toBe(true);
  });
});
