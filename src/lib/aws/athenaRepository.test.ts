import { describe, expect, it } from 'vitest';
import {
  buildCreateDatabaseDdl,
  buildCreateTableDdl,
  buildOverviewQuery,
  buildPayloadSchemaRefsQuery,
  buildProducersBreakdownQuery,
  buildSourceBreakdownQuery,
} from './athenaRepository';

describe('athenaRepository queries', () => {
  it('escapes request id in overview query', () => {
    const sql = buildOverviewQuery("abc'123");
    expect(sql).toContain("request_id = 'abc''123'");
    expect(sql).toContain('COUNT(*)');
  });

  it('groups by source type in breakdown query', () => {
    const sql = buildSourceBreakdownQuery('req-1');
    expect(sql).toContain('GROUP BY source_type');
    expect(sql).toContain("request_id = 'req-1'");
  });

  it('groups producers by source type and producer', () => {
    const sql = buildProducersBreakdownQuery('req-1');
    expect(sql).toContain('source_producer');
    expect(sql).toContain('GROUP BY source_type, source_producer');
  });

  it('selects distinct payload schema refs', () => {
    const sql = buildPayloadSchemaRefsQuery("req'2");
    expect(sql).toContain("request_id = 'req''2'");
    expect(sql).toContain('DISTINCT payload_schema_ref');
  });

  it('builds bootstrap DDL statements', () => {
    expect(buildCreateDatabaseDdl()).toContain('CREATE DATABASE IF NOT EXISTS');
    expect(buildCreateTableDdl()).toContain('CREATE EXTERNAL TABLE IF NOT EXISTS osint_cube');
    expect(buildCreateTableDdl()).toContain('PARTITIONED BY');
  });
});
