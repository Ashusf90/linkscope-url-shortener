import {
  validateDestination,
  makeAlias,
  summarizeClicks,
  isExpired,
} from '../src/core.js';
test('accepts valid HTTPS destination', () =>
  expect(validateDestination('https://example.com/path')).toBeNull());
test('accepts valid HTTP destination', () =>
  expect(validateDestination('http://example.com')).toBeNull());
test('rejects javascript scheme', () =>
  expect(validateDestination('javascript:alert(1)')).toMatch(/HTTP and HTTPS/));
test('rejects malformed destination', () =>
  expect(validateDestination('not a url')).toMatch(/valid destination/));
test('rejects empty destination', () =>
  expect(validateDestination('')).toMatch(/required/));
test('generates short alias', () => expect(makeAlias()).toMatch(/^[\w-]{7}$/));
test('summarizes total and breakdowns', () => {
  const a = summarizeClicks([
    {
      clickedAt: '2026-10-01T12:00:00Z',
      referrer: 'Direct',
      device: 'Mobile',
      browser: 'Chrome',
    },
    {
      clickedAt: '2026-10-01T13:00:00Z',
      referrer: 'Direct',
      device: 'Desktop',
      browser: 'Firefox',
    },
  ]);
  expect(a.totalClicks).toBe(2);
  expect(a.overTime).toEqual([{ date: '2026-10-01', count: 2 }]);
  expect(a.topReferrers[0]).toEqual({ name: 'Direct', count: 2 });
});
test('recognizes expired links', () =>
  expect(isExpired('2020-01-01T00:00:00Z', new Date('2021-01-01'))).toBe(true));
test('does not expire future links', () =>
  expect(isExpired('2030-01-01T00:00:00Z', new Date('2026-01-01'))).toBe(false));
