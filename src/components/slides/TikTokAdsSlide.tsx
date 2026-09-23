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
  { name: 'Hearing Aid', spend: 699.88, conversions: 23, revenue: 3050.00, clicks: 820 },
  { name: 'Sudan', spend: 696.40, conversions: 31, revenue: 3300.00, clicks: 940 },
  { name: 'Gaza Refugees', spend: 505.29, conversions: 8, revenue: 350.00, clicks: 610 },
  { name: 'Water for Life', spend: 420.15, conversions: 11, revenue: 680.00, clicks: 520 },
  { name: 'Education Project', spend: 280.50, conversions: 6, revenue: 320.00, clicks: 340 },
  { name: 'Winter Appeal', spend: 145.30, conversions: 3, revenue: 150.00, clicks: 190 },
  { name: 'Yemen Crisis', spend: 65.40, conversions: 1, revenue: 40.00, clicks: 85 },
  { name: 'Emergency Relief', spend: 32.93, conversions: 0, revenue: 16.00, clicks: 42 },
  { name: 'Orphan Care', spend: 12.00, conversions: 0, revenue: 10.00, clicks: 18 }
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

  // Deltas: if live prior items exist calculate dynamically; otherwise use client baseline from report
  const priS = livePriorItems.reduce((a, b) => a + b.spend, 0);
  const priC = livePriorItems.reduce((a, b) => a + b.conversions, 0);
  const priR = livePriorItems.reduce((a, b) => a + b.revenue, 0);

  const deltaSpend = priS > 0 ? `${(((curS - priS) / priS) * 100).toFixed(1)}%` : '-17.4%';
  const trendSpend = priS > 0 ? (curS <= priS ? 'up' : 'down') : 'up';

  const deltaSales = priC > 0 ? `${(((curC - priC) / priC) * 100).toFixed(1)}%` : '-18.6%';
  const trendSales = priC > 0 ? (curC >= priC ? 'up' : 'down') : 'down';

  const deltaRev = priR > 0 ? `${(((curR - priR) / priR) * 100).toFixed(1)}%` : '-5.5%';
  const trendRev = priR > 0 ? (curR >= priR ? 'up' : 'down') : 'down';

  const curROASVal = curR / Math.max(1, curS);
  const priROASVal = priR / Math.max(1, priS);
  const deltaROAS = (priS > 0 && priR > 0) ? `${(((curROASVal - priROASVal) / priROASVal) * 100).toFixed(1)}%` : '+14.4%';
  const trendROAS = (priS > 0 && priR > 0) ? (curROASVal >= priROASVal ? 'up' : 'down') : 'up';

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

  const cpaValue = curC > 0 ? curS / curC : 34.43;
  const pctOfTotal = Math.round((curS / Math.max(1, metrics.current.total.spend)) * 100) || 16;

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
