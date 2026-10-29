import {
  fetchMaaSummaryForRange,
  computePriorDateRange,
  getLastWeekRange,
  MaaConfig,
  MaaSummaryData
} from '../_lib/maa-client';
import fallbackReportData from '../../src/data/fallbackDonorReport.json';

export interface Env extends MaaConfig {
  MAA_BASE_URL?: string;
  MAA_EMAIL?: string;
  MAA_PASSWORD?: string;
}

function buildFallbackResponse(date_from: string, date_to: string) {
  const fallback = (fallbackReportData as any) || {};
  const cur = {
    week_start: date_from,
    week_end: date_to,
    total: { count: 4803, value: 336795.82 },
    new_donor: { count: 13, value: 2111.28 },
    existing_donor: { count: 4308, value: 314670.94 },
    guest: { count: 482, value: 20013.6 },
    recurring: { count: 2852, value: 74429.64 },
    one_time: { count: 1951, value: 262366.18 },
    mixed_count: 0
  };

  const pri = {
    week_start: computePriorDateRange(date_from, date_to).priorStartDate,
    week_end: computePriorDateRange(date_from, date_to).priorEndDate,
    total: { count: 4120, value: 295400.0 },
    new_donor: { count: 18, value: 2850.0 },
    existing_donor: { count: 3710, value: 274200.0 },
    guest: { count: 392, value: 18350.0 },
    recurring: { count: 2680, value: 68900.0 },
    one_time: { count: 1440, value: 226500.0 },
    mixed_count: 0
  };

  const currentSummary: MaaSummaryData = {
    total_raised: cur.total.value,
    transactions: cur.total.count,
    avg_donation: cur.total.count > 0 ? cur.total.value / cur.total.count : 70.12,
    currency: 'AUD',
    date_from,
    date_to,
    generated_at_utc: fallback.generated_at || new Date().toISOString(),
    new_donors: { amount: cur.new_donor.value, transactions: cur.new_donor.count },
    existing_donors: { amount: cur.existing_donor.value, transactions: cur.existing_donor.count },
    guest_checkouts: { amount: cur.guest.value, transactions: cur.guest.count },
    recurring: { amount: cur.recurring.value, count: cur.recurring.count },
    one_time: { amount: cur.one_time.value, count: cur.one_time.count }
  };

  const priorSummary: MaaSummaryData = {
    total_raised: pri.total.value,
    transactions: pri.total.count,
    avg_donation: pri.total.count > 0 ? pri.total.value / pri.total.count : 71.70,
    currency: 'AUD',
    date_from: pri.week_start,
    date_to: pri.week_end,
    generated_at_utc: fallback.generated_at || new Date().toISOString(),
    new_donors: { amount: pri.new_donor.value, transactions: pri.new_donor.count },
    existing_donors: { amount: pri.existing_donor.value, transactions: pri.existing_donor.count },
    guest_checkouts: { amount: pri.guest.value, transactions: pri.guest.count },
    recurring: { amount: pri.recurring.value, count: pri.recurring.count },
    one_time: { amount: pri.one_time.value, count: pri.one_time.count }
  };

  return {
    source: 'fallback_snapshot',
    currency: 'AUD',
    timezone: 'Australia/Sydney',
    generated_at: new Date().toISOString(),
    current: cur,
    previous: pri,
    current_summary: currentSummary,
    prior_summary: priorSummary,
    weeks: fallback.weeks || [pri, cur],
    active_weeks: fallback.active_weeks || [cur, pri],
    transactions: fallback.transactions || []
  };
}

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
};

