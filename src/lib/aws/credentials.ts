import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';

export interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  region: string;
}

const STORAGE_KEY = 'osint-fusion-aws-credentials';

export function loadStoredCredentials(): AwsCredentials | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AwsCredentials;
  } catch {
    return null;
  }
}

export function storeCredentials(credentials: AwsCredentials): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
}

export function clearStoredCredentials(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

/** Validate credentials by calling STS GetCallerIdentity. */
export async function validateCredentials(credentials: AwsCredentials): Promise<string> {
  const client = new STSClient({
    region: credentials.region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    },
  });

  const response = await client.send(new GetCallerIdentityCommand({}));
  if (!response.Account) {
    throw new Error('Unable to verify AWS credentials.');
  }
  return response.Arn ?? response.Account;
}
