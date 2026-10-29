// functions/_lib/maa-client.ts
// Official client for the MAA International Datafeed API:
//   1. POST /api/v1/auth/login        -> bearer token with expiration
//   2. POST /api/v1/donations/summary -> donor totals & splits for date range

export interface MaaConfig {
  baseUrl?: string;
  email?: string;
  password?: string;
}

export interface MaaDonationSplit {
  amount: number;
  transactions: number;
}

export interface MaaFrequencySplit {
  amount: number;
  count: number;
}

export interface MaaSummaryData {
  total_raised: number;
  transactions: number;
  avg_donation: number;
  currency: string;
  date_from: string;
  date_to: string;
  generated_at_utc?: string;
  new_donors: MaaDonationSplit;
  existing_donors: MaaDonationSplit;
  guest_checkouts: MaaDonationSplit;
  recurring: MaaFrequencySplit;
  one_time: MaaFrequencySplit;
}

export const ERROR_HINTS: Record<string, Record<number, string>> = {
  login: {
    400: 'Body missing, not JSON, a field is invalid, or there are extra fields.',
    401: 'Invalid credentials (or the account is locked/inactive).',
    429: 'Too many login attempts. Wait and try again.',
  },
  summary: {
    400: 'Bad request body. Check the dates are YYYY-MM-DD.',
    401: 'Token missing, invalid or expired.',
    429: 'Another summary call by this user is still running. Send one call at a time.',
  },
};

// Global in-memory cache for auth session and date-range summaries
let sessionCache: { token: string; expiresAt: number } | null = null;
const summaryCache = new Map<string, { data: MaaSummaryData; timestamp: number }>();
const SUMMARY_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

// Serialization queue to guarantee summary calls run one at a time (preventing 429)
let requestQueue: Promise<any> = Promise.resolve();
function runSerialized<T>(task: () => Promise<T>): Promise<T> {
  const next = requestQueue.then(() => task(), () => task());
  requestQueue = next.catch(() => {});
  return next;
}

export interface MaaConfig {
  baseUrl?: string;
  email?: string;
  password?: string;
  MAA_BASE_URL?: string;
  MAA_EMAIL?: string;
  MAA_PASSWORD?: string;
  [key: string]: any;
}

export function getDefaultBaseUrl(customUrl?: string, config?: MaaConfig): string {
  const url =
    customUrl ||
    config?.baseUrl ||
    config?.MAA_BASE_URL ||
    config?.maa_base_url ||
    (typeof process !== 'undefined' ? process.env?.MAA_BASE_URL : '') ||
    'https://datafeed.maainternational.org.au';
  return url.trim().replace(/\/+$/, '');
}

export function getMaaCredentials(config?: MaaConfig): { baseUrl: string; email: string; password: string } {
  const baseUrl = getDefaultBaseUrl(config?.baseUrl, config);
  const email = (
    config?.email ||
    config?.MAA_EMAIL ||
    config?.maa_email ||
    config?.Email ||
    (typeof process !== 'undefined' ? process.env?.MAA_EMAIL : '') ||
    ''
  ).trim();
  const password = (
    config?.password ||
    config?.MAA_PASSWORD ||
    config?.maa_password ||
    config?.Password ||
    (typeof process !== 'undefined' ? process.env?.MAA_PASSWORD : '') ||
    ''
  ).trim();
  return { baseUrl, email, password };
}

async function postJson(baseUrl: string, path: string, body: any, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const started = Date.now();
  const res = await fetch(baseUrl + path, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const ms = Date.now() - started;

  const text = await res.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data, ms };
}

export async function loginToMaa(config?: MaaConfig): Promise<{ token: string; expiresAt: number }> {
  const { baseUrl, email, password } = getMaaCredentials(config);

  if (!email || !password) {
    throw new Error('MAA_EMAIL or MAA_PASSWORD not configured. Please set them in your .env file.');
  }

  // Reuse cached session if valid with a 60s buffer
  if (sessionCache && Date.now() < sessionCache.expiresAt - 60000) {
    console.log('[MAA Datafeed] Active authentication token found in cache.');
    return sessionCache;
  }

  console.log('[MAA Datafeed] Generating authentication token...');
  const { status, data, ms } = await postJson(baseUrl, '/api/v1/auth/login', { email, password });
  if (status !== 200) {
    const hint = ERROR_HINTS.login[status] || 'Unexpected login response';
    console.error(`[MAA Datafeed] Authentication failed with status ${status}: ${hint}`);
    throw new Error(`MAA login failed with status ${status}: ${hint}`);
  }

  if (typeof data?.accessToken !== 'string' || data.tokenType !== 'Bearer') {
    console.error('[MAA Datafeed] Login response missing accessToken or tokenType');
    throw new Error('MAA login response missing valid accessToken or tokenType');
  }

  const expiresInSec = typeof data.expiresIn === 'number' ? data.expiresIn : 3600;
  sessionCache = {
    token: data.accessToken,
    expiresAt: Date.now() + expiresInSec * 1000,
  };
  console.log(`[MAA Datafeed] Authentication token successfully generated (${ms}ms, valid for ${expiresInSec}s).`);
  return sessionCache;
}

