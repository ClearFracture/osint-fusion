import { Panel } from './Panel';
import { GeofenceMap } from './GeofenceMap';
import { isoToDatetimeLocal } from '../lib/dateTimeLocal';
import { CANONICAL_SOURCE_TYPES, SOURCE_TYPE_LABELS, type SourceType } from '../types/cube';
import type { CollectionTopic, GeoJsonGeometry, TopicTimeRange } from '../types/request';

interface RequestTopicPanelsProps {
  narrative: string;
  geofence?: GeoJsonGeometry;
  timeRange: TopicTimeRange;
  sourceTypes: SourceType[];
  readOnly?: boolean;
  onNarrativeChange?: (value: string) => void;
  onGeofenceChange?: (value: GeoJsonGeometry | undefined) => void;
  onTimeRangeChange?: (value: TopicTimeRange) => void;
  onSourceTypesChange?: (value: SourceType[]) => void;
}

/** Topic narrative, geofence, time range, and optional source types — shared by create and detail views. */
export function RequestTopicPanels({
  narrative,
  geofence,
  timeRange,
  sourceTypes,
  readOnly = false,
  onNarrativeChange,
  onGeofenceChange,
  onTimeRangeChange,
  onSourceTypesChange,
}: RequestTopicPanelsProps) {
  const startValue = timeRange.start;
  const endValue = timeRange.end;

  function toggleSourceType(sourceType: SourceType) {
    if (readOnly || !onSourceTypesChange) {
      return;
    }
    if (sourceTypes.includes(sourceType)) {
      onSourceTypesChange(sourceTypes.filter((type) => type !== sourceType));
      return;
    }
    onSourceTypesChange([...sourceTypes, sourceType]);
  }

  return (
    <>
      <Panel title="1 — Topic / Question Narrative">
        {readOnly ? (
          <textarea
            readOnly
            value={narrative || '(not provided)'}
            rows={4}
            className="input-tactical mt-0 cursor-default resize-none opacity-90"
          />
        ) : (
          <>
            <textarea
              value={narrative}
              onChange={(e) => onNarrativeChange?.(e.target.value)}
              rows={4}
              required
              placeholder="Describe the intelligence question or collection topic…"
              className="input-tactical mt-0 resize-y"
            />
            <p className="mt-2 text-sm text-tactical-muted">Required.</p>
          </>
        )}
      </Panel>

      <Panel title="2 — Geofence (optional)">
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

      <Panel title="3 — Time Range (optional)">
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

      <Panel title="4 — Source Types (optional)">
        {readOnly ? (
          sourceTypes.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {sourceTypes.map((sourceType) => (
                <li
                  key={sourceType}
                  className="rounded border border-tactical-border px-3 py-1 text-sm"
                >
                  {SOURCE_TYPE_LABELS[sourceType]}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-tactical-muted">(not specified — any source type)</p>
          )
        ) : (
          <>
            <p className="mb-3 text-sm text-tactical-muted">
              Limit collection to specific source categories, or leave unselected for any type.
            </p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {CANONICAL_SOURCE_TYPES.map((sourceType) => {
                const selected = sourceTypes.includes(sourceType);
                return (
                  <li key={sourceType}>
                    <label className="flex cursor-pointer items-center gap-3 rounded border border-tactical-border px-3 py-2 hover:border-tactical-gold/60">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSourceType(sourceType)}
                        className="h-4 w-4 accent-tactical-gold"
                      />
                      <span className="text-sm">{SOURCE_TYPE_LABELS[sourceType]}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Panel>
    </>
  );
}

export function topicToPanelState(topic: CollectionTopic): {
  narrative: string;
  geofence?: GeoJsonGeometry;
  timeRange: TopicTimeRange;
  sourceTypes: SourceType[];
} {
  return {
    narrative: topic.narrative ?? '',
    geofence: topic.geofence,
    timeRange: {
      start: topic.time_range?.start ? isoToDatetimeLocal(topic.time_range.start) : '',
      end: topic.time_range?.end ? isoToDatetimeLocal(topic.time_range.end) : '',
    },
    sourceTypes: topic.source_types ?? [],
  };
}
