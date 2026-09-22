import React from 'react';
import { 
  HeartHandshake, 
  UserPlus, 
  Users, 
  Repeat, 
  Gift,
  HelpCircle
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

  // Average calculations
  const avgGuest = summary.guest.count > 0 ? summary.guest.value / summary.guest.count : 0;
  const avgRecur = summary.recurring.count > 0 ? summary.recurring.value / summary.recurring.count : 0;
  const avgOnetime = summary.one_time.count > 0 ? summary.one_time.value / summary.one_time.count : 0;

  return (
    <SlideWrapper id="donor_insights" innerClassName="border-l-[3px] border-l-[#10b981]">
      <div className="mb-[30px]">
        <div className="w-full">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0 shadow-xs">
                <HeartHandshake size={18} />
              </div>
              <h2 className="!mb-0 text-[20px] font-[800] text-slate-900 tracking-tight">
                Donor Performance & Giving Breakdown
              </h2>
            </div>
          </div>
          <div className="text-[13px] font-[500] text-slate-500 mb-4">
            Analysis of new supporter acquisition, returning donors, recurring subscription sign-ups, and one-time gifts.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-slate-100 border border-slate-200 rounded-xl p-5 h-[115px]" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-[220px] bg-slate-100 rounded-xl" />
            <div className="h-[220px] bg-slate-100 rounded-xl" />
          </div>
        </div>
      ) : (
        <>
          {/* The 4 Core Goal KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Goal 1: New donor transactions (number & spend) */}
            <KpiCard 
              icon={UserPlus} 
              label="New Donor Transactions" 
              value={fCurrency(summary.new_donor.value)} 
              sublabel={`${fNumber(summary.new_donor.count)} transactions • Avg ${fCurrency(summary.avgNewDonor)}`} 
              delta={summary.deltas.new_donor} 
              trend={summary.trends.new_donor} 
              variant="g_green" 
            />

            {/* Goal 2: Existing donor transactions (number & spend) */}
            <KpiCard 
              icon={Users} 
              label="Existing Donor Transactions" 
              value={fCurrency(summary.existing_donor.value)} 
              sublabel={`${fNumber(summary.existing_donor.count)} transactions • Avg ${fCurrency(summary.avgExistingDonor)}`} 
              delta={summary.deltas.existing_donor} 
              trend={summary.trends.existing_donor} 
              variant="g_blue" 
            />

            {/* Goal 3: Recurring transactions (number & value) */}
            <KpiCard 
              icon={Repeat} 
              label="Recurring Transactions" 
              value={fCurrency(summary.recurring.value)} 
              sublabel={`${fNumber(summary.recurring.count)} subscription sign-ups`} 
              delta={summary.deltas.recurring} 
              trend={summary.trends.recurring} 
              variant="m_mid" 
            />

            {/* Goal 4: One-time transactions (number & value) */}
            <KpiCard 
              icon={Gift} 
              label="One-Time Transactions" 
              value={fCurrency(summary.one_time.value)} 
              sublabel={`${fNumber(summary.one_time.count)} single donations`} 
              delta={summary.deltas.one_time} 
              trend={summary.trends.one_time} 
              variant="g_yellow" 
            />
          </div>

          {/* Deep-Dive Comparative Breakdown: 2 Focused Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Column 1: Supporter Acquisition (New vs Existing) */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-emerald-600 shrink-0" />
                    <h3 className="text-[12px] font-bold text-slate-600 uppercase tracking-wider">
                      Supporter Acquisition (New vs Existing)
                    </h3>
                  </div>
                  <span className="text-[12px] font-semibold text-slate-500">
                    {fNumber(totalCount)} Transactions
                  </span>
                </div>

                {/* Segmented bar */}
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex mb-5">
                  {totalValue > 0 ? (
                    <>
                      <div 
                        style={{ width: `${newPct}%` }} 
                        className="bg-[#10b981] transition-all duration-300" 
                        title={`New Donors: ${newPct.toFixed(1)}%`}
                      />
                      <div 
                        style={{ width: `${existPct}%` }} 
                        className="bg-[#3b82f6] transition-all duration-300" 
                        title={`Existing Donors: ${existPct.toFixed(1)}%`}
                      />
                      <div 
                        style={{ width: `${guestPct}%` }} 
                        className="bg-[#94a3b8] transition-all duration-300" 
                        title={`Guest Donors: ${guestPct.toFixed(1)}%`}
                      />
                    </>
                  ) : (
                    <div className="w-full bg-slate-100" />
                  )}
                </div>

                {/* Structured comparative breakdown rows */}
                <div className="space-y-3.5">
                  {/* New Donors */}
                  <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100/80 flex items-center justify-between">
                    <div className="flex items-start gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] mt-1 shrink-0" />
                      <div>
                        <div className="text-[13px] font-bold text-slate-800">
                          New Donor Transactions
                        </div>
                        <div className="text-[11px] text-slate-500">
                          First-time supporters acquiring gifts
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[15px] font-[800] text-slate-900 tabular-nums">
                        {fCurrency(summary.new_donor.value)}
                      </div>
                      <div className="text-[11px] text-emerald-700 font-semibold">
                        {fNumber(summary.new_donor.count)} transactions ({newPct.toFixed(1)}%)
                      </div>
                    </div>
                  </div>

                  {/* Existing Donors */}
                  <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-100/80 flex items-center justify-between">
                    <div className="flex items-start gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] mt-1 shrink-0" />
                      <div>
                        <div className="text-[13px] font-bold text-slate-800">
                          Existing Donor Transactions
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Returning supporters with active donation history
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[15px] font-[800] text-slate-900 tabular-nums">
                        {fCurrency(summary.existing_donor.value)}
                      </div>
                      <div className="text-[11px] text-blue-700 font-semibold">
                        {fNumber(summary.existing_donor.count)} transactions ({existPct.toFixed(1)}%)
                      </div>
                    </div>
                  </div>

                  {/* Guest Checkouts */}
                  {summary.guest.count > 0 && (
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                      <div className="flex items-start gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#94a3b8] mt-1 shrink-0" />
                        <div>
                          <div className="text-[12px] font-semibold text-slate-700">
                            Guest Checkout Transactions
                          </div>
                          <div className="text-[10.5px] text-slate-400">
                            Immediate express donations (unlinked accounts)
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[13px] font-[700] text-slate-800 tabular-nums">
                          {fCurrency(summary.guest.value)}
                        </div>
                        <div className="text-[10.5px] text-slate-500 font-medium">
                          {fNumber(summary.guest.count)} transactions ({guestPct.toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Column 2: Giving Frequency (Recurring vs One-Time) */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Repeat size={16} className="text-indigo-600 shrink-0" />
                    <h3 className="text-[12px] font-bold text-slate-600 uppercase tracking-wider">
                      Giving Frequency (Recurring vs One-Time)
                    </h3>
                  </div>
                  <span className="text-[12px] font-semibold text-slate-500">
                    {fCurrency(totalValue)} Total Value
                  </span>
                </div>

                {/* Segmented bar */}
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex mb-5">
                  {totalValue > 0 ? (
                    <>
                      <div 
                        style={{ width: `${recurPct}%` }} 
                        className="bg-[#6366f1] transition-all duration-300" 
                        title={`Recurring Subscriptions: ${recurPct.toFixed(1)}%`}
                      />
                      <div 
                        style={{ width: `${onetimePct}%` }} 
                        className="bg-[#f59e0b] transition-all duration-300" 
                        title={`One-Time Donations: ${onetimePct.toFixed(1)}%`}
                      />
                    </>
                  ) : (
                    <div className="w-full bg-slate-100" />
                  )}
                </div>

                {/* Structured comparative breakdown rows */}
                <div className="space-y-3.5">
                  {/* Recurring Subscriptions */}
                  <div className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-100/80 flex items-center justify-between">
                    <div className="flex items-start gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1] mt-1 shrink-0" />
                      <div>
                        <div className="text-[13px] font-bold text-slate-800 flex items-center gap-1.5">
                          Recurring Transactions
                          <span className="text-[10px] uppercase font-bold tracking-wide px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                            Subscription
                          </span>
                        </div>
                        <div className="text-[11px] text-indigo-900/70 font-medium">
                          Orphan sponsorship, Giving Friday, automated regular gifts
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[15px] font-[800] text-slate-900 tabular-nums">
                        {fCurrency(summary.recurring.value)}
                      </div>
                      <div className="text-[11px] text-indigo-700 font-semibold">
                        {fNumber(summary.recurring.count)} subscriptions ({recurPct.toFixed(1)}%)
                      </div>
                    </div>
                  </div>

                  {/* One-Time Gifts */}
                  <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-100/80 flex items-center justify-between">
                    <div className="flex items-start gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] mt-1 shrink-0" />
                      <div>
                        <div className="text-[13px] font-bold text-slate-800 flex items-center gap-1.5">
                          One-Time Transactions
                          <span className="text-[10px] uppercase font-bold tracking-wide px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                            Single Gift
                          </span>
                        </div>
                        <div className="text-[11px] text-amber-900/70 font-medium">
                          Campaign appeals, emergency relief & general donations
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[15px] font-[800] text-slate-900 tabular-nums">
                        {fCurrency(summary.one_time.value)}
                      </div>
                      <div className="text-[11px] text-amber-800 font-semibold">
                        {fNumber(summary.one_time.count)} single gifts ({onetimePct.toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Consolidated Period Summary Bar */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-6 flex-wrap">
              <div>
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Total Raised</span>
                <span className="text-[16px] font-[800] text-slate-900 tabular-nums">{fCurrency(totalValue)}</span>
              </div>
              <div className="h-7 w-[1px] bg-slate-200 hidden sm:block" />
              <div>
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Completed Transactions</span>
                <span className="text-[16px] font-[800] text-slate-900 tabular-nums">{fNumber(totalCount)}</span>
              </div>
              <div className="h-7 w-[1px] bg-slate-200 hidden sm:block" />
              <div>
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Avg Transaction Size</span>
                <span className="text-[16px] font-[800] text-slate-900 tabular-nums">{fCurrency(summary.avgDonation)}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </SlideWrapper>
  );
};