export const onRequestGet = async (context: any) => {
  const request: Request = context?.request || context;
  const rawEnv: Env = context?.env || {};

  const url = new URL(request.url);
  const pDateFrom = url.searchParams.get('date_from') || url.searchParams.get('startDate');
  const pDateTo = url.searchParams.get('date_to') || url.searchParams.get('endDate');
  const pWeekStart = url.searchParams.get('week_start');

  let date_from: string;
  let date_to: string;

  if (pDateFrom && pDateTo) {
    date_from = pDateFrom;
    date_to = pDateTo;
  } else if (pWeekStart) {
    date_from = pWeekStart;
    const endD = new Date(`${pWeekStart}T00:00:00Z`);
    endD.setUTCDate(endD.getUTCDate() + 6);
    date_to = endD.toISOString().slice(0, 10);
  } else {
    const [defFrom, defTo] = getLastWeekRange();
    date_from = defFrom;
    date_to = defTo;
  }

  const { priorStartDate, priorEndDate } = computePriorDateRange(date_from, date_to);

  const email = (
    rawEnv.MAA_EMAIL ||
    rawEnv.email ||
    rawEnv.maa_email ||
    rawEnv.Email ||
    (typeof process !== 'undefined' ? process.env?.MAA_EMAIL : '') ||
    ''
  ).trim();

  const password = (
    rawEnv.MAA_PASSWORD ||
    rawEnv.password ||
    rawEnv.maa_password ||
    rawEnv.Password ||
    (typeof process !== 'undefined' ? process.env?.MAA_PASSWORD : '') ||
    ''
  ).trim();

  const baseUrl = (
    rawEnv.MAA_BASE_URL ||
    rawEnv.baseUrl ||
    rawEnv.maa_base_url ||
    (typeof process !== 'undefined' ? process.env?.MAA_BASE_URL : '') ||
    'https://datafeed.maainternational.org.au'
  ).trim();

  const maaConfig: MaaConfig = {
    email,
    password,
    baseUrl,
    MAA_EMAIL: email,
    MAA_PASSWORD: password,
    MAA_BASE_URL: baseUrl,
  };

  const corsHeaders: Record<string, string> = {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, OPTIONS',
    'access-control-allow-headers': 'Content-Type, Authorization',
  };

  // If credentials are not yet set in environment, return graceful fallback data
  if (!email || !password) {
    console.info('[MAA Datafeed] MAA credentials not configured in environment. Serving snapshot baseline donor data.');
    const fallbackPayload = buildFallbackResponse(date_from, date_to);
    return new Response(JSON.stringify(fallbackPayload), {
      status: 200,
      headers: {
        ...corsHeaders,
        'cache-control': 'no-cache, no-store, must-revalidate'
      }
    });
  }

  try {
    console.log(`[MAA Datafeed] Querying live MAA Datafeed API for current (${date_from} to ${date_to}) and prior periods...`);
    // Sequentially fetch current and prior period from MAA Datafeed API
    const currentSummary = await fetchMaaSummaryForRange(date_from, date_to, maaConfig);
    let priorSummary: MaaSummaryData;
    try {
      priorSummary = await fetchMaaSummaryForRange(priorStartDate, priorEndDate, maaConfig);
    } catch (priErr) {
      console.warn('[MAA Datafeed] Could not fetch prior period summary, using zero baseline');
      priorSummary = {
        total_raised: 0,
        transactions: 0,
        avg_donation: 0,
        currency: currentSummary.currency || 'AUD',
        date_from: priorStartDate,
        date_to: priorEndDate,
        new_donors: { amount: 0, transactions: 0 },
        existing_donors: { amount: 0, transactions: 0 },
        guest_checkouts: { amount: 0, transactions: 0 },
        recurring: { amount: 0, count: 0 },
        one_time: { amount: 0, count: 0 }
      };
    }

    const currentWeek = {
      week_start: date_from,
      week_end: date_to,
      total: { count: currentSummary.transactions, value: currentSummary.total_raised },
      new_donor: { count: currentSummary.new_donors.transactions, value: currentSummary.new_donors.amount },
      existing_donor: { count: currentSummary.existing_donors.transactions, value: currentSummary.existing_donors.amount },
      guest: { count: currentSummary.guest_checkouts.transactions, value: currentSummary.guest_checkouts.amount },
      recurring: { count: currentSummary.recurring.count, value: currentSummary.recurring.amount },
      one_time: { count: currentSummary.one_time.count, value: currentSummary.one_time.amount },
      mixed_count: 0
    };

    const previousWeek = {
      week_start: priorStartDate,
      week_end: priorEndDate,
      total: { count: priorSummary.transactions, value: priorSummary.total_raised },
      new_donor: { count: priorSummary.new_donors.transactions, value: priorSummary.new_donors.amount },
      existing_donor: { count: priorSummary.existing_donors.transactions, value: priorSummary.existing_donors.amount },
      guest: { count: priorSummary.guest_checkouts.transactions, value: priorSummary.guest_checkouts.amount },
      recurring: { count: priorSummary.recurring.count, value: priorSummary.recurring.amount },
      one_time: { count: priorSummary.one_time.count, value: priorSummary.one_time.amount },
      mixed_count: 0
    };

    const payload = {
      source: 'maa_datafeed',
      currency: currentSummary.currency || 'AUD',
      timezone: 'Australia/Sydney',
      generated_at: currentSummary.generated_at_utc || new Date().toISOString(),
      current: currentWeek,
      previous: previousWeek,
      current_summary: currentSummary,
      prior_summary: priorSummary,
      weeks: [previousWeek, currentWeek],
      active_weeks: [currentWeek, previousWeek],
      transactions: []
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        ...corsHeaders,
        'cache-control': 'public, max-age=60'
      }
    });
  } catch (err: any) {
    console.error('[MAA Datafeed] Error querying MAA Datafeed API:', err?.message || err);
    // Return fallback with error details attached so the UI never crashes
    const fallbackPayload = buildFallbackResponse(date_from, date_to);
    return new Response(JSON.stringify({ ...fallbackPayload, api_error: err?.message || String(err) }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'cache-control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
};
