import React from 'react';
import type { BacktestResults } from '../types.ts';
import { PortfolioValueChart, PriceSignalChart, ReturnDistributionChart, CumulativePnlChart } from './charts.tsx';
import { DownloadIcon } from './icons.tsx';
import { formatCurrency, formatPercent, formatDate } from '../utils/formatters.ts';

interface MainContentProps {
    results: BacktestResults | null;
    symbol: string;
    loadingMessage: string;
}

const MainContent: React.FC<MainContentProps> = ({ results, symbol, loadingMessage }) => {
    if (loadingMessage) {
        return (
            <main className="main-content-loading">
                <div className="spinner"></div>
                <h2>Running Backtest</h2>
                <p>{loadingMessage}</p>
            </main>
        );
    }
    
    if (!results) {
        return (
            <main className="main-content-placeholder">
                <h2>Trading Strategy Backtester</h2>
                <p>Configure your strategy on the left and click "Run Backtest" to see your results.</p>
            </main>
        );
    }

    if (results.error) {
         return (
            <main className="main-content-placeholder">
                <h2>Error</h2>
                <p>{results.error}</p>
            </main>
        );
    }

    const { summary, trades, companyInfo } = results;
    
    const exportToCSV = (data: any[], filename: string) => {
        if (data.length === 0) return;
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    return (
        <main className="main-content">
            <header className="main-header">
                <h1>Trading Strategy Backtester + {symbol}</h1>
                <p>Test your trading strategies against historical market data with comprehensive performance analytics.</p>
            </header>

            {results.notification && <div className="notification-banner">{results.notification}</div>}

            {companyInfo && (
                <section className="content-card">
                    <h2>About {symbol}</h2>
                    <div className="company-info-grid">
                         <div className="summary-item">
                            <span className="label">Sector</span>
                            <span className="value">{companyInfo.sector}</span>
                        </div>
                        <div className="summary-item">
                            <span className="label">P/E Ratio</span>
                            <span className="value">{Number.isFinite(companyInfo.trailingPE) ? companyInfo.trailingPE.toFixed(2) : 'N/A'}</span>
                        </div>
                        <div className="summary-item">
                            <span className="label">Beta</span>
                            <span className="value">{companyInfo.beta.toFixed(2)}</span>
                        </div>
                    </div>
                    <p className="company-summary">{companyInfo.longBusinessSummary}</p>
                </section>
            )}

            <section className="content-card">
                <h2>Performance Summary</h2>
                <div className="summary-grid">
                    <div className="summary-item">
                        <span className="label">Total Return</span>
                        <span className={`value ${summary.totalReturn > 0 ? 'positive' : 'negative'}`}>{formatPercent(summary.totalReturn)}</span>
                    </div>
                    <div className="summary-item">
                        <span className="label">Sharpe Ratio</span>
                        <span className="value">{summary.sharpeRatio.toFixed(2)}</span>
                    </div>
                    <div className="summary-item">
                        <span className="label">Max Drawdown</span>
                        <span className={`value negative`}>{formatPercent(summary.maxDrawdown)}</span>
                    </div>
                    <div className="summary-item">
                        <span className="label">Win Rate</span>
                        <span className="value">{formatPercent(summary.winRate)}</span>
                    </div>
                    <div className="summary-item">
                        <span className="label">Total Trades</span>
                        <span className="value">{summary.totalTrades}</span>
                    </div>
                    <div className="summary-item">
                        <span className="label">Avg Trade Return</span>
                        <span className={`value ${summary.avgTradeReturn > 0 ? 'positive' : 'negative'}`}>{formatPercent(summary.avgTradeReturn)}</span>
                    </div>
                    <div className="summary-item">
                        <span className="label">Volatility</span>
                        <span className="value">{formatPercent(summary.volatility)}</span>
                    </div>
                     <div className="summary-item">
                        <span className="label">Final Portfolio Value</span>
                        <span className="value">{formatCurrency(summary.finalPortfolioValue)}</span>
                    </div>
                </div>
            </section>
            
            <section className="content-card charts-grid">
                <div>
                    <h2>Portfolio Value vs Benchmark</h2>
                    <div className="chart-container">
                        <PortfolioValueChart results={results} />
                    </div>
                </div>
                 <div>
                    <h2>Price with Buy/Sell Signals</h2>
                    <div className="chart-container">
                        <PriceSignalChart results={results} />
                    </div>
                </div>
            </section>

             <section className="content-card">
                <h2>Trade History</h2>
                <div style={{maxHeight: '400px', overflowY: 'auto'}}>
                    <table className="trade-history-table">
                        <thead>
                            <tr>
                                <th>Entry Date</th>
                                <th>Exit Date</th>
                                <th>Entry Price</th>
                                <th>Exit Price</th>
                                <th>Return</th>
                                <th>P&L</th>
                                <th>Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trades.map((trade, i) => (
                                <tr key={i}>
                                    <td>{formatDate(trade.entryDate)}</td>
                                    <td>{formatDate(trade.exitDate)}</td>
                                    <td>{formatCurrency(trade.entryPrice)}</td>
                                    <td>{formatCurrency(trade.exitPrice)}</td>
                                    <td className={trade.return > 0 ? 'positive' : 'negative'}>{formatPercent(trade.return)}</td>
                                    <td className={trade.pnl > 0 ? 'positive' : 'negative'}>{formatCurrency(trade.pnl)}</td>
                                    <td>{trade.type}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="content-card additional-charts">
                 <div>
                    <h2>Trade Return Distribution</h2>
                    <div className="chart-container">
                        <ReturnDistributionChart trades={trades} />
                    </div>
                 </div>
                 <div>
                    <h2>Cumulative P&L by Trade</h2>
                    <div className="chart-container">
                        <CumulativePnlChart trades={trades} />
                    </div>
                 </div>
            </section>

            <section className="content-card">
                <h2>Export Results</h2>
                <div className="export-buttons">
                    <button onClick={() => exportToCSV(trades, 'trade_history')}>
                        <DownloadIcon/> Download Trade History (CSV)
                    </button>
                    <button onClick={() => exportToCSV(results.portfolioHistory.map(p => ({ date: formatDate(p.date), value: p.value })), 'portfolio_data')}>
                        <DownloadIcon/> Download Portfolio Data (CSV)
                    </button>
                </div>
            </section>

        </main>
    );
};

export default MainContent;