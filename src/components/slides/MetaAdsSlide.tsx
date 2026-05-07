import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
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

  const trendData = (metrics as any).dailyTrend.map((t: any) => ({
    date: t.date,
    revenue: t.facebook.revenue,
    spend: t.facebook.spend,
    conv: t.facebook.conv,
    roas: t.facebook.spend > 0 ? t.facebook.revenue / t.facebook.spend : 0
  }));

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
        <KpiCard icon={DollarSign} label="Meta Spend" value={fCurrency(curS)} sublabel="Facebook & IG cost" delta={calcD(curS, priS)} trend={curS <= priS ? 'up' : 'down'} variant="m_light" />
        <KpiCard icon={Target} label="Conversions" value={fNumber(Math.round(curC))} sublabel="Pixel tracked sales" delta={calcD(curC, priC)} trend={curC >= priC ? 'up' : 'down'} variant="m_mid" />
        <KpiCard icon={TrendingUp} label="Revenue" value={fCurrency(curR)} sublabel="Total omni revenue" delta={calcD(curR, priR)} trend={curR >= priR ? 'up' : 'down'} variant="m_blue" />
        <KpiCard icon={Award} label="Meta ROAS" value={fROAS(curR, curS)} sublabel="Direct ad efficiency" delta={calcD(curR/Math.max(1, curS), priR/Math.max(1, priS))} trend={curR/Math.max(1, curS) >= priR/Math.max(1, priS) ? 'up' : 'down'} variant="m_dark" />
      </div>

      <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-8 mb-4 h-[350px]">
         <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Last 7 Days Trend (Meta)</h3>
         <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" fontSize={10} tick={{ fill: '#94a3b8' }} />
              <YAxis fontSize={10} tick={{ fill: '#94a3b8' }} tickFormatter={(v) => `$${fNumber(v)}`} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px', color: '#0f172a' }}
                itemStyle={{ color: '#0f172a' }}
                labelStyle={{ color: '#64748b', fontWeight: 'bold', marginBottom: '4px' }}
                formatter={(v: any, name: string) => [fCurrency(v), name]}
              />
              <Bar dataKey="revenue" fill="#1877F2" radius={[4, 4, 0, 0]} name="Revenue" />
              <Bar dataKey="spend" fill="#AAC9FF" radius={[4, 4, 0, 0]} name="Spend" />
            </BarChart>
         </ResponsiveContainer>
      </div>
    </SlideWrapper>
  );
};
