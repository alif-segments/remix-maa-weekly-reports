import { useState, useEffect } from 'react';
import { DonorReportResponse } from '../types';

let cachedResponse: { [key: string]: DonorReportResponse } = {};

export function useDonorReport(weekStart?: string) {
  const cacheKey = weekStart || 'default';
  const [data, setData] = useState<DonorReportResponse | null>(cachedResponse[cacheKey] || null);
  const [loading, setLoading] = useState<boolean>(!cachedResponse[cacheKey]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      if (cachedResponse[cacheKey]) {
        setData(cachedResponse[cacheKey]);
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        const query = weekStart ? `?week_start=${encodeURIComponent(weekStart)}` : '';
        const res = await fetch(`/api/donor-report${query}`);
        if (!res.ok) {
          throw new Error(`Donor report fetch returned ${res.status}`);
        }
        const json: DonorReportResponse = await res.json();
        cachedResponse[cacheKey] = json;
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
