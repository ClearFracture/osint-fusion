import { describe, expect, it } from 'vitest';
import { hasTopicContent, topicSummary } from './topicValidation';

describe('topicValidation', () => {
  it('requires topic / question narrative', () => {
    expect(hasTopicContent({})).toBe(false);
    expect(hasTopicContent({ narrative: '   ' })).toBe(false);
    expect(hasTopicContent({ narrative: 'hello' })).toBe(true);
    expect(
      hasTopicContent({
        geofence: { type: 'Polygon', coordinates: [] },
      }),
    ).toBe(false);
    expect(
      hasTopicContent({
        time_range: { start: '2026-01-01', end: '2026-02-01' },
      }),
    ).toBe(false);
    expect(hasTopicContent({ source_types: ['SocialMedia'] })).toBe(false);
  });

  it('builds topic summary from narrative', () => {
    expect(topicSummary({ narrative: 'Short topic' })).toBe('Short topic');
  });

  it('builds topic summary from source types when narrative missing', () => {
    expect(topicSummary({ source_types: ['Infrastructure', 'SocialMedia'] })).toBe(
      'Infrastructure, Social Media',
    );
  });
});
