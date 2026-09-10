import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Panel } from '../components/Panel';
import { StatusBadge } from '../components/StatusBadge';
import { useAwsCredentials } from '../contexts/AwsCredentialsContext';
import { isLikelyCorsError } from '../lib/aws/corsError';
import { loadRegistry } from '../lib/requestService';
import { CorsErrorPanel } from '../components/CorsErrorPanel';
import { DeleteRequestButton } from '../components/DeleteRequestButton';

export function LandingPage() {
  const { s3Client } = useAwsCredentials();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['registry'],
    queryFn: () => loadRegistry(s3Client!),
    enabled: Boolean(s3Client),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-tactical-gold">Collection Requests</h1>
          <p className="text-tactical-muted">Select a request to explore its data cube or establish a new collection.</p>
        </div>
        <Link
          to="/requests/new"
          className="rounded bg-tactical-gold px-4 py-2 font-display font-semibold text-tactical-bg hover:opacity-90"
        >
          New Collection Request
        </Link>
      </div>

      <Panel title="Active Requests">
        {isLoading && <p className="text-tactical-muted">Loading registry…</p>}
        {error && isLikelyCorsError(error) && <CorsErrorPanel />}
        {error && !isLikelyCorsError(error) && (
          <p className="text-red-300">
            Failed to load registry: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        )}
        {!isLoading && !error && (data?.requests.length ?? 0) === 0 && (
          <div className="py-8 text-center">
            <p className="text-tactical-muted">No collection requests yet.</p>
            <Link to="/requests/new" className="mt-2 inline-block text-tactical-gold underline">
              Create the first request
            </Link>
          </div>
        )}
        {data && data.requests.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-tactical-border text-tactical-muted">
                <tr>
                  <th className="py-2 pr-4">Topic</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Created</th>
                  <th className="py-2 pr-4">Records</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.requests.map((entry) => (
                  <tr key={entry.request_id} className="border-b border-tactical-border/50">
                    <td className="py-3 pr-4">{entry.topic_summary}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={entry.status} />
                    </td>
                    <td className="py-3 pr-4 text-tactical-muted">
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 pr-4">{entry.record_count ?? '—'}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <Link
                          to={`/requests/${entry.request_id}`}
                          className="text-tactical-gold underline hover:opacity-80"
                        >
                          Open
                        </Link>
                        <DeleteRequestButton
                          requestId={entry.request_id}
                          topicSummary={entry.topic_summary}
                          variant="inline"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 text-sm text-tactical-muted underline hover:text-tactical-gold"
        >
          Refresh list
        </button>
      </Panel>
    </div>
  );
}
