import React, { useState } from 'react';
import { DollarSign, Target, TrendingUp, Award, ChevronUp, ChevronDown } from 'lucide-react';
import { SlideWrapper } from '../SlideWrapper';
import { KpiCard } from '../KpiCard';
import { EditableContent } from '../EditableContent';
import { LOGOS } from '@/src/constants';
import { MetricsSummary } from '@/src/types';
import { fCurrency, fNumber, fROAS, fCPA } from '@/src/lib/formatters';
import { cn } from '@/src/lib/utils';

interface MetaAdsSlideProps {
  metrics: MetricsSummary;
  isEditMode?: boolean;
  content?: string;
  defaultText: string;
  onUpdateContent?: (val: string) => void;
  onSave?: (val: string) => void;
}

type SortField = 'spend' | 'conversions' | 'revenue' | 'roas';

export const MetaAdsSlide = ({ 
  metrics,
  isEditMode = false,
  content,
  defaultText,
  onUpdateContent,
  onSave
}: MetaAdsSlideProps) => {
  const [sortField, setSortField] = useState<SortField>('spend');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const metaItems = Object.entries(metrics.current.byCampaign)
    .filter(([, c]) => (c as any).source === 'facebook')
    .map(([name, c]) => ({ name, ...(c as any) }));
  
  const pMetaItems = Object.entries(metrics.prior.byCampaign)
    .filter(([, c]) => (c as any).source === 'facebook')
    .map(([name, c]) => ({ name, ...(c as any) }));
  
  const curS = metaItems.reduce((a, b) => a + b.spend, 0);
  const priS = pMetaItems.reduce((a, b) => a + b.spend, 0);
  const curC = metaItems.reduce((a, b) => a + b.conversions, 0);
  const priC = pMetaItems.reduce((a, b) => a + b.conversions, 0);
  const curR = metaItems.reduce((a, b) => a + b.revenue, 0);
  const priR = pMetaItems.reduce((a, b) => a + b.revenue, 0);

  const calcD = (c: number, p: number) => {
    if (p === 0) return "NEW";
    const d = ((c - p) / Math.max(1, p)) * 100;
    return `${d > 0 ? '+' : ''}${d.toFixed(1)}%`;
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sortedCampaigns = [...metaItems].sort((a, b) => {
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

  return (
    <SlideWrapper id="meta" innerClassName="border-l-[3px] border-l-[#2563eb]">
      <div className="mb-[35px]">
        <div className="w-full">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <img src={LOGOS.meta} alt="Meta" className="h-6 w-auto object-contain" />
              <h2 className="!mb-0">Meta Ads Performance</h2>
            </div>
            <div className="text-[13px] text-[#64748b] font-[500] whitespace-nowrap">
              Period: {metrics.formattedRange}
            </div>
          </div>
          <div className="text-[12px] font-[500] text-[#64748b] mb-6">
             ~{(curS / Math.max(1, metrics.current.total.spend) * 100).toFixed(0)}% of total consolidated spend
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <KpiCard icon={DollarSign} label="Meta Spend" value={fCurrency(curS)} sublabel="Facebook & IG cost" delta={calcD(curS, priS)} trend={curS <= priS ? 'up' : 'down'} variant="m_light" />
        <KpiCard icon={Target} label="Conversions" value={fNumber(Math.round(curC))} sublabel="Pixel tracked sales" delta={calcD(curC, priC)} trend={curC >= priC ? 'up' : 'down'} variant="m_mid" />
        <KpiCard icon={TrendingUp} label="Revenue" value={fCurrency(curR)} sublabel="Total omni revenue" delta={calcD(curR, priR)} trend={curR >= priR ? 'up' : 'down'} variant="m_blue" />
        <KpiCard icon={Award} label="Meta ROAS" value={fROAS(curR, curS)} sublabel="Direct ad efficiency" delta={calcD(curR/Math.max(1, curS), priR/Math.max(1, priS))} trend={curR/Math.max(1, curS) >= priR/Math.max(1, priS) ? 'up' : 'down'} variant="m_dark" />
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-y-auto max-h-[280px] shadow-sm no-scrollbar">
        <div className="px-6 py-4 border-b border-[#f1f5f9] bg-[#f8fafc]">
          <h3 className="text-[12px] font-bold text-[#64748b] uppercase tracking-widest">Campaign Performance</h3>
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
                  Conv. <SortIcon field="conversions" />
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
                      <span className={cn("w-1.5 h-1.5 rounded-full", roasValue > 2 ? "bg-[#16a34a]" : roasValue >= 1 ? "bg-[#f59e0b]" : "bg-[#dc2626]")} />
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
