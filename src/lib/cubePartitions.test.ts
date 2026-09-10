import { describe, expect, it } from 'vitest';
import { buildAddPartitionDdl, parseCubePartitionsFromKeys } from './cubePartitions';

describe('cubePartitions', () => {
  it('parses source_type and source_producer from parquet keys', () => {
    const partitions = parseCubePartitionsFromKeys('req-1', [
      'requests/req-1/cube/data/source_type=SocialMedia/source_producer=BlueSky/part-0.parquet',
      'requests/req-1/cube/data/source_type=SocialMedia/source_producer=BlueSky/part-1.parquet',
      'requests/req-1/cube/data/source_type=Infrastructure/source_producer=OpenStreetMap/part-0.parquet',
    ]);

    expect(partitions).toHaveLength(2);
    expect(partitions[0]).toMatchObject({
      requestId: 'req-1',
      sourceType: 'Infrastructure',
      sourceProducer: 'OpenStreetMap',
    });
    expect(partitions[1]).toMatchObject({
      sourceType: 'SocialMedia',
      sourceProducer: 'BlueSky',
    });
  });

  it('builds ADD PARTITION DDL with explicit location', () => {
    const ddl = buildAddPartitionDdl({
      requestId: "req'1",
      sourceType: 'SocialMedia',
      sourceProducer: 'BlueSky',
      relativeLocation:
        'requests/req-1/cube/data/source_type=SocialMedia/source_producer=BlueSky/',
    });

    expect(ddl).toContain("request_id='req''1'");
    expect(ddl).toContain("source_type='SocialMedia'");
    expect(ddl).toContain('ADD IF NOT EXISTS PARTITION');
    expect(ddl).toContain(
      "LOCATION 's3://cf-hackathon/osint-fusion-app/requests/req-1/cube/data/source_type=SocialMedia/source_producer=BlueSky/'",
    );
  });
});
