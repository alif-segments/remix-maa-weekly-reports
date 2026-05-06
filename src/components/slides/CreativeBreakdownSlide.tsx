import React from 'react';
import { Award, ExternalLink } from 'lucide-react';
import { SlideWrapper } from '../SlideWrapper';
import { LOGOS } from '@/src/constants';
import { MetricsSummary } from '@/src/types';
import { fCurrency, fNumber } from '@/src/lib/formatters';
import { cn } from '@/src/lib/utils';

interface CreativeBreakdownSlideProps {
  metrics: MetricsSummary;
}

export const CreativeBreakdownSlide = ({ metrics }: CreativeBreakdownSlideProps) => {
  return (
    <SlideWrapper id="creatives">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
           <img src={LOGOS.meta} alt="Meta" className="h-6 w-auto object-contain" />
           <div className="section-label !mb-0 ml-1">Creative Insight</div>
        </div>
        <h2>Meta Creative Breakdown</h2>
      </div>
      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden overflow-y-auto max-h-[500px] no-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-20 bg-white">
            <tr className="border-b-2 border-[#f1f5f9]">
              <th className="px-6 py-4 text-[11px] font-[600] uppercase tracking-[0.5px] text-[#64748b]">Creative Asset</th>
              <th className="px-6 py-4 text-[11px] font-[600] uppercase tracking-[0.5px] text-[#64748b] text-center">Preview Link</th>
              <th className="px-6 py-4 text-[11px] font-[600] uppercase tracking-[0.5px] text-[#64748b] text-right">Spend</th>
              <th className="px-6 py-4 text-[11px] font-[600] uppercase tracking-[0.5px] text-[#64748b] text-right">Sales</th>
              <th className="px-6 py-4 text-[11px] font-[600] uppercase tracking-[0.5px] text-[#64748b] text-right">Revenue</th>
              <th className="px-6 py-4 text-[11px] font-[600] uppercase tracking-[0.5px] text-[#64748b] text-right">Efficiency</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f5f9]">
            {Object.entries(metrics.current.byCreative)
              .sort(([, a], [, b]) => (b as any).spend - (a as any).spend)
              .slice(0, 20)
              .map(([name, c]) => {
                const creative = c as any;
                const roas = creative.revenue / Math.max(1, creative.spend);
                return (
                  <tr key={name} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="px-6 py-5">
                      <div className="text-[14px] font-[600] text-[#0f172a] mb-0.5 max-w-md truncate">{name}</div>
                      <div className="text-[12px] text-[#94a3b8] font-[400] truncate max-w-md">{creative.campaign}</div>
                    </td>
                    <td className="px-6 py-5 text-center">
                        {creative.preview_url ? (
                           <a 
                             href={creative.preview_url} 
                             target="_blank" 
                             rel="noopener noreferrer" 
                             className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f1f5f9] text-[#64748b] hover:text-primary rounded-lg transition-colors font-[600] text-[12px]"
                           >
                              <ExternalLink size={12} />
                              View Link
                           </a>
                        ) : (
                          <span className="text-[11px] text-gray-300 font-medium italic">No Preview</span>
                        )}
                    </td>
                    <td className="px-6 py-5 text-right text-[14px] font-[500] tabular-nums">{fCurrency(creative.spend)}</td>
                    <td className="px-6 py-5 text-right text-[14px] font-[500] tabular-nums tracking-tight">{fNumber(Math.round(creative.conversions))}</td>
                    <td className="px-6 py-5 text-right text-[14px] font-[700] tabular-nums text-[#0f172a]">{fCurrency(creative.revenue)}</td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 text-[14px] font-[700] tabular-nums">
                         <span className={cn(
                            "w-2 h-2 rounded-full",
                            roas > 2 ? "bg-[#16a34a]" : roas >= 1 ? "bg-[#f59e0b]" : "bg-[#dc2626]"
                          )} />
                          {roas.toFixed(2)}x
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
