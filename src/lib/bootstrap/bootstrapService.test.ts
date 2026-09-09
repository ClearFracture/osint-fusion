import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bootstrapInfrastructure } from './bootstrapService';
import * as s3Repository from '../aws/s3Repository';
import * as athenaRepository from '../aws/athenaRepository';

describe('bootstrapInfrastructure', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('creates missing S3 registry and schema files', async () => {
    vi.spyOn(s3Repository, 'getJsonObject').mockResolvedValue(null);
    const putMock = vi.spyOn(s3Repository, 'putJsonObject').mockResolvedValue();
    vi.spyOn(athenaRepository, 'executeDdl').mockResolvedValue();

    const result = await bootstrapInfrastructure({} as never, {} as never);

    expect(putMock).toHaveBeenCalled();
    expect(result.created).toContain('registry/requests.json');
    expect(result.created).toContain('registry/schemas/index.json');
    expect(result.errors).toEqual([]);
  });

  it('skips existing S3 objects', async () => {
    vi.spyOn(s3Repository, 'getJsonObject').mockResolvedValue({ version: 1, requests: [] });
    vi.spyOn(s3Repository, 'putJsonObject').mockResolvedValue();
    vi.spyOn(athenaRepository, 'executeDdl').mockResolvedValue();

    const result = await bootstrapInfrastructure({} as never, {} as never);

    expect(result.skipped).toContain('registry/requests.json');
    expect(s3Repository.putJsonObject).not.toHaveBeenCalled();
  });
});
