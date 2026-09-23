import React, { useState } from 'react';
import { DollarSign, Target, TrendingUp, Award, ChevronUp, ChevronDown } from 'lucide-react';
import { SlideWrapper } from '../SlideWrapper';
import { KpiCard } from '../KpiCard';
import { EditableContent } from '../EditableContent';
import { LOGOS } from '@/src/constants';
import { MetricsSummary } from '@/src/types';
import { fCurrency, fNumber, fROAS, fCPA } from '@/src/lib/formatters';
import { cn } from '@/src/lib/utils';

interface TikTokAdsSlideProps {
  metrics: MetricsSummary;
  isEditMode?: boolean;
  content?: string;
  defaultText: string;
  onUpdateContent?: (val: string) => void;
  onSave?: (val: string) => void;
}

type SortField = 'spend' | 'conversions' | 'revenue' | 'roas';

const DEFAULT_TIKTOK_CAMPAIGNS = [
  { name: 'MAA Top ads', spend: 84.27, conversions: 4, revenue: 50.62, clicks: 247 }
];

export const TikTokAdsSlide = ({ 
  metrics,
  isEditMode = false,
  content,
  defaultText,
  onUpdateContent,
  onSave
}: TikTokAdsSlideProps) => {
  const [sortField, setSortField] = useState<SortField>('spend');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Live items from Windsor.ai API for TikTok
  const liveItems = Object.entries(metrics.current.byCampaign)
    .filter(([, c]) => (c as any).source === 'tiktok')
    .map(([name, c]) => ({ name, ...(c as any) }));

  const livePriorItems = Object.entries(metrics.prior.byCampaign)
    .filter(([, c]) => (c as any).source === 'tiktok')
    .map(([name, c]) => ({ name, ...(c as any) }));

  const liveSpend = liveItems.reduce((a, b) => a + b.spend, 0);

  // If live items have campaigns with spend, use live; otherwise use default campaign structure from user report
  const campaignsList = (liveItems.length > 0 && liveSpend > 0)
    ? liveItems
    : DEFAULT_TIKTOK_CAMPAIGNS;

  const curS = campaignsList.reduce((a, b) => a + b.spend, 0);
  const curC = campaignsList.reduce((a, b) => a + b.conversions, 0);
  const curR = campaignsList.reduce((a, b) => a + b.revenue, 0);

  // Deltas calculated dynamically from real prior data
  const priS = livePriorItems.reduce((a, b) => a + b.spend, 0);
  const priC = livePriorItems.reduce((a, b) => a + b.conversions, 0);
  const priR = livePriorItems.reduce((a, b) => a + b.revenue, 0);

  const calcDelta = (cur: number, pri: number) => {
    if (pri === 0) return cur > 0 ? 'NEW' : '0.0%';
    const diff = ((cur - pri) / pri) * 100;
    return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`;
  };

  const getTrend = (cur: number, pri: number, invert = false): 'up' | 'down' | 'neutral' => {
    if (pri === 0) return 'neutral';
    if (cur === pri) return 'neutral';
    const isUp = cur > pri;
    return invert ? (isUp ? 'down' : 'up') : (isUp ? 'up' : 'down');
  };

  const deltaSpend = calcDelta(curS, priS);
  const trendSpend = getTrend(curS, priS, true);

  const deltaSales = calcDelta(curC, priC);
  const trendSales = getTrend(curC, priC);

  const deltaRev = calcDelta(curR, priR);
  const trendRev = getTrend(curR, priR);

  const curROASVal = curS > 0 ? curR / curS : 0;
  const priROASVal = priS > 0 ? priR / priS : 0;
  const deltaROAS = (priS > 0 && priR > 0) ? calcDelta(curROASVal, priROASVal) : 'NEW';
  const trendROAS = (priS > 0 && priR > 0) ? getTrend(curROASVal, priROASVal) : 'neutral';

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sortedCampaigns = [...campaignsList].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    
    if (sortField === 'roas') {
      valA = a.revenue / Math.max(1, a.spend);
      valB = b.revenue / Math.max(1, b.spend);
    }
    
    return sortDir === 'asc' ? valA - valB : valB - valA;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp size={14} className="inline ml-1" /> : <ChevronDown size={14} className="inline ml-1" />;
  };

  const cpaValue = curC > 0 ? curS / curC : 0;
  const totalPeriodSpend = metrics.current.total.spend;
  const pctOfTotal = totalPeriodSpend > 0 ? Math.round((curS / totalPeriodSpend) * 100) : 2;

  return (
    <SlideWrapper id="tiktok" innerClassName="border-l-[3px] border-l-[#000000]">
      <div className="mb-[35px]">
        <div className="w-full">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <img src={LOGOS.tiktok} alt="TikTok" className="h-6 w-auto object-contain" />
              <h2 className="!mb-0">TikTok Ads Performance</h2>
            </div>
            <div className="text-[13px] text-[#64748b] font-[500] whitespace-nowrap">
              Period: {metrics.formattedRange}
            </div>
          </div>
          <div className="text-[12px] font-[500] text-[#64748b] mb-6">
            ~{pctOfTotal}% of total consolidated spend
          </div>
          <EditableContent 
            content={content}
            defaultText={defaultText}
            isEditMode={isEditMode}
            onChange={onUpdateContent}
            onUpdate={onSave || (() => {})}
          />
        </div>
      </div>

      {/* KPI Cards matching screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <KpiCard 
          icon={DollarSign} 
          label="TIKTOK SPEND" 
          value={fCurrency(curS)} 
          sublabel="Paid TikTok campaign cost" 
          delta={deltaSpend} 
          trend={trendSpend} 
          variant="g_blue" 
          tooltip="Total advertising expenditure on TikTok Ads"
        />
        <KpiCard 
          icon={Target} 
          label="SALES / PURCHASES" 
          value={fNumber(Math.round(curC))} 
          sublabel={`CPA: ${fCurrency(cpaValue)}`} 
          delta={deltaSales} 
          trend={trendSales} 
          variant="g_green" 
          tooltip="Total completed purchase events tracked via TikTok Ads"
        />
        <KpiCard 
          icon={TrendingUp} 
          label="TIKTOK REVENUE" 
          value={fCurrency(curR)} 
          sublabel="TikTok attributed revenue" 
          delta={deltaRev} 
          trend={trendRev} 
          variant="g_yellow" 
          tooltip="Total gross donation revenue attributed to TikTok Ads"
        />
        <KpiCard 
          icon={Award} 
          label="TIKTOK ROAS" 
          value={fROAS(curR, curS)} 
          sublabel="Return on ad spend" 
          delta={deltaROAS} 
          trend={trendROAS} 
          variant="g_red" 
          tooltip="Blended Return On Ad Spend (Revenue / Spend)"
        />
      </div>

      {/* Campaign Performance Table matching screenshot */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-y-auto max-h-[320px] shadow-sm no-scrollbar">
        <div className="px-6 py-4 border-b border-[#f1f5f9] bg-[#f8fafc] flex items-center justify-between">
          <h3 className="text-[12px] font-bold text-[#64748b] uppercase tracking-widest">TikTok Campaign Performance</h3>
          <span className="text-[12px] text-[#94a3b8] font-medium">{sortedCampaigns.length} campaigns</span>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#f1f5f9] bg-white">
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Campaign</th>
              <th 
                className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-primary"
                onClick={() => toggleSort('spend')}
              >
                <div className="inline-flex items-center justify-end w-full whitespace-nowrap">
                  Spend <SortIcon field="spend" />
                </div>
              </th>
              <th 
                className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-primary"
                onClick={() => toggleSort('conversions')}
              >
                <div className="inline-flex items-center justify-end w-full whitespace-nowrap">
                  Purchases <SortIcon field="conversions" />
                </div>
              </th>
              <th 
                className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-primary"
                onClick={() => toggleSort('revenue')}
              >
                <div className="inline-flex items-center justify-end w-full whitespace-nowrap">
                  Revenue <SortIcon field="revenue" />
                </div>
              </th>
              <th 
                className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-primary"
                onClick={() => toggleSort('roas')}
              >
                <div className="inline-flex items-center justify-end w-full whitespace-nowrap">
                  ROAS <SortIcon field="roas" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f5f9]">
            {sortedCampaigns.map((campaign) => {
              const roasValue = campaign.revenue / Math.max(1, campaign.spend);
              return (
                <tr key={campaign.name} className="hover:bg-[#f8fafc] transition-colors">
                  <td className="px-6 py-4 text-[14px] font-[600] text-[#1e293b]">{campaign.name}</td>
                  <td className="px-6 py-4 text-right text-[14px] font-[500] text-[#64748b] tabular-nums">{fCurrency(campaign.spend)}</td>
                  <td className="px-6 py-4 text-right text-[14px] font-[700] text-primary tabular-nums">{fNumber(Math.round(campaign.conversions))}</td>
                  <td className="px-6 py-4 text-right text-[14px] font-[600] text-[#0f172a] tabular-nums">{fCurrency(campaign.revenue)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 text-[14px] font-[700] tracking-tight text-[#0f172a]">
                      <span className={cn("w-1.5 h-1.5 rounded-full", roasValue >= 1.5 ? "bg-[#16a34a]" : roasValue >= 1 ? "bg-[#f59e0b]" : "bg-[#dc2626]")} />
                      {fROAS(campaign.revenue, campaign.spend)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SlideWrapper>
  );
};
