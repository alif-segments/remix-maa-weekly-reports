import React from 'react';
import { Calendar, Target, DollarSign, ChevronDown } from 'lucide-react';
import { SlideWrapper } from '../SlideWrapper';
import { LOGOS } from '@/src/constants';
import { MetricsSummary } from '@/src/types';

interface CoverSlideProps {
  metrics: MetricsSummary;
}

export const CoverSlide = ({ metrics }: CoverSlideProps) => {
  return (
    <SlideWrapper id="cover" innerClassName="bg-white border-0 shadow-none !p-0">
      <header className="absolute top-0 left-0 right-0 py-4 px-4 md:px-8 border-b border-[#e2e8f0] bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4 md:gap-6">
          <img src={LOGOS.client} alt="MAA" className="h-[24px] md:h-[32px] w-auto object-contain" referrerPolicy="no-referrer" />
          <div className="w-[1px] h-[24px] bg-[#e2e8f0] hidden sm:block" />
          <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
            <div className="flex items-center gap-1.5 md:gap-2">
              <img src={LOGOS.meta} alt="Meta" className="w-[14px] md:w-[16.5px] h-[14px] md:h-[16.5px] object-contain" referrerPolicy="no-referrer" />
              <span className="text-[10px] md:text-[11px] font-bold text-gray-400">Facebook</span>
            </div>
            <div className="text-[10px] font-bold text-gray-300 mx-0.5 md:mx-1">x</div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <img src={LOGOS.google_ads} alt="Google Ads" className="w-[14px] md:w-[16.5px] h-[14px] md:h-[16.5px] object-contain" referrerPolicy="no-referrer" />
              <span className="text-[10px] md:text-[11px] font-bold text-[#4285F4]">Google</span>
            </div>
            <div className="text-[10px] font-bold text-gray-300 mx-0.5 md:mx-1">x</div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <img src={LOGOS.ga4} alt="GA4" className="w-[14px] md:w-[16.5px] h-[14px] md:h-[16.5px] object-contain" referrerPolicy="no-referrer" />
              <span className="text-[10px] md:text-[11px] font-bold text-[#F9AB00]">GA4</span>
            </div>
          </div>
        </div>
        <div className="text-center sm:text-right w-full sm:w-auto">
          <div className="text-[9px] md:text-[10px] font-[600] text-[#64748b] uppercase tracking-[1px] mb-0.5 md:mb-1">Prepared By</div>
          <img src={LOGOS.agency} alt="Segments" className="h-[16px] md:h-[20px] w-auto object-contain mx-auto sm:ml-auto mb-1 invert" referrerPolicy="no-referrer" />
          <div className="text-[10px] md:text-[12px] text-[#94a3b8]">
            {metrics.startDate} – {metrics.endDate}
          </div>
        </div>
      </header>
      <div className="px-6 md:px-14 py-20 mt-32 sm:mt-16">
        <div className="section-label">Performance Report</div>
        <h1 className="text-[32px] md:text-[48px] font-[800] text-[#0f172a] mb-4 md:mb-6 leading-[1.1] tracking-tight">
          Performance <br className="hidden md:block" />
          <span className="text-primary italic">Dashboard</span>
        </h1>
        <p className="text-[16px] md:text-[20px] text-gray-500 font-medium mb-8 md:mb-12">
          7-Day Consolidated Report · Meta, Google & GA4
        </p>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-primary" />
            Period: {metrics.startDate} – {metrics.endDate}
          </div>
          <div className="flex items-center gap-2">
            <Target size={14} className="text-primary" />
            Source: Windsor.ai
          </div>
          <div className="flex items-center gap-2">
            <DollarSign size={14} className="text-primary" />
            Currency: AUD
          </div>
        </div>
      </div>
      <div className="scroll-hint">
        <ChevronDown size={24} />
      </div>
    </SlideWrapper>
  );
};
