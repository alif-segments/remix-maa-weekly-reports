import {
  fetchMaaSummaryForRange,
  computePriorDateRange,
  getLastWeekRange,
  MaaConfig,
  MaaSummaryData
} from '../_lib/maa-client';

export interface Env extends MaaConfig {
  MAA_BASE_URL?: string;
  MAA_EMAIL?: string;
  MAA_PASSWORD?: string;
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

  // No credentials: report the problem instead of serving made-up numbers.
  if (!email || !password) {
    console.error('[MAA Datafeed] MAA_EMAIL / MAA_PASSWORD are not configured.');
    return new Response(JSON.stringify({ error: 'MAA_EMAIL / MAA_PASSWORD are not configured on the server.' }), {
      status: 503,
      headers: { ...corsHeaders, 'cache-control': 'no-store' }
    });
  }

  try {
    console.log(`[MAA Datafeed] Querying live MAA Datafeed API for current (${date_from} to ${date_to}) and prior periods...`);
    // Each summary call takes ~20s and the API allows one at a time per user, so the
    // calls run one after another. Stay well under Cloudflare's ~100s response limit.
    const deadline = Date.now() + 90_000;
    const currentSummary = await fetchMaaSummaryForRange(date_from, date_to, maaConfig, deadline);
    let priorSummary: MaaSummaryData;
    let priorMissing = false;
    try {
      if (deadline - Date.now() < 25_000) throw new Error('not enough time left for prior period');
      priorSummary = await fetchMaaSummaryForRange(priorStartDate, priorEndDate, maaConfig, deadline);
    } catch (priErr: any) {
      priorMissing = true;
      console.warn('[MAA Datafeed] Could not fetch prior period summary, using zero baseline:', priErr?.message || priErr);
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
      prior_missing: priorMissing,
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
        // Don't let browsers keep a zero-baseline response around
        'cache-control': priorMissing ? 'no-store' : 'private, max-age=300'
      }
    });
  } catch (err: any) {
    console.error('[MAA Datafeed] Error querying MAA Datafeed API:', err?.message || err);
    return new Response(JSON.stringify({ error: 'MAA Datafeed request failed', api_error: err?.message || String(err) }), {
      status: 502,
      headers: { ...corsHeaders, 'cache-control': 'no-store' }
    });
  }
};
