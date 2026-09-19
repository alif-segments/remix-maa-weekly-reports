import React from 'react';
import { 
  HeartHandshake, 
  UserPlus, 
  Users, 
  Repeat, 
  Gift 
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

const calcD = (c: number, p: number) => {
  if (p === 0) {
    return c > 0 ? "NEW" : "0.0%";
  }
  const d = ((c - p) / Math.max(1, p)) * 100;
  return `${d > 0 ? '+' : ''}${d.toFixed(1)}%`;
};

export const DonorInsightsSlide = ({
  metrics,
  isEditMode = false,
  content,
  defaultText,
  onUpdateContent,
  onSave
}: DonorInsightsSlideProps) => {
  const { data: reportData, loading } = useDonorReport(metrics?.startDate);

  const current = reportData?.current || {
    total: { count: 0, value: 0 },
    new_donor: { count: 0, value: 0 },
    existing_donor: { count: 0, value: 0 },
    guest: { count: 0, value: 0 },
    recurring: { count: 0, value: 0 },
    one_time: { count: 0, value: 0 },
    mixed_count: 0
  };

  const prev = reportData?.previous || {
    total: { count: 0, value: 0 },
    new_donor: { count: 0, value: 0 },
    existing_donor: { count: 0, value: 0 },
    guest: { count: 0, value: 0 },
    recurring: { count: 0, value: 0 },
    one_time: { count: 0, value: 0 },
    mixed_count: 0
  };

  // Metric derivations for the weekly period
  const totalValue = current.total.value || 0;
  const totalDonors = (current.new_donor.count + current.existing_donor.count + current.guest.count) || 0;
  const totalGifts = current.total.count || 0;

  // Percentage calculations
  const newPct = totalValue > 0 ? (current.new_donor.value / totalValue) * 100 : 0;
  const existPct = totalValue > 0 ? (current.existing_donor.value / totalValue) * 100 : 0;
  const guestPct = totalValue > 0 ? (current.guest.value / totalValue) * 100 : 0;

  const recurPct = totalValue > 0 ? (current.recurring.value / totalValue) * 100 : 0;
  const onetimePct = totalValue > 0 ? (current.one_time.value / totalValue) * 100 : 0;

  // Average gift sizes
  const avgNew = current.new_donor.count > 0 ? current.new_donor.value / current.new_donor.count : 0;
  const avgExist = current.existing_donor.count > 0 ? current.existing_donor.value / current.existing_donor.count : 0;
  const avgGuest = current.guest.count > 0 ? current.guest.value / current.guest.count : 0;
  const avgRecur = current.recurring.count > 0 ? current.recurring.value / current.recurring.count : 0;
  const avgOnetime = current.one_time.count > 0 ? current.one_time.value / current.one_time.count : 0;

  return (
    <SlideWrapper id="donor_insights" innerClassName="border-l-[3px] border-l-[#10b981]">
      <div className="mb-[35px]">
        <div className="w-full">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                <HeartHandshake size={16} />
              </div>
              <h2 className="!mb-0">Donors & Giving Performance</h2>
            </div>
            <div className="text-[13px] text-[#64748b] font-[500] whitespace-nowrap">
              Period: {metrics.formattedRange}
            </div>
          </div>
          <div className="text-[12px] font-[500] text-[#64748b] mb-6">
            Supporter acquisition, retention, and recurring giving breakdown across all channels
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-[210px] bg-slate-100 rounded-xl" />
            <div className="h-[210px] bg-slate-100 rounded-xl" />
          </div>
        </div>
      ) : (
        <>
          {/* 4 Standard KPI Cards matching other slides */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <KpiCard 
              icon={UserPlus} 
              label="New Donors" 
              value={fCurrency(current.new_donor.value)} 
              sublabel={`${fNumber(current.new_donor.count)} first-time donors`} 
              delta={calcD(current.new_donor.value, prev.new_donor.value)} 
              trend={current.new_donor.value >= prev.new_donor.value ? 'up' : 'down'} 
              variant="g_green" 
            />
            <KpiCard 
              icon={Users} 
              label="Existing Donors" 
              value={fCurrency(current.existing_donor.value)} 
              sublabel={`${fNumber(current.existing_donor.count)} returning donors`} 
              delta={calcD(current.existing_donor.value, prev.existing_donor.value)} 
              trend={current.existing_donor.value >= prev.existing_donor.value ? 'up' : 'down'} 
              variant="g_blue" 
            />
            <KpiCard 
              icon={Repeat} 
              label="Recurring Giving" 
              value={fCurrency(current.recurring.value)} 
              sublabel={`${fNumber(current.recurring.count)} subscriptions`} 
              delta={calcD(current.recurring.value, prev.recurring.value)} 
              trend={current.recurring.value >= prev.recurring.value ? 'up' : 'down'} 
              variant="m_mid" 
            />
            <KpiCard 
              icon={Gift} 
              label="One-Time Giving" 
              value={fCurrency(current.one_time.value)} 
              sublabel={`${fNumber(current.one_time.count)} single gifts`} 
              delta={calcD(current.one_time.value, prev.one_time.value)} 
              trend={current.one_time.value >= prev.one_time.value ? 'up' : 'down'} 
              variant="g_yellow" 
            />
          </div>

          {/* Visual Breakdown Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: Donor Composition (New vs Existing vs Guest) */}
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-emerald-600 shrink-0" />
                    <h3 className="text-[12px] font-bold text-[#64748b] uppercase tracking-widest">
                      Donor Composition
                    </h3>
                  </div>
                  <span className="text-[12px] font-semibold text-slate-500">
                    {fNumber(totalDonors)} Total Supporters
                  </span>
                </div>

                {/* Segmented distribution bar */}
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex mb-5">
                  {totalValue > 0 ? (
                    <>
                      <div 
                        style={{ width: `${newPct}%` }} 
                        className="bg-[#10b981] transition-all duration-500" 
                        title={`New Donors: ${newPct.toFixed(1)}%`}
                      />
                      <div 
                        style={{ width: `${existPct}%` }} 
                        className="bg-[#3b82f6] transition-all duration-500" 
                        title={`Existing Donors: ${existPct.toFixed(1)}%`}
                      />
                      <div 
                        style={{ width: `${guestPct}%` }} 
                        className="bg-[#94a3b8] transition-all duration-500" 
                        title={`Guest Donors: ${guestPct.toFixed(1)}%`}
                      />
                    </>
                  ) : (
                    <div className="w-full bg-slate-100" />
                  )}
                </div>
              </div>

              {/* 3 Metric breakdown columns */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] shrink-0" />
                    <span className="text-[11px] font-bold text-slate-600 truncate">New Donors</span>
                  </div>
                  <div className="text-[16px] font-[800] text-[#0f172a] tabular-nums">
                    {fCurrency(current.new_donor.value)}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {newPct.toFixed(0)}% • {current.new_donor.count} donors
                  </div>
                  <div className="text-[10.5px] text-slate-400 font-medium">
                    Avg: {fCurrency(avgNew)}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] shrink-0" />
                    <span className="text-[11px] font-bold text-slate-600 truncate">Existing</span>
                  </div>
                  <div className="text-[16px] font-[800] text-[#0f172a] tabular-nums">
                    {fCurrency(current.existing_donor.value)}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {existPct.toFixed(0)}% • {current.existing_donor.count} donors
                  </div>
                  <div className="text-[10.5px] text-slate-400 font-medium">
                    Avg: {fCurrency(avgExist)}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#94a3b8] shrink-0" />
                    <span className="text-[11px] font-bold text-slate-600 truncate">Guest</span>
                  </div>
                  <div className="text-[16px] font-[800] text-[#0f172a] tabular-nums">
                    {fCurrency(current.guest.value)}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {guestPct.toFixed(0)}% • {current.guest.count} donors
                  </div>
                  <div className="text-[10.5px] text-slate-400 font-medium">
                    Avg: {fCurrency(avgGuest)}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Giving Frequency Distribution (Recurring vs One-Time) */}
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Repeat size={16} className="text-indigo-600 shrink-0" />
                    <h3 className="text-[12px] font-bold text-[#64748b] uppercase tracking-widest">
                      Giving Frequency Distribution
                    </h3>
                  </div>
                  <span className="text-[12px] font-semibold text-slate-500">
                    {fNumber(totalGifts)} Total Contributions
                  </span>
                </div>

                {/* Segmented distribution bar */}
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex mb-5">
                  {totalValue > 0 ? (
                    <>
                      <div 
                        style={{ width: `${recurPct}%` }} 
                        className="bg-[#6366f1] transition-all duration-500" 
                        title={`Recurring Giving: ${recurPct.toFixed(1)}%`}
                      />
                      <div 
                        style={{ width: `${onetimePct}%` }} 
                        className="bg-[#f59e0b] transition-all duration-500" 
                        title={`One-Time Giving: ${onetimePct.toFixed(1)}%`}
                      />
                    </>
                  ) : (
                    <div className="w-full bg-slate-100" />
                  )}
                </div>
              </div>

              {/* 2 Metric breakdown columns */}
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1] shrink-0" />
                    <span className="text-[11px] font-bold text-slate-600 truncate">Recurring Subscriptions</span>
                  </div>
                  <div className="text-[17px] font-[800] text-[#0f172a] tabular-nums">
                    {fCurrency(current.recurring.value)}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {recurPct.toFixed(0)}% revenue • {current.recurring.count} gifts
                  </div>
                  <div className="text-[10.5px] text-slate-400 font-medium">
                    Avg Gift: {fCurrency(avgRecur)}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] shrink-0" />
                    <span className="text-[11px] font-bold text-slate-600 truncate">One-Time Gifts</span>
                  </div>
                  <div className="text-[17px] font-[800] text-[#0f172a] tabular-nums">
                    {fCurrency(current.one_time.value)}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {onetimePct.toFixed(0)}% revenue • {current.one_time.count} gifts
                  </div>
                  <div className="text-[10.5px] text-slate-400 font-medium">
                    Avg Gift: {fCurrency(avgOnetime)}
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
