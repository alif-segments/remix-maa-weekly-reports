import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, CheckCircle2, Loader2, Circle } from 'lucide-react';
import { LOGOS } from '../constants';

interface PreloadStep {
  id: string;
  name: string;
  desc: string;
}

const PRELOAD_STEPS: PreloadStep[] = [
  { id: 'init', name: 'App Init', desc: 'Application initialized' },
  { id: 'meta', name: 'Getting Facebook data...', desc: 'Fetching Meta Ads performance API' },
  { id: 'google', name: 'Getting Google data', desc: 'Fetching Google Ads performance API' },
  { id: 'tiktok', name: 'Getting TikTok data', desc: 'Fetching TikTok Ads performance API' },
  { id: 'grants', name: 'Getting Google Grants', desc: 'Fetching Google Grants Ads API' },
  { id: 'ga4', name: 'Getting GA4 data', desc: 'Fetching GA4 analytics sessions' },
  { id: 'donor', name: 'Getting Donor data', desc: 'Fetching Stape donor transactions' },
  { id: 'process', name: 'Processing data', desc: 'Generating weekly performance metrics' }
];

interface PreloaderProps {
  isDataLoaded?: boolean;
  onFinish?: () => void;
}

export const Preloader: React.FC<PreloaderProps> = ({ isDataLoaded = false, onFinish }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    // Progress through steps smoothly
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < PRELOAD_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 650);

    return () => clearInterval(interval);
  }, []);

  // When data is actually loaded from the server
  useEffect(() => {
    if (isDataLoaded) {
      // Accelerate to completion
      const timer = setTimeout(() => {
        setCurrentStepIndex(PRELOAD_STEPS.length);
        setIsCompleted(true);
        const finishTimer = setTimeout(() => {
          if (onFinish) onFinish();
        }, 400);
        return () => clearTimeout(finishTimer);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isDataLoaded, onFinish]);

  // Compute progress percentage
  const total = PRELOAD_STEPS.length;
  const progress = isCompleted 
    ? 100 
    : Math.min(95, Math.round(((currentStepIndex + 0.3) / total) * 100));

  const activeStep = PRELOAD_STEPS[Math.min(currentStepIndex, PRELOAD_STEPS.length - 1)];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f8fafc] p-4">
      {/* Compact, balanced preloader card with no excessive height */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-[450px] bg-white rounded-2xl border border-slate-200 shadow-[0_12px_36px_rgba(15,23,42,0.07)] p-5 sm:p-6 flex flex-col"
      >
        {/* Brand Logo */}
        <div className="flex flex-col items-center mb-4">
          <img 
            src={LOGOS.client} 
            alt="MAA International" 
            className="h-8 sm:h-9 w-auto object-contain mb-2" 
          />
          <div className="flex items-center gap-1.5 text-[10.5px] font-bold tracking-[2px] text-blue-600 uppercase">
            <Activity size={13} className="animate-pulse text-blue-500" />
            <span>PERFORMANCE DASHBOARD</span>
          </div>
        </div>

        {/* Progress Header & Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-[12px] font-semibold text-slate-700 mb-1.5">
            <span className="truncate pr-2">
              {isCompleted ? 'Dashboard Ready' : activeStep.name}
            </span>
            <span className="text-blue-600 font-bold tabular-nums shrink-0">
              {progress}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-blue-600 rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Steps List Box */}
        <div className="bg-[#f8fafc] border border-slate-100 rounded-xl p-2 sm:p-2.5 space-y-1">
          {PRELOAD_STEPS.map((step, idx) => {
            const isDone = isCompleted || idx < currentStepIndex;
            const isActive = !isCompleted && idx === currentStepIndex;
            const isPending = !isCompleted && idx > currentStepIndex;

            return (
              <div 
                key={step.id}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all text-[12px] ${
                  isActive 
                    ? 'bg-blue-50/80 border border-blue-100 text-blue-800 shadow-2xs' 
                    : isDone
                    ? 'text-slate-700'
                    : 'text-slate-400 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  {isDone ? (
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  ) : isActive ? (
                    <Loader2 size={15} className="text-blue-600 animate-spin shrink-0" />
                  ) : (
                    <Circle size={15} className="text-slate-300 shrink-0" />
                  )}
                  <span className={`truncate ${isActive ? 'font-semibold text-blue-900' : isDone ? 'font-medium' : 'font-normal'}`}>
                    {step.name}
                  </span>
                </div>
                <span className="text-[10.5px] text-slate-400 font-normal shrink-0 text-right truncate max-w-[170px]">
                  {step.desc}
                </span>
              </div>
            );
          })}
        </div>

        {/* Connector Footer Note */}
        <div className="mt-3.5 text-center">
          <span className="text-[9.5px] font-bold tracking-[2px] text-slate-400 uppercase">
            WINDSOR.AI & STAPE DATA CONNECTOR
          </span>
        </div>
      </motion.div>
    </div>
  );
};
