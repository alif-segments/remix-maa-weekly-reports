import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LOGOS } from '../constants';

interface SourceStep {
  name: string;
  mono: string;
  logo?: string;
  tint: string;
  ink: string;
  title: string;
  desc: string;
}

const SOURCES: SourceStep[] = [
  { 
    name: 'Meta Ads', 
    mono: 'M', 
    logo: LOGOS.meta, 
    tint: '#E8EEFB', 
    ink: '#2A4A96', 
    title: 'Getting Facebook data', 
    desc: 'Fetching Meta Ads performance' 
  },
  { 
    name: 'Google Ads', 
    mono: 'G', 
    logo: LOGOS.google_ads, 
    tint: '#FDF0E1', 
    ink: '#8A4B0C', 
    title: 'Getting Google data', 
    desc: 'Fetching Google Ads performance' 
  },
  { 
    name: 'TikTok Ads', 
    mono: 'T', 
    logo: LOGOS.tiktok, 
    tint: '#EEEAF8', 
    ink: '#4B3A8C', 
    title: 'Getting TikTok data', 
    desc: 'Fetching TikTok Ads performance' 
  },
  { 
    name: 'Google Grants', 
    mono: 'Gr', 
    logo: LOGOS.google_ads, 
    tint: '#E4F3EC', 
    ink: '#1C6646', 
    title: 'Getting Google Grants', 
    desc: 'Fetching Google Grants Ads API' 
  },
  { 
    name: 'GA4', 
    mono: 'GA', 
    logo: LOGOS.ga4, 
    tint: '#FBEBE6', 
    ink: '#8F3A22', 
    title: 'Getting GA4 data', 
    desc: 'Fetching GA4 analytics sessions' 
  },
  { 
    name: 'Donors', 
    mono: 'D', 
    logo: LOGOS.client, 
    tint: '#E3F1F5', 
    ink: '#1F5A6B', 
    title: 'Getting donor data', 
    desc: 'Connecting to MAA donor feed' 
  }
];

const ALL_STEPS = [
  { title: 'Starting up', desc: 'Initializing the application' },
  ...SOURCES,
  { title: 'Processing data', desc: 'Generating weekly performance report' }
];

interface PreloaderProps {
  isDataLoaded?: boolean;
  isPerfLoaded?: boolean;
  isDonorLoaded?: boolean;
  onFinish?: () => void;
}

