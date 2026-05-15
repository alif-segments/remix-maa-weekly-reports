import React from 'react';
import { 
  Users, 
  MousePointer2, 
  ShoppingBag, 
  DollarSign,
  TrendingUp,
  PieChart as PieIcon
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { SlideWrapper } from '../SlideWrapper';
import { KpiCard } from '../KpiCard';
import { EditableContent } from '../EditableContent';
import { LOGOS } from '@/src/constants';
import { MetricsSummary } from '@/src/types';
import { fCurrency, fNumber } from '@/src/lib/formatters';
import { cn } from '@/src/lib/utils';

interface GA4SlideProps {
  metrics: MetricsSummary;
  isEditMode?: boolean;
  content?: string;
  defaultText: string;
  onUpdateContent?: (val: string) => void;
  onSave?: (val: string) => void;
}

export const GA4Slide = ({ 
  metrics,
  isEditMode = false,
  content,
  defaultText,
  onUpdateContent,
  onSave
}: GA4SlideProps) => {
  const ga4 = metrics.ga4;
  if (!ga4) return null;

  const COLORS = ['#4285F4', '#34A853', '#FBBC04', '#EA4335', '#8E24AA', '#00ACC1', '#FF7043'];

  // Data for Pie Chart
  const pieData = ga4.channelSplit.slice(0, 5).map((item, index) => ({
    name: item.channel,
    value: item.revenue
  }));

  return (
    <SlideWrapper id="ga4" innerClassName="border-l-[3px] border-l-[#4285F4]">
      <div className="mb-10">
        <div className="bg-[#E8F0FE] text-[#1967D2] text-[11px] font-[700] uppercase px-3 py-1 rounded inline-block mb-4 tracking-[1px] border border-[#D2E3FC]">Google Analytics 4 Overview</div>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <img src={LOGOS.ga4} alt="GA4" className="w-[25px] h-[25px] object-contain" />
            <h2 className="!mb-0">GA4 Performance Summary</h2>
          </div>
          <div className="text-[13px] text-[#64748b] font-[500] whitespace-nowrap">
            Period: {metrics.formattedRange}
          </div>
        </div>
        <div className="mt-4">
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
        <KpiCard icon={MousePointer2} label="Sessions" value={fNumber(ga4.current.sessions)} sublabel="Total site visits" delta={ga4.deltas.sessions} trend={ga4.trends.sessions} variant="g_blue" />
        <KpiCard icon={ShoppingBag} label="Transactions" value={fNumber(ga4.current.transactions)} sublabel="Ecommerce sales" delta={ga4.deltas.transactions} trend={ga4.trends.transactions} variant="g_green" />
        <KpiCard icon={TrendingUp} label="Revenue" value={fCurrency(ga4.current.revenue)} sublabel="Attributed revenue" delta={ga4.deltas.revenue} trend={ga4.trends.revenue} variant="g_yellow" />
        <KpiCard icon={Users} label="Active Users" value={fNumber(ga4.current.users)} sublabel="Unique visitors" delta="NEW" trend="neutral" variant="g_red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Trend Bar Chart */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-8">
          <h3 className="text-[12px] font-[600] text-[#64748b] uppercase tracking-[1.5px] mb-6">GA4 Weekly Revenue Trend</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ga4.weeklyTrend}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="label" fontSize={10} tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                 <YAxis fontSize={10} tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${fNumber(v)}`} />
                 <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }}
                    formatter={(v: any) => [fCurrency(v), 'Revenue']}
                 />
                 <Bar dataKey="revenue" fill="#4285F4" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel Split Table */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
           <div className="p-6 border-b border-[#f1f5f9] flex items-center justify-between">
              <h3 className="text-[12px] font-[600] text-[#64748b] uppercase tracking-[1.5px]">Channel Grouping Split</h3>
              <PieIcon className="w-4 h-4 text-[#94a3b8]" />
           </div>
           <div className="max-h-[300px] overflow-y-auto no-scrollbar">
             <table className="w-full text-left">
               <thead className="bg-[#f8fafc] sticky top-0">
                 <tr className="border-b border-[#f1f5f9]">
                   <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Channel</th>
                   <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sessions</th>
                   <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trans.</th>
                   <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Revenue</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-[#f1f5f9]">
                 {ga4.channelSplit.map((ch, idx) => (
                   <tr key={ch.channel} className="hover:bg-[#f8fafc] transition-colors">
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                           <span className="text-[13px] font-[600] text-[#1e293b]">{ch.channel}</span>
                        </div>
                     </td>
                     <td className="px-6 py-4 text-right text-[13px] font-[500] text-[#64748b] tabular-nums">{fNumber(ch.sessions)}</td>
                     <td className="px-6 py-4 text-right text-[13px] font-[500] text-[#64748b] tabular-nums">{fNumber(ch.transactions)}</td>
                     <td className="px-6 py-4 text-right text-[13px] font-[700] text-[#0f172a] tabular-nums">{fCurrency(ch.revenue)}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      </div>
    </SlideWrapper>
  );
};
