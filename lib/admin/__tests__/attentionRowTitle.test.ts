import { describe, expect, it } from 'vitest';
import { attentionRowTitle } from '../attentionRowTitle';

describe('attentionRowTitle', () => {
  it('includes service, property, and date', () => {
    expect(
      attentionRowTitle({
        serviceType: 'Turnover',
        propertyName: 'Lakeside cabin',
        dateLabel: 'Nov 20',
      })
    ).toBe('Turnover · Lakeside cabin · Nov 20');
  });

  it('avoids duplicating when property equals service', () => {
    expect(
      attentionRowTitle({
        serviceType: 'Deep clean',
        propertyName: 'Deep clean',
        dateLabel: 'Nov 16',
      })
    ).toBe('Deep clean · Nov 16');
  });

  it('falls back to customer name when property is missing', () => {
    expect(
      attentionRowTitle({
        serviceType: 'Turnover',
        customerName: 'Fern Hill',
        dateLabel: 'Nov 18',
      })
    ).toBe('Turnover · Fern Hill · Nov 18');
  });
});
