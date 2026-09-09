import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Panel } from '../components/Panel';
import { getConfig } from '../config/env';
import { useAwsCredentials } from '../contexts/AwsCredentialsContext';
import { buildAgentMessage } from '../lib/belvedereMessage';
import { loadRequest } from '../lib/requestService';

export function BelvedereHandoffPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const { s3Client } = useAwsCredentials();
  const { belvederePipelineUrl } = getConfig();

  const { data: request, isLoading, error } = useQuery({
    queryKey: ['request', requestId],
    queryFn: () => loadRequest(s3Client!, requestId!),
    enabled: Boolean(s3Client && requestId),
  });

  async function copyMessage() {
    if (!request) return;
    await navigator.clipboard.writeText(buildAgentMessage(request));
  }

  if (isLoading) return <p className="text-tactical-muted">Loading…</p>;
  if (error || !request) {
    return <p className="text-red-300">Request not found.</p>;
  }

  const message = buildAgentMessage(request);

  return (
    <div className="space-y-6">
      <div>
        <Link to={`/requests/${requestId}`} className="text-sm text-tactical-muted hover:text-tactical-gold">
          ← Request detail
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold text-tactical-gold">Belvedere Handoff</h1>
        <p className="text-tactical-muted">Request ID: {request.request_id}</p>
      </div>

      <Panel title="Pipeline Link">
        {belvederePipelineUrl ? (
          <a
            href={belvederePipelineUrl}
            target="_blank"
            rel="noreferrer"
            className="break-all text-tactical-gold underline"
          >
            Open Belvedere pipeline
          </a>
        ) : (
          <p className="text-amber-200">Set VITE_BELVEDERE_PIPELINE_URL in your environment.</p>
        )}
      </Panel>

      <Panel title="Agent Message">
        <p className="mb-3 text-sm text-tactical-muted">
          Copy this message into the Belvedere pipeline chat.
        </p>
        <pre className="max-h-96 overflow-auto rounded border border-tactical-border bg-tactical-bg p-4 text-xs whitespace-pre-wrap">
          {message}
        </pre>
        <button
          type="button"
          onClick={copyMessage}
          className="mt-4 rounded border border-tactical-gold px-4 py-2 text-tactical-gold hover:bg-tactical-gold/10"
        >
          Copy to clipboard
        </button>
      </Panel>
    </div>
  );
}
