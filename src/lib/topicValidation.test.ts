import { describe, expect, it } from 'vitest';
import { hasTopicContent, topicSummary } from './topicValidation';

describe('topicValidation', () => {
  it('requires at least one topic field', () => {
    expect(hasTopicContent({})).toBe(false);
    expect(hasTopicContent({ narrative: 'hello' })).toBe(true);
    expect(
      hasTopicContent({
        geofence: { type: 'Polygon', coordinates: [] },
      }),
    ).toBe(true);
    expect(
      hasTopicContent({
        time_range: { start: '2026-01-01', end: '2026-02-01' },
      }),
    ).toBe(true);
  });

  it('builds topic summary from narrative', () => {
    expect(topicSummary({ narrative: 'Short topic' })).toBe('Short topic');
  });
});
