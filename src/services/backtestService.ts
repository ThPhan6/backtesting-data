import type { BacktestConfig, BacktestResults, PricePoint } from '../types.ts';
import { fetchMarketData, fetchCompanyInfo } from './marketDataService.ts';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const calculateIndicators = (prices: {price: number, date: Date}[], config: BacktestConfig): PricePoint[] => {
    const data: PricePoint[] = prices.map(p => ({
        ...p,
        shortSMA: null,
        longSMA: null,
        shortEMA: null,
        longEMA: null,
        rsi: null,
    }));

    // SMA
    for (let i = 0; i < data.length; i++) {
        if (i >= config.shortSMAPeriod - 1) {
            data[i].shortSMA = data.slice(i - config.shortSMAPeriod + 1, i + 1).reduce((sum, val) => sum + val.price, 0) / config.shortSMAPeriod;
        }
        if (i >= config.longSMAPeriod - 1) {
            data[i].longSMA = data.slice(i - config.longSMAPeriod + 1, i + 1).reduce((sum, val) => sum + val.price, 0) / config.longSMAPeriod;
        }
    }

    // EMA
    const shortEMAMultiplier = 2 / (config.shortEMAPeriod + 1);
    const longEMAMultiplier = 2 / (config.longEMAPeriod + 1);
    for (let i = 0; i < data.length; i++) {
        if (i === config.shortEMAPeriod - 1) {
            data[i].shortEMA = data.slice(0, config.shortEMAPeriod).reduce((sum, val) => sum + val.price, 0) / config.shortEMAPeriod;
        } else if (i > config.shortEMAPeriod - 1) {
            data[i].shortEMA = (data[i].price - data[i - 1].shortEMA!) * shortEMAMultiplier + data[i - 1].shortEMA!;
        }
        if (i === config.longEMAPeriod - 1) {
            data[i].longEMA = data.slice(0, config.longEMAPeriod).reduce((sum, val) => sum + val.price, 0) / config.longEMAPeriod;
        } else if (i > config.longEMAPeriod - 1) {
            data[i].longEMA = (data[i].price - data[i - 1].longEMA!) * longEMAMultiplier + data[i - 1].longEMA!;
        }
    }

    // RSI
    let avgGain = 0;
    let avgLoss = 0;
    for (let i = 1; i < data.length; i++) {
        const change = data[i].price - data[i - 1].price;
        const gain = change > 0 ? change : 0;
        const loss = change < 0 ? -change : 0;

        if (i < config.rsiPeriod + 1) {
            avgGain += gain;
            avgLoss += loss;
            if (i === config.rsiPeriod) {
                avgGain /= config.rsiPeriod;
                avgLoss /= config.rsiPeriod;
            }
        } else {
            avgGain = (avgGain * (config.rsiPeriod - 1) + gain) / config.rsiPeriod;
            avgLoss = (avgLoss * (config.rsiPeriod - 1) + loss) / config.rsiPeriod;
        }

        if (i >= config.rsiPeriod) {
            if (avgLoss === 0) {
                data[i].rsi = 100;
            } else {
                const rs = avgGain / avgLoss;
                data[i].rsi = 100 - (100 / (1 + rs));
            }
        }
    }
    
    return data;
};


