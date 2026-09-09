import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Panel } from '../components/Panel';
import { StatusBadge } from '../components/StatusBadge';
import { useAwsCredentials } from '../contexts/AwsCredentialsContext';
import { checkCubeReadiness } from '../lib/readiness';
import {
  loadRequest,
  saveRequestStatus,
  updateRegistryRecordCount,
} from '../lib/requestService';
import { loadCubeSchema } from '../lib/schemaService';
import { ConnectTab } from './request-detail/ConnectTab';
import { OverviewTab } from './request-detail/OverviewTab';
import { SourcesTab } from './request-detail/SourcesTab';

type Tab = 'overview' | 'sources' | 'connect';

export function RequestDetailPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const { s3Client } = useAwsCredentials();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  const requestQuery = useQuery({
    queryKey: ['request', requestId],
    queryFn: () => loadRequest(s3Client!, requestId!),
    enabled: Boolean(s3Client && requestId),
  });

  const request = requestQuery.data;
  const isReady = request?.status === 'ready';

  async function handleRefreshStatus() {
    if (!s3Client || !request) return;
    setRefreshing(true);
    setRefreshMessage(null);
    try {
      const readiness = await checkCubeReadiness(s3Client, request.request_id, request.status);
      await saveRequestStatus(s3Client, request, readiness.status);

      if (readiness.status === 'ready') {
        const schema = await loadCubeSchema(s3Client, request.request_id);
        if (schema) {
          await updateRegistryRecordCount(
            s3Client,
            request.request_id,
            schema.total_records,
            'ready',
          );
        }
      }

      if (readiness.manifest?.status === 'failed') {
        setRefreshMessage(readiness.manifest.error_message ?? 'Pipeline reported failure.');
      } else if (readiness.status === 'ready') {
        setRefreshMessage('Data cube is ready.');
      } else {
        setRefreshMessage('Cube not ready yet — Belvedere may still be building.');
      }

      await queryClient.invalidateQueries({ queryKey: ['request', requestId] });
      await queryClient.invalidateQueries({ queryKey: ['registry'] });
    } catch (err) {
      setRefreshMessage(err instanceof Error ? err.message : 'Refresh failed.');
    } finally {
      setRefreshing(false);
    }
  }

  if (requestQuery.isLoading) return <p className="text-tactical-muted">Loading request…</p>;
  if (!request) return <p className="text-red-300">Request not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/" className="text-sm text-tactical-muted hover:text-tactical-gold">
            ← Catalog
          </Link>
          <h1 className="mt-2 font-display text-2xl font-bold text-tactical-gold">
            {request.topic.narrative?.slice(0, 80) ?? 'Collection Request'}
          </h1>
          <p className="text-sm text-tactical-muted">ID: {request.request_id}</p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <Panel title="Mission Status">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleRefreshStatus}
            disabled={refreshing}
            className="rounded border border-tactical-gold px-4 py-2 text-tactical-gold hover:bg-tactical-gold/10 disabled:opacity-50"
          >
            {refreshing ? 'Checking…' : 'Refresh readiness'}
          </button>
          <Link
            to={`/requests/${request.request_id}/handoff`}
            className="rounded border border-tactical-border px-4 py-2 hover:border-tactical-gold"
          >
            Belvedere handoff
          </Link>
        </div>
        {refreshMessage && <p className="mt-3 text-sm text-tactical-muted">{refreshMessage}</p>}
        {!isReady && (
          <p className="mt-3 text-sm text-tactical-muted">
            Exploration tabs unlock when the data cube is ready.
          </p>
        )}
      </Panel>

      {isReady && (
        <>
          <div className="flex gap-2 border-b border-tactical-border">
            {(['overview', 'sources', 'connect'] as Tab[]).map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setTab(name)}
                className={`px-4 py-2 font-display text-sm uppercase tracking-wide ${
                  tab === name
                    ? 'border-b-2 border-tactical-gold text-tactical-gold'
                    : 'text-tactical-muted hover:text-tactical-text'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
          {tab === 'overview' && <OverviewTab requestId={request.request_id} />}
          {tab === 'sources' && <SourcesTab requestId={request.request_id} />}
          {tab === 'connect' && <ConnectTab requestId={request.request_id} />}
        </>
      )}
    </div>
  );
}
