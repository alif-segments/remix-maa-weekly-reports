import React from 'react';
import { DollarSign, Target, TrendingUp, Award } from 'lucide-react';
import { SlideWrapper } from '../SlideWrapper';
import { KpiCard } from '../KpiCard';
import { LOGOS } from '@/src/constants';
import { MetricsSummary } from '@/src/types';
import { fCurrency, fNumber, fROAS } from '@/src/lib/formatters';
import { cn } from '@/src/lib/utils';

interface MetaAdsSlideProps {
  metrics: MetricsSummary;
}

export const MetaAdsSlide = ({ metrics }: MetaAdsSlideProps) => {
  const metaItems = Object.values(metrics.current.byCampaign).filter(c => (c as any).source?.includes('facebook')).map(c => c as any);
  const pMetaItems = Object.values(metrics.prior.byCampaign).filter(c => (c as any).source?.includes('facebook')).map(c => c as any);
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

  return (
    <SlideWrapper id="meta" innerClassName="border-l-[3px] border-l-[#2563eb]">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
           <img src={LOGOS.meta} alt="Meta" className="h-6 w-auto object-contain" />
          <h2>Meta Ads Performance</h2>
        </div>
        <div className="text-[12px] font-[500] text-[#64748b]">
           ~{(curS / Math.max(1, metrics.current.total.spend) * 100).toFixed(0)}% of total consolidated spend
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <KpiCard icon={DollarSign} label="Meta Spend" value={fCurrency(curS)} sublabel="Facebook & IG cost" delta={calcD(curS, priS)} trend={curS <= priS ? 'up' : 'down'} variant="spend" />
        <KpiCard icon={Target} label="Conversions" value={fNumber(Math.round(curC))} sublabel="Pixel tracked sales" delta={calcD(curC, priC)} trend={curC >= priC ? 'up' : 'down'} variant="sales" />
        <KpiCard icon={TrendingUp} label="Revenue" value={fCurrency(curR)} sublabel="Total omni revenue" delta={calcD(curR, priR)} trend={curR >= priR ? 'up' : 'down'} variant="revenue" />
        <KpiCard icon={Award} label="Meta ROAS" value={fROAS(curR, curS)} sublabel="Direct ad efficiency" delta={calcD(curR/Math.max(1, curS), priR/Math.max(1, priS))} trend={curR/Math.max(1, curS) >= priR/Math.max(1, priS) ? 'up' : 'down'} variant="roas" />
      </div>

      <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-8 mb-10">
         <h3 className="text-[12px] font-[600] text-[#64748b] uppercase tracking-[1.5px] mb-4">Meta Channel Insights</h3>
         <p contentEditable suppressContentEditableWarning className="text-[15px] text-[#64748b] leading-[1.6] outline-none border-transparent hover:border-gray-200 border rounded transition-colors p-1 -m-1">
           Meta Ads performance continues to show strong efficiency. The conversion volume is largely driven by core purchase events tracked via the pixel. 
           Current scaling suggests broad audience targeting is performing well with healthy frequency stabilization.
         </p>
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden overflow-y-auto max-h-[300px] no-scrollbar">
         <table className="w-full text-left">
           <thead className="sticky top-0 bg-white z-10">
             <tr className="border-b-2 border-[#f1f5f9]">
               <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Meta Campaign</th>
               <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Spend</th>
               <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sales</th>
               <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Revenue</th>
               <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">ROAS</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-[#f1f5f9]">
             {Object.entries(metrics.current.byCampaign)
               .filter(([, c]) => (c as any).source?.includes('facebook'))
               .sort(([, a], [, b]) => (b as any).spend - (a as any).spend)
               .map(([name, c]) => {
                 const campaign = c as any;
                 const roas = campaign.revenue / Math.max(1, campaign.spend);
                 return (
                   <tr key={name} className="hover:bg-[#f8fafc] transition-colors">
                     <td className="px-6 py-4 text-[13px] font-[600] text-[#0f172a]">{name}</td>
                     <td className="px-6 py-4 text-right text-[13px] font-[500] tabular-nums">{fCurrency(campaign.spend)}</td>
                     <td className="px-6 py-4 text-right text-[13px] font-[500] tabular-nums text-primary">{fNumber(campaign.conversions)}</td>
                     <td className="px-6 py-4 text-right text-[13px] font-[700] tabular-nums text-[#0f172a]">{fCurrency(campaign.revenue)}</td>
                     <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 text-[13px] font-[700] tracking-tight">
                          <span className={cn("w-1.5 h-1.5 rounded-full", roas > 2 ? "bg-[#16a34a]" : roas >= 1 ? "bg-[#f59e0b]" : "bg-[#dc2626]")} />
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
