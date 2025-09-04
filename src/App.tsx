import React, { useState } from 'react';
import Sidebar from './components/Sidebar.tsx';
import MainContent from './components/MainContent.tsx';
import { runBacktest } from './services/backtestService.ts';
import type { BacktestConfig, BacktestResults } from './types.ts';

const App = () => {
    const [config, setConfig] = useState<BacktestConfig>({
        assetType: 'Cryptocurrency',
        symbol: 'BTC-USD',
        startDate: '2025-06-01',
        endDate: '2025-09-01',
        strategyType: 'Simple Moving Average Crossover',
        shortSMAPeriod: 10,
        longSMAPeriod: 30,
        shortEMAPeriod: 12,
        longEMAPeriod: 26,
        rsiPeriod: 14,
        rsiOverbought: 70,
        rsiOversold: 30,
        initialCapital: 10000,
        useSMA: false,
        useEMA: false,
        useRSI: false,
        positionSize: 1,
        stopLoss: 0.03,
        takeProfit: 0.06,
        useRiskReward: true,
        riskPercent: 3,
        rewardRatio: 2,
    });
    const [results, setResults] = useState<BacktestResults | null>(null);
    const [loadingMessage, setLoadingMessage] = useState('');

    const handleRunBacktest = async () => {
        setResults(null);
        
        const backtestResults = await runBacktest(config, (message) => {
            setLoadingMessage(message);
        });
        
        if (backtestResults.error) {
            setResults(backtestResults as BacktestResults);
        } else {
            const notification = `✅ Backtest completed! Generated ${backtestResults.trades?.length || 0} signals and executed ${backtestResults.trades?.length || 0} trades.`;
            setResults({ ...backtestResults, notification } as BacktestResults);
        }
        
        setLoadingMessage('');
    };

    return (
        <div className="app-container">
            <Sidebar config={config} setConfig={setConfig} onRunBacktest={handleRunBacktest} loading={!!loadingMessage} />
            <MainContent results={results} symbol={config.symbol} loadingMessage={loadingMessage} />
        </div>
    );
};

export default App;