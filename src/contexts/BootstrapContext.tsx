import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { bootstrapInfrastructure, type BootstrapResult } from '../lib/bootstrap/bootstrapService';
import { useAwsCredentials } from './AwsCredentialsContext';

interface BootstrapContextValue {
  result: BootstrapResult | null;
  running: boolean;
  rerun: () => Promise<void>;
}

const BootstrapContext = createContext<BootstrapContextValue | null>(null);

export function BootstrapProvider({ children }: { children: ReactNode }) {
  const { s3Client, athenaClient, identityArn } = useAwsCredentials();
  const [result, setResult] = useState<BootstrapResult | null>(null);
  const [running, setRunning] = useState(false);

  const rerun = useCallback(async () => {
    if (!s3Client || !athenaClient) {
      return;
    }
    setRunning(true);
    try {
      const bootstrapResult = await bootstrapInfrastructure(s3Client, athenaClient);
      setResult(bootstrapResult);
    } finally {
      setRunning(false);
    }
  }, [s3Client, athenaClient]);

  useEffect(() => {
    if (!s3Client || !athenaClient || !identityArn) {
      return;
    }
    void rerun();
  }, [s3Client, athenaClient, identityArn, rerun]);

  const value = useMemo(() => ({ result, running, rerun }), [result, running, rerun]);

  return <BootstrapContext.Provider value={value}>{children}</BootstrapContext.Provider>;
}

export function useBootstrap(): BootstrapContextValue {
  const context = useContext(BootstrapContext);
  if (!context) {
    throw new Error('useBootstrap must be used within BootstrapProvider');
  }
  return context;
}
