import React from 'react';
import { 
  HeartHandshake, 
  DollarSign, 
  Receipt, 
  Gift, 
  Users, 
  Repeat 
} from 'lucide-react';
import { SlideWrapper } from '../SlideWrapper';
import { KpiCard } from '../KpiCard';
import { EditableContent } from '../EditableContent';
import { MetricsSummary } from '@/src/types';
import { fCurrency, fNumber } from '@/src/lib/formatters';
import { useDonorReport } from '@/src/hooks/useDonorReport';

interface DonorInsightsSlideProps {
  metrics: MetricsSummary;
  isEditMode?: boolean;
  content?: string;
  defaultText: string;
  onUpdateContent?: (val: string) => void;
  onSave?: (val: string) => void;
}

export const DonorInsightsSlide = ({
  metrics,
  isEditMode = false,
  content,
  defaultText,
  onUpdateContent,
  onSave
}: DonorInsightsSlideProps) => {
  // Pass both start and end date so transactions are filtered in-memory instantly with zero reload latency!
  const { summary, loading } = useDonorReport(metrics?.startDate, metrics?.endDate);

  const totalValue = summary.total.value || 0;
  const totalCount = summary.total.count || 0;

  // Percentage shares
  const newPct = totalValue > 0 ? (summary.new_donor.value / totalValue) * 100 : 0;
  const existPct = totalValue > 0 ? (summary.existing_donor.value / totalValue) * 100 : 0;
  const guestPct = totalValue > 0 ? (summary.guest.value / totalValue) * 100 : 0;

  const recurPct = totalValue > 0 ? (summary.recurring.value / totalValue) * 100 : 0;
  const onetimePct = totalValue > 0 ? (summary.one_time.value / totalValue) * 100 : 0;

  return (
    <SlideWrapper id="donor_insights" innerClassName="border-l-[3px] border-l-[#10b981]">
      <div className="mb-6">
        <div className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0 shadow-xs">
                <HeartHandshake size={18} />
              </div>
              <h2 className="!mb-0 text-[20px] font-[800] text-slate-900 tracking-tight">
                Donor Performance & Giving Breakdown
              </h2>
            </div>
            <div className="text-[13px] text-[#64748b] font-[500] whitespace-nowrap">
              Period: {metrics.formattedRange || '14 Sept – 20 Sept 2026'}
            </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-100 border border-slate-200 rounded-xl p-5 h-[115px]" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="h-[200px] bg-slate-100 rounded-xl" />
            <div className="h-[200px] bg-slate-100 rounded-xl" />
          </div>
        </div>
      ) : (
        <>
          {/* Top 3 Primary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {/* Total Raised */}
            <KpiCard 
              icon={DollarSign} 
              label="Total Raised" 
              value={fCurrency(totalValue)} 
              sublabel="Gross donor contributions" 
              variant="g_green" 
              tooltip="Total gross donor contributions tracked via Stape Store"
            />

            {/* Transactions */}
            <KpiCard 
              icon={Receipt} 
              label="Transactions" 
              value={fNumber(totalCount)} 
              sublabel="Completed donations" 
              variant="g_blue" 
              tooltip="Total completed donation transactions"
            />

            {/* Avg Donation */}
            <KpiCard 
              icon={Gift} 
              label="Avg Donation" 
              value={fCurrency(summary.avgDonation)} 
              sublabel="Average gift size" 
              variant="g_yellow" 
              tooltip="Average transaction size per completed gift"
            />
          </div>

          {/* Deep-Dive Comparative Breakdown: 2 Focused Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            {/* Column 1: Supporter Acquisition (New vs Existing) */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2" title="Supporter Acquisition (New vs Existing Donors)">
                    <Users size={16} className="text-emerald-600 shrink-0" />
                    <h3 className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">
                      Supporter Acquisition
                    </h3>
                  </div>
                  <span className="text-[11.5px] font-semibold text-slate-500 whitespace-nowrap">
                    {fNumber(totalCount)} Donors
                  </span>
                </div>

                {/* Segmented bar */}
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex mb-4">
                  {totalValue > 0 ? (
                    <>
                      <div 
                        style={{ width: `${newPct}%` }} 
                        className="bg-[#10b981] transition-all duration-300" 
                        title={`New Donors: ${newPct.toFixed(1)}% (${fCurrency(summary.new_donor.value)})`}
                      />
                      <div 
                        style={{ width: `${existPct}%` }} 
                        className="bg-[#3b82f6] transition-all duration-300" 
                        title={`Existing Donors: ${existPct.toFixed(1)}% (${fCurrency(summary.existing_donor.value)})`}
                      />
                      <div 
                        style={{ width: `${guestPct}%` }} 
                        className="bg-[#94a3b8] transition-all duration-300" 
                        title={`Guest Donors: ${guestPct.toFixed(1)}% (${fCurrency(summary.guest.value)})`}
                      />
                    </>
                  ) : (
                    <div className="w-full bg-slate-100" />
                  )}
                </div>

                {/* Structured comparative breakdown rows */}
                <div className="space-y-2.5">
                  {/* New Donors */}
                  <div 
                    className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100/80 flex items-center justify-between transition-colors hover:bg-emerald-50"
                    title="First-time supporters acquiring gifts"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[13px] font-bold text-slate-800 leading-tight">
                          New Donors
                        </div>
                        <div className="text-[11px] text-slate-500 leading-tight truncate">
                          First-time supporters
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <div className="text-[14px] font-[800] text-slate-900 tabular-nums">
                        {fCurrency(summary.new_donor.value)}
                      </div>
                      <div className="text-[11px] text-emerald-700 font-semibold">
                        {fNumber(summary.new_donor.count)} txns ({newPct.toFixed(1)}%)
                      </div>
                    </div>
                  </div>

                  {/* Existing Donors */}
                  <div 
                    className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-100/80 flex items-center justify-between transition-colors hover:bg-blue-50"
                    title="Returning supporters with active donation history"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[13px] font-bold text-slate-800 leading-tight">
                          Existing Donors
                        </div>
                        <div className="text-[11px] text-slate-500 leading-tight truncate">
                          Returning supporters
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <div className="text-[14px] font-[800] text-slate-900 tabular-nums">
                        {fCurrency(summary.existing_donor.value)}
                      </div>
                      <div className="text-[11px] text-blue-700 font-semibold">
                        {fNumber(summary.existing_donor.count)} txns ({existPct.toFixed(1)}%)
                      </div>
                    </div>
                  </div>

                  {/* Guest Checkouts */}
                  {summary.guest.count > 0 && (
                    <div 
                      className="p-2 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-between transition-colors hover:bg-slate-100/70"
                      title="Immediate express donations (unlinked accounts)"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-[#94a3b8] shrink-0" />
                        <div className="min-w-0">
                          <div className="text-[12px] font-semibold text-slate-700 leading-tight">
                            Guest Checkouts
                          </div>
                          <div className="text-[10.5px] text-slate-400 leading-tight truncate">
                            Express donations
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <div className="text-[12.5px] font-[700] text-slate-800 tabular-nums">
                          {fCurrency(summary.guest.value)}
                        </div>
                        <div className="text-[10.5px] text-slate-500 font-medium">
                          {fNumber(summary.guest.count)} txns ({guestPct.toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Column 2: Giving Frequency (Recurring vs One-Time) */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2" title="Giving Frequency: Recurring Subscriptions vs One-Time Gifts">
                    <Repeat size={16} className="text-indigo-600 shrink-0" />
                    <h3 className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">
                      Giving Frequency
                    </h3>
                  </div>
                  <span className="text-[11.5px] font-semibold text-slate-500 whitespace-nowrap">
                    {fCurrency(totalValue)} Total
                  </span>
                </div>

                {/* Segmented bar */}
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex mb-4">
                  {totalValue > 0 ? (
                    <>
                      <div 
                        style={{ width: `${recurPct}%` }} 
                        className="bg-[#6366f1] transition-all duration-300" 
                        title={`Recurring Subscriptions: ${recurPct.toFixed(1)}% (${fCurrency(summary.recurring.value)})`}
                      />
                      <div 
                        style={{ width: `${onetimePct}%` }} 
                        className="bg-[#f59e0b] transition-all duration-300" 
                        title={`One-Time Gifts: ${onetimePct.toFixed(1)}% (${fCurrency(summary.one_time.value)})`}
                      />
                    </>
                  ) : (
                    <div className="w-full bg-slate-100" />
                  )}
                </div>

                {/* Structured comparative breakdown rows */}
                <div className="space-y-2.5">
                  {/* Recurring Subscriptions */}
                  <div 
                    className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100/80 flex items-center justify-between transition-colors hover:bg-indigo-50"
                    title="Orphan sponsorship, Giving Friday, automated regular gifts"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1] shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[13px] font-bold text-slate-800 flex items-center gap-1.5 leading-tight">
                          Recurring
                          <span className="text-[9.5px] uppercase font-bold tracking-wide px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 shrink-0">
                            Sub
                          </span>
                        </div>
                        <div className="text-[11px] text-indigo-900/60 leading-tight truncate">
                          Sponsorships & regular gifts
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <div className="text-[14px] font-[800] text-slate-900 tabular-nums">
                        {fCurrency(summary.recurring.value)}
                      </div>
                      <div className="text-[11px] text-indigo-700 font-semibold">
                        {fNumber(summary.recurring.count)} subs ({recurPct.toFixed(1)}%)
                      </div>
                    </div>
                  </div>

                  {/* One-Time Gifts */}
                  <div 
                    className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-100/80 flex items-center justify-between transition-colors hover:bg-amber-50"
                    title="Campaign appeals, emergency relief & general donations"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[13px] font-bold text-slate-800 flex items-center gap-1.5 leading-tight">
                          One-Time
                          <span className="text-[9.5px] uppercase font-bold tracking-wide px-1.5 py-0.2 rounded bg-amber-100 text-amber-700 shrink-0">
                            Single
                          </span>
                        </div>
                        <div className="text-[11px] text-amber-900/60 leading-tight truncate">
                          Appeals & general donations
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <div className="text-[14px] font-[800] text-slate-900 tabular-nums">
                        {fCurrency(summary.one_time.value)}
                      </div>
                      <div className="text-[11px] text-amber-800 font-semibold">
                        {fNumber(summary.one_time.count)} gifts ({onetimePct.toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </SlideWrapper>
  );
};
