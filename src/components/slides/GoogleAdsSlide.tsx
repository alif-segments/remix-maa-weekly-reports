import React from 'react';
import { DollarSign, Target, TrendingUp, Award } from 'lucide-react';
import { SlideWrapper } from '../SlideWrapper';
import { KpiCard } from '../KpiCard';
import { LOGOS } from '@/src/constants';
import { MetricsSummary } from '@/src/types';
import { fCurrency, fNumber, fROAS } from '@/src/lib/formatters';
import { cn } from '@/src/lib/utils';

interface GoogleAdsSlideProps {
  metrics: MetricsSummary;
}

export const GoogleAdsSlide = ({ metrics }: GoogleAdsSlideProps) => {
  const googleSearchItems = Object.values(metrics.current.byCampaign).filter(c => (c as any).source === 'google_ads').map(c => c as any);
  const pGoogleItems = Object.values(metrics.prior.byCampaign).filter(c => (c as any).source === 'google_ads').map(c => c as any);
  const curS = googleSearchItems.reduce((a, b) => a + b.spend, 0);
  const priS = pGoogleItems.reduce((a, b) => a + b.spend, 0);
  const curC = googleSearchItems.reduce((a, b) => a + b.conversions, 0);
  const priC = pGoogleItems.reduce((a, b) => a + b.conversions, 0);
  const curR = googleSearchItems.reduce((a, b) => a + b.revenue, 0);
  const priR = pGoogleItems.reduce((a, b) => a + b.revenue, 0);

  const calcD = (c: number, p: number) => {
    if (p === 0) return "NEW";
    const d = ((c - p) / Math.max(1, p)) * 100;
    return `${d > 0 ? '+' : ''}${d.toFixed(1)}%`;
  };

  return (
    <SlideWrapper id="google" innerClassName="border-l-[3px] border-l-[#f59e0b]">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <img src={LOGOS.google_ads} alt="Google" className="h-6 w-auto object-contain" />
          <h2>Google Ads Performance</h2>
        </div>
        <div className="text-[12px] font-[500] text-[#64748b]">
           ~{(curS / Math.max(1, metrics.current.total.spend) * 100).toFixed(0)}% of total consolidated spend
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <KpiCard icon={DollarSign} label="Google Spend" value={fCurrency(curS)} sublabel="Search & Display cost" delta={calcD(curS, priS)} trend={curS <= priS ? 'up' : 'down'} variant="spend" />
        <KpiCard icon={Target} label="Conversions" value={fNumber(Math.round(curC))} sublabel="Lead completions" delta={calcD(curC, priC)} trend={curC >= priC ? 'up' : 'down'} variant="sales" />
        <KpiCard icon={TrendingUp} label="Revenue" value={fCurrency(curR)} sublabel="Search attribution" delta={calcD(curR, priR)} trend={curR >= priR ? 'up' : 'down'} variant="revenue" />
        <KpiCard icon={Award} label="Google ROAS" value={fROAS(curR, curS)} sublabel="Search efficiency" delta={calcD(curR/Math.max(1, curS), priR/Math.max(1, priS))} trend={curR/Math.max(1, curS) >= priR/Math.max(1, priS) ? 'up' : 'down'} variant="roas" />
      </div>

      <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-8 mb-10">
         <h3 className="text-[12px] font-[600] text-[#64748b] uppercase tracking-[1.5px] mb-4">Google Channel Insights</h3>
         <p contentEditable suppressContentEditableWarning className="text-[15px] text-[#64748b] leading-[1.6] outline-none border-transparent hover:border-gray-200 border rounded transition-colors p-1 -m-1">
           Google Ads remain a critical source of high-intent conversion volume. Search campaigns targeting core keywords show the best return, 
           leveraging conversion tags for precise event attribution. Scaling effort should focus on impression share for top-performing terms.
         </p>
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden overflow-y-auto max-h-[300px] no-scrollbar">
         <table className="w-full text-left">
           <thead className="sticky top-0 bg-white z-10">
             <tr className="border-b-2 border-[#f1f5f9]">
               <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Keyword Group / Campaign</th>
               <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Spend</th>
               <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Conv.</th>
               <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Revenue</th>
               <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">ROAS</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-[#f1f5f9]">
             {Object.entries(metrics.current.byCampaign)
               .filter(([, c]) => (c as any).source === 'google_ads')
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
