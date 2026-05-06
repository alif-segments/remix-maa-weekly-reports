import React from 'react';
import { SlideWrapper } from '../SlideWrapper';
import { LOGOS } from '@/src/constants';

export const FooterSlide = () => {
  return (
    <SlideWrapper id="footer" innerClassName="border-0 shadow-none bg-transparent flex flex-col items-center justify-center text-center py-20 px-12">
        <div className="flex items-center gap-12 mb-12 opacity-80 scale-110">
           <img src={LOGOS.client} alt="MAA" className="h-[40px] w-auto object-contain" referrerPolicy="no-referrer" />
           <div className="w-[1px] h-[32px] bg-[#e2e8f0]" />
           <img src={LOGOS.agency} alt="Segments" className="h-[24px] w-auto object-contain invert" referrerPolicy="no-referrer" />
        </div>
        <div className="space-y-4">
          <h2 className="text-[12px] font-[600] tracking-[2px] uppercase text-[#64748b]">WWW.SEGMENTS.AGENCY</h2>
          <div className="text-[11px] text-[#94a3b8] font-[500] uppercase tracking-[1px]">
            MAA INTERNATIONAL · INTERNAL DATA EXPORT · WINDSOR.AI CONNECTOR
          </div>
          <div className="w-12 h-0.5 bg-[#cbd5e1] mx-auto mt-6" />
        </div>
    </SlideWrapper>
  );
};
