export const fCurrency = (val: number) => 
  new Intl.NumberFormat('en-AU', { 
    style: 'currency', 
    currency: 'AUD', 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).format(val);

export const fNumber = (val: number) => 
  new Intl.NumberFormat('en-AU', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 2 
  }).format(val);

export const fCPA = (spend: number, conv: number) => 
  conv > 0 ? fCurrency(spend / conv) : 'n/a';

export const fROAS = (rev: number, spend: number) => 
  spend > 0 ? `${(rev / spend).toFixed(2)}x` : 'n/a';
