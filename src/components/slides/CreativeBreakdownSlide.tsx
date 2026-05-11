import React, { useState } from 'react';
import { Award, ExternalLink, ChevronUp, ChevronDown, Search } from 'lucide-react';
import { SlideWrapper } from '../SlideWrapper';
import { EditableContent } from '../EditableContent';
import { LOGOS } from '@/src/constants';
import { MetricsSummary } from '@/src/types';
import { fCurrency, fNumber, fROAS } from '@/src/lib/formatters';
import { cn } from '@/src/lib/utils';

interface CreativeBreakdownSlideProps {
  metrics: MetricsSummary;
  isEditMode?: boolean;
  content?: string;
  onUpdateContent?: (val: string) => void;
}

type SortField = 'spend' | 'conversions' | 'revenue' | 'roas';

export const CreativeBreakdownSlide = ({ 
  metrics,
  isEditMode = false,
  content,
  onUpdateContent
}: CreativeBreakdownSlideProps) => {
  const [sortField, setSortField] = useState<SortField>('spend');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  const creatives = Object.entries(metrics.current.byCreative).map(([name, c]) => ({
    name,
    ...(c as any)
  }));

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sortedCreatives = [...creatives]
    .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || (c as any).campaign?.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
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

  const topPerformer = [...creatives].sort((a, b) => (b.revenue / Math.max(1, b.spend)) - (a.revenue / Math.max(1, a.spend)))[0];

  const defaultText = `Creative analysis reveals that **${topPerformer?.name}** is currently the highest performing asset with a **${fROAS(topPerformer?.revenue, topPerformer?.spend)} return**.

UGC-style content remains dominant in driving conversions, specifically in the **Retargeting** segments where trust signals are paramount.`;

  return (
    <SlideWrapper id="creatives">
      <div className="mb-6">
        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
             <img src={LOGOS.meta} alt="Meta" className="h-6 w-auto object-contain" />
             <div className="section-label !mb-0 ml-1">Creative Insight</div>
          </div>
          <h2 className="mb-6">Meta Creative Performance</h2>
          <EditableContent 
            content={content || defaultText}
            isEditMode={isEditMode}
            onUpdate={onUpdateContent || (() => {})}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-[18px] font-bold text-[#0f172a]">Creative Performance Breakdown</h3>
          <p className="text-[14px] text-[#64748b]">Detailed metrics for every active ad creative</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search ads or campaigns..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm overflow-hidden overflow-y-auto max-h-[450px] no-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-20 bg-white shadow-sm">
            <tr className="border-b border-[#f1f5f9]">
              <th className="px-6 py-4 text-[11px] font-[600] uppercase tracking-[0.5px] text-[#64748b]">Ad Creative</th>
              <th 
                className="px-6 py-4 text-right text-[11px] font-[600] uppercase tracking-[0.5px] text-[#64748b] cursor-pointer hover:text-primary"
                onClick={() => toggleSort('spend')}
              >
                Spend <SortIcon field="spend" />
              </th>
              <th 
                className="px-6 py-4 text-right text-[11px] font-[600] uppercase tracking-[0.5px] text-[#64748b] cursor-pointer hover:text-primary"
                onClick={() => toggleSort('conversions')}
              >
                Sales <SortIcon field="conversions" />
              </th>
              <th 
                className="px-6 py-4 text-right text-[11px] font-[600] uppercase tracking-[0.5px] text-[#64748b] cursor-pointer hover:text-primary"
                onClick={() => toggleSort('revenue')}
              >
                Revenue <SortIcon field="revenue" />
              </th>
              <th 
                className="px-6 py-4 text-left text-[11px] font-[600] uppercase tracking-[0.5px] text-[#64748b] cursor-pointer hover:text-primary pl-10"
                onClick={() => toggleSort('roas')}
              >
                ROAS <SortIcon field="roas" />
              </th>
              <th className="px-6 py-4 text-right text-[11px] font-[600] uppercase tracking-[0.5px] text-[#64748b]">Preview</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f5f9]">
            {sortedCreatives.map((creative) => {
              const roas = creative.revenue / Math.max(1, creative.spend);
              return (
                <tr key={creative.name} className="hover:bg-[#f8fafc] transition-colors group">
                  <td className="px-6 py-5">
                    <div className="text-[14px] font-[700] text-[#0f172a] mb-0.5 max-w-sm truncate">{creative.name}</div>
                    <div className="text-[12px] text-[#94a3b8] font-[400] truncate max-w-sm">{creative.campaign}</div>
                  </td>
                  <td className="px-6 py-5 text-right text-[14px] font-[500] tabular-nums text-[#64748b]">{fCurrency(creative.spend)}</td>
                  <td className="px-6 py-5 text-right text-[14px] font-[700] tabular-nums text-[#0f172a] tracking-tight">{fNumber(Math.round(creative.conversions))}</td>
                  <td className="px-6 py-5 text-right text-[14px] font-[700] tabular-nums text-[#16a34a]">{fCurrency(creative.revenue)}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3 pl-4">
                       <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden shrink-0">
                          <div 
                            className={cn(
                              "h-full rounded-full",
                              roas > 2.5 ? "bg-[#3b82f6]" : roas > 1.5 ? "bg-[#16a34a]" : "bg-[#f97316]"
                            )}
                            style={{ width: `${Math.min(100, (roas / 4) * 100)}%` }}
                          />
                       </div>
                       <span className="text-[14px] font-[700] tabular-nums text-[#0f172a]">{roas.toFixed(2)}x</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    {creative.preview_url ? (
                      <a 
                        href={creative.preview_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 transition-colors font-bold text-[13px]"
                      >
                         View Ad <ExternalLink size={14} />
                      </a>
                    ) : (
                      <span className="text-[11px] text-gray-300 font-medium italic">No Preview</span>
                    )}
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
