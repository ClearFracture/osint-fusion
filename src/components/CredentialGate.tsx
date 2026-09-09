import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConfig } from '../config/env';
import { useAwsCredentials } from '../contexts/AwsCredentialsContext';
import { Panel } from './Panel';

export function CredentialGate() {
  const { login } = useAwsCredentials();
  const navigate = useNavigate();
  const config = getConfig();
  const [accessKeyId, setAccessKeyId] = useState('');
  const [secretAccessKey, setSecretAccessKey] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [region, setRegion] = useState(config.region);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({
        accessKeyId: accessKeyId.trim(),
        secretAccessKey: secretAccessKey.trim(),
        sessionToken: sessionToken.trim() || undefined,
        region: region.trim() || config.region,
      });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credential validation failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-tactical-bg px-4 py-12 font-body text-tactical-text">
      <div className="mx-auto max-w-lg">
        <header className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold tracking-wide text-tactical-gold">
            OSINT-FUSION
          </h1>
          <p className="mt-1 text-sm text-tactical-muted">Establish AWS Link</p>
        </header>
        <Panel title="Credentials">
          <p className="mb-4 text-sm text-tactical-muted">
            Provide credentials with access to{' '}
            <code className="text-tactical-gold">cf-hackathon/osint-fusion-app</code>. Credentials
            are stored in this browser tab session only.
          </p>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm text-tactical-text">
              Access Key ID
              <input
                required
                value={accessKeyId}
                onChange={(e) => setAccessKeyId(e.target.value)}
                className="input-tactical"
                autoComplete="off"
              />
            </label>
            <label className="block text-sm text-tactical-text">
              Secret Access Key
              <input
                required
                type="password"
                value={secretAccessKey}
                onChange={(e) => setSecretAccessKey(e.target.value)}
                className="input-tactical"
                autoComplete="off"
              />
            </label>
            <label className="block text-sm text-tactical-text">
              Session Token (optional)
              <input
                value={sessionToken}
                onChange={(e) => setSessionToken(e.target.value)}
                className="input-tactical"
                autoComplete="off"
              />
            </label>
            <label className="block text-sm text-tactical-text">
              Region
              <input
                required
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="input-tactical"
                autoComplete="off"
              />
            </label>
            {error && <p className="text-sm text-red-300">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-tactical-gold px-4 py-2 font-display font-semibold text-tactical-bg hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Verifying…' : 'Authenticate'}
            </button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
