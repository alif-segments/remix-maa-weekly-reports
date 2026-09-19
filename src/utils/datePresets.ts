import { DateRange, DatePreset } from '../types';

/**
 * Returns preset ranges calculated relative to the latest reference date.
 * Uses UTC date calculations to avoid local timezone offset artifacts.
 */
export function getPresets(referenceDate: Date = new Date()): DatePreset[] {
  // Normalize to UTC midnight
  const ref = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate()));
  const toISO = (d: Date) => d.toISOString().split('T')[0];

  // 1. Previous Week: Monday to Sunday of previous calendar week
  const day = ref.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const offsetToMon = (day + 6) % 7;
  const lastMon = new Date(ref);
  lastMon.setUTCDate(ref.getUTCDate() - offsetToMon - 7);
  const lastSun = new Date(lastMon);
  lastSun.setUTCDate(lastMon.getUTCDate() + 6);

  // 2. Yesterday
  const yest = new Date(ref);
  yest.setUTCDate(ref.getUTCDate() - 1);

  // 3. Last 7 Days (ending yesterday)
  const l7Start = new Date(ref);
  l7Start.setUTCDate(ref.getUTCDate() - 7);
  const l7End = new Date(ref);
  l7End.setUTCDate(ref.getUTCDate() - 1);

  // 4. Last 14 Days (ending yesterday)
  const l14Start = new Date(ref);
  l14Start.setUTCDate(ref.getUTCDate() - 14);
  const l14End = new Date(ref);
  l14End.setUTCDate(ref.getUTCDate() - 1);

  // 5. Last 30 Days (ending yesterday)
  const l30Start = new Date(ref);
  l30Start.setUTCDate(ref.getUTCDate() - 30);
  const l30End = new Date(ref);
  l30End.setUTCDate(ref.getUTCDate() - 1);

  // 6. This Month (1st to today)
  const thisMonthStart = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), 1));
  const thisMonthEnd = ref;

  // 7. Last Month (1st to last day of previous month)
  const lastMonthStart = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() - 1, 1));
  const lastMonthEnd = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), 0));

  return [
    { id: 'prev_week', label: 'Previous Week', startDate: toISO(lastMon), endDate: toISO(lastSun) },
    { id: 'yesterday', label: 'Yesterday', startDate: toISO(yest), endDate: toISO(yest) },
    { id: 'last_7', label: 'Last 7 Days', startDate: toISO(l7Start), endDate: toISO(l7End) },
    { id: 'last_14', label: 'Last 14 Days', startDate: toISO(l14Start), endDate: toISO(l14End) },
    { id: 'last_30', label: 'Last 30 Days', startDate: toISO(l30Start), endDate: toISO(l30End) },
    { id: 'this_month', label: 'This Month', startDate: toISO(thisMonthStart), endDate: toISO(thisMonthEnd) },
    { id: 'last_month', label: 'Last Month', startDate: toISO(lastMonthStart), endDate: toISO(lastMonthEnd) },
  ];
}

/**
 * Gets default date range (Previous completed Monday to Sunday)
 */
export function getDefaultDateRange(): DateRange {
  const presets = getPresets();
  const prevWeek = presets.find(p => p.id === 'prev_week') || presets[0];
  return {
    startDate: prevWeek.startDate,
    endDate: prevWeek.endDate
  };
}

/**
 * Formats a date range for display in the pill button and slide headers
 * Example: "07 Sept – 13 Sept 2026" or "17 Sept 2026"
 */
export function formatDateRange(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return '';
  const d1 = new Date(`${startDate}T00:00:00Z`);
  const d2 = new Date(`${endDate}T00:00:00Z`);

  if (startDate === endDate) {
    return d1.toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC'
    });
  }

  const sameYear = d1.getUTCFullYear() === d2.getUTCFullYear();
  const sStr = d1.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
    timeZone: 'UTC'
  });
  const eStr = d2.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  });

  return `${sStr} – ${eStr}`;
}
