import { useMemo, useState, useEffect } from 'react';
import { RawData, PeriodMetrics, MetricsSummary, GA4PeriodMetrics, GA4MetricsSummary, DateRange } from '@/src/types';
import { API_URL, GA4_API_URL, TIKTOK_ADS_API_URL } from '@/src/constants';
import { getDefaultDateRange } from '@/src/utils/datePresets';

// In-memory client cache to make subsequent renders, date changes, and tab switches instantaneous
let memoryCachedData: { combinedData: RawData[]; loadedGa4: any[] } | null = null;

export function usePerformanceData(customRange?: DateRange | null) {
  const [data, setData] = useState<RawData[]>(() => memoryCachedData?.combinedData || []);
  const [ga4Data, setGa4Data] = useState<any[]>(() => memoryCachedData?.loadedGa4 || []);
  const [loading, setLoading] = useState<boolean>(() => !memoryCachedData);

  useEffect(() => {
    const fetchData = async () => {
      // If we already have memory cache, skip verbose initial log unless refreshing
      if (!memoryCachedData) {
        console.info("[usePerformanceData] Fetching ads performance and GA4 web analytics data...");
      }
      try {
        let perfResult: any = null;
        let ga4Result: any = null;
        let tiktokResult: any = null;

        // Fetch via fast-cached server proxy first (sub-100ms response vs 4-8s slow direct connection)
        try {
          const [perfRes, ga4Res, tiktokRes] = await Promise.all([
            fetch('/api/proxy/perf').catch(() => null),
            fetch('/api/proxy/ga4').catch(() => null),
            fetch('/api/proxy/tiktok').catch(() => null)
          ]);

          if (perfRes && perfRes.ok && ga4Res && ga4Res.ok) {
            perfResult = await perfRes.json();
            ga4Result = await ga4Res.json();
            if (tiktokRes && tiktokRes.ok) {
              tiktokResult = await tiktokRes.json().catch(() => null);
            }
          } else {
            throw new Error("Proxy response invalid or unready");
          }
        } catch (proxyErr) {
          console.warn("[usePerformanceData] Proxy fetch fallback to direct:", proxyErr);
          // Fallback to direct Windsor.ai endpoints if proxy is unavailable
          const [perfRes, ga4Res, tiktokRes] = await Promise.all([
            fetch(API_URL),
            fetch(GA4_API_URL),
            fetch(TIKTOK_ADS_API_URL).catch(() => null)
          ]);
          perfResult = await perfRes.json();
          ga4Result = await ga4Res.json();
          if (tiktokRes && tiktokRes.ok) {
            tiktokResult = await tiktokRes.json().catch(() => null);
          }
        }
        
        const perfRows: RawData[] = Array.isArray(perfResult?.data) ? perfResult.data : (Array.isArray(perfResult) ? perfResult : []);
        const tiktokRows: RawData[] = Array.isArray(tiktokResult?.data) 
          ? tiktokResult.data.map((r: any) => ({ ...r, datasource: 'tiktok' })) 
          : (Array.isArray(tiktokResult) ? tiktokResult.map((r: any) => ({ ...r, datasource: 'tiktok' })) : []);

        const combinedData = [...perfRows, ...tiktokRows];
        const loadedGa4 = ga4Result?.data || ga4Result || [];

        console.info(
          `[usePerformanceData] Data successfully loaded:\n` +
          `  • Total ad rows: ${combinedData.length} (Meta & Google: ${perfRows.length}, TikTok: ${tiktokRows.length})\n` +
          `  • GA4 analytics rows: ${Array.isArray(loadedGa4) ? loadedGa4.length : 0}`
        );

        memoryCachedData = { combinedData, loadedGa4 };
        setData(combinedData);
        setGa4Data(loadedGa4);
      } catch (err) {
        console.error("[usePerformanceData] Performance data fetch failed:", err);
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
    
    // Calculate date range:
    // If customRange is provided and valid, use it. Otherwise default to previous full week (Monday to Sunday)
    let selectedStartDate = customRange?.startDate;
    let selectedEndDate = customRange?.endDate;

    if (!selectedStartDate || !selectedEndDate) {
      const defaultRange = getDefaultDateRange();
      selectedStartDate = defaultRange.startDate;
      selectedEndDate = defaultRange.endDate;
      console.info(`[usePerformanceData] No custom date range specified. Applied Australia/Sydney default: ${selectedStartDate} to ${selectedEndDate}`);
    } else {
      console.info(`[usePerformanceData] Active date range: ${selectedStartDate} to ${selectedEndDate}`);
    }

    if (selectedStartDate > selectedEndDate) {
      const swap = selectedStartDate;
      selectedStartDate = selectedEndDate;
      selectedEndDate = swap;
    }

    const getMondayAndSundayOfDate = (dStr: string) => {
      const d = new Date(`${dStr}T00:00:00Z`);
      const day = d.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const diffToMonday = day === 0 ? -6 : 1 - day;
      
      const monday = new Date(d);
      monday.setUTCDate(d.getUTCDate() + diffToMonday);
      
      const sunday = new Date(monday);
      sunday.setUTCDate(monday.getUTCDate() + 6);
      
      return {
        monday: monday.toISOString().split('T')[0],
        sunday: sunday.toISOString().split('T')[0]
      };
    };

    const { sunday: reportEndSunday } = getMondayAndSundayOfDate(selectedEndDate);
    
    // Build currentDates from selectedStartDate to selectedEndDate
    const currentDates: string[] = [];
    const curD = new Date(`${selectedStartDate}T00:00:00Z`);
    const endD = new Date(`${selectedEndDate}T00:00:00Z`);
    const walkD = new Date(endD);
    while (walkD >= curD) {
      currentDates.push(walkD.toISOString().split('T')[0]);
      walkD.setUTCDate(walkD.getUTCDate() - 1);
    }
    
    // Prior period: same duration (number of days) immediately preceding selectedStartDate
    const priorDates: string[] = [];
    const priorEndD = new Date(`${selectedStartDate}T00:00:00Z`);
    priorEndD.setUTCDate(priorEndD.getUTCDate() - 1);
    for (let i = 0; i < currentDates.length; i++) {
      const d = new Date(priorEndD);
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
        tiktok_ads: { spend: 0, clicks: 0, conversions: 0, revenue: 0, lpv: 0, ctr: 0 },
        google_grants: { clicks: 0, spend: 0, conversions: 0, revenue: 0 },
        events: { clicks: 0, spend: 0, conversions: 0, revenue: 0 },
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
        const isTikTok = ds === 'tiktok';
        const isGoogle = ds === 'googleads' || ds === 'google_ads' || (!isFacebook && !isTikTok && (row.account_name || '').includes("-")); // Fallback for IDs

        const isGrants = (row.account_name || '').toLowerCase().includes("grants");
        const accountId = (row.account_name || '').match(/(\d{3}-\d{3}-\d{4})/)?.[0] || "";
        const isGrantsAccount = isGrants || accountId === "328-834-3137";
        
        // Exclude all Event campaign data from main/consolidated MAA performance calculations
        const isEvent = (row.campaign || '').toLowerCase().includes("event");
        const isSeparate = isGrantsAccount || isEvent;
        
        const spend = parse(row.spend || row.cost);
        const clicks = parseInt(String(row.clicks || "0"));
        
        let conv = 0;
        let rev = 0;
        let lpv = parseInt(String(row.actions_landing_page_view || "0"));

        if (isFacebook) {
          conv = parse(row.actions_offsite_conversion_fb_pixel_purchase) || parse(row.conversions);
          rev = parse(row.action_values_omni_purchase) || parse(row.conversion_value);
        } else if (isTikTok) {
          conv = parse(row.complete_payment) || parse(row.conversions);
          rev = parse(row.total_complete_payment_rate) || parse(row.total_complete_payment_value) || parse(row.conversion_value) || parse(row.action_values_omni_purchase) || 0;
        } else {
          conv = parse(row.conversions);
          rev = parse(row.conversion_value);
        }

        if (isEvent) {
          // Event campaigns kept separate - excluded from consolidated MAA totals & platform rollups
          if (result.events) {
            result.events.spend += spend;
            result.events.clicks += clicks;
            result.events.conversions += conv;
            result.events.revenue += rev;
          }
        } else if (isGrantsAccount) {
          result.google_grants.spend += spend;
          result.google_grants.clicks += clicks;
          result.google_grants.conversions += conv;
          result.google_grants.revenue += rev;
        } else {
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
          } else if (isTikTok && result.tiktok_ads) {
            result.tiktok_ads.spend += spend;
            result.tiktok_ads.clicks += clicks;
            result.tiktok_ads.conversions += conv;
            result.tiktok_ads.revenue += rev;
            result.tiktok_ads.lpv += lpv;
          } else {
            result.google_ads.spend += spend;
            result.google_ads.clicks += clicks;
            result.google_ads.conversions += conv;
            result.google_ads.revenue += rev;
            result.google_ads.lpv += lpv;
          }
        }

        const campaignKey = row.campaign || (isTikTok ? 'TikTok Campaign' : 'Unnamed Campaign');
        let campaignSource = ds;
        if (isTikTok) {
          campaignSource = 'tiktok';
        } else if (isEvent) {
          campaignSource = 'event';
        } else if (isGrantsAccount) {
          campaignSource = 'google_ads_separate';
        } else if (isFacebook) {
          campaignSource = 'facebook';
        } else {
          campaignSource = 'google_ads';
        }

        if (!result.byCampaign[campaignKey]) {
          result.byCampaign[campaignKey] = { 
            spend: 0, 
            clicks: 0, 
            conversions: 0, 
            revenue: 0, 
            lpv: 0, 
            ctr: 0, 
            source: campaignSource 
          };
        }
        const c = result.byCampaign[campaignKey];
        c.spend += spend;
        c.clicks += clicks;
        c.conversions += conv;
        c.revenue += rev;
        c.lpv += lpv;

        // Exclude Event creatives from creative leaderboard to prevent distorting creative analysis
        if (isFacebook && !isEvent) {
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
          cr.lpv += lpv;
        }
      });

      return result;
    };

    const current = processPeriod(currentDates);
    const prior = processPeriod(priorDates);

    console.info(
      `[usePerformanceData] Performance calculated for ${selectedStartDate} to ${selectedEndDate}:\n` +
      `  • Consolidated Spend: $${current.total.spend.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
      `  • Consolidated Revenue: $${current.total.revenue.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
      `  • Consolidated ROAS: ${current.total.spend > 0 ? (current.total.revenue / current.total.spend).toFixed(2) : '0.00'}x\n` +
      `  • Consolidated Conversions: ${current.total.conversions}\n` +
      `  • Excluded Event Campaign Spend: $${current.events?.spend.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} (Kept separate from main totals)\n` +
      `  • Excluded Google Grants Spend: $${current.google_grants?.spend.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`
    );

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
      const { monday: monStr, sunday: sunStr } = getMondayAndSundayOfDate(row.date);
      if (sunStr > reportEndSunday) return; // Skip rows after the report end date
      
      const weekKey = row.week_iso || getWeekKey(row.date);
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = { 
          week: weekKey, 
          year: monStr.split('-')[0], 
          spend: 0, 
          conversions: 0, 
          revenue: 0, 
          startDate: monStr, 
          endDate: sunStr 
        };
      }
      
      const spend = parse(row.spend || row.cost);
      let conv = 0;
      let rev = 0;
      if (row.datasource?.toLowerCase() === 'facebook') {
        conv = parse(row.actions_offsite_conversion_fb_pixel_purchase) || parse(row.conversions);
        rev = parse(row.action_values_omni_purchase) || parse(row.conversion_value);
      } else if (row.datasource?.toLowerCase() === 'tiktok') {
        conv = parse(row.complete_payment) || parse(row.conversions);
        rev = parse(row.total_complete_payment_rate) || parse(row.total_complete_payment_value) || parse(row.conversion_value) || parse(row.action_values_omni_purchase) || 0;
      } else {
        conv = parse(row.conversions);
        rev = parse(row.conversion_value);
      }
      
      const isEvent = (row.campaign || '').toLowerCase().includes("event");
      const isGrants = (row.account_name || '').includes("Grants") || (row.account_name || '').includes("328-834-3137");
      const isSeparate = isGrants || isEvent;
      if (!isSeparate) {
        weeks[weekKey].spend += spend;
        weeks[weekKey].conversions += conv;
        weeks[weekKey].revenue += rev;
      }
    });

    const formatD = (d: string) => {
      // Split and reconstruct to avoid timezone shifts, or use UTC
      const date = new Date(`${d}T00:00:00Z`);
      return date.toLocaleDateString('en-AU', { 
        day: '2-digit', 
        month: 'short',
        timeZone: 'UTC'
      });
    };

    const weeklyPerf = Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, w]) => ({
        ...w,
        roas: w.spend > 0 ? w.revenue / w.spend : 0,
        label: formatD(w.startDate),
        rangeLabel: `${formatD(w.startDate)} – ${formatD(w.endDate)}`
      }))
      .slice(-12);

    // DAILY TREND DATA for the current period
    const dailyDataRaw = sortedData
      .filter(d => currentDates.includes(d.date))
      .sort((a, b) => a.date.localeCompare(b.date));
    const dailyPerf = dailyDataRaw.reduce((acc: any, row) => {
      const date = formatD(row.date);
      if (!acc[date]) {
        acc[date] = { 
          date, 
          facebook: { spend: 0, revenue: 0, conv: 0 }, 
          google: { spend: 0, revenue: 0, conv: 0 },
          tiktok: { spend: 0, revenue: 0, conv: 0 }
        };
      }
      
      const spend = parse(row.spend || row.cost);
      let conv = 0;
      let rev = 0;
      if (row.datasource?.toLowerCase() === 'facebook') {
        conv = parse(row.actions_offsite_conversion_fb_pixel_purchase) || parse(row.conversions);
        rev = parse(row.action_values_omni_purchase) || parse(row.conversion_value);
      } else if (row.datasource?.toLowerCase() === 'tiktok') {
        conv = parse(row.complete_payment) || parse(row.conversions);
        rev = parse(row.total_complete_payment_rate) || parse(row.total_complete_payment_value) || parse(row.conversion_value) || parse(row.action_values_omni_purchase) || 0;
      } else {
        conv = parse(row.conversions);
        rev = parse(row.conversion_value);
      }

      let source = 'google';
      if (row.datasource?.toLowerCase() === 'facebook') source = 'facebook';
      else if (row.datasource?.toLowerCase() === 'tiktok') source = 'tiktok';
      
      const isEventRow = (row.campaign || '').toLowerCase().includes("event");
      const isGrantsRow = (row.account_name || '').includes("Grants") || (row.account_name || '').includes("328-834-3137");
      const isSeparateRow = isGrantsRow || isEventRow;

      if (!isSeparateRow && acc[date][source]) {
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
        const { monday: monStr, sunday: sunStr } = getMondayAndSundayOfDate(row.date);
        if (sunStr > reportEndSunday) return; // Skip rows after the report end date
        
        const wk = row.week_iso || getWeekKey(row.date);
        if (!ga4Weeks[wk]) {
          ga4Weeks[wk] = { 
            week: wk, 
            sessions: 0, 
            transactions: 0, 
            revenue: 0, 
            startDate: monStr, 
            endDate: sunStr 
          };
        }
        ga4Weeks[wk].sessions += parse(row.sessions);
        ga4Weeks[wk].transactions += parse(row.transactions || row.ecommerce_purchases);
        ga4Weeks[wk].revenue += parse(row.purchase_revenue || row.totalrevenue);
      });

      const weeklyTrend = Object.values(ga4Weeks)
        .sort((a: any, b: any) => a.week.localeCompare(b.week))
        .map((w: any) => ({
          ...w,
          label: formatD(w.startDate),
          rangeLabel: `${formatD(w.startDate)} – ${formatD(w.endDate)}`
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
      const d1 = new Date(`${s}T00:00:00Z`);
      const d2 = new Date(`${e}T00:00:00Z`);
      if (s === e) {
        return d1.toLocaleDateString('en-AU', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric',
          timeZone: 'UTC'
        });
      }
      const sameYear = d1.getUTCFullYear() === d2.getUTCFullYear();
      const sStr = d1.toLocaleDateString('en-AU', { 
        day: '2-digit', 
        month: 'short',
        ...(sameYear ? {} : { year: 'numeric' }),
        timeZone: 'UTC'
      });
      const eStr = d2.toLocaleDateString('en-AU', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric',
        timeZone: 'UTC'
      });
      return `${sStr} – ${eStr}`;
    };

    const ga4 = processGA4();

    return {
      current,
      prior,
      startDate: selectedStartDate,
      endDate: selectedEndDate,
      formattedRange: formatRange(selectedStartDate, selectedEndDate),
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
  }, [data, ga4Data, customRange?.startDate, customRange?.endDate]);

  return { metrics, loading };
}
