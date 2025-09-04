export const formatCurrency = (value: number | undefined): string => value ? `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00';

export const formatPercent = (value: number | undefined): string => value ? `${(value * 100).toFixed(2)}%` : '0.00%';

export const formatDate = (date: Date | undefined | string): string => date ? new Date(date).toISOString().split('T')[0] : '';
