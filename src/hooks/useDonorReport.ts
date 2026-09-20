import { useState, useEffect } from 'react';
import { DonorReportResponse } from '../types';

let cachedResponse: { [key: string]: { data: DonorReportResponse; timestamp: number } } = {};
const CACHE_TTL = 30 * 1000; // 30 seconds

export function useDonorReport(weekStart?: string) {
  const cacheKey = weekStart || 'default';
  const validCached = cachedResponse[cacheKey] && (Date.now() - cachedResponse[cacheKey].timestamp < CACHE_TTL)
    ? cachedResponse[cacheKey].data
    : null;

  const [data, setData] = useState<DonorReportResponse | null>(validCached);
  const [loading, setLoading] = useState<boolean>(!validCached);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      const currentCached = cachedResponse[cacheKey] && (Date.now() - cachedResponse[cacheKey].timestamp < CACHE_TTL)
        ? cachedResponse[cacheKey].data
        : null;

      if (currentCached) {
        setData(currentCached);
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        const query = weekStart ? `?week_start=${encodeURIComponent(weekStart)}` : '';
        const res = await fetch(`/api/donor-report${query}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        if (!res.ok) {
          throw new Error(`Donor report fetch returned ${res.status}`);
        }
        const json: DonorReportResponse = await res.json();
        cachedResponse[cacheKey] = { data: json, timestamp: Date.now() };
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

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [cacheKey, weekStart]);

  return { data, loading, error };
}
