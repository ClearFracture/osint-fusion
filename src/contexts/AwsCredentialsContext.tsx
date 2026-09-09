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
  clearStoredCredentials,
  loadStoredCredentials,
  storeCredentials,
  validateCredentials,
  type AwsCredentials,
} from '../lib/aws/credentials';
import { createAthenaClient } from '../lib/aws/athenaRepository';
import { createS3Client } from '../lib/aws/s3Repository';

interface AwsCredentialsContextValue {
  credentials: AwsCredentials | null;
  identityArn: string | null;
  s3Client: S3Client | null;
  athenaClient: AthenaClient | null;
  login: (credentials: AwsCredentials) => Promise<void>;
  logout: () => void;
}

const AwsCredentialsContext = createContext<AwsCredentialsContextValue | null>(null);

export function AwsCredentialsProvider({ children }: { children: ReactNode }) {
  const [credentials, setCredentials] = useState<AwsCredentials | null>(() =>
    loadStoredCredentials(),
  );
  const [identityArn, setIdentityArn] = useState<string | null>(null);

  const login = useCallback(async (next: AwsCredentials) => {
    const arn = await validateCredentials(next);
    storeCredentials(next);
    setCredentials(next);
    setIdentityArn(arn);
  }, []);

  const logout = useCallback(() => {
    clearStoredCredentials();
    setCredentials(null);
    setIdentityArn(null);
  }, []);

  useEffect(() => {
    if (!credentials || identityArn) {
      return;
    }
    validateCredentials(credentials)
      .then(setIdentityArn)
      .catch(() => {
        clearStoredCredentials();
        setCredentials(null);
      });
  }, [credentials, identityArn]);

  const s3Client = useMemo(
    () => (credentials ? createS3Client(credentials) : null),
    [credentials],
  );
  const athenaClient = useMemo(
    () => (credentials ? createAthenaClient(credentials) : null),
    [credentials],
  );

  const value = useMemo(
    () => ({ credentials, identityArn, s3Client, athenaClient, login, logout }),
    [credentials, identityArn, s3Client, athenaClient, login, logout],
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
