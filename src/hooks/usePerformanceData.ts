import { useMemo, useState, useEffect } from 'react';
import { RawData, PeriodMetrics, MetricsSummary, GA4PeriodMetrics, GA4MetricsSummary } from '@/src/types';
import { API_URL, GA4_API_URL } from '@/src/constants';

export function usePerformanceData() {
  const [data, setData] = useState<RawData[]>([]);
  const [ga4Data, setGa4Data] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [perfRes, ga4Res] = await Promise.all([
          fetch(API_URL),
          fetch(GA4_API_URL)
        ]);
        const perfResult = await perfRes.json();
        const ga4Result = await ga4Res.json();
        
        setData(perfResult.data || perfResult);
        setGa4Data(ga4Result.data || ga4Result);
      } catch (err) {
        console.error("Fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const metrics = useMemo(() => {
    if (!data.length || !Array.isArray(data)) return null;

    const sortedData = [...data].filter(d => d.date).sort((a, b) => a.date.localeCompare(b.date));
    if (!sortedData.length) return null;
    
    // Calculate date range: Previous full week (Monday to Sunday)
    const now = new Date();
    // Normalize to midnight UTC for consistent calculations
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    
    // Day of week: 0=Sun, 1=Mon, ..., 6=Sat
    const dayOfWeek = today.getUTCDay();
    // Find Monday of the current calendar week (distance to Mon)
    const offsetToCurrentMonday = (dayOfWeek + 6) % 7;
    
    // The report starts from the Monday of the PREVIOUS full week
    const lastMonday = new Date(today);
    lastMonday.setUTCDate(today.getUTCDate() - offsetToCurrentMonday - 7);
    
    // The report ends on the Sunday of the PREVIOUS full week
    const lastSunday = new Date(lastMonday);
    lastSunday.setUTCDate(lastMonday.getUTCDate() + 6);
    
    const currentDates: string[] = [];
    const priorDates: string[] = [];
    
    // Current period: Last Monday to Last Sunday (6 days after last Monday)
    for (let i = 0; i < 7; i++) {
      const d = new Date(lastSunday);
      d.setUTCDate(d.getUTCDate() - i);
      currentDates.push(d.toISOString().split('T')[0]);
    }
    
    // Prior period: The week before last Monday
    const priorSunday = new Date(lastMonday);
    priorSunday.setUTCDate(lastMonday.getUTCDate() - 1);
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(priorSunday);
      d.setUTCDate(d.getUTCDate() - i);
      priorDates.push(d.toISOString().split('T')[0]);
    }

    const calcDelta = (cur: number, pri: number) => {
      if (pri === 0) return "NEW";
      const diff = ((cur - pri) / pri) * 100;
      return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`;
    };

    const getTrend = (cur: number, pri: number, invert = false): 'up' | 'down' | 'neutral' => {
      if (pri === 0) return 'neutral';
      if (cur === pri) return 'neutral';
      const isUp = cur > pri;
      return invert ? (isUp ? 'down' : 'up') : (isUp ? 'up' : 'down');
    };

    const processPeriod = (periodDates: string[]) => {
      const pData = sortedData.filter(d => periodDates.includes(d.date));
      const result: PeriodMetrics = {
        total: { spend: 0, clicks: 0, conversions: 0, revenue: 0, lpv: 0, ctr: 0 },
        google_ads: { spend: 0, clicks: 0, conversions: 0, revenue: 0, lpv: 0, ctr: 0 },
        meta_ads: { spend: 0, clicks: 0, conversions: 0, revenue: 0, lpv: 0, ctr: 0 },
        google_grants: { clicks: 0, spend: 0, conversions: 0, revenue: 0 },
        byCampaign: {},
        byCreative: {}
      };

      const parse = (v: any) => {
        if (v === null || v === undefined) return 0;
        const n = parseFloat(v);
        return isNaN(n) ? 0 : n;
      };

      pData.forEach(row => {
        const ds = row.datasource?.toLowerCase() || '';
        const isFacebook = ds === 'facebook';
        const isGoogle = ds === 'googleads' || ds === 'google_ads' || (ds !== 'facebook' && row.account_name.includes("-")); // Fallback for IDs

        const isGrants = row.account_name.toLowerCase().includes("grants");
        const accountId = row.account_name.match(/(\d{3}-\d{3}-\d{4})/)?.[0] || "";
        const isSeparate = isGrants || accountId === "328-834-3137";
        
        const spend = parse(row.spend || row.cost);
        const clicks = parseInt(String(row.clicks || "0"));
        
        let conv = 0;
        let rev = 0;
        let lpv = parseInt(String(row.actions_landing_page_view || "0"));

        if (isFacebook) {
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

          if (isFacebook) {
            result.meta_ads.spend += spend;
            result.meta_ads.clicks += clicks;
            result.meta_ads.conversions += conv;
            result.meta_ads.revenue += rev;
            result.meta_ads.lpv += lpv;
          } else {
            result.google_ads.spend += spend;
            result.google_ads.clicks += clicks;
            result.google_ads.conversions += conv;
            result.google_ads.revenue += rev;
            result.google_ads.lpv += lpv;
          }
        } else {
          result.google_grants.spend += spend;
          result.google_grants.clicks += clicks;
          result.google_grants.conversions += conv;
          result.google_grants.revenue += rev;
        }

        if (!result.byCampaign[row.campaign]) {
          result.byCampaign[row.campaign] = { spend: 0, clicks: 0, conversions: 0, revenue: 0, lpv: 0, ctr: 0, source: ds + (isSeparate ? "_separate" : "") };
        }
        const c = result.byCampaign[row.campaign];
        c.spend += spend;
        c.clicks += clicks;
        c.conversions += conv;
        c.revenue += rev;
        c.lpv += lpv;

        if (isFacebook) {
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

    // DAILY TREND DATA (last 7 days)
    const dailyDataRaw = sortedData.filter(d => currentDates.includes(d.date)).reverse();
    const dailyPerf = dailyDataRaw.reduce((acc: any, row) => {
      const date = formatD(row.date);
      if (!acc[date]) {
        acc[date] = { date, facebook: { spend: 0, revenue: 0, conv: 0 }, google: { spend: 0, revenue: 0, conv: 0 } };
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

      const source = row.datasource?.toLowerCase() === 'facebook' ? 'facebook' : 'google';
      const isSeparate = row.account_name.includes("Grants") || row.account_name.includes("328-834-3137");

      if (!isSeparate) {
        acc[date][source].spend += spend;
        acc[date][source].revenue += rev;
        acc[date][source].conv += conv;
      }
      
      return acc;
    }, {});

    const dailyTrend = Object.values(dailyPerf);

    // GA4 PROCESSING
    const processGA4 = () => {
      if (!ga4Data.length) return undefined;
      
      const ga4Sorted = [...ga4Data].filter(d => d.date).sort((a, b) => a.date.localeCompare(b.date));
      const parse = (v: any) => {
        if (v === null || v === undefined) return 0;
        const n = parseFloat(v);
        return isNaN(n) ? 0 : n;
      };

      const processGA4Period = (pDates: string[]) => {
        const filtered = ga4Sorted.filter(d => pDates.includes(d.date));
        const res: GA4PeriodMetrics = { sessions: 0, transactions: 0, revenue: 0, users: 0 };
        filtered.forEach(row => {
          res.sessions += parse(row.sessions);
          res.transactions += parse(row.transactions || row.ecommerce_purchases);
          res.revenue += parse(row.purchase_revenue || row.totalrevenue);
          res.users += parse(row.totalusers);
        });
        return res;
      };

      const curGA4 = processGA4Period(currentDates);
      const priGA4 = processGA4Period(priorDates);

      // Channel Split
      const channelMap: Record<string, any> = {};
      ga4Sorted.filter(d => currentDates.includes(d.date)).forEach(row => {
        const channel = row.session_default_channel_group || "Unassigned";
        if (!channelMap[channel]) channelMap[channel] = { channel, sessions: 0, transactions: 0, revenue: 0 };
        channelMap[channel].sessions += parse(row.sessions);
        channelMap[channel].transactions += parse(row.transactions || row.ecommerce_purchases);
        channelMap[channel].revenue += parse(row.purchase_revenue || row.totalrevenue);
      });

      // Weekly Trend
      const ga4Weeks: Record<string, any> = {};
      ga4Sorted.forEach(row => {
        const wk = row.week_iso || getWeekKey(row.date);
        if (!ga4Weeks[wk]) ga4Weeks[wk] = { week: wk, sessions: 0, transactions: 0, revenue: 0, startDate: row.date, endDate: row.date };
        ga4Weeks[wk].sessions += parse(row.sessions);
        ga4Weeks[wk].transactions += parse(row.transactions || row.ecommerce_purchases);
        ga4Weeks[wk].revenue += parse(row.purchase_revenue || row.totalrevenue);
        if (row.date < ga4Weeks[wk].startDate) ga4Weeks[wk].startDate = row.date;
        if (row.date > ga4Weeks[wk].endDate) ga4Weeks[wk].endDate = row.date;
      });

      const weeklyTrend = Object.values(ga4Weeks)
        .sort((a: any, b: any) => a.week.localeCompare(b.week))
        .map((w: any) => ({
          ...w,
          label: `${formatD(w.startDate)} - ${formatD(w.endDate)}`
        }))
        .slice(-12);

      return {
        current: curGA4,
        prior: priGA4,
        engagementRate: curGA4.sessions > 0 ? (curGA4.transactions / curGA4.sessions) * 100 : 0,
        deltas: {
          sessions: calcDelta(curGA4.sessions, priGA4.sessions),
          transactions: calcDelta(curGA4.transactions, priGA4.transactions),
          revenue: calcDelta(curGA4.revenue, priGA4.revenue)
        },
        trends: {
          sessions: getTrend(curGA4.sessions, priGA4.sessions),
          transactions: getTrend(curGA4.transactions, priGA4.transactions),
          revenue: getTrend(curGA4.revenue, priGA4.revenue)
        },
        weeklyTrend,
        channelSplit: Object.values(channelMap).sort((a: any, b: any) => b.revenue - a.revenue)
      } as GA4MetricsSummary;
    };

    const formatRange = (s: string, e: string) => {
      if (!s || !e) return '';
      const d1 = new Date(s);
      const d2 = new Date(e);
      const sStr = d1.toLocaleDateString('en-AU', { day: '2-digit', month: 'short' });
      const eStr = d2.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
      return `${sStr} – ${eStr}`;
    };

    const ga4 = processGA4();

    return {
      current,
      prior,
      startDate: currentDates[currentDates.length - 1],
      endDate: currentDates[0],
      formattedRange: formatRange(currentDates[currentDates.length - 1], currentDates[0]),
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
      weeklyPerf,
      dailyTrend,
      ga4
    };
  }, [data, ga4Data]);

  return { metrics, loading };
}
