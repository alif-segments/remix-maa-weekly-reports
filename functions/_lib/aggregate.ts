// functions/_lib/aggregate.ts  — pure logic, no network, no secrets.
export type Txn = {
  transaction_id?: string;
  transaction_value?: number;
  transaction_type?: string; // one_time | recurring | mixed
  one_time_value?: number;
  recurring_value?: number;
  donor_identified?: boolean;
  currency?: string;
  timestamp?: number; // ms since epoch, written by the server tag
};
export type Doc = { key: string; data: Record<string, Txn> };
export type Bucket = { count: number; value: number };
export type Week = {
  week_start: string; // Monday, YYYY-MM-DD (Australia/Sydney)
  week_end: string;   // Sunday
  total: Bucket;
  new_donor: Bucket;
  existing_donor: Bucket;
  guest: Bucket;      // not logged in: cannot be classified new/existing
  recurring: Bucket;  // transactions with recurring_value > 0, value = recurring_value
  one_time: Bucket;   // transactions with one_time_value > 0, value = one_time_value
  mixed_count: number;
};

const TZ = 'Australia/Sydney';
const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });

export const sydneyDate = (ms: number): string => dayFmt.format(new Date(ms)); // YYYY-MM-DD
export const addDays = (d: string, n: number): string => {
  const t = new Date(d + 'T00:00:00Z');
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
};
export const mondayOf = (d: string): string => {
  const t = new Date(d + 'T00:00:00Z');
  return addDays(d, -((t.getUTCDay() + 6) % 7));
};

const num = (v: unknown): number => (typeof v === 'number' && v === v ? v : 0);
const bucket = (): Bucket => ({ count: 0, value: 0 });
const add = (b: Bucket, v: number) => { b.count += 1; b.value = Math.round((b.value + v) * 100) / 100; };

export type Flat = {
  id: string;
  date: string; // YYYY-MM-DD (Australia/Sydney)
  week: string; // Monday, YYYY-MM-DD (Australia/Sydney)
  cls: 'new' | 'existing' | 'guest';
  total: number;
  one: number;
  rec: number;
  mixed: boolean;
  type: string;
  timestamp: number;
};

// New vs existing is decided from the donor's WHOLE history, never from the requested week:
// the donor's earliest transaction is "new", every later one is "existing".
export function flatten(docs: Doc[]): Flat[] {
  const out: Flat[] = [];
  const seenTxnIds = new Set<string>();

  for (const doc of docs) {
    const guest = String(doc.key).indexOf('guest_') === 0;
    const txns = Object.keys(doc.data || {})
      .map((k) => doc.data[k])
      .filter((t) => t && typeof t === 'object' && typeof t.timestamp === 'number');
    txns.sort((a, b) => (a.timestamp as number) - (b.timestamp as number) ||
      String(a.transaction_id).localeCompare(String(b.transaction_id)));
    txns.forEach((t, i) => {
      const txId = String(t.transaction_id || `${doc.key}_${t.timestamp}`);
      if (seenTxnIds.has(txId)) {
        return;
      }
      seenTxnIds.add(txId);

      const d = sydneyDate(t.timestamp as number);
      out.push({
        id: txId,
        date: d,
        week: mondayOf(d),
        cls: guest ? 'guest' : i === 0 ? 'new' : 'existing',
        total: num(t.transaction_value),
        one: num(t.one_time_value),
        rec: num(t.recurring_value),
        mixed: t.transaction_type === 'mixed',
        type: t.transaction_type || (num(t.recurring_value) > 0 ? 'recurring' : 'one_time'),
        timestamp: t.timestamp as number,
      });
    });
  }
  return out;
}

export function buildReport(docs: Doc[], weekStart: string, weeks = 12) {
  const keys = Array.from({ length: weeks }, (_, i) => addDays(weekStart, -7 * (weeks - 1 - i)));
  const byWeek = new Map<string, Week>(keys.map((k) => [k, {
    week_start: k, week_end: addDays(k, 6),
    total: bucket(), new_donor: bucket(), existing_donor: bucket(), guest: bucket(),
    recurring: bucket(), one_time: bucket(), mixed_count: 0,
  }]));
  const activeWeeksMap = new Map<string, Week>();
  const flatList = flatten(docs);

  for (const f of flatList) {
    if (!activeWeeksMap.has(f.week)) {
      activeWeeksMap.set(f.week, {
        week_start: f.week, week_end: addDays(f.week, 6),
        total: bucket(), new_donor: bucket(), existing_donor: bucket(), guest: bucket(),
        recurring: bucket(), one_time: bucket(), mixed_count: 0,
      });
    }
    const aw = activeWeeksMap.get(f.week)!;
    add(aw.total, f.total);
    add(f.cls === 'new' ? aw.new_donor : f.cls === 'existing' ? aw.existing_donor : aw.guest, f.total);
    if (f.rec > 0) add(aw.recurring, f.rec);
    if (f.one > 0) add(aw.one_time, f.one);
    if (f.mixed) aw.mixed_count += 1;

    const w = byWeek.get(f.week);
    if (!w) continue;
    add(w.total, f.total);
    add(f.cls === 'new' ? w.new_donor : f.cls === 'existing' ? w.existing_donor : w.guest, f.total);
    if (f.rec > 0) add(w.recurring, f.rec);
    if (f.one > 0) add(w.one_time, f.one);
    if (f.mixed) w.mixed_count += 1;
  }
  const series = keys.map((k) => byWeek.get(k) as Week);
  const activeWeeks = Array.from(activeWeeksMap.values()).sort((a, b) => b.week_start.localeCompare(a.week_start));

  return {
    generated_at: new Date().toISOString(),
    timezone: TZ,
    currency: 'AUD',
    current: series[series.length - 1],
    previous: series[series.length - 2],
    weeks: series,
    active_weeks: activeWeeks,
    transactions: flatList,
  };
}
