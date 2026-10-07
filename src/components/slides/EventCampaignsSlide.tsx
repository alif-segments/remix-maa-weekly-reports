import React, { useState } from 'react';
import { DollarSign, Target, TrendingUp, Calendar, ChevronUp, ChevronDown, Ticket } from 'lucide-react';
import { SlideWrapper } from '../SlideWrapper';
import { KpiCard } from '../KpiCard';
import { EditableContent } from '../EditableContent';
import { LOGOS } from '@/src/constants';
import { MetricsSummary } from '@/src/types';
import { fCurrency, fNumber, fROAS, fCPA } from '@/src/lib/formatters';
import { cn } from '@/src/lib/utils';

interface EventCampaignsSlideProps {
  metrics: MetricsSummary;
  isEditMode?: boolean;
  content?: string;
  defaultText?: string;
  onUpdateContent?: (val: string) => void;
  onSave?: (val: string) => void;
}

type SortField = 'spend' | 'conversions' | 'revenue' | 'roas';

export const EventCampaignsSlide = ({ 
  metrics,
  isEditMode = false,
  content,
  defaultText,
  onUpdateContent,
  onSave
}: EventCampaignsSlideProps) => {
  const [sortField, setSortField] = useState<SortField>('spend');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const eventItems = Object.entries(metrics.current.byCampaign)
    .filter(([, c]) => (c as any).source === 'event')
    .map(([name, c]) => ({ name, ...(c as any) }));
  
  const pEventItems = Object.entries(metrics.prior.byCampaign)
    .filter(([, c]) => (c as any).source === 'event')
    .map(([name, c]) => ({ name, ...(c as any) }));
  
  const curS = eventItems.reduce((a, b) => a + b.spend, 0);
  const priS = pEventItems.reduce((a, b) => a + b.spend, 0);
  const curC = eventItems.reduce((a, b) => a + b.conversions, 0);
  const priC = pEventItems.reduce((a, b) => a + b.conversions, 0);
  const curR = eventItems.reduce((a, b) => a + b.revenue, 0);
  const priR = pEventItems.reduce((a, b) => a + b.revenue, 0);

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

  const sortedCampaigns = [...eventItems].sort((a, b) => {
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

  const defaultNarrative = defaultText || `Event marketing campaigns generated a total revenue of **${fCurrency(curR)}** this period from an advertising investment of **${fCurrency(curS)}**.

Ticket purchases/registrations reached **${Math.round(curC)} orders**, with an average acquisition cost of **${fCPA(curS, curC)}** and a return on ad spend of **${fROAS(curR, curS)}**.

*Note: All Event campaign figures are tracked independently and excluded from the main consolidated MAA donation totals.*`;

  // Only render if event campaigns exist in dataset
  if (eventItems.length === 0 && (!metrics.current.events || metrics.current.events.spend === 0)) {
    return null;
  }

  return (
    <SlideWrapper id="events" innerClassName="border-l-[3px] border-l-[#8b5cf6]">
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="bg-[#ede9fe] text-[#6d28d9] text-[11px] font-[700] uppercase px-3 py-1 rounded inline-block tracking-[1px] border border-[#ddd6fe]">
            Separate Oversight Report
          </div>
          <div className="bg-amber-50 text-amber-700 text-[11px] font-[600] px-3 py-1 rounded inline-block border border-amber-200">
            Excluded from Consolidated Totals
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <img src={LOGOS.meta} alt="Meta" className="h-6 w-auto object-contain" />
            <h2 className="!mb-0">Event Campaigns (West Bank Tour & Events)</h2>
          </div>
          <div className="text-[13px] text-[#64748b] font-[500] whitespace-nowrap">
            Period: {metrics.formattedRange}
          </div>
        </div>
        <p className="text-[13px] text-gray-500 mb-6">
          Ticket sales, attendee registrations, and venue-specific promotions are managed and evaluated separately to maintain direct-donation integrity across core MAA accounts.
        </p>
        <div className="mb-6">
          <EditableContent 
            content={content}
            defaultText={defaultNarrative}
            isEditMode={isEditMode}
            onChange={onUpdateContent}
            onUpdate={onSave || (() => {})}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard 
          label="Event Spend" 
          value={fCurrency(curS)} 
          sublabel="Total Event Ad Spend" 
          icon={DollarSign} 
          delta={calcD(curS, priS)} 
          trend={curS <= priS ? "up" : "down"}
          variant="spend"
        />
        <KpiCard 
          label="Registrations / Purchases" 
          value={fNumber(curC)} 
          sublabel="Tracked Event Purchases" 
          icon={Ticket} 
          delta={calcD(curC, priC)} 
          trend={curC >= priC ? "up" : "down"}
          variant="sales"
        />
        <KpiCard 
          label="Event Revenue" 
          value={fCurrency(curR)} 
          sublabel="Gross Ticket Revenue" 
          icon={TrendingUp} 
          delta={calcD(curR, priR)} 
          trend={curR >= priR ? "up" : "down"}
          variant="revenue"
        />
        <KpiCard 
          label="Event ROAS" 
          value={fROAS(curR, curS)} 
          sublabel="Return on Event Ad Spend" 
          icon={Target} 
          delta={calcD(curR / Math.max(1, curS), priR / Math.max(1, priS))} 
          trend={(curR / Math.max(1, curS)) >= (priR / Math.max(1, priS)) ? "up" : "down"}
          variant="roas"
        />
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-[#e2e8f0] bg-[#f8fafc] flex justify-between items-center">
          <h3 className="text-[14px] font-[700] text-[#0f172a] uppercase tracking-[1px]">Event Campaign Breakdown</h3>
          <span className="text-[12px] font-[500] text-[#64748b]">{sortedCampaigns.length} Active Events</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#e2e8f0] text-[11px] font-[700] text-[#64748b] uppercase tracking-[1px] bg-[#f8fafc]/50">
                <th className="py-3 px-6">Campaign</th>
                <th className="py-3 px-6 text-right cursor-pointer hover:text-black" onClick={() => toggleSort('spend')}>
                  Spend <SortIcon field="spend" />
                </th>
                <th className="py-3 px-6 text-right cursor-pointer hover:text-black" onClick={() => toggleSort('conversions')}>
                  Purchases <SortIcon field="conversions" />
                </th>
                <th className="py-3 px-6 text-right">CPA</th>
                <th className="py-3 px-6 text-right cursor-pointer hover:text-black" onClick={() => toggleSort('revenue')}>
                  Revenue <SortIcon field="revenue" />
                </th>
                <th className="py-3 px-6 text-right cursor-pointer hover:text-black" onClick={() => toggleSort('roas')}>
                  ROAS <SortIcon field="roas" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0] text-[13px]">
              {sortedCampaigns.map((c, i) => {
                const roas = c.spend > 0 ? c.revenue / c.spend : 0;
                const cpa = c.conversions > 0 ? c.spend / c.conversions : 0;
                return (
                  <tr key={i} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="py-3.5 px-6 font-[600] text-[#0f172a]">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#8b5cf6] shrink-0" />
                        {c.name}
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-right font-[500] text-[#64748b]">{fCurrency(c.spend)}</td>
                    <td className="py-3.5 px-6 text-right font-[500] text-[#64748b]">{fNumber(c.conversions)}</td>
                    <td className="py-3.5 px-6 text-right font-[500] text-[#64748b]">{fCurrency(cpa)}</td>
                    <td className="py-3.5 px-6 text-right font-[600] text-[#0f172a]">{fCurrency(c.revenue)}</td>
                    <td className="py-3.5 px-6 text-right font-[700] text-[#16a34a]">{roas.toFixed(2)}x</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </SlideWrapper>
  );
};
