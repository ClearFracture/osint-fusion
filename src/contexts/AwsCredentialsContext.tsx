import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { S3Client } from '@aws-sdk/client-s3';
import type { AthenaClient } from '@aws-sdk/client-athena';
import {
  areEnvCredentialsConfigured,
  clearCredentialsClearedFlag,
  clearStoredCredentials,
  loadEnvCredentials,
  isUsingEnvCredentials,
  markCredentialsCleared,
  resolveAvailableCredentials,
  storeCredentials,
  validateCredentials,
  type AwsCredentials,
} from '../lib/aws/credentials';
import { createAthenaClient } from '../lib/aws/athenaRepository';
import { createS3Client } from '../lib/aws/s3Repository';

export type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';

interface AwsCredentialsContextValue {
  credentials: AwsCredentials | null;
  identityArn: string | null;
  authStatus: AuthStatus;
  credentialsFromEnv: boolean;
  envCredentialsAvailable: boolean;
  s3Client: S3Client | null;
  athenaClient: AthenaClient | null;
  login: (credentials: AwsCredentials) => Promise<void>;
  restoreFromEnvironment: () => Promise<void>;
  logout: () => void;
}

const AwsCredentialsContext = createContext<AwsCredentialsContextValue | null>(null);

export function AwsCredentialsProvider({ children }: { children: ReactNode }) {
  const initialCredentials = resolveAvailableCredentials();
  const [credentials, setCredentials] = useState<AwsCredentials | null>(initialCredentials);
  const [identityArn, setIdentityArn] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>(
    initialCredentials ? 'checking' : 'unauthenticated',
  );
  const [credentialsFromEnv, setCredentialsFromEnv] = useState(() =>
    isUsingEnvCredentials(initialCredentials),
  );

  const applyCredentials = useCallback(
    async (next: AwsCredentials, options: { persist: boolean; fromEnv: boolean }) => {
      const arn = await validateCredentials(next);
      if (options.persist) {
        storeCredentials(next);
      } else {
        clearStoredCredentials();
      }
      clearCredentialsClearedFlag();
      setCredentials(next);
      setIdentityArn(arn);
      setCredentialsFromEnv(options.fromEnv);
      setAuthStatus('authenticated');
    },
    [],
  );

  const login = useCallback(
    async (next: AwsCredentials) => {
      setAuthStatus('checking');
      await applyCredentials(next, { persist: true, fromEnv: false });
    },
    [applyCredentials],
  );

  const restoreFromEnvironment = useCallback(async () => {
    const envCredentials = loadEnvCredentials();
    if (!envCredentials) {
      throw new Error('AWS credentials are not configured in the environment.');
    }
    setAuthStatus('checking');
    await applyCredentials(envCredentials, { persist: false, fromEnv: true });
  }, [applyCredentials]);

  const logout = useCallback(() => {
    clearStoredCredentials();
    setCredentials(null);
    setIdentityArn(null);
    setCredentialsFromEnv(false);
    if (areEnvCredentialsConfigured()) {
      markCredentialsCleared();
    }
    setAuthStatus('unauthenticated');
  }, []);

  useEffect(() => {
    if (!credentials || identityArn) {
      return;
    }

    let cancelled = false;
    validateCredentials(credentials)
      .then((arn) => {
        if (cancelled) return;
        setIdentityArn(arn);
        setAuthStatus('authenticated');
      })
      .catch(() => {
        if (cancelled) return;
        clearStoredCredentials();
        setCredentials(null);
        setIdentityArn(null);
        setCredentialsFromEnv(false);
        setAuthStatus('unauthenticated');
      });

    return () => {
      cancelled = true;
    };
  }, [credentials, identityArn]);

  const s3Client = useMemo(
    () => (credentials && authStatus === 'authenticated' ? createS3Client(credentials) : null),
    [credentials, authStatus],
  );
  const athenaClient = useMemo(
    () => (credentials && authStatus === 'authenticated' ? createAthenaClient(credentials) : null),
    [credentials, authStatus],
  );

  const value = useMemo(
    () => ({
      credentials,
      identityArn,
      authStatus,
      credentialsFromEnv,
      envCredentialsAvailable: areEnvCredentialsConfigured(),
      s3Client,
      athenaClient,
      login,
      restoreFromEnvironment,
      logout,
    }),
    [
      credentials,
      identityArn,
      authStatus,
      credentialsFromEnv,
      s3Client,
      athenaClient,
      login,
      restoreFromEnvironment,
      logout,
    ],
  );

  return (
    <AwsCredentialsContext.Provider value={value}>{children}</AwsCredentialsContext.Provider>
  );
}

export function useAwsCredentials(): AwsCredentialsContextValue {
  const context = useContext(AwsCredentialsContext);
  if (!context) {
    throw new Error('useAwsCredentials must be used within AwsCredentialsProvider');
  }
  return context;
}
