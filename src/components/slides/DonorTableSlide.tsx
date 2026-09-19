import React, { useState, useMemo } from 'react';
import { 
  Table as TableIcon, 
  ChevronUp, 
  ChevronDown, 
  DollarSign, 
  Users, 
  Repeat, 
  TrendingUp,
  UserCheck,
  UserPlus,
  Gift
} from 'lucide-react';
import { SlideWrapper } from '../SlideWrapper';
import { KpiCard } from '../KpiCard';
import { EditableContent } from '../EditableContent';
import { MetricsSummary, DonorWeek } from '@/src/types';
import { fCurrency, fNumber } from '@/src/lib/formatters';
import { useDonorReport } from '@/src/hooks/useDonorReport';
import { cn } from '@/src/lib/utils';

interface DonorTableSlideProps {
  metrics: MetricsSummary;
  isEditMode?: boolean;
  content?: string;
  defaultText?: string;
  onUpdateContent?: (val: string) => void;
  onSave?: (val: string) => void;
}

type SortField = 'name' | 'count' | 'share' | 'avg' | 'total';

interface SegmentRow {
  key: string;
  name: string;
  description: string;
  color: string;
  count: number;
  total: number;
  share: number;
  avg: number;
}

export const DonorTableSlide = ({
  metrics,
  isEditMode = false,
  content,
  defaultText = 'Weekly donor breakdown details transaction volume, donor segments, and contribution values across giving channels.',
  onUpdateContent,
  onSave
}: DonorTableSlideProps) => {
  const { data: reportData, loading } = useDonorReport(metrics?.startDate);
  const [sortField, setSortField] = useState<SortField>('total');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [activeTab, setActiveTab] = useState<'segments' | 'weeks'>('segments');

  const current = reportData?.current || {
    total: { count: 0, value: 0 },
    new_donor: { count: 0, value: 0 },
    existing_donor: { count: 0, value: 0 },
    guest: { count: 0, value: 0 },
    recurring: { count: 0, value: 0 },
    one_time: { count: 0, value: 0 },
    mixed_count: 0
  };

  const totalValue = current.total.value || 0;
  const totalCount = current.total.count || 0;
  const avgGift = totalCount > 0 ? totalValue / totalCount : 0;
  const newShare = totalValue > 0 ? (current.new_donor.value / totalValue) * 100 : 0;
  const recurShare = totalValue > 0 ? (current.recurring.value / totalValue) * 100 : 0;

  // Build the 5 core giving segments for the weekly period
  const segments: SegmentRow[] = useMemo(() => {
    return [
      {
        key: 'new',
        name: 'New Supporters',
        description: 'First-time donors acquired this week',
        color: '#10b981',
        count: current.new_donor.count,
        total: current.new_donor.value,
        share: totalValue > 0 ? (current.new_donor.value / totalValue) * 100 : 0,
        avg: current.new_donor.count > 0 ? current.new_donor.value / current.new_donor.count : 0
      },
      {
        key: 'existing',
        name: 'Returning Supporters',
        description: 'Existing donors renewing contributions',
        color: '#3b82f6',
        count: current.existing_donor.count,
        total: current.existing_donor.value,
        share: totalValue > 0 ? (current.existing_donor.value / totalValue) * 100 : 0,
        avg: current.existing_donor.count > 0 ? current.existing_donor.value / current.existing_donor.count : 0
      },
      {
        key: 'recurring',
        name: 'Recurring Subscriptions',
        description: 'Automated recurring pledge schedules',
        color: '#6366f1',
        count: current.recurring.count,
        total: current.recurring.value,
        share: totalValue > 0 ? (current.recurring.value / totalValue) * 100 : 0,
        avg: current.recurring.count > 0 ? current.recurring.value / current.recurring.count : 0
      },
      {
        key: 'onetime',
        name: 'One-Time Giving',
        description: 'Single appeal and emergency gifts',
        color: '#f59e0b',
        count: current.one_time.count,
        total: current.one_time.value,
        share: totalValue > 0 ? (current.one_time.value / totalValue) * 100 : 0,
        avg: current.one_time.count > 0 ? current.one_time.value / current.one_time.count : 0
      },
      {
        key: 'guest',
        name: 'Guest Contributions',
        description: 'Unidentified or guest checkout gifts',
        color: '#94a3b8',
        count: current.guest.count,
        total: current.guest.value,
        share: totalValue > 0 ? (current.guest.value / totalValue) * 100 : 0,
        avg: current.guest.count > 0 ? current.guest.value / current.guest.count : 0
      }
    ];
  }, [current, totalValue]);

  // Filter weeks to only those with activity, or the last 3 weeks max
  const activeWeeks = useMemo(() => {
    if (reportData?.active_weeks && reportData.active_weeks.length > 0) {
      return reportData.active_weeks;
    }
    const list = reportData?.weeks || [];
    const withData = list.filter(w => w.total.count > 0);
    if (withData.length > 0) return withData;
    return list.slice(-3); // at most 3 weeks if empty
  }, [reportData]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sortedSegments = useMemo(() => {
    return [...segments].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDir === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
  }, [segments, sortField, sortDir]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp size={13} className="inline ml-1" /> : <ChevronDown size={13} className="inline ml-1" />;
  };

  return (
    <SlideWrapper id="donor_table" innerClassName="border-l-[3px] border-l-[#10b981]">
      <div className="mb-[35px]">
        <div className="w-full">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                <TableIcon size={16} />
              </div>
              <h2 className="!mb-0">Donor Performance Breakdown</h2>
            </div>
            <div className="text-[13px] text-[#64748b] font-[500] whitespace-nowrap">
              Period: {metrics.formattedRange}
            </div>
          </div>
          <div className="text-[12px] font-[500] text-[#64748b] mb-6">
            Detailed breakdown of supporter segments, gift frequencies, and transaction values
          </div>
          <EditableContent 
            content={content}
            defaultText={defaultText}
            isEditMode={isEditMode}
            onChange={onUpdateContent}
            onUpdate={onSave || (() => {})}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-slate-100 border border-slate-200 rounded-xl p-5 h-[110px]" />
            ))}
          </div>
          <div className="h-[250px] bg-slate-100 rounded-xl" />
        </div>
      ) : (
        <>
          {/* 4 Standard KPI Cards matching other slides */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <KpiCard 
              icon={DollarSign} 
              label="Weekly Donated" 
              value={fCurrency(totalValue)} 
              sublabel={`${fNumber(totalCount)} total donations`} 
              delta={totalValue > 0 ? "NEW" : "0.0%"} 
              trend={totalValue > 0 ? "up" : "neutral"} 
              variant="g_green" 
            />
            <KpiCard 
              icon={UserPlus} 
              label="New Supporters" 
              value={fCurrency(current.new_donor.value)} 
              sublabel={`${newShare.toFixed(1)}% of total revenue`} 
              delta={current.new_donor.value > 0 ? "NEW" : "0.0%"} 
              trend={current.new_donor.value > 0 ? "up" : "neutral"} 
              variant="g_blue" 
            />
            <KpiCard 
              icon={Repeat} 
              label="Recurring Share" 
              value={`${recurShare.toFixed(1)}%`} 
              sublabel={`${fCurrency(current.recurring.value)} recurring`} 
              delta={current.recurring.value > 0 ? "NEW" : "0.0%"} 
              trend={current.recurring.value > 0 ? "up" : "neutral"} 
              variant="m_mid" 
            />
            <KpiCard 
              icon={TrendingUp} 
              label="Avg. Gift Value" 
              value={fCurrency(avgGift)} 
              sublabel="per donation transaction" 
              delta={avgGift > 0 ? "NEW" : "0.0%"} 
              trend={avgGift > 0 ? "up" : "neutral"} 
              variant="g_yellow" 
            />
          </div>

          {/* Table Container (Matching Google & Meta slides with bounded height and clean padding) */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-[#f1f5f9] bg-[#f8fafc] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-[12px] font-bold text-[#64748b] uppercase tracking-widest">
                  {activeTab === 'segments' ? 'Weekly Supporter & Giving Segments' : 'Active Weeks Activity Log'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('segments')}
                  className={cn(
                    "text-[11px] font-semibold px-3 py-1.5 rounded transition-colors",
                    activeTab === 'segments' 
                      ? "bg-emerald-600 text-white shadow-xs" 
                      : "text-slate-600 hover:bg-slate-200"
                  )}
                >
                  Weekly Breakdown
                </button>
                {activeWeeks.some(w => w.total.count > 0) && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('weeks')}
                    className={cn(
                      "text-[11px] font-semibold px-3 py-1.5 rounded transition-colors",
                      activeTab === 'weeks' 
                        ? "bg-emerald-600 text-white shadow-xs" 
                        : "text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    Active Weeks ({activeWeeks.length})
                  </button>
                )}
              </div>
            </div>

            {activeTab === 'segments' ? (
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#f1f5f9] bg-white">
                      <th 
                        className="px-6 py-3.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-emerald-700"
                        onClick={() => toggleSort('name')}
                      >
                        Giving Segment <SortIcon field="name" />
                      </th>
                      <th 
                        className="px-6 py-3.5 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-emerald-700"
                        onClick={() => toggleSort('count')}
                      >
                        <div className="inline-flex items-center justify-end w-full whitespace-nowrap">
                          Transactions <SortIcon field="count" />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3.5 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-emerald-700"
                        onClick={() => toggleSort('share')}
                      >
                        <div className="inline-flex items-center justify-end w-full whitespace-nowrap">
                          Share of Total <SortIcon field="share" />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3.5 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-emerald-700"
                        onClick={() => toggleSort('avg')}
                      >
                        <div className="inline-flex items-center justify-end w-full whitespace-nowrap">
                          Avg. Donation <SortIcon field="avg" />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3.5 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-emerald-700"
                        onClick={() => toggleSort('total')}
                      >
                        <div className="inline-flex items-center justify-end w-full whitespace-nowrap">
                          Total Raised <SortIcon field="total" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9]">
                    {sortedSegments.map((seg) => (
                      <tr key={seg.key} className="hover:bg-[#f8fafc] transition-colors">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                            <div>
                              <div className="text-[13px] font-[600] text-[#1e293b] leading-snug">
                                {seg.name}
                              </div>
                              <div className="text-[10.5px] text-slate-400 font-normal">
                                {seg.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-right text-[13px] font-[600] text-[#1e293b] tabular-nums">
                          {fNumber(seg.count)}
                        </td>
                        <td className="px-6 py-3 text-right text-[13px] font-[500] text-[#64748b] tabular-nums">
                          {seg.share.toFixed(1)}%
                        </td>
                        <td className="px-6 py-3 text-right text-[13px] font-[500] text-[#64748b] tabular-nums">
                          {fCurrency(seg.avg)}
                        </td>
                        <td className="px-6 py-3 text-right text-[14px] font-[700] text-[#0f172a] tabular-nums">
                          {fCurrency(seg.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold">
                      <td className="px-6 py-3.5 text-[12px] uppercase tracking-wider text-slate-700">
                        Total Weekly Contributions
                      </td>
                      <td className="px-6 py-3.5 text-right text-[13px] text-slate-800 tabular-nums">
                        {fNumber(totalCount)} txns
                      </td>
                      <td className="px-6 py-3.5 text-right text-[12.5px] text-slate-600 tabular-nums">
                        100.0%
                      </td>
                      <td className="px-6 py-3.5 text-right text-[13px] text-slate-700 tabular-nums">
                        {fCurrency(avgGift)}
                      </td>
                      <td className="px-6 py-3.5 text-right text-[14px] font-[800] text-emerald-700 tabular-nums">
                        {fCurrency(totalValue)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[260px] no-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-[#f8fafc] border-b border-[#f1f5f9]">
                    <tr>
                      <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Week Period</th>
                      <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">New Donors</th>
                      <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Existing</th>
                      <th className="px-6 py-3 text-right text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recurring</th>
                      <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Raised</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9]">
                    {activeWeeks.map((w) => (
                      <tr key={w.week_start} className="hover:bg-[#f8fafc] transition-colors">
                        <td className="px-6 py-3 text-[13px] font-[600] text-slate-800">
                          {w.week_start} – {w.week_end}
                        </td>
                        <td className="px-6 py-3 text-right text-[13px] text-slate-600 tabular-nums">
                          {fCurrency(w.new_donor.value)} ({w.new_donor.count})
                        </td>
                        <td className="px-6 py-3 text-right text-[13px] text-slate-600 tabular-nums">
                          {fCurrency(w.existing_donor.value)} ({w.existing_donor.count})
                        </td>
                        <td className="px-6 py-3 text-right text-[13px] text-slate-600 tabular-nums">
                          {fCurrency(w.recurring.value)} ({w.recurring.count})
                        </td>
                        <td className="px-6 py-3 text-right text-[13.5px] font-[700] text-emerald-700 tabular-nums">
                          {fCurrency(w.total.value)} ({w.total.count})
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </SlideWrapper>
  );
};
