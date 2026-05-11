import React, { useMemo, useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Award,
  ChevronDown,
  Info,
  Layers,
  Facebook,
  Globe,
  Edit2,
  Eye,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { LOGOS } from './constants';
import { usePerformanceData } from './hooks/usePerformanceData';
import { contentService } from './services/contentService';
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

import { Preloader } from './components/Preloader';

// Slide Components
import { CoverSlide } from './components/slides/CoverSlide';
import { SummarySlide } from './components/slides/SummarySlide';
import { WeeklyTrendSlide } from './components/slides/WeeklyTrendSlide';
import { CreativeBreakdownSlide } from './components/slides/CreativeBreakdownSlide';
import { GoogleAdsSlide } from './components/slides/GoogleAdsSlide';
import { MetaAdsSlide } from './components/slides/MetaAdsSlide';
import { GrantsSlide } from './components/slides/GrantsSlide';
import { GA4Slide } from './components/slides/GA4Slide';
import { FooterSlide } from './components/slides/FooterSlide';

export default function App() {
  const { metrics, loading } = usePerformanceData();
  const [activeSlide, setActiveSlide] = useState('cover');
  const [isEditMode, setIsEditMode] = useState(false);
  const [pageContent, setPageContent] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Detect edit mode and fetch content
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'edit') {
      setIsEditMode(true);
    }

    const loadContent = async () => {
      const content = await contentService.fetchAll();
      setPageContent(content);
    };
    loadContent();
  }, []);

  const handleUpdateContent = async (section_id: string, newContent: string) => {
    setPageContent(prev => ({ ...prev, [section_id]: newContent }));
    setSaveStatus('saving');
    const success = await contentService.updateSection(section_id, newContent);
    if (success) {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } else {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

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
    return <Preloader />;
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
    { id: 'google', icon: Globe },
    { id: 'meta', icon: Facebook },
    { id: 'creatives', icon: Award },
    { id: 'ga4', icon: TrendingUp },
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
      <SummarySlide 
        metrics={metrics} 
        platformStats={platformStats} 
        topCreative={topCreative} 
        isEditMode={isEditMode}
        content={pageContent.exec_summary}
        onUpdateContent={(val) => handleUpdateContent('exec_summary', val)}
      />
      <WeeklyTrendSlide metrics={metrics} />
      <GoogleAdsSlide 
        metrics={metrics} 
        isEditMode={isEditMode}
        content={pageContent.google_summary}
        onUpdateContent={(val) => handleUpdateContent('google_summary', val)}
      />
      <MetaAdsSlide 
        metrics={metrics} 
        isEditMode={isEditMode}
        content={pageContent.meta_summary}
        onUpdateContent={(val) => handleUpdateContent('meta_summary', val)}
      />
      <CreativeBreakdownSlide 
        metrics={metrics} 
        isEditMode={isEditMode}
        content={pageContent.creatives_summary}
        onUpdateContent={(val) => handleUpdateContent('creatives_summary', val)}
      />
      <GA4Slide 
        metrics={metrics} 
        isEditMode={isEditMode}
        content={pageContent.ga4_summary}
        onUpdateContent={(val) => handleUpdateContent('ga4_summary', val)}
      />
      <GrantsSlide 
        metrics={metrics} 
        isEditMode={isEditMode}
        content={pageContent.grants_summary}
        onUpdateContent={(val) => handleUpdateContent('grants_summary', val)}
      />
      <FooterSlide />

      {/* Persistence Bar */}
      <AnimatePresence>
        {saveStatus !== 'idle' && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]"
          >
            <div className={cn(
              "px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 backdrop-blur-md",
              saveStatus === 'saving' ? "bg-white/90 text-primary border border-primary/20" : 
              saveStatus === 'saved' ? "bg-green-600 text-white" : 
              "bg-red-600 text-white"
            )}>
              {saveStatus === 'saving' && <Loader2 className="animate-spin" size={18} />}
              {saveStatus === 'saved' && <CheckCircle2 size={18} />}
              <span className="font-bold text-[14px]">
                {saveStatus === 'saving' ? 'Syncing to Google Sheets...' : 
                 saveStatus === 'saved' ? 'All changes saved!' : 
                 'Error syncing changes'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Mode Toggle (Desktop only) */}
      <div className="fixed bottom-8 right-8 z-[60] flex items-center gap-2">
         <button 
           onClick={() => {
             const newMode = !isEditMode;
             setIsEditMode(newMode);
             const url = new URL(window.location.href);
             if (newMode) url.searchParams.set('mode', 'edit');
             else url.searchParams.delete('mode');
             window.history.replaceState({}, '', url);
           }}
           className={cn(
             "px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition-all font-bold text-[13px] border",
             isEditMode 
              ? "bg-primary text-white border-primary" 
              : "bg-white text-gray-700 border-gray-200 hover:border-primary"
           )}
         >
           {isEditMode ? <Eye size={16} /> : <Edit2 size={16} />}
           {isEditMode ? 'View Mode' : 'Edit Mode'}
         </button>
      </div>
    </div>
  );
}
