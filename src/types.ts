export interface RawData {
  account_name: string;
  campaign: string;
  clicks: string;
  datasource: "facebook" | "google_ads" | "tiktok" | string;
  date: string;
  spend: string;
  cost?: string;
  conversions?: string;
  ctr?: string;
  name?: string;
  actions_landing_page_view?: string;
  actions_lead?: string;
  actions_offsite_conversion_fb_pixel_purchase?: string;
  action_values_omni_purchase?: string;
  conversion_value?: string;
  mobile_feed_standard_preview_url?: string;
  week_iso?: string;
  currency?: string;
  total_complete_payment_rate?: string | number;
  complete_payment?: string | number;
  total_complete_payment_value?: string | number;
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
  google_ads: ProcessedMetric;
  meta_ads: ProcessedMetric;
  tiktok_ads?: ProcessedMetric;
  google_grants: { clicks: number; spend: number; conversions: number; revenue: number };
  byCampaign: Record<string, ProcessedMetric & { source: string }>;
  byCreative: Record<string, ProcessedMetric & { campaign: string, preview_url?: string }>;
}

export interface MetricsSummary {
  current: PeriodMetrics;
  prior: PeriodMetrics;
  startDate: string;
  endDate: string;
  formattedRange?: string;
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

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface DatePreset {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
}

export interface GA4MetricsSummary {
  current: GA4PeriodMetrics;
  prior: GA4PeriodMetrics;
  engagementRate: number;
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

export interface DonorBucket {
  count: number;
  value: number;
}

export interface DonorWeek {
  week_start: string;
  week_end: string;
  total: DonorBucket;
  new_donor: DonorBucket;
  existing_donor: DonorBucket;
  guest: DonorBucket;
  recurring: DonorBucket;
  one_time: DonorBucket;
  mixed_count: number;
}

export interface DonorTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  week: string; // Monday YYYY-MM-DD
  cls: 'new' | 'existing' | 'guest';
  total: number;
  one: number;
  rec: number;
  mixed: boolean;
  type: string;
  timestamp: number;
}

export interface DonorMetricsSummary {
  period: {
    startDate: string;
    endDate: string;
    formattedRange: string;
  };
  total: DonorBucket;
  new_donor: DonorBucket;
  existing_donor: DonorBucket;
  guest: DonorBucket;
  recurring: DonorBucket;
  one_time: DonorBucket;
  prior: {
    total: DonorBucket;
    new_donor: DonorBucket;
    existing_donor: DonorBucket;
    guest: DonorBucket;
    recurring: DonorBucket;
    one_time: DonorBucket;
  };
  deltas: {
    total: string;
    new_donor: string;
    existing_donor: string;
    recurring: string;
    one_time: string;
  };
  trends: {
    total: 'up' | 'down' | 'neutral';
    new_donor: 'up' | 'down' | 'neutral';
    existing_donor: 'up' | 'down' | 'neutral';
    recurring: 'up' | 'down' | 'neutral';
    one_time: 'up' | 'down' | 'neutral';
  };
  avgDonation: number;
  avgNewDonor: number;
  avgExistingDonor: number;
  recurringShare: number;
  transactions: DonorTransaction[];
}

export interface DonorReportResponse {
  generated_at: string;
  timezone: string;
  currency: string;
  current: DonorWeek;
  previous: DonorWeek;
  weeks: DonorWeek[];
  active_weeks?: DonorWeek[];
  transactions?: DonorTransaction[];
}
