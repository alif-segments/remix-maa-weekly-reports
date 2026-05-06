import React from 'react';
import { cn } from '@/src/lib/utils';

interface KpiCardProps {
  label: string;
  value: string;
  sublabel: string;
  icon: any;
  delta?: string;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'revenue' | 'spend' | 'roas' | 'sales';
}

export const KpiCard = ({ 
  label, 
  value, 
  sublabel, 
  icon: Icon, 
  delta, 
  trend, 
  variant = 'revenue' 
}: KpiCardProps) => {
  const variants = {
    revenue: { bg: 'bg-[#dbeafe]', text: 'text-[#2563eb]' },
    spend: { bg: 'bg-[#fce7f3]', text: 'text-[#db2777]' },
    roas: { bg: 'bg-[#d1fae5]', text: 'text-[#16a34a]' },
    sales: { bg: 'bg-[#fef3c7]', text: 'text-[#f59e0b]' }
  };

  const style = variants[variant] || variants.revenue;

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 relative flex-1 min-w-[200px]">
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-4", style.bg, style.text)}>
        <Icon size={18} />
      </div>
      
      {delta && (
        <div className={cn(
          "absolute top-4 right-4 text-[12px] font-[600] px-2.5 py-1 rounded-full",
          trend === 'up' ? "bg-[#d1fae5] text-[#16a34a]" : trend === 'down' ? "bg-[#fecaca] text-[#dc2626]" : "bg-[#f1f5f9] text-[#64748b]"
        )}>
          {delta}
        </div>
      )}

      <div className="text-[11px] font-[600] tracking-[1px] uppercase text-[#64748b] mb-0.5">{label}</div>
      <div className="text-[32px] font-[700] text-[#0f172a] mb-1 leading-none">{value}</div>
      <div className="text-[12px] text-[#94a3b8]">{sublabel}</div>
    </div>
  );
};
