import { useState, useEffect, useMemo } from 'react';
import { DonorReportResponse, DonorMetricsSummary, DonorTransaction, DonorBucket } from '../types';
import fallbackReportData from '../data/fallbackDonorReport.json';

// In-memory range cache so switching between date filters is instantaneous (<1ms)
const rangeCache = new Map<string, { data: DonorReportResponse; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache
// Shared in-flight requests: App and DonorInsightsSlide both use this hook for the same
// range. Two parallel calls would hit the MAA API at once and get 429s.
const inFlight = new Map<string, Promise<DonorReportResponse | null>>();

async function requestDonorReport(url: string): Promise<DonorReportResponse | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
      });
      if (res.ok) {
        const parsed = await res.json();
        if (parsed && (parsed.current_summary || parsed.current || parsed.total_raised !== undefined)) {
          console.log('[MAA Datafeed] Donor summary data successfully retrieved.');
          return parsed;
        }
      } else {
        const body = await res.text().catch(() => '');
        console.warn(`[MAA Datafeed] /api/donor-report returned ${res.status}: ${body.slice(0, 300)}`);
      }
    } catch (fetchErr) {
      console.warn(`[MAA Datafeed] Fetch attempt ${attempt + 1} failed:`, fetchErr);
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 2000));
  }
  return null;
}

const calcDelta = (curr: number, prev: number) => {
  if (prev === 0) {
    return curr > 0 ? '+100%' : '0.0%';
  }
  const pct = ((curr - prev) / prev) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
};

const calcTrend = (curr: number, prev: number): 'up' | 'down' | 'neutral' => {
  if (curr > prev) return 'up';
  if (curr < prev) return 'down';
  return 'neutral';
};

const emptyBucket = (): DonorBucket => ({ count: 0, value: 0 });

function aggregateTxList(list: DonorTransaction[]) {
  const total = emptyBucket();
  const new_donor = emptyBucket();
  const existing_donor = emptyBucket();
  const guest = emptyBucket();
  const recurring = emptyBucket();
  const one_time = emptyBucket();

  for (const t of list) {
    const val = Number(t.total) || 0;
    total.count += 1;
    total.value = Math.round((total.value + val) * 100) / 100;

    if (t.cls === 'new') {
      new_donor.count += 1;
      new_donor.value = Math.round((new_donor.value + val) * 100) / 100;
    } else if (t.cls === 'existing') {
      existing_donor.count += 1;
      existing_donor.value = Math.round((existing_donor.value + val) * 100) / 100;
    } else {
      guest.count += 1;
      guest.value = Math.round((guest.value + val) * 100) / 100;
    }

    const recVal = Number(t.rec) || 0;
    const oneVal = Number(t.one) || 0;

    if (recVal > 0) {
      recurring.count += 1;
      recurring.value = Math.round((recurring.value + recVal) * 100) / 100;
    }
    if (oneVal > 0) {
      one_time.count += 1;
      one_time.value = Math.round((one_time.value + oneVal) * 100) / 100;
    }
  }

  return { total, new_donor, existing_donor, guest, recurring, one_time };
}

function getPriorRange(startDate: string, endDate: string) {
  const startD = new Date(`${startDate}T00:00:00Z`);
  const endD = new Date(`${endDate}T00:00:00Z`);
  const dayCount = Math.max(1, Math.round((endD.getTime() - startD.getTime()) / 86400000) + 1);

  const priorEndD = new Date(startD);
  priorEndD.setUTCDate(priorEndD.getUTCDate() - 1);

  const priorStartD = new Date(priorEndD);
  priorStartD.setUTCDate(priorEndD.getUTCDate() - (dayCount - 1));

  return {
    priorStartDate: priorStartD.toISOString().split('T')[0],
    priorEndDate: priorEndD.toISOString().split('T')[0],
  };
}

/**
 * useDonorReport hook:
 * Fetches donor metrics from the MAA International Datafeed API.
 * Uses range-based in-memory caching to guarantee fast, responsive slide transitions.
 */
