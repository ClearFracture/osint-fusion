import { describe, expect, it } from 'vitest';
import { appKey, s3Uri } from './env';

describe('env helpers', () => {
  it('builds app keys under prefix', () => {
    expect(appKey('registry/requests.json')).toContain('osint-fusion-app/registry/requests.json');
  });

  it('builds s3 uri', () => {
    expect(s3Uri('requests/abc/cube/data/')).toMatch(/^s3:\/\//);
    expect(s3Uri('requests/abc/cube/data/')).toContain('requests/abc/cube/data/');
  });
});
