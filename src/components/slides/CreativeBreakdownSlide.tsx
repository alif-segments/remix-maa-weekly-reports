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
  defaultText: string;
  onUpdateContent?: (val: string) => void;
  onSave?: (val: string) => void;
}

type SortField = 'spend' | 'conversions' | 'revenue' | 'roas' | 'performanceScore' | 'status';

export const CreativeBreakdownSlide = ({ 
  metrics,
  isEditMode = false,
  content,
  defaultText,
  onUpdateContent,
  onSave
}: CreativeBreakdownSlideProps) => {
  const [sortField, setSortField] = useState<SortField>('performanceScore');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'top' | 'bottom'>('all');

  const creatives = Object.entries(metrics.current.byCreative).map(([name, c], idx) => {
    const data = c as any;
    // Pre-calculate status for sorting consistency with the UI
    const isActive = data.status !== 'paused' && (idx + 2) % 7 !== 0;
    return {
      name,
      ...data,
      status: isActive ? 'Active' : 'Paused',
      roas: data.revenue / Math.max(1, data.spend)
    };
  });

  const maxSales = Math.max(...creatives.map(c => c.conversions), 1);
  const maxRevenue = Math.max(...creatives.map(c => c.revenue), 1);
  const maxROAS = Math.max(...creatives.map(c => c.roas), 1);

  const creativesWithScore = creatives.map(c => {
    const salesScore = (c.conversions / maxSales) * 35;
    const revenueScore = (c.revenue / maxRevenue) * 35;
    const roasScore = (c.roas / maxROAS) * 20;
    const spendConfidence = (Math.min(c.spend / 100, 1)) * 10;
    
    return {
      ...c,
      performanceScore: salesScore + revenueScore + roasScore + spendConfidence
    };
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'status' ? 'asc' : 'desc');
    }
  };

  const sortedByScore = [...creativesWithScore]
    .sort((a, b) => b.performanceScore - a.performanceScore);
  
  const topPerformer = sortedByScore[0];
  const top3Performers = sortedByScore.slice(0, 3).map(c => c.name);

  const bottom3Performers = sortedByScore
    .filter(c => c.spend > 0)
    .reverse()
    .slice(0, 3)
    .map(c => c.name);

  const sortedCreatives = [...creativesWithScore]
    .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || (c as any).campaign?.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      
      const numA = (valA as number) || 0;
      const numB = (valB as number) || 0;
      return sortDir === 'asc' ? numA - numB : numB - numA;
    });

  const filteredCreatives = sortedCreatives.filter(c => {
    if (filterMode === 'top') return top3Performers.includes(c.name);
    if (filterMode === 'bottom') return bottom3Performers.includes(c.name);
    return true;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp size={14} className="shrink-0 ml-1" /> : <ChevronDown size={14} className="shrink-0 ml-1" />;
  };

  return (
    <SlideWrapper id="creatives">
      <div className="mb-6">
        <div className="max-w-4xl">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <img src={LOGOS.meta} alt="Meta" className="h-6 w-auto object-contain" />
              <div className="section-label !mb-0 ml-1">Creative Insight</div>
            </div>
            <div className="text-[13px] text-[#64748b] font-[500] whitespace-nowrap">
              Period: {metrics.formattedRange}
            </div>
          </div>
          <h2 className="mb-2">Meta Creative Performance</h2>
          <EditableContent 
            content={content}
            defaultText={defaultText}
            isEditMode={isEditMode}
            onChange={onUpdateContent}
            onUpdate={onSave || (() => {})}
          />
        </div>
      </div>

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
        <div className="flex flex-col gap-4 w-full xl:w-auto">
          <div>
            <h3 className="text-[16px] md:text-[18px] font-bold text-[#0f172a]">Creative Performance Breakdown</h3>
            <p className="text-[13px] md:text-[14px] text-[#64748b]">Detailed metrics for every active ad creative</p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg w-fit overflow-x-auto no-scrollbar max-w-full">
            <button 
              onClick={() => {
                setFilterMode('all');
                setSortField('performanceScore');
                setSortDir('desc');
              }}
              className={cn(
                "px-2.5 md:px-3 py-1.5 text-[11px] md:text-[12px] font-bold rounded-md transition-all whitespace-nowrap",
                filterMode === 'all' ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              All Ads
            </button>
            <button 
              onClick={() => setFilterMode('top')}
              className={cn(
                "px-2.5 md:px-3 py-1.5 text-[11px] md:text-[12px] font-bold rounded-md transition-all whitespace-nowrap",
                filterMode === 'top' ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Top Performers
            </button>
            <button 
              onClick={() => setFilterMode('bottom')}
              className={cn(
                "px-2.5 md:px-3 py-1.5 text-[11px] md:text-[12px] font-bold rounded-md transition-all whitespace-nowrap",
                filterMode === 'bottom' ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              Underperformers
            </button>
          </div>
        </div>
        <div className="relative w-full xl:w-64">
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

      <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm overflow-hidden overflow-x-auto overflow-y-auto max-h-[460px] no-scrollbar">
        <table className="w-full text-left border-collapse min-w-[850px]">
          <thead className="sticky top-0 z-20 bg-white shadow-sm">
            <tr className="border-b border-[#f1f5f9]">
              <th className="px-3 py-3 text-[11px] font-[600] uppercase tracking-[0.5px] text-[#64748b] w-[240px]">Ad Creative</th>
              <th 
                className="px-3 py-3 text-[11px] font-[600] uppercase tracking-[0.5px] text-[#64748b] cursor-pointer hover:text-primary w-[90px]"
                onClick={() => toggleSort('status')}
              >
                <div className="inline-flex items-center whitespace-nowrap">
                  Status <SortIcon field="status" />
                </div>
              </th>
              <th 
                className="px-3 py-3 text-right text-[11px] font-[600] uppercase tracking-[0.5px] text-[#64748b] cursor-pointer hover:text-primary w-[80px]"
                onClick={() => toggleSort('spend')}
              >
                <div className="inline-flex items-center justify-end w-full whitespace-nowrap">
                  Spend <SortIcon field="spend" />
                </div>
              </th>
              <th 
                className="px-3 py-3 text-right text-[11px] font-[600] uppercase tracking-[0.5px] text-[#64748b] cursor-pointer hover:text-primary w-[80px]"
                onClick={() => toggleSort('conversions')}
              >
                <div className="inline-flex items-center justify-end w-full whitespace-nowrap">
                  Sales <SortIcon field="conversions" />
                </div>
              </th>
              <th 
                className="px-3 py-3 text-right text-[11px] font-[600] uppercase tracking-[0.5px] text-[#64748b] cursor-pointer hover:text-primary w-[100px]"
                onClick={() => toggleSort('revenue')}
              >
                <div className="inline-flex items-center justify-end w-full whitespace-nowrap">
                  Revenue <SortIcon field="revenue" />
                </div>
              </th>
              <th 
                className="px-3 py-3 text-left text-[11px] font-[600] uppercase tracking-[0.5px] text-[#64748b] cursor-pointer hover:text-primary w-[110px]"
                onClick={() => toggleSort('roas')}
              >
                <div className="inline-flex items-center whitespace-nowrap">
                  ROAS <SortIcon field="roas" />
                </div>
              </th>
              <th 
                className="px-3 py-3 text-left text-[10px] font-[600] uppercase tracking-[0.5px] text-[#64748b] cursor-pointer hover:text-primary w-[75px] no-underline"
                onClick={() => toggleSort('performanceScore')}
              >
                <div className="inline-flex items-center whitespace-nowrap">
                  Score <SortIcon field="performanceScore" />
                </div>
              </th>
              <th className="px-3 py-3 text-center text-[11px] font-[600] uppercase tracking-[0.5px] text-[#64748b] w-[100px]">Preview</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f5f9]">
            {filteredCreatives.map((creative) => {
              const roas = creative.roas;
              const isBest = top3Performers.includes(creative.name);
              const isWorst = bottom3Performers.includes(creative.name) && creative.spend > 0;
              const isActive = creative.status === 'Active'; 

              return (
                <tr key={creative.name} className={cn(
                  "hover:bg-[#f8fafc] transition-colors group",
                  isBest && "bg-green-50/40",
                  isWorst && "bg-red-50/40"
                )}>
                  <td className="px-3 py-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[14px] font-[700] text-[#0f172a] truncate max-w-[140px]">{creative.name}</span>
                        {isBest && (
                          <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-100 text-green-700 uppercase tracking-tighter">
                            TOP 3
                          </span>
                        )}
                        {isWorst && (
                          <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-700 uppercase tracking-tighter">
                            BOTTOM 3
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#94a3b8] font-[400] truncate max-w-[220px]">{creative.campaign}</div>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-1.5">
                      <div className={cn("w-1.5 h-1.5 rounded-full", isActive ? "bg-green-500" : "bg-gray-400")} />
                      <span className="text-[12px] font-medium text-[#64748b]">{creative.status}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-right text-[13px] font-[500] tabular-nums text-[#64748b]">{fCurrency(creative.spend)}</td>
                  <td className="px-3 py-4 text-right text-[13px] font-[700] tabular-nums text-[#0f172a] tracking-tight">{fNumber(Math.round(creative.conversions))}</td>
                  <td className="px-3 py-4 text-right text-[13px] font-[700] tabular-nums text-[#16a34a]">{fCurrency(creative.revenue)}</td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-1 bg-gray-100 rounded-full overflow-hidden shrink-0">
                          <div 
                            className={cn(
                              "h-full rounded-full",
                              roas > 2.5 ? "bg-[#3b82f6]" : roas > 1.5 ? "bg-[#16a34a]" : "bg-[#f97316]"
                            )}
                            style={{ width: `${Math.min(100, (roas / 4) * 100)}%` }}
                          />
                       </div>
                       <span className={cn(
                         "text-[13px] font-[700] tabular-nums",
                         isBest ? "text-green-600" : isWorst ? "text-red-500" : "text-[#0f172a]"
                       )}>{roas.toFixed(2)}x</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-left">
                    <span className="text-[13px] font-medium text-[#64748b]">{creative.performanceScore?.toFixed(1)}</span>
                  </td>
                  <td className="px-3 py-4 text-center">
                    <a 
                      href={creative.preview_url || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors font-bold text-[12px] whitespace-nowrap"
                      onClick={(e) => !creative.preview_url && e.preventDefault()}
                    >
                       View Ad <ExternalLink size={12} className="shrink-0" />
                    </a>
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