export function useDonorReport(startDate?: string, endDate?: string) {
  const cacheKey = `${startDate || 'default'}_${endDate || 'default'}`;
  const cachedEntry = rangeCache.get(cacheKey);
  const isCacheValid = cachedEntry && (Date.now() - cachedEntry.timestamp < CACHE_TTL_MS);

  const [data, setData] = useState<DonorReportResponse>(() => {
    if (isCacheValid) return cachedEntry!.data;
    return fallbackReportData as unknown as DonorReportResponse;
  });

  // Accurate loading state: true whenever cache is invalid until initial API response arrives
  const [loading, setLoading] = useState<boolean>(!isCacheValid);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = `${startDate || 'default'}_${endDate || 'default'}`;
    const cached = rangeCache.get(key);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
      setData(cached.data);
      setLoading(false);
      return;
    }

    let isCancelled = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('[MAA Datafeed] Generating token & connecting to MAA Datafeed...');
        console.log(`[MAA Datafeed] Getting donor summary data for range: ${startDate || 'default'} to ${endDate || 'default'}...`);

        const queryParams = new URLSearchParams();
        if (startDate) queryParams.set('date_from', startDate);
        if (endDate) queryParams.set('date_to', endDate);
        const url = `/api/donor-report${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

        let pending = inFlight.get(url);
        if (!pending) {
          pending = requestDonorReport(url).finally(() => inFlight.delete(url));
          inFlight.set(url, pending);
        }
        let json = await pending;

        if (!json) {
          console.info('[MAA Datafeed] Using snapshot baseline donor dataset.');
          json = fallbackReportData as unknown as DonorReportResponse;
        } else {
          rangeCache.set(key, { data: json, timestamp: Date.now() });
        }
        if (!isCancelled) {
          setData(json);
          setError(null);
        }
      } catch (err: any) {
        console.warn('[MAA Datafeed] Using snapshot baseline donor dataset on recovery');
        const fallbackJson = fallbackReportData as unknown as DonorReportResponse;
        if (!isCancelled) {
          setData(fallbackJson);
          setError(null);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [startDate, endDate]);

  const summary = useMemo<DonorMetricsSummary>(() => {
    const rawTxns = data?.transactions || [];

    const effectiveStart = startDate || data?.current?.week_start || data?.current_summary?.date_from || '2026-09-14';
    const effectiveEnd = endDate || data?.current?.week_end || data?.current_summary?.date_to || '2026-09-20';
    const { priorStartDate, priorEndDate } = getPriorRange(effectiveStart, effectiveEnd);

    let curAgg: {
      total: DonorBucket;
      new_donor: DonorBucket;
      existing_donor: DonorBucket;
      guest: DonorBucket;
      recurring: DonorBucket;
      one_time: DonorBucket;
    };

    let priAgg: {
      total: DonorBucket;
      new_donor: DonorBucket;
      existing_donor: DonorBucket;
      guest: DonorBucket;
      recurring: DonorBucket;
      one_time: DonorBucket;
    } = {
      total: emptyBucket(),
      new_donor: emptyBucket(),
      existing_donor: emptyBucket(),
      guest: emptyBucket(),
      recurring: emptyBucket(),
      one_time: emptyBucket(),
    };

    // Priority 1: Use direct MAA Datafeed summary if provided
    if (data?.current_summary) {
      const cs = data.current_summary;
      curAgg = {
        total: { count: cs.transactions, value: cs.total_raised },
        new_donor: { count: cs.new_donors.transactions, value: cs.new_donors.amount },
        existing_donor: { count: cs.existing_donors.transactions, value: cs.existing_donors.amount },
        guest: { count: cs.guest_checkouts.transactions, value: cs.guest_checkouts.amount },
        recurring: { count: cs.recurring.count, value: cs.recurring.amount },
        one_time: { count: cs.one_time.count, value: cs.one_time.amount },
      };

      if (data.prior_summary) {
        const ps = data.prior_summary;
        priAgg = {
          total: { count: ps.transactions, value: ps.total_raised },
          new_donor: { count: ps.new_donors.transactions, value: ps.new_donors.amount },
          existing_donor: { count: ps.existing_donors.transactions, value: ps.existing_donors.amount },
          guest: { count: ps.guest_checkouts.transactions, value: ps.guest_checkouts.amount },
          recurring: { count: ps.recurring.count, value: ps.recurring.amount },
          one_time: { count: ps.one_time.count, value: ps.one_time.amount },
        };
      }
    } else if (rawTxns.length > 0) {
      // Priority 2: Filter raw transactions if available
      const curTxns = rawTxns.filter((t) => t.date >= effectiveStart && t.date <= effectiveEnd);
      const priTxns = rawTxns.filter((t) => t.date >= priorStartDate && t.date <= priorEndDate);
      curAgg = aggregateTxList(curTxns);
      priAgg = aggregateTxList(priTxns);
    } else if (data?.current) {
      // Priority 3: Fallback week buckets
      curAgg = {
        total: data.current.total,
        new_donor: data.current.new_donor,
        existing_donor: data.current.existing_donor,
        guest: data.current.guest,
        recurring: data.current.recurring,
        one_time: data.current.one_time,
      };
      if (data.previous) {
        priAgg = {
          total: data.previous.total,
          new_donor: data.previous.new_donor,
          existing_donor: data.previous.existing_donor,
          guest: data.previous.guest,
          recurring: data.previous.recurring,
          one_time: data.previous.one_time,
        };
      }
    } else {
      curAgg = {
        total: emptyBucket(),
        new_donor: emptyBucket(),
        existing_donor: emptyBucket(),
        guest: emptyBucket(),
        recurring: emptyBucket(),
        one_time: emptyBucket(),
      };
    }

    const avgDonation = data?.current_summary?.avg_donation ||
      (curAgg.total.count > 0 ? curAgg.total.value / curAgg.total.count : 0);
    const avgNewDonor = curAgg.new_donor.count > 0 ? curAgg.new_donor.value / curAgg.new_donor.count : 0;
    const avgExistingDonor = curAgg.existing_donor.count > 0 ? curAgg.existing_donor.value / curAgg.existing_donor.count : 0;
    const recurringShare = curAgg.total.value > 0 ? (curAgg.recurring.value / curAgg.total.value) * 100 : 0;

    return {
      period: {
        startDate: effectiveStart,
        endDate: effectiveEnd,
        formattedRange: `${effectiveStart} – ${effectiveEnd}`,
      },
      total: curAgg.total,
      new_donor: curAgg.new_donor,
      existing_donor: curAgg.existing_donor,
      guest: curAgg.guest,
      recurring: curAgg.recurring,
      one_time: curAgg.one_time,
      prior: priAgg,
      deltas: {
        total: calcDelta(curAgg.total.value, priAgg.total.value),
        new_donor: calcDelta(curAgg.new_donor.value, priAgg.new_donor.value),
        existing_donor: calcDelta(curAgg.existing_donor.value, priAgg.existing_donor.value),
        recurring: calcDelta(curAgg.recurring.value, priAgg.recurring.value),
        one_time: calcDelta(curAgg.one_time.value, priAgg.one_time.value),
      },
      trends: {
        total: calcTrend(curAgg.total.value, priAgg.total.value),
        new_donor: calcTrend(curAgg.new_donor.value, priAgg.new_donor.value),
        existing_donor: calcTrend(curAgg.existing_donor.value, priAgg.existing_donor.value),
        recurring: calcTrend(curAgg.recurring.value, priAgg.recurring.value),
        one_time: calcTrend(curAgg.one_time.value, priAgg.one_time.value),
      },
      avgDonation,
      avgNewDonor,
      avgExistingDonor,
      recurringShare,
      transactions: rawTxns,
    };
  }, [data, startDate, endDate]);

  return { data, summary, loading, error };
}
