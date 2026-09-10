import { SOURCE_TYPE_LABELS } from '../types/cube';
import type { NewRequestInput } from '../types/request';

/** Returns true when the required topic / question narrative is populated. */
export function hasTopicContent(topic: NewRequestInput): boolean {
  return Boolean(topic.narrative?.trim());
}

/** Short summary for registry display. */
export function topicSummary(topic: NewRequestInput): string {
  if (topic.narrative?.trim()) {
    const text = topic.narrative.trim();
    return text.length > 80 ? `${text.slice(0, 77)}...` : text;
  }
  if (topic.geofence) {
    return `Geofence (${topic.geofence.type})`;
  }
  if (topic.time_range) {
    return `${topic.time_range.start} → ${topic.time_range.end}`;
  }
  if (topic.source_types && topic.source_types.length > 0) {
    return topic.source_types.map((type) => SOURCE_TYPE_LABELS[type] ?? type).join(', ');
  }
  return 'Untitled collection request';
}
