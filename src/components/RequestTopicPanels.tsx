import { Panel } from './Panel';
import { GeofenceMap } from './GeofenceMap';
import { isoToDatetimeLocal } from '../lib/dateTimeLocal';
import type { CollectionTopic, GeoJsonGeometry, TopicTimeRange } from '../types/request';

interface RequestTopicPanelsProps {
  narrative: string;
  geofence?: GeoJsonGeometry;
  timeRange: TopicTimeRange;
  readOnly?: boolean;
  onNarrativeChange?: (value: string) => void;
  onGeofenceChange?: (value: GeoJsonGeometry | undefined) => void;
  onTimeRangeChange?: (value: TopicTimeRange) => void;
}

/** Topic narrative, geofence map, and time range — shared by create and detail views. */
export function RequestTopicPanels({
  narrative,
  geofence,
  timeRange,
  readOnly = false,
  onNarrativeChange,
  onGeofenceChange,
  onTimeRangeChange,
}: RequestTopicPanelsProps) {
  const startValue = timeRange.start;
  const endValue = timeRange.end;

  return (
    <>
      <Panel title="1 — Topic Narrative">
        {readOnly ? (
          <textarea
            readOnly
            value={narrative || '(not provided)'}
            rows={4}
            className="input-tactical mt-0 cursor-default resize-none opacity-90"
          />
        ) : (
          <textarea
            value={narrative}
            onChange={(e) => onNarrativeChange?.(e.target.value)}
            rows={4}
            placeholder="Describe the collection requirement…"
            className="input-tactical mt-0 resize-y"
          />
        )}
      </Panel>

      <Panel title="2 — Geofence">
        {readOnly ? (
          geofence ? (
            <GeofenceMap value={geofence} readOnly />
          ) : (
            <p className="text-sm text-tactical-muted">(not provided)</p>
          )
        ) : (
          <>
            <p className="mb-3 text-sm text-tactical-muted">
              Draw a polygon or rectangle on the map.
            </p>
            <GeofenceMap onChange={onGeofenceChange} />
          </>
        )}
      </Panel>

      <Panel title="3 — Time Range">
        {readOnly && !timeRange.start && !timeRange.end ? (
          <p className="text-sm text-tactical-muted">(not provided)</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-tactical-text">
              Start
              <input
                type="datetime-local"
                readOnly={readOnly}
                value={startValue}
                onChange={(e) =>
                  onTimeRangeChange?.({ ...timeRange, start: e.target.value })
                }
                className={`input-tactical ${readOnly ? 'cursor-default opacity-90' : ''}`}
              />
            </label>
            <label className="text-sm text-tactical-text">
              End
              <input
                type="datetime-local"
                readOnly={readOnly}
                value={endValue}
                onChange={(e) => onTimeRangeChange?.({ ...timeRange, end: e.target.value })}
                className={`input-tactical ${readOnly ? 'cursor-default opacity-90' : ''}`}
              />
            </label>
          </div>
        )}
      </Panel>
    </>
  );
}

export function topicToPanelState(topic: CollectionTopic): {
  narrative: string;
  geofence?: GeoJsonGeometry;
  timeRange: TopicTimeRange;
} {
  return {
    narrative: topic.narrative ?? '',
    geofence: topic.geofence,
    timeRange: {
      start: topic.time_range?.start ? isoToDatetimeLocal(topic.time_range.start) : '',
      end: topic.time_range?.end ? isoToDatetimeLocal(topic.time_range.end) : '',
    },
  };
}
