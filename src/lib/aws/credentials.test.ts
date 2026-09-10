import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  areCredentialsCleared,
  clearCredentialsClearedFlag,
  clearStoredCredentials,
  loadStoredCredentials,
  markCredentialsCleared,
  resolveAvailableCredentials,
  storeCredentials,
  validateCredentials,
} from './credentials';

vi.mock('@aws-sdk/client-sts', () => ({
  STSClient: vi.fn().mockImplementation(() => ({
    send: vi.fn().mockResolvedValue({ Account: '123456789012', Arn: 'arn:aws:iam::123:user/test' }),
  })),
  GetCallerIdentityCommand: vi.fn(),
}));

describe('credentials storage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('stores and loads credentials from session storage', () => {
    const creds = {
      accessKeyId: 'AKIA',
      secretAccessKey: 'secret',
      region: 'us-east-1',
    };
    storeCredentials(creds);
    expect(loadStoredCredentials()).toEqual(creds);
    clearStoredCredentials();
    expect(loadStoredCredentials()).toBeNull();
  });

  it('validates credentials via STS', async () => {
    const arn = await validateCredentials({
      accessKeyId: 'AKIA',
      secretAccessKey: 'secret',
      region: 'us-east-1',
    });
    expect(arn).toContain('arn:aws:iam::123:user/test');
  });

  it('ignores env credentials after user clears credentials', () => {
    markCredentialsCleared();
    expect(areCredentialsCleared()).toBe(true);
    expect(resolveAvailableCredentials()).toBeNull();
    clearCredentialsClearedFlag();
  });
});
