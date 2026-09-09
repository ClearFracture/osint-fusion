import type { NewRequestInput } from '../types/request';

/** Returns true when at least one topic field is populated. */
export function hasTopicContent(topic: NewRequestInput): boolean {
  const hasNarrative = Boolean(topic.narrative?.trim());
  const hasGeofence = Boolean(topic.geofence);
  const hasTimeRange = Boolean(topic.time_range?.start && topic.time_range?.end);
  return hasNarrative || hasGeofence || hasTimeRange;
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
  return 'Untitled collection request';
}
