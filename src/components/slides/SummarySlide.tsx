import React from 'react';
import { ShoppingCart, DollarSign, Target } from 'lucide-react';
import { SlideWrapper } from '../SlideWrapper';
import { KpiCard } from '../KpiCard';
import { EditableContent } from '../EditableContent';
import { LOGOS } from '@/src/constants';
import { MetricsSummary } from '@/src/types';
import { fCurrency, fROAS, fCPA, fNumber } from '@/src/lib/formatters';
import { cn } from '@/src/lib/utils';

interface SummarySlideProps {
  metrics: MetricsSummary;
  platformStats: any;
  topCreative: any;
  isEditMode?: boolean;
  content?: string;
  defaultText: string;
  onUpdateContent?: (val: string) => void;
  onSave?: (val: string) => void;
}

export const SummarySlide = ({ 
  metrics, 
  platformStats, 
  topCreative,
  isEditMode = false,
  content,
  defaultText,
  onUpdateContent,
  onSave
}: SummarySlideProps) => {
  return (
    <SlideWrapper id="summary">
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2">
               <img src={LOGOS.meta} alt="Meta" className="h-5 w-auto object-contain" />
               <span className="text-[10px] font-bold text-gray-400">Facebook</span>
             </div>
             <span className="text-[10px] font-bold text-gray-300">x</span>
             <div className="flex items-center gap-2">
               <img src={LOGOS.google_ads} alt="Google" className="h-5 w-auto object-contain" />
               <span className="text-[10px] font-bold text-[#4285F4]">Google</span>
             </div>
             <div className="section-label !mb-0 ml-2">Consolidated Overview</div>
          </div>
          <div className="text-[13px] text-[#64748b] font-[500] whitespace-nowrap">
            Period: {metrics.formattedRange}
          </div>
        </div>
        <h2 className="mb-0">Executive Summary</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start mb-[35px]">
        <div className="md:col-span-7">
          <EditableContent 
            content={content}
            defaultText={defaultText}
            isEditMode={isEditMode}
            onChange={onUpdateContent}
            onUpdate={onSave || (() => {})}
          />
        </div>
        <div className="md:col-span-5">
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-8 sticky top-0">
             <h3 className="text-[12px] font-[600] text-[#64748b] uppercase tracking-[1.5px] mb-6">Strategic Takeaways</h3>
             <ul className="space-y-6">
                {[
                  { label: "Revenue Momentum", text: `Total revenue has moved to ${fCurrency(metrics.current.total.revenue)}, showing ${metrics.deltas.revenue} change.`, color: "bg-[#16a34a]" },
                  { label: "Efficiency Guardrails", text: `Average sales CPA is currently at ${fCPA(metrics.current.total.spend, metrics.current.total.conversions)}.`, color: "bg-[#2563eb]" },
                  { label: "Scaling Opportunity", text: `Meta ROAS remains strong at ${fROAS(metrics.current.total.revenue, metrics.current.total.spend)}, allowing for budget testing.`, color: "bg-[#f59e0b]" },
                  { label: "Creative Leader", text: `${topCreative?.name || 'N/A'} is leading with ${topCreative?.roas.toFixed(2)}x returns.`, color: "bg-[#16a34a]" }
                ].map((item, idx) => (
                  <li key={idx} className="flex gap-4">
                    <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0 transition-all", item.color)} />
                    <div>
                      <div className="text-[14px] font-[700] text-[#0f172a] mb-1">{item.label}</div>
                      <div className="text-[13px] text-[#64748b] leading-[1.5]">{item.text}</div>
                    </div>
                  </li>
                ))}
             </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          label="Total Revenue" 
          value={fCurrency(metrics.current.total.revenue)} 
          sublabel="Consolidated across channels" 
          icon={ShoppingCart} 
          delta={metrics.deltas.revenue} 
          trend={metrics.trends.revenue}
          variant="revenue"
        />
        <KpiCard 
          label="Total Spend" 
          value={fCurrency(metrics.current.total.spend)} 
          sublabel="Total ad investment" 
          icon={DollarSign} 
          delta={metrics.deltas.spend} 
          trend={metrics.trends.spend}
          variant="spend"
        />
        <KpiCard 
          label="Blended ROAS" 
          value={fROAS(metrics.current.total.revenue, metrics.current.total.spend)} 
          sublabel="Return on Ad Spend" 
          icon={Target} 
          delta={metrics.deltas.roas} 
          trend={metrics.trends.roas}
          variant="roas"
        />
        <KpiCard 
          label="Total Sales" 
          value={fNumber(Math.round(metrics.current.total.conversions))} 
          sublabel="Conversion volume" 
          icon={ShoppingCart} 
          delta={metrics.deltas.sales} 
          trend={metrics.trends.sales}
          variant="sales"
        />
      </div>
    </SlideWrapper>
  );
};