// --- BACKTESTING ENGINE ---
export const runBacktest = async (
    config: BacktestConfig,
    onProgress: (message: string) => void
): Promise<Partial<BacktestResults>> => {
    try {
        const { 
            symbol, startDate, endDate, initialCapital,
            positionSize, stopLoss, takeProfit
        } = config;
        
        // Step 1: Fetch real market data and company info concurrently
        onProgress('📥 Stage 1/4: Fetching market data...');
        const [prices, companyInfo] = await Promise.all([
            fetchMarketData(symbol, startDate, endDate),
            fetchCompanyInfo(symbol)
        ]);

        const requiredDataPoints = Math.max(config.longSMAPeriod, config.longEMAPeriod, config.rsiPeriod) + 1;
        if (!prices || prices.length < requiredDataPoints) {
            return { error: `Not enough data for the selected time period and indicator settings. This strategy requires at least ${requiredDataPoints} data points, but only ${prices?.length || 0} were found for the selected date range. Please select a longer date range or shorter indicator periods.` };
        }

        // Step 2: Calculate indicators
        onProgress('🔧 Stage 2/4: Processing and cleaning data...');
        await sleep(150); 
        const dataWithIndicators = calculateIndicators(prices, config);

        // Step 3: Run simulation loop
        onProgress('📊 Stage 3/4: Running simulation...');
        await sleep(150);
        let cash = initialCapital;
        let shares = 0;
        let entryPrice = 0;
        let entryDate: Date | null = null;
        const trades = [];
        const portfolioHistory = [{ date: new Date(startDate), value: initialCapital }];
        const buyAndHoldShares = initialCapital / dataWithIndicators[0].price;

        const executeBuy = (price: number, date: Date) => {
            if (cash > 0) {
                const investment = cash * positionSize;
                shares = investment / price;
                entryPrice = price;
                entryDate = date;
                cash -= investment;
            }
        };

        const executeSell = (price: number, date: Date, type: string) => {
            if (shares > 0) {
                const exitPrice = price;
                cash += shares * exitPrice;
                const pnl = (exitPrice - entryPrice) * shares;
                trades.push({
                    entryDate, exitDate: date, entryPrice, exitPrice, shares,
                    return: (exitPrice - entryPrice) / entryPrice, pnl, type,
                });
                shares = 0;
                entryPrice = 0;
                entryDate = null;
            }
        };

        dataWithIndicators.forEach((d, i) => {
            const currentPrice = d.price;
            
            // --- Risk Management: Check for SL/TP ---
            if (shares > 0) {
                if (stopLoss > 0 && currentPrice <= entryPrice * (1 - stopLoss)) {
                    executeSell(currentPrice, d.date, 'Stop Loss');
                } else if (takeProfit > 0 && currentPrice >= entryPrice * (1 + takeProfit)) {
                    executeSell(currentPrice, d.date, 'Take Profit');
                }
            }

            // --- Strategy Signals ---
            const prev = i > 0 ? dataWithIndicators[i - 1] : d;
            switch (config.strategyType) {
                case 'Simple Moving Average Crossover':
                    if (d.shortSMA && d.longSMA && prev.shortSMA && prev.longSMA) {
                        if (d.shortSMA > d.longSMA && prev.shortSMA <= prev.longSMA && shares === 0) {
                            executeBuy(currentPrice, d.date);
                        }
                        else if (d.shortSMA < d.longSMA && prev.shortSMA >= prev.longSMA && shares > 0) {
                            executeSell(currentPrice, d.date, 'Signal');
                        }
                    }
                    break;
                case 'RSI Mean Reversion':
                    if (d.rsi && prev.rsi) {
                        if (d.rsi > config.rsiOversold && prev.rsi <= config.rsiOversold && shares === 0) {
                            executeBuy(currentPrice, d.date);
                        }
                        else if (d.rsi < config.rsiOverbought && prev.rsi >= config.rsiOverbought && shares > 0) {
                            executeSell(currentPrice, d.date, 'Signal');
                        }
                    }
                    break;
                case 'EMA + RSI Combo':
                    if (d.shortEMA && d.longEMA && prev.shortEMA && prev.longEMA && d.rsi) {
                        if (d.shortEMA > d.longEMA && prev.shortEMA <= prev.longEMA && d.rsi > 50 && shares === 0) {
                            executeBuy(currentPrice, d.date);
                        }
                        else if (d.shortEMA < d.longEMA && prev.shortEMA >= prev.longEMA && shares > 0) {
                            executeSell(currentPrice, d.date, 'Signal');
                        }
                    }
                    break;
                default:
                    break;
            }

            const portfolioValue = cash + (shares * currentPrice);
            portfolioHistory.push({ date: d.date, value: portfolioValue });
        });
        
        // Step 4: Calculate final summary statistics
        onProgress('📈 Stage 4/4: Compiling final report...');
        await sleep(150);
        const buyAndHoldHistory = dataWithIndicators.map(d => ({ date: d.date, value: buyAndHoldShares * d.price }));
        const finalPortfolioValue = portfolioHistory[portfolioHistory.length - 1].value;
        const totalReturn = (finalPortfolioValue - initialCapital) / initialCapital;
        const winningTrades = trades.filter(t => t.pnl > 0).length;
        const winRate = trades.length > 0 ? winningTrades / trades.length : 0;
        
        const portfolioReturns = portfolioHistory.map((p, i) => i > 0 ? (p.value / portfolioHistory[i-1].value) - 1 : 0).slice(1);
        const avgReturn = portfolioReturns.reduce((sum, val) => sum + val, 0) / portfolioReturns.length;
        const variance = portfolioReturns.reduce((acc, val) => acc + Math.pow(val - avgReturn, 2), 0) / portfolioReturns.length;
        const volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized

        let peak = -Infinity;
        let maxDrawdown = 0;
        portfolioHistory.forEach(({ value }) => {
            if (value > peak) peak = value;
            const drawdown = (peak - value) / peak;
            if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        });

        const returns = trades.map(t => t.return);
        const avgTradeReturn = returns.length > 0 ? returns.reduce((a,b) => a+b, 0) / returns.length : 0;
        
        return {
            summary: {
                totalReturn,
                sharpeRatio: volatility > 0 ? (totalReturn - 0.02) / volatility : 0, // Mock risk-free rate of 2%
                maxDrawdown: -maxDrawdown,
                winRate,
                totalTrades: trades.length,
                avgTradeReturn,
                volatility,
                finalPortfolioValue,
            },
            portfolioHistory,
            buyAndHoldHistory,
            trades,
            priceData: dataWithIndicators,
            companyInfo,
        };
    } catch (error) {
        console.error("Backtest failed:", error);
        return { error: error instanceof Error ? error.message : 'An unknown error occurred during the backtest.' };
    }
};