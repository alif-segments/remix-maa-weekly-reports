import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Filter, Check, X, RotateCcw, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { DateRange, DatePreset } from '../types';
import { getPresets, getDefaultDateRange, formatDateRange } from '../utils/datePresets';
import { cn } from '../lib/utils';

interface DateRangePickerProps {
  dateRange: DateRange;
  onChange: (range: DateRange) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  onClose: () => void;
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  dateRange,
  onChange,
  isOpen,
  onToggleOpen,
  onClose,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const presets = useRef<DatePreset[]>(getPresets()).current;

  // Local draft state for the date picker inputs
  const [tempStartDate, setTempStartDate] = useState(dateRange.startDate);
  const [tempEndDate, setTempEndDate] = useState(dateRange.endDate);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(() => {
    const match = presets.find(
      p => p.startDate === dateRange.startDate && p.endDate === dateRange.endDate
    );
    return match ? match.id : null;
  });

  // Keep local draft in sync whenever dateRange prop changes
  useEffect(() => {
    setTempStartDate(dateRange.startDate);
    setTempEndDate(dateRange.endDate);
    const match = presets.find(
      p => p.startDate === dateRange.startDate && p.endDate === dateRange.endDate
    );
    setSelectedPresetId(match ? match.id : null);
  }, [dateRange.startDate, dateRange.endDate, presets]);

  // Click outside listener to dismiss the popup
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSelectPreset = (preset: DatePreset) => {
    console.info(`[DateRangePicker] Selected quick preset "${preset.label}": ${preset.startDate} to ${preset.endDate}`);
    setTempStartDate(preset.startDate);
    setTempEndDate(preset.endDate);
    setSelectedPresetId(preset.id);
  };

  const handleReset = () => {
    const defaultRange = getDefaultDateRange();
    console.info(`[DateRangePicker] Resetting filter to Australian default range: ${defaultRange.startDate} to ${defaultRange.endDate}`);
    setTempStartDate(defaultRange.startDate);
    setTempEndDate(defaultRange.endDate);
    setSelectedPresetId('prev_week');
    onChange(defaultRange);
  };

  const handleApply = () => {
    let start = tempStartDate;
    let end = tempEndDate;
    if (!start || !end) return;

    // Auto-order start and end if inverted
    if (start > end) {
      const temp = start;
      start = end;
      end = temp;
      setTempStartDate(start);
      setTempEndDate(end);
      console.info(`[DateRangePicker] Inverted dates detected and auto-corrected.`);
    }

    console.info(`[DateRangePicker] Applied date range filter: ${start} to ${end}`);
    onChange({ startDate: start, endDate: end });
    onClose();
  };

  const displayFormattedRange = formatDateRange(dateRange.startDate, dateRange.endDate);

  return (
    <div ref={containerRef} className={cn("relative inline-block text-left", className)}>
      {/* Trigger Pill Button (Matches top right filter button in reference image) */}
      <button
        id="date-filter-trigger-btn"
        type="button"
        onClick={onToggleOpen}
        aria-expanded={isOpen}
        aria-label="Open date filter"
        className={cn(
          "flex items-center gap-3 bg-white hover:bg-slate-50 border rounded-2xl px-3.5 py-2 shadow-sm transition-all text-left select-none cursor-pointer",
          isOpen
            ? "border-blue-500 ring-2 ring-blue-500/15 shadow-md"
            : "border-slate-200/90 hover:border-slate-300"
        )}
      >
        {/* Calendar icon in soft blue badge */}
        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <Calendar size={17} className="stroke-[2.2]" />
        </div>

        {/* Date Filter & Current Active Range */}
        <div className="flex flex-col min-w-0 pr-1">
          <span className="text-[10px] font-bold tracking-[0.08em] uppercase text-slate-400 leading-none mb-1">
            Date Filter
          </span>
          <span className="text-[13px] font-bold text-slate-800 leading-tight whitespace-nowrap">
            {displayFormattedRange || `${dateRange.startDate} – ${dateRange.endDate}`}
          </span>
        </div>

        {/* Chevron state */}
        <div className="text-slate-400 shrink-0">
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Date Selector Popover (Matches Red Box in reference image) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="date-range-modal"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2.5 z-[120] w-[420px] max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-200/90 p-5 overflow-hidden"
          >
            {/* Header: Funnel icon + Select Date Range + Close button */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-[15px]">
                <Filter size={17} className="text-blue-600 stroke-[2.4]" />
                <span>Select Date Range</span>
              </div>
              <button
                id="close-date-modal-btn"
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                title="Close date filter"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Presets Section */}
            <div className="mt-4">
              <div className="text-[11px] font-bold text-slate-400 tracking-[0.08em] uppercase mb-2.5">
                Quick Presets
              </div>
              <div className="grid grid-cols-3 gap-2">
                {presets.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      id={`preset-btn-${preset.id}`}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={cn(
                        "text-[12px] py-2 px-2 rounded-xl border text-center transition-all flex items-center justify-center gap-1.5 leading-tight select-none",
                        isSelected
                          ? "bg-[#eff6ff] text-[#1d4ed8] border-[#93c5fd] font-bold shadow-xs ring-1 ring-blue-400/30"
                          : "bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50 hover:border-slate-300 font-medium"
                      )}
                    >
                      {isSelected && (
                        <Check size={14} className="text-blue-600 stroke-[2.5] shrink-0" />
                      )}
                      <span className="truncate">{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Start & End Date Section */}
            <div className="mt-5">
              <div className="text-[11px] font-bold text-slate-400 tracking-[0.08em] uppercase mb-2.5">
                Custom Start & End Date
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label 
                    htmlFor="start-date-input" 
                    className="block text-[12px] font-semibold text-slate-600 mb-1.5"
                  >
                    Start Date
                  </label>
                  <input
                    id="start-date-input"
                    type="date"
                    value={tempStartDate}
                    onChange={(e) => {
                      setTempStartDate(e.target.value);
                      setSelectedPresetId(null);
                    }}
                    className="w-full bg-slate-50/90 hover:bg-white border border-slate-200/90 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-3 py-2 text-[13px] text-slate-800 font-medium outline-none transition-all shadow-2xs"
                  />
                </div>
                <div>
                  <label 
                    htmlFor="end-date-input" 
                    className="block text-[12px] font-semibold text-slate-600 mb-1.5"
                  >
                    End Date
                  </label>
                  <input
                    id="end-date-input"
                    type="date"
                    value={tempEndDate}
                    onChange={(e) => {
                      setTempEndDate(e.target.value);
                      setSelectedPresetId(null);
                    }}
                    className="w-full bg-slate-50/90 hover:bg-white border border-slate-200/90 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-3 py-2 text-[13px] text-slate-800 font-medium outline-none transition-all shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Footer Action Bar */}
            <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
              <button
                id="reset-date-filter-btn"
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <RotateCcw size={14} className="stroke-[2.2]" />
                Reset
              </button>

              <button
                id="apply-date-filter-btn"
                type="button"
                onClick={handleApply}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all active:scale-[0.98]"
              >
                <Sparkles size={14} className="stroke-[2.2]" />
                Apply Date Range
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
