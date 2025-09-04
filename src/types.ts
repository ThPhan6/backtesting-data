export interface Trade {
    entryDate: Date;
    exitDate: Date;
    entryPrice: number;
    exitPrice: number;
    shares: number;
    return: number;
    pnl: number;
    type: string;
}

export interface Summary {
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    totalTrades: number;
    avgTradeReturn: number;
    volatility: number;
    finalPortfolioValue: number;
}

export interface HistoryPoint {
    date: Date;
    value: number;
}

export interface PricePoint {
    date: Date;
    price: number;
    shortSMA: number | null;
    longSMA: number | null;
    shortEMA: number | null;
    longEMA: number | null;
    rsi: number | null;
}

export interface CompanyInfo {
    sector: string;
    trailingPE: number;
    beta: number;
    longBusinessSummary: string;
}

export interface BacktestResults {
    summary: Summary;
    portfolioHistory: HistoryPoint[];
    buyAndHoldHistory: HistoryPoint[];
    trades: Trade[];
    priceData: PricePoint[];
    notification: string;
    companyInfo?: CompanyInfo;
    error?: string;
}

export interface BacktestConfig {
    assetType: 'Stock' | 'Cryptocurrency';
    symbol: string;
    startDate: string;
    endDate: string;
    strategyType: string;
    shortSMAPeriod: number;
    longSMAPeriod: number;
    shortEMAPeriod: number;
    longEMAPeriod: number;
    rsiPeriod: number;
    rsiOverbought: number;
    rsiOversold: number;
    initialCapital: number;
    useSMA: boolean;
    useEMA: boolean;
    useRSI: boolean;
    positionSize: number;
    stopLoss: number;
    takeProfit: number;
    useRiskReward: boolean;
    riskPercent: number;
    rewardRatio: number;
}