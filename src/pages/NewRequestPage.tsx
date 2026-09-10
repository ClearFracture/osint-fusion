import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { RequestTopicPanels } from '../components/RequestTopicPanels';
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
            ? {
                start: new Date(timeRange.start).toISOString(),
                end: new Date(timeRange.end).toISOString(),
              }
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

      <RequestTopicPanels
        narrative={narrative}
        geofence={geofence}
        timeRange={timeRange}
        onNarrativeChange={setNarrative}
        onGeofenceChange={setGeofence}
        onTimeRangeChange={setTimeRange}
      />

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
