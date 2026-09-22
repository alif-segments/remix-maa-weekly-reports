import React from 'react';
import { 
  ComposedChart,
  Bar, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { DollarSign } from 'lucide-react';
import { SlideWrapper } from '../SlideWrapper';
import { LOGOS } from '@/src/constants';
import { MetricsSummary } from '@/src/types';
import { fCurrency, fNumber } from '@/src/lib/formatters';

interface WeeklyTrendSlideProps {
  metrics: MetricsSummary;
}

export const WeeklyTrendSlide = ({ metrics }: WeeklyTrendSlideProps) => {
  return (
    <SlideWrapper id="charts">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-12 mb-4">
          <div className="flex flex-wrap items-center gap-3 mb-4">
             <div className="flex items-center gap-2">
               <img src={LOGOS.meta} alt="Meta" className="h-5 w-auto object-contain" />
               <span className="text-[10px] font-bold text-gray-400 uppercase">Facebook</span>
             </div>
             <span className="text-[10px] font-bold text-gray-300">x</span>
             <div className="flex items-center gap-2">
               <img src={LOGOS.google_ads} alt="Google" className="h-5 w-auto object-contain" />
               <span className="text-[10px] font-bold text-[#4285F4] uppercase">Google</span>
             </div>
             <div className="section-label !mb-0 ml-0 sm:ml-2">12-Week Trend</div>
          </div>
          <h2 className="text-[20px] font-[800] text-slate-900 tracking-tight mb-1">Weekly Performance Overview</h2>
          <div className="text-[12px] text-[#64748b] font-[500]">
            {metrics.weeklyPerf.length > 0 && (
              <>Trend Period: {metrics.weeklyPerf[0].startDate} – {metrics.weeklyPerf[metrics.weeklyPerf.length - 1].endDate}</>
            )}
          </div>
        </div>
        <div className="lg:col-span-12">
          <div className="h-[300px] md:h-[380px] w-full mt-2 relative">
            {metrics.weeklyPerf && metrics.weeklyPerf.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={metrics.weeklyPerf}
                  margin={{ top: 16, right: 10, left: 0, bottom: 10 }}
                  barGap={4}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="label" 
                    fontSize={9} 
                    fontWeight={500}
                    tick={{ fill: '#64748b', fontSize: 9 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis 
                    yAxisId="left"
                    fontSize={9} 
                    tick={{ fill: '#64748b', fontSize: 9 }} 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`}
                    width={44}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    fontSize={9} 
                    tick={{ fill: '#64748b', fontSize: 9 }} 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`}
                    width={44}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)', fontSize: '11px', padding: '8px 12px' }}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.rangeLabel || label}
                    formatter={(value: number, name: string) => {
                      return [fCurrency(value), name];
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '16px' }} 
                    formatter={(value) => <span className="mr-6 inline-block font-semibold text-[11px]" style={{ color: value === 'Revenue' ? '#4285F4' : '#10b981' }}>{value}</span>}
                  />
                  <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#4285F4" radius={[4, 4, 0, 0]} barSize={28} />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="spend" 
                    name="Spend" 
                    stroke="#10b981" 
                    strokeWidth={2.5} 
                    dot={{ r: 3, fill: '#10b981', strokeWidth: 1.5, stroke: '#fff' }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">
                Insufficient weekly data to display trend
              </div>
            )}
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
};
