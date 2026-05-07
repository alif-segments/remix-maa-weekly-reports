export interface RawData {
  account_name: string;
  campaign: string;
  clicks: string;
  datasource: "facebook" | "google_ads";
  date: string;
  spend: string;
  cost: string;
  conversions: string;
  ctr: string;
  name?: string;
  actions_landing_page_view?: string;
  actions_lead?: string;
  actions_offsite_conversion_fb_pixel_purchase?: string;
  action_values_omni_purchase?: string;
  conversion_value?: string;
  mobile_feed_standard_preview_url?: string;
  week_iso?: string;
}

export interface ProcessedMetric {
  spend: number;
  clicks: number;
  conversions: number;
  revenue: number;
  lpv: number; // landing page views
  ctr: number;
}

export interface PeriodMetrics {
  total: ProcessedMetric;
  byCampaign: Record<string, ProcessedMetric & { source: string }>;
  byCreative: Record<string, ProcessedMetric & { campaign: string, preview_url?: string }>;
}

export interface MetricsSummary {
  current: PeriodMetrics;
  prior: PeriodMetrics;
  startDate: string;
  endDate: string;
  deltas: {
    revenue: string;
    spend: string;
    roas: string;
    sales: string;
  };
  trends: {
    revenue: 'up' | 'down' | 'neutral';
    spend: 'up' | 'down' | 'neutral';
    roas: 'up' | 'down' | 'neutral';
    sales: 'up' | 'down' | 'neutral';
  };
  weeklyPerf: any[];
  dailyTrend: any[]; // Missing in previous read but seems to exist based on my edits
  ga4?: GA4MetricsSummary;
}

export interface GA4MetricsSummary {
  current: GA4PeriodMetrics;
  prior: GA4PeriodMetrics;
  deltas: {
    sessions: string;
    transactions: string;
    revenue: string;
  };
  trends: {
    sessions: 'up' | 'down' | 'neutral';
    transactions: 'up' | 'down' | 'neutral';
    revenue: 'up' | 'down' | 'neutral';
  };
  weeklyTrend: any[];
  channelSplit: { channel: string; sessions: number; transactions: number; revenue: number }[];
}

export interface GA4PeriodMetrics {
  sessions: number;
  transactions: number;
  revenue: number;
  users: number;
}
