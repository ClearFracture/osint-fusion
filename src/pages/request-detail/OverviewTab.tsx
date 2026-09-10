import { useQuery } from '@tanstack/react-query';
import { Panel } from '../../components/Panel';
import { sourceTypeLabel } from '../../types/cube';
import { useAwsCredentials } from '../../contexts/AwsCredentialsContext';
import {
  buildOverviewQuery,
  buildSourceBreakdownQuery,
  runQuery,
} from '../../lib/aws/athenaRepository';

export function OverviewTab({ requestId }: { requestId: string }) {
  const { athenaClient } = useAwsCredentials();

  const metricsQuery = useQuery({
    queryKey: ['overview-metrics', requestId],
    queryFn: async () => {
      const rows = await runQuery(athenaClient!, buildOverviewQuery(requestId));
      return rows[0] ?? {};
    },
    enabled: Boolean(athenaClient),
    retry: false,
  });

  const breakdownQuery = useQuery({
    queryKey: ['source-breakdown', requestId],
    queryFn: () => runQuery(athenaClient!, buildSourceBreakdownQuery(requestId)),
    enabled: Boolean(athenaClient),
    retry: false,
  });

  const totalRecords = metricsQuery.data?.total_records ?? '—';
  const sourceTypeCount = metricsQuery.data?.source_type_count ?? '—';
  const producerCount = metricsQuery.data?.producer_count ?? '—';
  const breakdown = breakdownQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricTile label="Total Records" value={totalRecords} />
        <MetricTile label="Source Types" value={sourceTypeCount} />
        <MetricTile label="Producers" value={producerCount} />
      </div>

      {metricsQuery.isError && (
        <p className="text-sm text-amber-200">
          Athena unavailable — metrics require the osint_cube table and registered Glue partitions
          for this request.
        </p>
      )}

      <Panel title="Records by Source Type">
        {breakdown.length === 0 ? (
          <p className="text-tactical-muted">No breakdown data available.</p>
        ) : (
          <ul className="space-y-2">
            {breakdown.map((row) => {
              const label = sourceTypeLabel(row.source_type ?? '');
              const count = row.record_count ?? '0';
              const max = Math.max(...breakdown.map((r) => Number(r.record_count ?? 0)), 1);
              const width = `${(Number(count) / max) * 100}%`;
              return (
                <li key={row.source_type}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{label}</span>
                    <span className="text-tactical-muted">{count}</span>
                  </div>
                  <div className="h-2 rounded bg-tactical-bg">
                    <div className="h-2 rounded bg-tactical-gold" style={{ width }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-tactical-border bg-tactical-panel/80 p-4 text-center">
      <p className="font-display text-2xl font-bold text-tactical-gold">{value}</p>
      <p className="text-xs uppercase tracking-wide text-tactical-muted">{label}</p>
    </div>
  );
}