export const Preloader: React.FC<PreloaderProps> = ({ 
  isDataLoaded = false, 
  isPerfLoaded = false, 
  isDonorLoaded = false, 
  onFinish 
}) => {
  const [progressVal, setProgressVal] = useState(0); // 0 to ALL_STEPS.length
  const [isDone, setIsDone] = useState(false);

  const n = ALL_STEPS.length; // 8 steps
  const accent = '#2557D6';
  const ok = '#1F8A5B';

  const isCompletelyLoaded = isDataLoaded || (isPerfLoaded && isDonorLoaded);

  useEffect(() => {
    // High-cadence timer (25ms) for silk-smooth, responsive animation
    const timer = setInterval(() => {
      setProgressVal((prev) => {
        if (isCompletelyLoaded) {
          // If all datasets (Ads + Donors) are ready, advance rapidly and smoothly to 100%
          const next = prev + 0.35;
          if (next >= n) {
            setIsDone(true);
            return n;
          }
          return next;
        } else {
          // When waiting for data, progress smoothly through earlier steps (0 to 6)
          // Once it reaches step 6.0 (the Donors step), hold smoothly on Donors (~86%)
          // until the MAA Datafeed API confirms data retrieval
          if (prev < 6.0) {
            return prev + 0.12;
          } else if (prev < 6.85) {
            return prev + 0.025;
          }
          // Smoothly hold at the Donors step without freezing dead
          return Math.min(6.92, prev + 0.002);
        }
      });
    }, 25);

    return () => clearInterval(timer);
  }, [isCompletelyLoaded, n]);

  // When completed, trigger onFinish callback swiftly
  useEffect(() => {
    if (isDone && onFinish) {
      const finishTimeout = setTimeout(() => {
        onFinish();
      }, 180);
      return () => clearTimeout(finishTimeout);
    }
  }, [isDone, onFinish]);

  const p = Math.min(n, progressVal);
  const done = isDone || p >= n;
  const idx = done ? n - 1 : Math.floor(p);
  const cur = ALL_STEPS[idx];
  const pct = Math.min(100, Math.round((p / n) * 100));
  const remaining = Math.max(1, Math.ceil((n - p) * 1.0));

  // Count synced sources
  let doneCount = 0;
  SOURCES.forEach((_, j) => {
    const stepIdx = j + 1;
    let isSrcDone = false;
    if (done) {
      isSrcDone = true;
    } else if (j === 5) {
      isSrcDone = Boolean(isDonorLoaded);
    } else {
      isSrcDone = Boolean(isPerfLoaded) || stepIdx < idx;
    }
    if (isSrcDone) doneCount += 1;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F2F4F3] p-4 font-sans select-none">
      {/* Container Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="w-full max-w-[468px] bg-white border border-[#E3E7EA] rounded-[20px] p-7 pb-5.5 flex flex-col gap-6 shadow-[0_1px_2px_rgba(16,24,32,0.04),0_12px_32px_rgba(16,24,32,0.06)]"
      >
        {/* Top Header with MAA Brand Logo and Syncing Badge */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* MAA Brand Logo */}
            <img 
              src={LOGOS.client} 
              alt="MAA International" 
              className="h-9 w-auto object-contain"
            />
            <div className="flex flex-col border-l border-slate-200 pl-3">
              <span className="text-[10.5px] font-semibold tracking-[0.6px] uppercase text-[#5C6874] leading-tight">
                Performance dashboard
              </span>
            </div>
          </div>

          {/* Sync Status Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F2F4F3] text-[12px] font-medium text-[#3D4853] shrink-0">
            {done ? (
              <>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ok }} />
                <span>Synced</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: accent }} />
                <span>Syncing</span>
              </>
            )}
          </div>
        </div>

        {/* Current Step Status & Percentage */}
        <div className="flex flex-col gap-3.5">
          <div className="flex items-end justify-between gap-4">
            <div aria-live="polite" className="flex flex-col gap-1 min-w-0">
              <span className="text-[17px] font-semibold tracking-[-0.2px] text-[#18212B] leading-tight">
                {done ? 'Your dashboard is ready' : cur.title}
              </span>
              <span className="text-[13px] text-[#5C6874] leading-tight">
                {done ? 'Opening the weekly performance view' : cur.desc}
              </span>
            </div>
            <div className="flex items-baseline gap-0.5 font-mono text-[#18212B] shrink-0">
              <span className="text-[38px] sm:text-[40px] font-semibold tracking-[-1.5px] leading-none">
                {pct}
              </span>
              <span className="text-[17px] font-medium text-[#5C6874]">%</span>
            </div>
          </div>

          {/* Multi-segment Progress Bar (8 segments) */}
          <div 
            role="progressbar" 
            aria-label="Loading progress" 
            aria-valuemin={0} 
            aria-valuemax={100} 
            aria-valuenow={pct} 
            className="flex gap-1"
          >
            {ALL_STEPS.map((_, i) => {
              const segFill = (done || i < idx) 
                ? 100 
                : (i === idx ? Math.round((p - i) * 100) : 0);

              return (
                <div 
                  key={i} 
                  className="flex-1 h-1.5 rounded-[3px] bg-[#E6EAED] overflow-hidden"
                >
                  <div 
                    className="h-full rounded-[3px] transition-all duration-150"
                    style={{ 
                      width: `${segFill}%`,
                      backgroundColor: segFill >= 100 ? ok : accent
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Step Count & ETA Text */}
          <div className="flex justify-between text-[12px] text-[#5C6874] font-mono">
            <span>Step {Math.min(idx + 1, n)} of {n}</span>
            <span>{done ? 'Complete' : `About ${remaining}s left`}</span>
          </div>
        </div>

        {/* Data Sources Grid */}
        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between items-baseline">
            <span className="text-[11px] font-bold tracking-[0.6px] uppercase text-[#3D4853]">
              Data sources
            </span>
            <span className="text-[12px] text-[#5C6874] font-mono">
              {doneCount}/{SOURCES.length} synced
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {SOURCES.map((src, j) => {
              const stepIdx = j + 1;
              let isSrcDone = false;
              let isSrcActive = false;
              let isSrcQueued = false;

              if (done) {
                isSrcDone = true;
              } else if (j === 5) {
                // Donors card linked to MAA Datafeed API
                if (isDonorLoaded) {
                  isSrcDone = true;
                } else if (idx >= 6) {
                  isSrcActive = true;
                } else {
                  isSrcQueued = true;
                }
              } else {
                // Ad performance sources linked to Windsor.ai
                if (isPerfLoaded && stepIdx <= idx) {
                  isSrcDone = true;
                } else if (stepIdx < idx) {
                  isSrcDone = true;
                } else if (stepIdx === idx) {
                  isSrcActive = true;
                } else {
                  isSrcQueued = true;
                }
              }

              return (
                <div
                  key={src.name}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all duration-200 ${
                    isSrcActive
                      ? 'border-[#2557D6] bg-[#F4F7FE] shadow-2xs'
                      : isSrcDone
                      ? 'border-[#E3E7EA] bg-white opacity-100'
                      : 'border-[#E3E7EA] bg-white opacity-70'
                  }`}
                >
                  {/* Source Icon / Badge */}
                  <div 
                    className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: src.tint }}
                  >
                    {src.logo ? (
                      <img 
                        src={src.logo} 
                        alt={src.name} 
                        className="w-5 h-5 object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <span 
                        className="text-[12px] font-bold tracking-[-0.2px]"
                        style={{ color: src.ink }}
                      >
                        {src.mono}
                      </span>
                    )}
                  </div>

                  {/* Source Title & Status Text */}
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[13px] font-semibold text-[#18212B] truncate leading-tight">
                      {src.name}
                    </span>
                    <span 
                      className="text-[11px] leading-tight font-medium"
                      style={{ 
                        color: isSrcActive ? accent : (isSrcDone ? '#3D4853' : '#6B7680') 
                      }}
                    >
                      {isSrcDone ? 'Synced' : (isSrcActive ? 'Fetching…' : 'Queued')}
                    </span>
                  </div>

                  {/* Status Indicator Icon */}
                  {isSrcDone && (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" className="shrink-0">
                      <circle cx="9" cy="9" r="8" fill={ok} />
                      <path d="M5.5 9.2l2.3 2.3 4.7-4.9" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {isSrcActive && (
                    <svg className="animate-spin shrink-0" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                      <circle cx="9" cy="9" r="7" stroke="#DCE4F7" strokeWidth="2.2" />
                      <path d="M9 2a7 7 0 0 1 7 7" stroke={accent} strokeWidth="2.2" strokeLinecap="round" />
                    </svg>
                  )}
                  {isSrcQueued && (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" className="shrink-0">
                      <circle cx="9" cy="9" r="7" stroke="#D3D9DE" strokeWidth="1.6" strokeDasharray="2.5 2.5" />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Secure Connector Footer */}
        <div className="flex items-center justify-center gap-1.5 pt-3 border-t border-[#EDF0F2] text-[12px] text-[#5C6874]">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="#5C6874" strokeWidth="1.4" />
            <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="#5C6874" strokeWidth="1.4" />
          </svg>
          <span>Secure connection via Windsor.ai &amp; MAA Datafeed</span>
        </div>
      </motion.div>
    </div>
  );
};
