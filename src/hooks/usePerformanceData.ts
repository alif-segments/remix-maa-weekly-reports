import { useMemo, useState, useEffect } from 'react';
import { RawData, PeriodMetrics, MetricsSummary } from '@/src/types';
import { API_URL } from '@/src/constants';

export function usePerformanceData() {
  const [data, setData] = useState<RawData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        const response = await fetch(API_URL);
        const result = await response.json();
        setData(result.data || result);
      } catch (err) {
        console.error("Fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPerformance();
  }, []);

  const metrics = useMemo(() => {
    if (!data.length || !Array.isArray(data)) return null;

    const sortedData = [...data].filter(d => d.date).sort((a, b) => a.date.localeCompare(b.date));
    if (!sortedData.length) return null;
    
    const maxDateStr = sortedData[sortedData.length - 1].date;
    const maxDate = new Date(maxDateStr);
    
    const currentDates: string[] = [];
    const priorDates: string[] = [];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(maxDate);
      d.setDate(d.getDate() - i);
      currentDates.push(d.toISOString().split('T')[0]);
    }
    for (let i = 7; i < 14; i++) {
      const d = new Date(maxDate);
      d.setDate(d.getDate() - i);
      priorDates.push(d.toISOString().split('T')[0]);
    }

    const processPeriod = (periodDates: string[]) => {
      const pData = sortedData.filter(d => periodDates.includes(d.date));
      const result: PeriodMetrics = {
        total: { spend: 0, clicks: 0, conversions: 0, revenue: 0, lpv: 0, ctr: 0 },
        byCampaign: {},
        byCreative: {}
      };

      const parse = (v: any) => {
        if (v === null || v === undefined) return 0;
        const n = parseFloat(v);
        return isNaN(n) ? 0 : n;
      };

      pData.forEach(row => {
        const isSeparate = row.account_name.includes("Grants") || row.account_name.includes("328-834-3137");
        const spend = parse(row.spend || row.cost);
        const clicks = parseInt(String(row.clicks || "0"));
        
        let conv = 0;
        let rev = 0;
        let lpv = parseInt(String(row.actions_landing_page_view || "0"));

        if (row.datasource?.toLowerCase() === 'facebook') {
          conv = parse(row.actions_offsite_conversion_fb_pixel_purchase) || parse(row.conversions);
          rev = parse(row.action_values_omni_purchase) || parse(row.conversion_value);
        } else {
          conv = parse(row.conversions);
          rev = parse(row.conversion_value);
        }

        if (!isSeparate) {
          result.total.spend += spend;
          result.total.clicks += clicks;
          result.total.conversions += conv;
          result.total.revenue += rev;
          result.total.lpv += lpv;
        }

        if (!result.byCampaign[row.campaign]) {
          result.byCampaign[row.campaign] = { spend: 0, clicks: 0, conversions: 0, revenue: 0, lpv: 0, ctr: 0, source: row.datasource + (isSeparate ? "_separate" : "") };
        }
        const c = result.byCampaign[row.campaign];
        c.spend += spend;
        c.clicks += clicks;
        c.conversions += conv;
        c.revenue += rev;
        c.lpv += lpv;

        if (row.datasource?.toLowerCase() === 'facebook') {
          const creativeName = row.name || row.campaign || "Unnamed Creative";
          if (!result.byCreative[creativeName]) {
            result.byCreative[creativeName] = { 
              spend: 0, clicks: 0, conversions: 0, revenue: 0, lpv: 0, ctr: 0, 
              campaign: row.campaign, preview_url: row.mobile_feed_standard_preview_url 
            };
          }
          const cr = result.byCreative[creativeName];
          cr.spend += spend;
          cr.clicks += clicks;
          cr.conversions += conv;
          cr.revenue += rev;
        }
      });

      return result;
    };

    const current = processPeriod(currentDates);
    const prior = processPeriod(priorDates);

    const weeks: Record<string, { week: string, year: string, spend: number, conversions: number, revenue: number, startDate: string, endDate: string }> = {};
    const parse = (v: any) => {
      if (v === null || v === undefined) return 0;
      const n = parseFloat(v);
      return isNaN(n) ? 0 : n;
    };

    const getWeekKey = (dStr: string) => {
      const d = new Date(dStr);
      const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      return `${date.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
    };

    data.forEach(row => {
      if (!row.date) return;
      const weekKey = row.week_iso || getWeekKey(row.date);
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = { week: weekKey, year: row.date.split('-')[0], spend: 0, conversions: 0, revenue: 0, startDate: row.date, endDate: row.date };
      } else {
        if (row.date < weeks[weekKey].startDate) weeks[weekKey].startDate = row.date;
        if (row.date > weeks[weekKey].endDate) weeks[weekKey].endDate = row.date;
      }
      
      const spend = parse(row.spend || row.cost);
      let conv = 0;
      let rev = 0;
      if (row.datasource?.toLowerCase() === 'facebook') {
        conv = parse(row.actions_offsite_conversion_fb_pixel_purchase) || parse(row.conversions);
        rev = parse(row.action_values_omni_purchase) || parse(row.conversion_value);
      } else {
        conv = parse(row.conversions);
        rev = parse(row.conversion_value);
      }
      
      const isSeparate = row.account_name.includes("Grants") || row.account_name.includes("328-834-3137");
      if (!isSeparate) {
        weeks[weekKey].spend += spend;
        weeks[weekKey].conversions += conv;
        weeks[weekKey].revenue += rev;
      }
    });

    const formatD = (d: string) => {
      const date = new Date(d);
      return date.toLocaleDateString('en-AU', { day: '2-digit', month: 'short' });
    };

    const weeklyPerf = Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, w]) => ({
        ...w,
        roas: w.spend > 0 ? w.revenue / w.spend : 0,
        label: `${formatD(w.startDate)} - ${formatD(w.endDate)}`
      }))
      .slice(-12);

    const calcDelta = (cur: number, pri: number) => {
      if (pri === 0) return "NEW";
      const diff = ((cur - pri) / pri) * 100;
      return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`;
    };

    const getTrend = (cur: number, pri: number, invert = false) => {
      if (pri === 0) return 'neutral';
      if (cur === pri) return 'neutral';
      const isUp = cur > pri;
      return invert ? (isUp ? 'down' : 'up') : (isUp ? 'up' : 'down');
    };

    return {
      current,
      prior,
      startDate: currentDates[currentDates.length - 1],
      endDate: currentDates[0],
      deltas: {
        revenue: calcDelta(current.total.revenue, prior.total.revenue),
        spend: calcDelta(current.total.spend, prior.total.spend),
        roas: calcDelta(current.total.revenue / Math.max(1, current.total.spend), prior.total.revenue / Math.max(1, prior.total.spend)),
        sales: calcDelta(current.total.conversions, prior.total.conversions)
      },
      trends: {
        revenue: getTrend(current.total.revenue, prior.total.revenue),
        spend: getTrend(current.total.spend, prior.total.spend, true),
        roas: getTrend(current.total.revenue / Math.max(1, current.total.spend), prior.total.revenue / Math.max(1, prior.total.spend)),
        sales: getTrend(current.total.conversions, prior.total.conversions)
      },
      weeklyPerf
    };
  }, [data]);

  return { metrics, loading };
}
