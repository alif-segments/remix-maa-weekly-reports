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
import { fCurrency, fNumber, fROAS, fCPA } from './lib/formatters';
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
  const [localPageContent, setLocalPageContent] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Detect edit mode and fetch content
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'edit') {
      setIsEditMode(true);
    }

    const loadContent = async () => {
      console.log('[App] Initializing content load...');
      const content = await contentService.fetchAll();
      console.log('[App] Content loaded from GAS:', content);
      setPageContent(content);
      setLocalPageContent(content);
    };
    loadContent();
  }, []);

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

  const defaultContents = useMemo(() => {
    if (!metrics || !platformStats) return {};
    
    // Safe extraction of metrics
    const cur = metrics.current;
    const gads = cur.google_ads || { revenue: 0, spend: 0, conversions: 0 };
    const mads = cur.meta_ads || { revenue: 0, spend: 0, conversions: 0 };
    const total = cur.total || { revenue: 0, spend: 0, conversions: 0 };
    const grants = cur.google_grants || { clicks: 0, spend: 0 };

    const maxSales = Math.max(...creatives.map(c => c.conversions || 0), 1);
    const maxRevenue = Math.max(...creatives.map(c => c.revenue || 0), 1);
    const maxROAS = Math.max(...creatives.map(c => (c.revenue / Math.max(1, c.spend)) || 0), 1);
    
    const creativesWithScore = creatives.map(c => {
      const salesScore = ((c.conversions || 0) / maxSales) * 35;
      const revenueScore = ((c.revenue || 0) / maxRevenue) * 35;
      const roas = (c.revenue || 0) / Math.max(1, c.spend || 0);
      const roasScore = (roas / maxROAS) * 20;
      const spendConfidence = (Math.min((c.spend || 0) / 100, 1)) * 10;
      return { ...c, performanceScore: salesScore + revenueScore + roasScore + spendConfidence, roas };
    });
    
    const topPerformer = [...creativesWithScore].sort((a, b) => b.performanceScore - a.performanceScore)[0] || creativesWithScore[0];

    return {
      exec_summary: `In this reporting period, the total advertising investment across **Meta** and **Google Ads** reached **${fCurrency(total.spend)}**, generating a total gross revenue of **${fCurrency(total.revenue)}**. This represents a blended ROAS of **${fROAS(total.revenue, total.spend)}**.

${platformStats?.dominant || 'Digital platforms'} ${platformStats?.shareText || 'driving traffic'}, specifically with **${Math.round(platformStats?.dominantConv || 0)} sales** ${platformStats?.trackingMethod || 'tracked'}. This counts for approximately ${((platformStats?.dominantConv || 0) / (platformStats?.totalConv || 1) * 100).toFixed(0)}% of total conversion volume.

Strategic focus remains on optimizing CPA for higher-intent segments while maintaining the broad reach necessary for top-of-funnel contribution from Google Search campaigns.`,
      google_summary: `Google Search campaigns generated a total revenue of **${fCurrency(gads.revenue)}** this period. The blended ROAS for Google Ads stands at **${fROAS(gads.revenue, gads.spend)}**, maintaining efficient lead acquisition.

Conversion volume reached **${Math.round(gads.conversions)} sales**, with a cost per acquisition of **${fCPA(gads.spend, gads.conversions)}**.`,
      meta_summary: `Meta Ads continues to show high efficiency with a **${fROAS(mads.revenue, mads.spend)} return**. The platform generated **${fCurrency(mads.revenue)}** in revenue from a spend of **${fCurrency(mads.spend)}**.

Performance remains stable across prospecting and retargeting audiences, with Facebook placements driving the majority of volume.`,
      creatives_summary: `Creative analysis reveals that **${topPerformer?.name || 'Top Ad'}** is currently the highest performing asset with a **${fROAS(topPerformer?.revenue, topPerformer?.spend)} return**.

UGC-style content remains dominant in driving conversions, specifically in the **Retargeting** segments where trust signals are paramount.`,
      ga4_summary: `Traffic analysis from GA4 shows **${fNumber(metrics.ga4?.current?.sessions || 0)} sessions** with an engagement rate of **${(metrics.ga4?.engagementRate || 0).toFixed(1)}%**.

New user acquisition remains steady, with paid channels contributing significantly to the overall traffic mix.`,
      grants_summary: `The Google Grants account generated **${fNumber(grants.clicks)} clicks** with a CPC of **${fCurrency(grants.spend / Math.max(1, grants.clicks))}** (utilizing granted credit).

Focus remains on brand awareness and information discovery for core mission keywords.`
    };
  }, [metrics, platformStats, creatives]);

  const handleUpdateContent = (section_id: string, newContent: string) => {
    setLocalPageContent(prev => ({ ...prev, [section_id]: newContent }));
  };

  const handleSaveSection = async (section_id: string, content: string) => {
    setSaveStatus('saving');
    const success = await contentService.updateSection({ section_id, content });
    if (success) {
      setPageContent(prev => ({ ...prev, [section_id]: content }));
      setLocalPageContent(prev => ({ ...prev, [section_id]: content }));
      setSaveStatus('saved');
      alert("Section updated successfully.");
      setTimeout(() => setSaveStatus('idle'), 2000);
    } else {
      setSaveStatus('error');
      alert("Update failed.");
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
        content={localPageContent.exec_summary}
        defaultText={defaultContents.exec_summary}
        onUpdateContent={(val) => handleUpdateContent('exec_summary', val)}
        onSave={(val) => handleSaveSection('exec_summary', val)}
      />
      <WeeklyTrendSlide metrics={metrics} />
      <GoogleAdsSlide 
        metrics={metrics} 
        isEditMode={isEditMode}
        content={localPageContent.google_summary}
        defaultText={defaultContents.google_summary}
        onUpdateContent={(val) => handleUpdateContent('google_summary', val)}
        onSave={(val) => handleSaveSection('google_summary', val)}
      />
      <MetaAdsSlide 
        metrics={metrics} 
        isEditMode={isEditMode}
        content={localPageContent.meta_summary}
        defaultText={defaultContents.meta_summary}
        onUpdateContent={(val) => handleUpdateContent('meta_summary', val)}
        onSave={(val) => handleSaveSection('meta_summary', val)}
      />
      <CreativeBreakdownSlide 
        metrics={metrics} 
        isEditMode={isEditMode}
        content={localPageContent.creatives_summary}
        defaultText={defaultContents.creatives_summary}
        onUpdateContent={(val) => handleUpdateContent('creatives_summary', val)}
        onSave={(val) => handleSaveSection('creatives_summary', val)}
      />
      <GA4Slide 
        metrics={metrics} 
        isEditMode={isEditMode}
        content={localPageContent.ga4_summary}
        defaultText={defaultContents.ga4_summary}
        onUpdateContent={(val) => handleUpdateContent('ga4_summary', val)}
        onSave={(val) => handleSaveSection('ga4_summary', val)}
      />
      <GrantsSlide 
        metrics={metrics} 
        isEditMode={isEditMode}
        content={localPageContent.grants_summary}
        defaultText={defaultContents.grants_summary}
        onUpdateContent={(val) => handleUpdateContent('grants_summary', val)}
        onSave={(val) => handleSaveSection('grants_summary', val)}
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
                {saveStatus === 'saving' ? 'Syncing changes...' : 
                 saveStatus === 'saved' ? 'All changes saved!' : 
                 'Error syncing changes'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Active Indicator */}
      {isEditMode && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-white p-2 px-6 rounded-2xl shadow-2xl border border-primary/10">
          <div className="flex items-center gap-2 text-primary text-[13px] font-bold">
            <Edit2 size={16} />
            Editor Mode Active
          </div>
        </div>
      )}

      {/* Floating Mode Toggle (Desktop only) */}
      <div className="fixed bottom-8 right-8 z-[60] flex flex-col items-end gap-3 translate-y-[-60px]">
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
           {isEditMode ? 'Exit Editor' : 'Enter Editor'}
         </button>
      </div>
    </div>
  );
}
