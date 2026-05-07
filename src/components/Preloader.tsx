import React from 'react';
import { motion } from 'motion/react';
import { LOGOS } from '../constants';

export const Preloader = () => {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-6">
        <motion.div
           animate={{ rotate: 360 }}
           transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
           className="w-12 h-12 border-4 border-[#e2e8f0] border-t-primary rounded-full"
        />
        <div className="flex flex-col items-center gap-2">
          <img src={LOGOS.client} alt="Logo" className="h-8 w-auto object-contain" />
          <span className="text-[10px] font-bold tracking-[3px] text-gray-400 uppercase">Generating Report</span>
        </div>
      </div>
    </div>
  );
};
