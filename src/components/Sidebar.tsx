import React, { useEffect } from 'react';
import type { BacktestConfig } from '../types.ts';
import { SettingsIcon, ChartIcon } from './icons.tsx';

interface SidebarProps {
    config: BacktestConfig;
    setConfig: React.Dispatch<React.SetStateAction<BacktestConfig>>;
    onRunBacktest: () => void;
    loading: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ config, setConfig, onRunBacktest, loading }) => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, type } = e.target;
        
        if (type === 'checkbox') {
            setConfig(prev => ({ 
                ...prev, 
                [name]: (e.target as HTMLInputElement).checked 
            }));
        } else {
            const { value } = e.target;
            const isNumber = type === 'number';
            setConfig(prev => ({ 
                ...prev, 
                [name]: isNumber ? (value === '' ? '' : parseFloat(value)) : value 
            }));
        }
    };
    
    useEffect(() => {
        if (config.useRiskReward) {
            const risk = config.riskPercent / 100;
            const takeProfit = risk * config.rewardRatio;
            setConfig(prev => ({
                ...prev,
                stopLoss: risk,
                takeProfit: takeProfit,
            }));
        }
    }, [config.riskPercent, config.rewardRatio, config.useRiskReward]);

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <SettingsIcon />
                <h2>Strategy Configuration</h2>
            </div>

            <div className="config-section">
                <div className="form-group">
                    <label htmlFor="assetType">Asset Type</label>
                    <select id="assetType" name="assetType" value={config.assetType} onChange={handleInputChange}>
                        <option>Stock</option>
                        <option>Cryptocurrency</option>
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="symbol">{config.assetType} Symbol</label>
                    {config.assetType === 'Stock' ? (
                         <input type="text" id="symbol" name="symbol" value={config.symbol} onChange={handleInputChange} />
                    ) : (
                        <select id="symbol" name="symbol" value={config.symbol} onChange={handleInputChange}>
                            <option>BTC-USD</option>
                        </select>
                    )}
                </div>
            </div>

            <div className="config-section">
                <div className="section-title"><h3>Time Period</h3></div>
                <div className="form-group">
                    <div className="input-wrapper">
                        <div>
                            <label htmlFor="startDate">Start Date</label>
                            <input type="date" id="startDate" name="startDate" value={config.startDate} onChange={handleInputChange} />
                        </div>
                        <div>
                            <label htmlFor="endDate">End Date</label>
                            <input type="date" id="endDate" name="endDate" value={config.endDate} onChange={handleInputChange} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="config-section">
                <div className="section-title"><h3><ChartIcon /> Technical Indicators</h3></div>
                <div className="form-group">
                    <label htmlFor="strategyType">Strategy Type</label>
                    <select id="strategyType" name="strategyType" value={config.strategyType} onChange={handleInputChange}>
                        <option>Simple Moving Average Crossover</option>
                        <option>RSI Mean Reversion</option>
                        <option>EMA + RSI Combo</option>
                        <option>Custom</option>
                    </select>
                </div>
                
                {config.strategyType === 'Simple Moving Average Crossover' && (
                    <>
                        <div className="form-group">
                            <label htmlFor="shortSMAPeriod">Short SMA Period</label>
                            <input type="number" id="shortSMAPeriod" name="shortSMAPeriod" value={config.shortSMAPeriod} onChange={handleInputChange} min="1"/>
                        </div>
                        <div className="form-group">
                            <label htmlFor="longSMAPeriod">Long SMA Period</label>
                            <input type="number" id="longSMAPeriod" name="longSMAPeriod" value={config.longSMAPeriod} onChange={handleInputChange} min="2"/>
                        </div>
                    </>
                )}

                 {config.strategyType === 'RSI Mean Reversion' && (
                    <>
                        <div className="form-group">
                            <label htmlFor="rsiPeriod">RSI Period</label>
                            <input type="number" id="rsiPeriod" name="rsiPeriod" value={config.rsiPeriod} onChange={handleInputChange} min="2"/>
                        </div>
                        <div className="form-group">
                             <div className="input-wrapper">
                                <div>
                                    <label htmlFor="rsiOversold">Oversold</label>
                                    <input type="number" id="rsiOversold" name="rsiOversold" value={config.rsiOversold} onChange={handleInputChange} min="1" max="99"/>
                                </div>
                                <div>
                                     <label htmlFor="rsiOverbought">Overbought</label>
                                    <input type="number" id="rsiOverbought" name="rsiOverbought" value={config.rsiOverbought} onChange={handleInputChange} min="1" max="99"/>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {config.strategyType === 'EMA + RSI Combo' && (
                    <>
                        <div className="form-group">
                            <label htmlFor="shortEMAPeriod">Short EMA Period</label>
                            <input type="number" id="shortEMAPeriod" name="shortEMAPeriod" value={config.shortEMAPeriod} onChange={handleInputChange} min="1"/>
                        </div>
                        <div className="form-group">
                            <label htmlFor="longEMAPeriod">Long EMA Period</label>
                            <input type="number" id="longEMAPeriod" name="longEMAPeriod" value={config.longEMAPeriod} onChange={handleInputChange} min="2"/>
                        </div>
                         <div className="form-group">
                            <label htmlFor="rsiPeriod">RSI Period</label>
                            <input type="number" id="rsiPeriod" name="rsiPeriod" value={config.rsiPeriod} onChange={handleInputChange} min="2"/>
                        </div>
                    </>
                )}

                {config.strategyType === 'Custom' && (
                     <div className="form-group">
                        <label className="custom-params-label">Custom Strategy Parameters</label>
                        <div className="checkbox-group">
                            <input type="checkbox" id="useSMA" name="useSMA" checked={config.useSMA} onChange={handleInputChange} />
                            <label htmlFor="useSMA">Use SMA</label>
                        </div>
                        <div className="checkbox-group">
                            <input type="checkbox" id="useEMA" name="useEMA" checked={config.useEMA} onChange={handleInputChange} />
                            <label htmlFor="useEMA">Use EMA</label>
                        </div>
                        <div className="checkbox-group">
                            <input type="checkbox" id="useRSI" name="useRSI" checked={config.useRSI} onChange={handleInputChange} />
                            <label htmlFor="useRSI">Use RSI</label>
                        </div>
                    </div>
                )}
            </div>

             <div className="config-section">
                <div className="section-title"><h3>⚠️ Risk Management</h3></div>
                 <div className="form-group">
                    <label htmlFor="initialCapital">Initial Capital ($)</label>
                    <input type="number" id="initialCapital" name="initialCapital" value={config.initialCapital} onChange={handleInputChange} min="1"/>
                </div>
                <div className="form-group">
                    <label htmlFor="positionSize">Position Size (%)</label>
                    <input type="number" id="positionSize" name="positionSize" value={config.positionSize * 100} onChange={(e) => setConfig(p => ({...p, positionSize: parseFloat(e.target.value) / 100}))} min="1" max="100"/>
                </div>
                <div className="form-group">
                    <div className="checkbox-group">
                        <input type="checkbox" id="useRiskReward" name="useRiskReward" checked={config.useRiskReward} onChange={handleInputChange} />
                        <label htmlFor="useRiskReward">Use Risk/Reward Ratio</label>
                    </div>
                </div>

                {config.useRiskReward ? (
                    <>
                        <div className="form-group">
                            <label htmlFor="riskPercent">Risk per Trade (%)</label>
                            <input type="number" id="riskPercent" name="riskPercent" value={config.riskPercent} onChange={handleInputChange} step="0.5" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="rewardRatio">Reward Ratio (Risk:Reward)</label>
                            <input type="number" id="rewardRatio" name="rewardRatio" value={config.rewardRatio} onChange={handleInputChange} step="0.1" />
                        </div>
                         <div className="info-box">
                            📊 SL: {config.riskPercent.toFixed(1)}% / TP: {(config.riskPercent * config.rewardRatio).toFixed(1)}% (1:{config.rewardRatio.toFixed(1)})
                        </div>
                    </>
                ) : (
                    <div className="input-wrapper">
                        <div className="form-group">
                            <label htmlFor="stopLoss">Stop Loss (%)</label>
                            <input type="number" id="stopLoss" name="stopLoss" value={config.stopLoss * 100} onChange={(e) => setConfig(p => ({...p, stopLoss: parseFloat(e.target.value) / 100}))} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="takeProfit">Take Profit (%)</label>
                            <input type="number" id="takeProfit" name="takeProfit" value={config.takeProfit * 100} onChange={(e) => setConfig(p => ({...p, takeProfit: parseFloat(e.target.value) / 100}))} />
                        </div>
                    </div>
                )}
            </div>
            
            <button className="run-backtest-btn" onClick={onRunBacktest} disabled={loading}>
                {loading ? 'Running...' : '🚀 Run Backtest'}
            </button>
        </aside>
    );
};

export default Sidebar;