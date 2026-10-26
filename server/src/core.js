import { nanoid } from 'nanoid';

/** Validate a destination before it is stored or redirected to. */
export function validateDestination(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return 'Destination URL is required';
  }

  try {
    const url = new URL(value);

    if (!['http:', 'https:'].includes(url.protocol)) {
      return 'Only HTTP and HTTPS URLs are allowed';
    }

    if (!url.hostname.includes('.')) {
      return 'Enter a valid destination URL';
    }

    return null;
  } catch {
    return 'Enter a valid destination URL';
  }
}

/** Generate a short, URL-safe alias. */
export function makeAlias() {
  return nanoid(7);
}

/** Convert click events into chart and breakdown data. */
export function summarizeClicks(clicks = []) {
  const byDate = {};
  const referrers = {};
  const devices = {};
  const browsers = {};

  for (const click of clicks) {
    const day = new Date(click.clickedAt).toISOString().slice(0, 10);
    const referrer = click.referrer || 'Direct';
    const device = click.device || 'Unknown';
    const browser = click.browser || 'Unknown';

    byDate[day] = (byDate[day] || 0) + 1;
    referrers[referrer] = (referrers[referrer] || 0) + 1;
    devices[device] = (devices[device] || 0) + 1;
    browsers[browser] = (browsers[browser] || 0) + 1;
  }

  const rank = (values) =>
    Object.entries(values)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

  return {
    totalClicks: clicks.length,
    overTime: Object.entries(byDate)
      .sort(([first], [second]) => first.localeCompare(second))
      .map(([date, count]) => ({ date, count })),
    topReferrers: rank(referrers),
    devices: rank(devices),
    browsers: rank(browsers),
  };
}

export function isExpired(expiresAt, now = new Date()) {
  return Boolean(expiresAt && new Date(expiresAt) <= now);
}
