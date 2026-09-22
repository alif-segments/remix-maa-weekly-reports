import React from 'react';
import { cn } from '@/src/lib/utils';

interface KpiCardProps {
  label: string;
  value: string;
  sublabel: string;
  icon: any;
  delta?: string;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'revenue' | 'spend' | 'roas' | 'sales' | 'g_blue' | 'g_green' | 'g_yellow' | 'g_red' | 'm_light' | 'm_mid' | 'm_blue' | 'm_dark';
  tooltip?: string;
}

export const KpiCard = ({ 
  label, 
  value, 
  sublabel, 
  icon: Icon, 
  delta, 
  trend, 
  variant = 'revenue',
  tooltip
}: KpiCardProps) => {
  const variants: Record<string, { bg: string, text: string }> = {
    revenue: { bg: 'bg-[#dbeafe]', text: 'text-[#2563eb]' },
    spend: { bg: 'bg-[#fce7f3]', text: 'text-[#db2777]' },
    roas: { bg: 'bg-[#d1fae5]', text: 'text-[#16a34a]' },
    sales: { bg: 'bg-[#fef3c7]', text: 'text-[#f59e0b]' },
    // Google Brand Colors
    g_blue: { bg: 'bg-[#E8F0FE]', text: 'text-[#4285F4]' },
    g_green: { bg: 'bg-[#E6F4EA]', text: 'text-[#34A853]' },
    g_yellow: { bg: 'bg-[#FEF7E0]', text: 'text-[#FBBC04]' },
    g_red: { bg: 'bg-[#FCE8E6]', text: 'text-[#EA4335]' },
    // Meta Brand Colors (Shades of Blue)
    m_light: { bg: 'bg-[#E7F3FF]', text: 'text-[#1877F2]' },
    m_mid: { bg: 'bg-[#D1E7FF]', text: 'text-[#0064E0]' },
    m_blue: { bg: 'bg-[#BBDDFF]', text: 'text-[#0056B3]' },
    m_dark: { bg: 'bg-[#A6D1FF]', text: 'text-[#00479E]' }
  };

  const style = variants[variant] || variants.revenue;

  return (
    <div 
      className="bg-white border border-[#e2e8f0] rounded-xl p-5 relative flex-1 min-w-[180px] transition-shadow hover:shadow-xs"
      title={tooltip || label}
    >
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-3.5", style.bg, style.text)}>
        <Icon size={18} />
      </div>
      
      {delta && (
        <div className={cn(
          "absolute top-4 right-4 text-[12px] font-[600] px-2.5 py-1 rounded-full",
          trend === 'up' ? "bg-[#bbf7d0] text-[#15803d]" : trend === 'down' ? "bg-[#fecaca] text-[#b91c1c]" : "bg-[#e2e8f0] text-[#475569]"
        )}>
          {delta}
        </div>
      )}

      <div 
        className="text-[11px] font-[600] tracking-[0.5px] uppercase text-[#64748b] mb-1 truncate whitespace-nowrap"
        title={tooltip || label}
      >
        {label}
      </div>
      <div className="text-[26px] xl:text-[28px] font-[700] text-[#0f172a] mb-1 leading-none tracking-tight">
        {value}
      </div>
      <div 
        className="text-[11.5px] text-[#94a3b8] truncate whitespace-nowrap"
        title={sublabel}
      >
        {sublabel}
      </div>
    </div>
  );
};
