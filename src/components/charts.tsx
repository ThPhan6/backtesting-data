import React, { useRef, useEffect } from 'react';
import type { BacktestResults, Trade } from '../types.ts';

// --- REUSABLE CHART COMPONENT ---
interface ChartComponentProps {
    type: any;
    data: any;
    options: any;
}
const ChartComponent: React.FC<ChartComponentProps> = ({ type, data, options }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<any>(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
             chartInstanceRef.current = new (window as any).Chart(ctx, { type, data, options });
        }

        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
        };
    }, [data, options, type]);

    return <canvas ref={canvasRef} />;
};


// --- SPECIFIC CHART COMPONENTS ---

export const PortfolioValueChart = ({ results }: { results: BacktestResults }) => {
    const data = {
        labels: results.portfolioHistory.map(p => p.date),
        datasets: [
            {
                label: 'Strategy',
                data: results.portfolioHistory.map(p => p.value),
                borderColor: 'rgba(239, 68, 68, 1)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                tension: 0.1,
                pointRadius: 0,
            },
            {
                label: 'Buy & Hold',
                data: results.buyAndHoldHistory.map(p => p.value),
                borderColor: 'rgba(107, 114, 128, 1)',
                backgroundColor: 'rgba(107, 114, 128, 0.1)',
                tension: 0.1,
                pointRadius: 0,
            },
        ]
    };
    const options = {
        responsive: true, maintainAspectRatio: false,
        scales: { x: { type: 'time', time: { unit: 'month' }, grid: { display: false } } },
        plugins: { legend: { position: 'top' }, tooltip: { mode: 'index', intersect: false } },
    };
    return <ChartComponent type="line" data={data} options={options} />;
};

export const PriceSignalChart = ({ results }: { results: BacktestResults }) => {
    const buySignals = results.trades.map(trade => ({ x: trade.entryDate, y: trade.entryPrice }));
    const sellSignals = results.trades.map(trade => ({ x: trade.exitDate, y: trade.exitPrice }));
    
    const data = {
        labels: results.priceData.map(p => p.date),
        datasets: [
            {
                label: 'Price',
                data: results.priceData.map(p => p.price),
                borderColor: 'rgba(59, 130, 246, 1)',
                type: 'line',
                tension: 0.1,
                pointRadius: 0,
            },
            {
                label: 'Buy Signal',
                data: buySignals,
                backgroundColor: 'rgba(16, 163, 74, 1)',
                pointStyle: 'triangle',
                radius: 6,
                rotation: 0,
                type: 'scatter',
            },
            {
                label: 'Sell Signal',
                data: sellSignals,
                backgroundColor: 'rgba(220, 38, 38, 1)',
                pointStyle: 'triangle',
                radius: 6,
                rotation: 180,
                type: 'scatter',
            }
        ]
    };
    const options = {
        responsive: true, maintainAspectRatio: false,
        scales: { x: { type: 'time', time: { unit: 'month' }, grid: { display: false } } },
        plugins: { legend: { position: 'top' }, tooltip: { mode: 'index', intersect: false } },
    };
    return <ChartComponent type="line" data={data} options={options} />;
};

export const ReturnDistributionChart = ({ trades }: { trades: Trade[] }) => {
    const returns = trades.map(t => t.return * 100);
    const bins = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
    const binnedData = new Array(bins.length + 1).fill(0);
    returns.forEach(r => {
        let binIndex = bins.findIndex(bin => r < bin);
        if (binIndex === -1) binIndex = bins.length;
        binnedData[binIndex]++;
    });
    
    const data = {
        labels: bins.map((b,i) => i < bins.length -1 ? `${bins[i]}% to ${bins[i+1]}%` : `>${bins[bins.length-1]}%`),
        datasets: [{ label: 'Frequency', data: binnedData, backgroundColor: 'rgba(59, 130, 246, 0.7)' }]
    };
    const options = { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } };
    return <ChartComponent type="bar" data={data} options={options} />;
};

export const CumulativePnlChart = ({ trades }: { trades: Trade[] }) => {
    let cumulativePnl = 0;
    const dataPoints = trades.map(t => {
        cumulativePnl += t.pnl;
        return cumulativePnl;
    });
    
    const data = {
        labels: trades.map((_, i) => `Trade ${i + 1}`),
        datasets: [{ label: 'Cumulative P&L', data: dataPoints, borderColor: 'rgba(22, 163, 74, 1)', tension: 0.1, pointRadius: 2 }]
    };
    const options = { responsive: true, maintainAspectRatio: false };
    return <ChartComponent type="line" data={data} options={options} />;
};