import { useState, useEffect, useMemo } from 'react';
import { DonorReportResponse, DonorMetricsSummary, DonorTransaction, DonorBucket } from '../types';

let globalDonorCache: { data: DonorReportResponse; timestamp: number } | null = null;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

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
 * Fetches all donor data from Stape Store ONCE on app load.
 * When the user applies or changes date filters, transactions are filtered
 * instantly in-memory without making new network requests or showing loading spinners.
 */
export function useDonorReport(startDate?: string, endDate?: string) {
  const isCacheValid = globalDonorCache && (Date.now() - globalDonorCache.timestamp < CACHE_TTL_MS);
  const [data, setData] = useState<DonorReportResponse | null>(isCacheValid ? globalDonorCache!.data : null);
  const [loading, setLoading] = useState<boolean>(!isCacheValid);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch if we don't have fresh global cache
    if (globalDonorCache && (Date.now() - globalDonorCache.timestamp < CACHE_TTL_MS)) {
      setData(globalDonorCache.data);
      setLoading(false);
      return;
    }

    let isCancelled = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/donor-report', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });
        if (!res.ok) {
          throw new Error(`Donor report fetch returned ${res.status}`);
        }
        const json: DonorReportResponse = await res.json();
        globalDonorCache = { data: json, timestamp: Date.now() };
        if (!isCancelled) {
          setData(json);
          setError(null);
        }
      } catch (err: any) {
        console.error('[useDonorReport] Error:', err);
        if (!isCancelled) {
          setError(err.message || 'Donor report unavailable');
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
  }, []); // Run once on mount! Never refetches just because date filter changes!

  // In-memory instant filtering whenever startDate or endDate changes
  const summary = useMemo<DonorMetricsSummary>(() => {
    const rawTxns = data?.transactions || [];

    // Fallback date ranges if not provided
    const effectiveStart = startDate || data?.current?.week_start || '2026-09-14';
    const effectiveEnd = endDate || data?.current?.week_end || '2026-09-20';
    const { priorStartDate, priorEndDate } = getPriorRange(effectiveStart, effectiveEnd);

    // Filter transactions in memory
    const curTxns = rawTxns.filter((t) => t.date >= effectiveStart && t.date <= effectiveEnd);
    const priTxns = rawTxns.filter((t) => t.date >= priorStartDate && t.date <= priorEndDate);

    // If transactions array is present, aggregate directly from them
    let curAgg = aggregateTxList(curTxns);
    let priAgg = aggregateTxList(priTxns);

    // If transactions array was empty (fallback to backend week objects)
    if (rawTxns.length === 0 && data?.current) {
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
    }

    const avgDonation = curAgg.total.count > 0 ? curAgg.total.value / curAgg.total.count : 0;
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
      transactions: curTxns,
    };
  }, [data, startDate, endDate]);

  return { data, summary, loading, error };
}