export function checkSummaryShape(s: any): string[] {
  if (!s || typeof s !== 'object') return ['Summary response is not an object'];
  const problems: string[] = [];
  const isNum = (v: any) => typeof v === 'number' && !isNaN(v);

  for (const key of ['total_raised', 'transactions', 'avg_donation']) {
    if (!isNum(s[key])) problems.push(`${key} should be a number`);
  }
  for (const key of ['new_donors', 'existing_donors', 'guest_checkouts']) {
    if (!isNum(s[key]?.amount) || !isNum(s[key]?.transactions)) {
      problems.push(`${key} should have amount and transactions`);
    }
  }
  for (const key of ['recurring', 'one_time']) {
    if (!isNum(s[key]?.amount) || !isNum(s[key]?.count)) {
      problems.push(`${key} should have amount and count`);
    }
  }
  return problems;
}

export async function fetchMaaSummaryForRange(
  date_from: string,
  date_to: string,
  config?: MaaConfig
): Promise<MaaSummaryData> {
  const cacheKey = `${date_from}_${date_to}`;
  const now = Date.now();
  const cached = summaryCache.get(cacheKey);
  if (cached && now - cached.timestamp < SUMMARY_CACHE_TTL_MS) {
    return cached.data;
  }

  return runSerialized(async () => {
    // Re-check cache inside serialized lock
    const freshCheck = summaryCache.get(cacheKey);
    if (freshCheck && Date.now() - freshCheck.timestamp < SUMMARY_CACHE_TTL_MS) {
      return freshCheck.data;
    }

    const { baseUrl } = getMaaCredentials(config);
    console.log(`[MAA Datafeed] Getting donor summary data for range: ${date_from} to ${date_to}...`);
    let session = await loginToMaa(config);

    let res = await postJson(baseUrl, '/api/v1/donations/summary', { date_from, date_to }, session.token);

    // If 401 or expired, refresh token and retry once
    if (res.status === 401) {
      console.warn('[MAA Datafeed] 401 received, refreshing token and retrying...');
      sessionCache = null;
      session = await loginToMaa(config);
      res = await postJson(baseUrl, '/api/v1/donations/summary', { date_from, date_to }, session.token);
    }

    // If 429 (rate limited or concurrent call), wait 1.5s and retry once
    if (res.status === 429) {
      console.warn('[MAA Datafeed] 429 rate limit encountered, waiting 1500ms...');
      await new Promise((r) => setTimeout(r, 1500));
      res = await postJson(baseUrl, '/api/v1/donations/summary', { date_from, date_to }, session.token);
    }

    if (res.status !== 200) {
      const hint = ERROR_HINTS.summary[res.status] || 'Unexpected summary response';
      console.error(`[MAA Datafeed] Summary fetch failed with status ${res.status}: ${hint}`);
      throw new Error(`MAA summary failed with status ${res.status}: ${hint}`);
    }

    console.log(`[MAA Datafeed] Donor summary data successfully retrieved for ${date_from} to ${date_to} (${res.ms}ms).`);

    const raw = res.data;
    const issues = checkSummaryShape(raw);
    if (issues.length > 0) {
      console.warn('[MAA API] Summary shape warnings:', issues);
    }

    const summary: MaaSummaryData = {
      total_raised: Number(raw.total_raised) || 0,
      transactions: Number(raw.transactions) || 0,
      avg_donation: Number(raw.avg_donation) || 0,
      currency: raw.currency || 'AUD',
      date_from: raw.date_from || date_from,
      date_to: raw.date_to || date_to,
      generated_at_utc: raw.generated_at_utc || new Date().toISOString(),
      new_donors: {
        amount: Number(raw.new_donors?.amount) || 0,
        transactions: Number(raw.new_donors?.transactions) || 0,
      },
      existing_donors: {
        amount: Number(raw.existing_donors?.amount) || 0,
        transactions: Number(raw.existing_donors?.transactions) || 0,
      },
      guest_checkouts: {
        amount: Number(raw.guest_checkouts?.amount) || 0,
        transactions: Number(raw.guest_checkouts?.transactions) || 0,
      },
      recurring: {
        amount: Number(raw.recurring?.amount) || 0,
        count: Number(raw.recurring?.count) || 0,
      },
      one_time: {
        amount: Number(raw.one_time?.amount) || 0,
        count: Number(raw.one_time?.count) || 0,
      },
    };

    summaryCache.set(cacheKey, { data: summary, timestamp: Date.now() });
    return summary;
  });
}

export function computePriorDateRange(date_from: string, date_to: string) {
  const startD = new Date(`${date_from}T00:00:00Z`);
  const endD = new Date(`${date_to}T00:00:00Z`);
  const dayCount = Math.max(1, Math.round((endD.getTime() - startD.getTime()) / 86400000) + 1);

  const priorEndD = new Date(startD);
  priorEndD.setUTCDate(priorEndD.getUTCDate() - 1);

  const priorStartD = new Date(priorEndD);
  priorStartD.setUTCDate(priorEndD.getUTCDate() - (dayCount - 1));

  return {
    priorStartDate: priorStartD.toISOString().slice(0, 10),
    priorEndDate: priorEndD.toISOString().slice(0, 10),
  };
}

export function getLastWeekRange(): [string, string] {
  const today = new Date();
  const day = (today.getUTCDay() + 6) % 7; // Monday = 0
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - day - 1));
  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - 6);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return [fmt(start), fmt(end)];
}
