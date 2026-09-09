import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { GeofenceMap } from '../components/GeofenceMap';
import { Panel } from '../components/Panel';
import { useAwsCredentials } from '../contexts/AwsCredentialsContext';
import { createRequest } from '../lib/requestService';
import { hasTopicContent } from '../lib/topicValidation';
import type { GeoJsonGeometry, TopicTimeRange } from '../types/request';

export function NewRequestPage() {
  const { s3Client } = useAwsCredentials();
  const navigate = useNavigate();
  const [narrative, setNarrative] = useState('');
  const [geofence, setGeofence] = useState<GeoJsonGeometry | undefined>();
  const [timeRange, setTimeRange] = useState<TopicTimeRange>({ start: '', end: '' });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const topic = {
        narrative: narrative.trim() || undefined,
        geofence,
        time_range:
          timeRange.start && timeRange.end
            ? { start: new Date(timeRange.start).toISOString(), end: new Date(timeRange.end).toISOString() }
            : undefined,
      };
      if (!hasTopicContent(topic)) {
        throw new Error('Provide at least one of narrative, geofence, or time range.');
      }
      return createRequest(s3Client!, topic);
    },
    onSuccess: (request) => navigate(`/requests/${request.request_id}/handoff`),
    onError: (err) => setError(err instanceof Error ? err.message : 'Failed to create request.'),
  });

  return (
    <div className="space-y-6">
      <div>
        <Link to="/" className="text-sm text-tactical-muted hover:text-tactical-gold">
          ← Back to catalog
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold text-tactical-gold">New Collection Request</h1>
      </div>

      <Panel title="1 — Topic Narrative">
        <textarea
          value={narrative}
          onChange={(e) => setNarrative(e.target.value)}
          rows={4}
          placeholder="Describe the collection requirement…"
          className="w-full rounded border border-tactical-border bg-tactical-bg px-3 py-2"
        />
      </Panel>

      <Panel title="2 — Geofence">
        <p className="mb-3 text-sm text-tactical-muted">Draw a polygon or rectangle on the map.</p>
        <GeofenceMap value={geofence} onChange={setGeofence} />
      </Panel>

      <Panel title="3 — Time Range">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            Start
            <input
              type="datetime-local"
              value={timeRange.start}
              onChange={(e) => setTimeRange((prev) => ({ ...prev, start: e.target.value }))}
              className="mt-1 w-full rounded border border-tactical-border bg-tactical-bg px-3 py-2"
            />
          </label>
          <label className="text-sm">
            End
            <input
              type="datetime-local"
              value={timeRange.end}
              onChange={(e) => setTimeRange((prev) => ({ ...prev, end: e.target.value }))}
              className="mt-1 w-full rounded border border-tactical-border bg-tactical-bg px-3 py-2"
            />
          </label>
        </div>
      </Panel>

      {error && <p className="text-red-300">{error}</p>}

      <button
        type="button"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
        className="rounded bg-tactical-gold px-6 py-2 font-display font-semibold text-tactical-bg hover:opacity-90 disabled:opacity-50"
      >
        {mutation.isPending ? 'Creating…' : 'Submit Collection Request'}
      </button>
    </div>
  );
}
