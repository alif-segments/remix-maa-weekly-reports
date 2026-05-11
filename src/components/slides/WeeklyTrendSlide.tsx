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
          <h2 className="text-[24px] md:text-[28px]">Weekly Performance Overview</h2>
          <div className="text-[12px] md:text-[14px] text-[#64748b] font-[500]">
            {metrics.weeklyPerf.length > 0 && (
              <>Trend Period: {metrics.weeklyPerf[0].startDate} – {metrics.weeklyPerf[metrics.weeklyPerf.length - 1].endDate}</>
            )}
          </div>
        </div>
        <div className="lg:col-span-12">
          <div className="h-[300px] md:h-[400px] w-full mt-4 relative">
            {metrics.weeklyPerf && metrics.weeklyPerf.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={metrics.weeklyPerf}
                  margin={{ top: 20, right: 10, left: 0, bottom: 20 }}
                  barGap={4}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="label" 
                    fontSize={10} 
                    fontWeight={500}
                    tick={{ fill: '#64748b' }}
                  />
                  <YAxis 
                    yAxisId="left"
                    fontSize={10} 
                    tick={{ fill: '#64748b' }} 
                    tickFormatter={(v) => `$${fNumber(v)}`}
                    width={50}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    fontSize={10} 
                    tick={{ fill: '#64748b' }} 
                    tickFormatter={(v) => `$${fNumber(v)}`}
                    width={50}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }}
                    formatter={(value: number, name: string) => {
                      return [fCurrency(value), name];
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }} 
                    formatter={(value) => <span className="mr-6 inline-block font-bold" style={{ color: value === 'Revenue' ? '#4285F4' : '#34A853' }}>{value}</span>}
                  />
                  <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#4285F4" radius={[4, 4, 0, 0]} barSize={40} />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="spend" 
                    name="Spend" 
                    stroke="#34A853" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#34A853', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
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
