import React, { useMemo, useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Award,
  ChevronDown,
  ChevronUp,
  Info,
  Layers,
  Facebook,
  Globe,
  Edit2,
  Eye,
  CheckCircle2,
  Loader2,
  Presentation,
  LayoutList,
  Pencil,
  HeartHandshake,
  Calendar,
  Video,
  Ticket
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { LOGOS } from './constants';
import { usePerformanceData } from './hooks/usePerformanceData';
import { contentService } from './services/contentService';
import { fCurrency, fNumber, fROAS, fCPA } from './lib/formatters';
import { useViewMode } from './context/ViewModeContext';
import { DateRangePicker } from './components/DateRangePicker';
import { DateRange } from './types';
import { getDefaultDateRange } from './utils/datePresets';
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
import { TikTokAdsSlide } from './components/slides/TikTokAdsSlide';
import { GrantsSlide } from './components/slides/GrantsSlide';
import { EventCampaignsSlide } from './components/slides/EventCampaignsSlide';
import { GA4Slide } from './components/slides/GA4Slide';
import { DonorInsightsSlide } from './components/slides/DonorInsightsSlide';
import { FooterSlide } from './components/slides/FooterSlide';

export default function App() {
  const [showDateFilter, setShowDateFilter] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('date') === 'true' || params.get('date_filter') === 'true';
  });

  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const params = new URLSearchParams(window.location.search);
    const startParam = params.get('start_date');
    const endParam = params.get('end_date');
    if (startParam && endParam) {
      console.info(`[App] Initialized date range from URL query params: ${startParam} to ${endParam}`);
      return { startDate: startParam, endDate: endParam };
    }
    const defaultRange = getDefaultDateRange();
    console.info(`[App] Initialized date range from Australian timezone default: ${defaultRange.startDate} to ${defaultRange.endDate}`);
    return defaultRange;
  });

  // When loaded with date=true, popup appears automatically as requested
  const [isDatePopupOpen, setIsDatePopupOpen] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('date') === 'true' || params.get('date_filter') === 'true';
  });

  // Secret keyboard shortcut to toggle date filter (Alt+D or Ctrl+Shift+D / Cmd+Shift+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (
        (e.altKey && e.key.toLowerCase() === 'd') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd')
      ) {
        e.preventDefault();
        setShowDateFilter((prev) => {
          const next = !prev;
          const url = new URL(window.location.href);
          if (next) {
            url.searchParams.set('date', 'true');
            setIsDatePopupOpen(true);
          } else {
            url.searchParams.delete('date');
            url.searchParams.delete('date_filter');
            url.searchParams.delete('start_date');
            url.searchParams.delete('end_date');
            setIsDatePopupOpen(false);
          }
          window.history.replaceState({}, '', url);
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { metrics, loading } = usePerformanceData(dateRange);
  const { viewMode, setViewMode } = useViewMode();
  const [activeSlide, setActiveSlide] = useState('cover');
  const [isPreloaderDone, setIsPreloaderDone] = useState(false);
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
      .filter(c => (c as any).source === 'facebook')
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
    const tads = cur.tiktok_ads || { revenue: 0, spend: 0, conversions: 0 };
    const total = cur.total || { revenue: 0, spend: 0, conversions: 0 };
    const grants = cur.google_grants || { clicks: 0, spend: 0 };

    const tiktokSpendVal = tads.spend;
    const tiktokRevVal = tads.revenue;
    const tiktokConvVal = tads.conversions;
    const tiktokRoasVal = tads.spend > 0 ? fROAS(tads.revenue, tads.spend) : '0.00x';
    const tiktokCpaVal = tads.conversions > 0 ? fCPA(tads.spend, tads.conversions) : '$0.00';

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
      exec_summary: `In this reporting period, the total advertising investment across **Meta**, **Google Ads**, and **TikTok Ads** reached **${fCurrency(total.spend)}**, generating a total gross revenue of **${fCurrency(total.revenue)}**. This represents a blended ROAS of **${fROAS(total.revenue, total.spend)}**.

${platformStats?.dominant || 'Digital platforms'} ${platformStats?.shareText || 'driving traffic'}, specifically with **${Math.round(platformStats?.dominantConv || 0)} sales** ${platformStats?.trackingMethod || 'tracked'}. This counts for approximately ${((platformStats?.dominantConv || 0) / (platformStats?.totalConv || 1) * 100).toFixed(0)}% of total conversion volume.

Strategic focus remains on optimizing CPA for higher-intent segments while maintaining the broad reach necessary for top-of-funnel contribution from Google Search campaigns.`,
      google_summary: `Google Search campaigns generated a total revenue of **${fCurrency(gads.revenue)}** this period. The blended ROAS for Google Ads stands at **${fROAS(gads.revenue, gads.spend)}**, maintaining efficient lead acquisition.

Conversion volume reached **${Math.round(gads.conversions)} sales**, with a cost per acquisition of **${fCPA(gads.spend, gads.conversions)}**.`,
      meta_summary: `Meta Ads continues to show high efficiency with a **${fROAS(mads.revenue, mads.spend)} return**. The platform generated **${fCurrency(mads.revenue)}** in revenue from a spend of **${fCurrency(mads.spend)}**.

Performance remains stable across prospecting and retargeting audiences, with Facebook placements driving the majority of volume.`,
      tiktok_summary: `TikTok Ads generated a total revenue of **${fCurrency(tiktokRevVal)}** this period from a spend of **${fCurrency(tiktokSpendVal)}**. The blended ROAS for TikTok Ads stands at **${tiktokRoasVal}**.

Conversion volume reached **${Math.round(tiktokConvVal)} purchases**, with a cost per acquisition of **${tiktokCpaVal}**.`,
      creatives_summary: `Creative analysis reveals that **${topPerformer?.name || 'Top Ad'}** is currently the highest performing asset with a **${fROAS(topPerformer?.revenue, topPerformer?.spend)} return**.

UGC-style content remains dominant in driving conversions, specifically in the **Retargeting** segments where trust signals are paramount.`,
      ga4_summary: `Traffic analysis from GA4 shows **${fNumber(metrics.ga4?.current?.sessions || 0)} sessions** with an engagement rate of **${(metrics.ga4?.engagementRate || 0).toFixed(1)}%**.

New user acquisition remains steady, with paid channels contributing significantly to the overall traffic mix.`,
      donor_summary: `Donor acquisition and giving frequency tracked via Stape Store (started 19 Sep).`,
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

  const hasEventCampaigns = Boolean(
    (metrics?.current?.events && (metrics.current.events.spend > 0 || metrics.current.events.conversions > 0)) ||
    (metrics && Object.values(metrics.current.byCampaign).some((c: any) => c.source === 'event'))
  );

  const slidesMapping = useMemo(() => [
    { id: 'cover', icon: Layers, label: 'Cover' },
    { id: 'summary', icon: TrendingUp, label: 'Executive Summary' },
    { id: 'charts', icon: DollarSign, label: 'Weekly Trend' },
    { id: 'google', icon: Globe, label: 'Google Ads' },
    { id: 'meta', icon: Facebook, label: 'Meta Ads' },
    { id: 'creatives', icon: Award, label: 'Top Creatives' },
    { id: 'tiktok', icon: Video, label: 'TikTok Ads' },
    { id: 'ga4', icon: TrendingUp, label: 'GA4 Traffic' },
    { id: 'donor_insights', icon: HeartHandshake, label: 'Donor Insights' },
    { id: 'grants', icon: Info, label: 'Google Grants' },
    ...(hasEventCampaigns ? [{ id: 'events', icon: Ticket, label: 'Event Campaigns' }] : []),
    { id: 'footer', icon: ChevronDown, label: 'End of Report' }
  ], [hasEventCampaigns]);

  const activeSlideIndex = useMemo(() => {
    const idx = slidesMapping.findIndex(s => s.id === activeSlide);
    return idx >= 0 ? idx : 0;
  }, [slidesMapping, activeSlide]);

  const navigateToSlide = (id: string) => {
    setActiveSlide(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Robust Active Slide Detection on Scroll & Window Resize
  useEffect(() => {
    if (!isPreloaderDone || loading) return;

    let rafId: number | null = null;

    const updateActiveSlide = () => {
      const slides = Array.from(document.querySelectorAll<HTMLElement>('.slide'));
      if (!slides.length) return;

      const windowHeight = window.innerHeight;
      const scrollY = window.scrollY || window.pageYOffset;
      const scrollHeight = document.documentElement.scrollHeight;

      // Top of page edge case
      if (scrollY <= 60) {
        if (slides[0]) setActiveSlide(slides[0].id);
        return;
      }

      // Bottom of page edge case
      if (windowHeight + scrollY >= scrollHeight - 60) {
        const lastSlide = slides[slides.length - 1];
        if (lastSlide) setActiveSlide(lastSlide.id);
        return;
      }

      // Focal point: 35% down the viewport
      const focalLine = windowHeight * 0.35;
      let matchingId: string | null = null;

      for (const slide of slides) {
        const rect = slide.getBoundingClientRect();
        if (rect.top <= focalLine && rect.bottom > focalLine) {
          matchingId = slide.id;
          break;
        }
      }

      // Fallback: slide with greatest visible portion in viewport
      if (!matchingId) {
        let maxVisibleRatio = -1;
        for (const slide of slides) {
          const rect = slide.getBoundingClientRect();
          const visibleHeight = Math.max(0, Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0));
          if (visibleHeight > maxVisibleRatio) {
            maxVisibleRatio = visibleHeight;
            matchingId = slide.id;
          }
        }
      }

      if (matchingId) {
        setActiveSlide(matchingId);
      }
    };

    const handleScroll = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateActiveSlide);
    };

    // Initial check after DOM renders
    const timer = setTimeout(updateActiveSlide, 100);

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isPreloaderDone, loading, viewMode, hasEventCampaigns]);

  // Keyboard slide navigation (ArrowUp, ArrowDown, PageUp, PageDown)
  useEffect(() => {
    if (!isPreloaderDone) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        const curIdx = slidesMapping.findIndex(s => s.id === activeSlide);
        if (curIdx >= 0 && curIdx < slidesMapping.length - 1) {
          e.preventDefault();
          navigateToSlide(slidesMapping[curIdx + 1].id);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        const curIdx = slidesMapping.findIndex(s => s.id === activeSlide);
        if (curIdx > 0) {
          e.preventDefault();
          navigateToSlide(slidesMapping[curIdx - 1].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPreloaderDone, activeSlide, slidesMapping]);

  const topCreative = creatives[0];

  if (!isPreloaderDone) {
    return <Preloader isDataLoaded={!loading && Boolean(metrics)} onFinish={() => setIsPreloaderDone(true)} />;
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

  return (
    <div className="relative">
      {/* Dot Navigation */}
      <nav 
        className="fixed right-5 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-2.5 hidden md:flex bg-white/80 backdrop-blur-md px-2 py-3 rounded-full border border-slate-200/80 shadow-md transition-all"
        aria-label="Slide Navigation"
      >
        {slidesMapping.map((s, idx) => {
          const isActive = activeSlide === s.id;
          return (
            <div key={s.id} className="relative group flex items-center justify-center">
              {/* Tooltip on hover */}
              <div className="absolute right-full mr-3.5 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-semibold tracking-tight whitespace-nowrap shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 translate-x-1 group-hover:translate-x-0 z-50">
                <span className="text-slate-400 font-mono text-[10px] mr-1.5">{String(idx + 1).padStart(2, '0')}</span>
                {s.label}
              </div>

              {/* Dot Button */}
              <button
                onClick={() => navigateToSlide(s.id)}
                className={cn(
                  "rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer",
                  isActive
                    ? "w-3.5 h-3.5 bg-primary ring-4 ring-primary/25 scale-110 shadow-xs"
                    : "w-2 h-2 bg-slate-300 hover:bg-slate-400 hover:scale-125"
                )}
                title={`${idx + 1}. ${s.label}`}
                aria-label={`Slide ${idx + 1}: ${s.label}`}
              />
            </div>
          );
        })}
      </nav>

      <CoverSlide metrics={metrics} hasDateFilter={showDateFilter} />
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
      <TikTokAdsSlide 
        metrics={metrics} 
        isEditMode={isEditMode}
        content={(localPageContent.tiktok_summary?.includes('7,916') || localPageContent.tiktok_summary?.includes('2,857')) ? undefined : localPageContent.tiktok_summary}
        defaultText={defaultContents.tiktok_summary}
        onUpdateContent={(val) => handleUpdateContent('tiktok_summary', val)}
        onSave={(val) => handleSaveSection('tiktok_summary', val)}
      />
      <GA4Slide 
        metrics={metrics} 
        isEditMode={isEditMode}
        content={localPageContent.ga4_summary}
        defaultText={defaultContents.ga4_summary}
        onUpdateContent={(val) => handleUpdateContent('ga4_summary', val)}
        onSave={(val) => handleSaveSection('ga4_summary', val)}
      />
      <DonorInsightsSlide 
        metrics={metrics}
        isEditMode={isEditMode}
        content={localPageContent.donor_summary}
        defaultText={defaultContents.donor_summary}
        onUpdateContent={(val) => handleUpdateContent('donor_summary', val)}
        onSave={(val) => handleSaveSection('donor_summary', val)}
      />
      <GrantsSlide 
        metrics={metrics} 
        isEditMode={isEditMode}
        content={localPageContent.grants_summary}
        defaultText={defaultContents.grants_summary}
        onUpdateContent={(val) => handleUpdateContent('grants_summary', val)}
        onSave={(val) => handleSaveSection('grants_summary', val)}
      />
      {hasEventCampaigns && (
        <EventCampaignsSlide 
          metrics={metrics} 
          isEditMode={isEditMode}
          content={localPageContent.events_summary}
          onUpdateContent={(val) => handleUpdateContent('events_summary', val)}
          onSave={(val) => handleSaveSection('events_summary', val)}
        />
      )}
      <FooterSlide />

      {/* Top Right Date Filter Trigger & Popover (when ?date=true is in URL or toggled) */}
      {showDateFilter && (
        <div className="fixed top-3.5 right-4 md:right-8 z-[90]">
          <DateRangePicker
            dateRange={dateRange}
            onChange={(newRange) => {
              setDateRange(newRange);
              const url = new URL(window.location.href);
              url.searchParams.set('date', 'true');
              url.searchParams.set('start_date', newRange.startDate);
              url.searchParams.set('end_date', newRange.endDate);
              window.history.replaceState({}, '', url);
            }}
            isOpen={isDatePopupOpen}
            onToggleOpen={() => setIsDatePopupOpen(prev => !prev)}
            onClose={() => setIsDatePopupOpen(false)}
          />
        </div>
      )}

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

      {/* Floating Controls Bar */}
      <div className="fixed bottom-6 right-6 z-[60] flex items-center bg-white p-1.5 px-2 rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-200/90 gap-2">
        {/* Active Slide Counter & Stepper */}
        <div className="flex items-center gap-1 bg-[#f1f5f9] px-2 py-1 rounded-[14px] text-slate-700 text-[12px] font-bold">
          <button
            onClick={() => {
              if (activeSlideIndex > 0) {
                navigateToSlide(slidesMapping[activeSlideIndex - 1].id);
              }
            }}
            disabled={activeSlideIndex <= 0}
            className="p-1 rounded-[8px] hover:bg-white text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Previous Slide (Arrow Up)"
            aria-label="Previous Slide"
          >
            <ChevronUp size={15} />
          </button>
          <span 
            className="font-mono text-[12px] px-1 text-slate-800 min-w-[46px] text-center select-none"
            title={`Slide ${activeSlideIndex + 1} of ${slidesMapping.length}: ${slidesMapping[activeSlideIndex]?.label || 'Cover'}`}
          >
            {activeSlideIndex + 1} / {slidesMapping.length}
          </span>
          <button
            onClick={() => {
              if (activeSlideIndex < slidesMapping.length - 1) {
                navigateToSlide(slidesMapping[activeSlideIndex + 1].id);
              }
            }}
            disabled={activeSlideIndex >= slidesMapping.length - 1}
            className="p-1 rounded-[8px] hover:bg-white text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Next Slide (Arrow Down)"
            aria-label="Next Slide"
          >
            <ChevronDown size={15} />
          </button>
        </div>

        {/* Vertical Divider */}
        <div className="w-[1px] h-5 bg-gray-200/80 mx-0.5" />

        {/* View Mode Segmented Control */}
        <div className="bg-[#f1f5f9] p-1 rounded-[14px] flex items-center gap-1">
          <button 
            onClick={() => setViewMode('slide')}
            className={cn(
              "px-3 py-1.5 rounded-[10px] transition-all flex items-center gap-2 text-[13px] font-bold",
              viewMode === 'slide' 
                ? "bg-white text-[#2563eb] shadow-sm border border-gray-200/60" 
                : "text-slate-600 hover:text-slate-900"
            )}
            title="Slide View (?view=slide)"
          >
            <Presentation size={16} className={viewMode === 'slide' ? "text-[#2563eb]" : "text-slate-600"} />
            Slides
          </button>
          <button 
            onClick={() => setViewMode('section')}
            className={cn(
              "px-3 py-1.5 rounded-[10px] transition-all flex items-center gap-2 text-[13px] font-bold",
              viewMode === 'section' 
                ? "bg-white text-[#2563eb] shadow-sm border border-gray-200/60" 
                : "text-slate-600 hover:text-slate-900"
            )}
            title="Section View (?view=section)"
          >
            <LayoutList size={16} className={viewMode === 'section' ? "text-[#2563eb]" : "text-slate-600"} />
            Sections
          </button>
        </div>

        {/* Date Filter Toggle Button - Kept secret, only accessible via URL (?date=true), Alt+D shortcut, or when Editor mode is active */}
        {(showDateFilter || isEditMode) && (
          <>
            <div className="w-[1px] h-5 bg-gray-200/80 mx-0.5" />
            <button 
              onClick={() => {
                const next = !showDateFilter;
                setShowDateFilter(next);
                const url = new URL(window.location.href);
                if (next) {
                  url.searchParams.set('date', 'true');
                  setIsDatePopupOpen(true);
                } else {
                  url.searchParams.delete('date');
                  url.searchParams.delete('date_filter');
                  url.searchParams.delete('start_date');
                  url.searchParams.delete('end_date');
                  setIsDatePopupOpen(false);
                }
                window.history.replaceState({}, '', url);
              }}
              className={cn(
                "px-3 py-1.5 rounded-[12px] border transition-all font-bold text-[13px] flex items-center gap-1.5",
                showDateFilter 
                  ? "bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe] shadow-xs" 
                  : "bg-white text-slate-700 border-gray-200 hover:bg-slate-50"
              )}
              title="Toggle Date Filter (?date=true | Alt+D)"
            >
              <Calendar size={15} className={showDateFilter ? "text-[#2563eb]" : "text-slate-500"} />
              <span>Date Filter</span>
            </button>
          </>
        )}

        {/* Vertical Divider */}
        <div className="w-[1px] h-5 bg-gray-200/80 mx-0.5" />

        {/* Editor Button */}
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
            "px-3.5 py-1.5 rounded-[12px] border transition-all font-bold text-[13px] flex items-center gap-2",
            isEditMode 
             ? "bg-[#2563eb] text-white border-[#2563eb] shadow-sm" 
             : "bg-white text-[#0f172a] border-gray-200 hover:bg-slate-50"
          )}
        >
          {isEditMode ? <Eye size={16} /> : <Pencil size={16} className="text-[#0f172a]" />}
          {isEditMode ? 'Exit Editor' : 'Editor'}
        </button>
      </div>

    </div>
  );
}
