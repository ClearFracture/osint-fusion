import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';

export interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  region: string;
}

const STORAGE_KEY = 'osint-fusion-aws-credentials';
const CLEARED_KEY = 'osint-fusion-credentials-cleared';

export function areEnvCredentialsConfigured(): boolean {
  const accessKeyId = import.meta.env.VITE_AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY?.trim();
  return Boolean(accessKeyId && secretAccessKey);
}

/** Read AWS credentials from Vite environment variables (.env). */
export function loadEnvCredentials(): AwsCredentials | null {
  const accessKeyId = import.meta.env.VITE_AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY?.trim();
  if (!accessKeyId || !secretAccessKey) {
    return null;
  }
  return {
    accessKeyId,
    secretAccessKey,
    sessionToken: import.meta.env.VITE_AWS_SESSION_TOKEN?.trim() || undefined,
    region: import.meta.env.VITE_AWS_REGION?.trim() || 'us-east-1',
  };
}

export function areCredentialsCleared(): boolean {
  return sessionStorage.getItem(CLEARED_KEY) === 'true';
}

export function markCredentialsCleared(): void {
  sessionStorage.setItem(CLEARED_KEY, 'true');
}

export function clearCredentialsClearedFlag(): void {
  sessionStorage.removeItem(CLEARED_KEY);
}

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

/**
 * Resolve credentials: session (manual entry) first, then .env unless user cleared credentials.
 */
export function resolveAvailableCredentials(): AwsCredentials | null {
  const stored = loadStoredCredentials();
  if (stored) {
    return stored;
  }
  if (areCredentialsCleared()) {
    return null;
  }
  return loadEnvCredentials();
}

/** True when active credentials come from .env rather than session/manual entry. */
export function isUsingEnvCredentials(credentials: AwsCredentials | null): boolean {
  if (!credentials || areCredentialsCleared() || loadStoredCredentials()) {
    return false;
  }
  const env = loadEnvCredentials();
  if (!env) {
    return false;
  }
  return (
    credentials.accessKeyId === env.accessKeyId &&
    credentials.secretAccessKey === env.secretAccessKey &&
    (credentials.sessionToken ?? '') === (env.sessionToken ?? '') &&
    credentials.region === env.region
  );
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
