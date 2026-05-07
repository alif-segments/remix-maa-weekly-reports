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
      <header className="absolute top-0 left-0 right-0 py-4 px-8 border-b border-[#e2e8f0] bg-white flex justify-between items-center">
        <div className="flex items-center gap-6">
          <img src={LOGOS.client} alt="MAA" className="h-[32px] w-auto object-contain" referrerPolicy="no-referrer" />
          <div className="w-[1px] h-[24px] bg-[#e2e8f0]" />
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <img src={LOGOS.meta} alt="Meta" className="w-[16.5px] h-[16.5px] object-contain" referrerPolicy="no-referrer" />
              <span className="text-[11px] font-bold text-gray-400">Facebook</span>
            </div>
            <div className="text-[10px] font-bold text-gray-300 mx-1">x</div>
            <div className="flex items-center gap-2">
              <img src={LOGOS.google_ads} alt="Google Ads" className="w-[16.5px] h-[16.5px] object-contain" referrerPolicy="no-referrer" />
              <span className="text-[11px] font-bold text-[#4285F4]">Google</span>
            </div>
            <div className="text-[10px] font-bold text-gray-300 mx-1">x</div>
            <div className="flex items-center gap-2">
              <img src={LOGOS.ga4} alt="GA4" className="w-[16.5px] h-[16.5px] object-contain" referrerPolicy="no-referrer" />
              <span className="text-[11px] font-bold text-[#F9AB00]">GA4</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-[600] text-[#64748b] uppercase tracking-[1px] mb-1">Prepared By</div>
          <img src={LOGOS.agency} alt="Segments" className="h-[20px] w-auto object-contain ml-auto mb-1 invert" referrerPolicy="no-referrer" />
          <div className="text-[12px] text-[#94a3b8]">
            {metrics.startDate} – {metrics.endDate}
          </div>
        </div>
      </header>
      <div className="px-14 py-20 mt-16">
        <div className="section-label">Performance Report</div>
        <h1 className="text-[48px] font-[800] text-[#0f172a] mb-6 leading-[1.1] tracking-tight">
          Performance <br />
          <span className="text-primary italic">Dashboard</span>
        </h1>
        <p className="text-[20px] text-gray-500 font-medium mb-12">
          7-Day Consolidated Report · Meta, Google & GA4
        </p>
        <div className="flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">
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
