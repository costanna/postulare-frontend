import { toIsoDate, todayIso } from './iso-date';

describe('iso-date', () => {
  it('formats a local date without shifting the day (no UTC conversion)', () => {
    expect(toIsoDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(toIsoDate(new Date(2026, 11, 31, 0, 0))).toBe('2026-12-31');
  });

  it('todayIso() matches the local calendar day', () => {
    expect(todayIso()).toBe(toIsoDate(new Date()));
  });
});
