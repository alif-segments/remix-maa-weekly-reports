import React, { useMemo, useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Award,
  ChevronDown,
  Info,
  Layers,
  Facebook,
  Globe
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from './lib/utils';
import { LOGOS } from './constants';
import { usePerformanceData } from './hooks/usePerformanceData';

// Slide Components
import { CoverSlide } from './components/slides/CoverSlide';
import { SummarySlide } from './components/slides/SummarySlide';
import { WeeklyTrendSlide } from './components/slides/WeeklyTrendSlide';
import { CreativeBreakdownSlide } from './components/slides/CreativeBreakdownSlide';
import { GoogleAdsSlide } from './components/slides/GoogleAdsSlide';
import { MetaAdsSlide } from './components/slides/MetaAdsSlide';
import { GrantsSlide } from './components/slides/GrantsSlide';
import { FooterSlide } from './components/slides/FooterSlide';

export default function App() {
  const { metrics, loading } = usePerformanceData();
  const [activeSlide, setActiveSlide] = useState('cover');

  // Observer for active slide
  useEffect(() => {
    if (loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSlide(entry.target.id);
          }
        });
      },
      { threshold: 0.5 }
    );

    document.querySelectorAll('.slide').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loading]);

  const creatives = useMemo(() => {
    if (!metrics) return [];
    return Object.entries(metrics.current.byCreative)
      .map(([name, stats]) => {
        const s = stats as any;
        return { 
          name, 
          ...s, 
          roas: (s.revenue || 0) / Math.max(1, s.spend || 0)
        };
      })
      .sort((a: any, b: any) => b.roas - a.roas);
  }, [metrics]);

  const platformStats = useMemo(() => {
    if (!metrics) return null;
    const metaConv = Object.values(metrics.current.byCampaign)
      .filter(c => (c as any).source?.includes('facebook'))
      .reduce((acc, c) => acc + (c as any).conversions, 0);
    const googleConv = Object.values(metrics.current.byCampaign)
      .filter(c => (c as any).source === 'google_ads')
      .reduce((acc, c) => acc + (c as any).conversions, 0);
    
    const isMetaDominant = metaConv >= googleConv;
  
    return {
      metaConv,
      googleConv,
      totalConv: metrics.current.total.conversions,
      dominant: isMetaDominant ? 'Meta Ads' : 'Google Ads',
      dominantShort: isMetaDominant ? 'Meta' : 'Google',
      dominantConv: isMetaDominant ? metaConv : googleConv,
      trackingMethod: isMetaDominant ? 'tracked via the pixel' : 'tracked via conversion tags',
      shareText: isMetaDominant 
        ? `contributed the majority of the conversion volume` 
        : `showcased significant performance growth in conversion volume`
    };
  }, [metrics]);

  const topCreative = creatives[0];

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex flex-col items-center gap-4"
        >
          <img src={LOGOS.client} alt="MAA" className="h-12 object-contain grayscale opacity-50" />
          <div className="text-xs font-bold tracking-widest text-gray-400 uppercase">Generating Report...</div>
        </motion.div>
      </div>
    );
  }

  if (!metrics) {
    return (
       <div className="h-screen w-full flex items-center justify-center bg-white p-12 text-center">
         <div>
           <img src={LOGOS.client} alt="MAA" className="h-12 object-contain mb-6 mx-auto" />
           <h2 className="text-xl font-bold text-gray-900 mb-2">No Performance Data Found</h2>
           <p className="text-gray-500">The Windsor.ai API returned an empty dataset for this period.</p>
         </div>
       </div>
    );
  }

  const slidesMapping = [
    { id: 'cover', icon: Layers },
    { id: 'summary', icon: TrendingUp },
    { id: 'charts', icon: DollarSign },
    { id: 'creatives', icon: Award },
    { id: 'google', icon: Globe },
    { id: 'meta', icon: Facebook },
    { id: 'grants', icon: Info },
    { id: 'footer', icon: ChevronDown }
  ];

  return (
    <div className="relative">
      {/* Dot Navigation */}
      <nav className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3 hidden md:flex">
        {slidesMapping.map((s) => (
          <button
            key={s.id}
            onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' })}
            className={cn(
              "w-2.5 h-2.5 rounded-full transition-all duration-300 border-2",
              activeSlide === s.id 
                ? "bg-primary border-primary scale-125" 
                : "bg-transparent border-[#cbd5e1] hover:border-gray-400"
            )}
            title={s.id.toUpperCase()}
          />
        ))}
      </nav>

      <CoverSlide metrics={metrics} />
      <SummarySlide metrics={metrics} platformStats={platformStats} topCreative={topCreative} />
      <WeeklyTrendSlide metrics={metrics} />
      <CreativeBreakdownSlide metrics={metrics} />
      <GoogleAdsSlide metrics={metrics} />
      <MetaAdsSlide metrics={metrics} />
      <GrantsSlide metrics={metrics} />
      <FooterSlide />
    </div>
  );
}
