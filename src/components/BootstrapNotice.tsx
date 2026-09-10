import { isLikelyCorsError } from '../lib/aws/corsError';
import { useBootstrap } from '../contexts/BootstrapContext';
import { CorsErrorPanel } from './CorsErrorPanel';

export function BootstrapNotice() {
  const { result, running, rerun } = useBootstrap();

  if (running) {
    return (
      <div className="mb-6 rounded border border-tactical-border bg-tactical-panel/60 px-4 py-3 text-sm text-tactical-muted">
        Initializing S3 registry and Athena catalog…
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const corsFailure = result.errors.some(isLikelyCorsError);

  if (result.errors.length === 0 && result.created.length === 0) {
    return null;
  }

  if (corsFailure) {
    return (
      <div className="mb-6 space-y-3">
        <CorsErrorPanel />
        <button
          type="button"
          onClick={() => void rerun()}
          className="text-sm text-tactical-muted underline hover:text-tactical-gold"
        >
          Retry bootstrap after CORS is configured
        </button>
      </div>
    );
  }

  return (
    <div
      className={`mb-6 rounded border px-4 py-3 text-sm ${
        result.errors.length > 0
          ? 'border-amber-700 bg-amber-900/20 text-amber-100'
          : 'border-tactical-ready/50 bg-tactical-ready/10 text-green-100'
      }`}
    >
      {result.created.length > 0 && (
        <p>
          Created infrastructure: {result.created.join(', ')}.
        </p>
      )}
      {result.errors.length > 0 && (
        <>
          <p className="mt-1">
            Some resources could not be created automatically: {result.errors.join('; ')}
          </p>
          <p className="mt-2">
            See the README section <strong>Manual AWS setup</strong> or retry after updating IAM
            permissions.
          </p>
          <button
            type="button"
            onClick={() => void rerun()}
            className="mt-2 underline hover:text-tactical-gold"
          >
            Retry bootstrap
          </button>
        </>
      )}
    </div>
  );
}
