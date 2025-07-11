'use client';

import React, { FC, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LineChart, Line, ResponsiveContainer, Tooltip, YAxis } from 'recharts';

interface BotCardProps {
  id: string;
  name: string;
  description: string;
  weeklyReturn: string;
  monthlyReturn: string;
  trades: number;
  winRate: string;
  strategy: string;
  riskLevel: 'low' | 'moderate' | 'high';
  riskColor?: string;
  riskManagement?: string;
  baseRiskPerTrade: number;
  onRiskChange?: (value: number) => void;
}

const BotCard: FC<BotCardProps> = ({
  id,
  name,
  description,
  weeklyReturn,
  monthlyReturn,
  trades,
  winRate,
  strategy,
  riskLevel,
  riskColor,
  riskManagement,
  baseRiskPerTrade,
  onRiskChange
}) => {
  const { connected } = useWallet();
  const [performanceTimeframe, setPerformanceTimeframe] = useState<'7d' | '30d'>('7d');
  const [riskPercentage, setRiskPercentage] = useState(baseRiskPerTrade);
  
  // Handle risk slider change
  const handleRiskChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRisk = Number(e.target.value);
    setRiskPercentage(newRisk);
    if (onRiskChange) {
      onRiskChange(newRisk);
    }
  };

  // Generate mock performance data
  const generatePerformanceData = (days: number) => {
    const data = [];
    const now = new Date();
    
    // Different patterns for different bots (fixed, not affected by risk slider)
    const getProfit = (i: number) => {
      switch (id) {
        case 'vol-tracker':
          return 0.4 + (Math.sin(i * 0.5) * 0.3) + (Math.random() * 0.2);
        case 'trend-surfer':
          return 0.7 + (Math.sin(i * 0.3) * 0.5) + (Math.random() * 0.3);
        case 'arb-finder':
          return 0.3 + (Math.cos(i * 0.2) * 0.1) + (Math.random() * 0.1);
        default:
          return 0.5 + (Math.random() * 0.3);
      }
    };
    
    // Use a fixed seed for random to ensure the chart shape remains consistent
    const seededRandom = (i: number) => {
      return Math.sin(i * 9876) * 10000 % 1;
    };
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Use the fixed pattern but scale the values based on the risk percentage
      let baseProfit = getProfit(i);
      
      // Apply a scaling factor based on the bot's base risk profile
      // but don't change the shape of the chart
      const scalingFactor = baseRiskPerTrade / 15; // 15% is our reference point
      const profit = baseProfit * scalingFactor;
      
      data.push({
        date: date.toISOString().split('T')[0],
        profit: parseFloat(profit.toFixed(2))
      });
    }
    
    return data;
  };
  
  const performanceData = performanceTimeframe === '7d' 
    ? generatePerformanceData(7) 
    : generatePerformanceData(30);
  
  // Calculate totals
  const totalProfit = performanceData.reduce((sum, day) => sum + day.profit, 0).toFixed(2);
  const averageProfit = (performanceData.reduce((sum, day) => sum + day.profit, 0) / performanceData.length).toFixed(2);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-green-400';
      case 'moderate':
        return 'text-yellow-400';
      case 'high':
        return 'text-red-400';
      default:
        return 'text-white';
    }
  };

  return (
    <div className="flex flex-col bg-dark-light rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300 border border-dark-lighter hover:border-primary h-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 mb-4">
        <h3 className="text-xl sm:text-2xl font-bold text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">{name}</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(riskLevel)} bg-dark-lighter backdrop-blur-sm self-start`}>
          {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
        </span>
      </div>

      <p className="text-sm sm:text-base text-white/80 mb-4 sm:mb-6 line-clamp-3 hover:line-clamp-none transition-all duration-300">{description}</p>

      <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="stat-card bg-dark-lighter p-3 sm:p-4 rounded-lg backdrop-blur-sm hover:scale-105 transition-transform duration-300">
          <p className="text-xs sm:text-sm text-white/60">Weekly Return</p>
          <p className="text-lg sm:text-2xl font-bold text-primary">{weeklyReturn}</p>
        </div>
        <div className="stat-card bg-dark-lighter p-3 sm:p-4 rounded-lg backdrop-blur-sm hover:scale-105 transition-transform duration-300">
          <p className="text-xs sm:text-sm text-white/60">Monthly Return</p>
          <p className="text-lg sm:text-2xl font-bold text-primary">{monthlyReturn}</p>
        </div>
        <div className="stat-card bg-dark-lighter p-3 sm:p-4 rounded-lg backdrop-blur-sm hover:scale-105 transition-transform duration-300">
          <p className="text-xs sm:text-sm text-white/60">Trades (30d)</p>
          <p className="text-lg sm:text-2xl font-bold text-white">{trades}</p>
        </div>
        <div className="stat-card bg-dark-lighter p-3 sm:p-4 rounded-lg backdrop-blur-sm hover:scale-105 transition-transform duration-300">
          <p className="text-xs sm:text-sm text-white/60">Win Rate</p>
          <p className="text-lg sm:text-2xl font-bold text-white">{winRate}</p>
        </div>
      </div>
      
      {/* Performance Chart Section */}
      <div className="mb-4 sm:mb-6 bg-dark-lighter p-3 sm:p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2 sm:mb-3">
          <h4 className="text-base sm:text-lg font-semibold">Performance History</h4>
          <div className="flex text-xs">
            <button 
              className={`px-2 py-1 rounded-l-md ${performanceTimeframe === '7d' ? 'bg-primary text-black' : 'bg-dark text-white/60'}`}
              onClick={() => setPerformanceTimeframe('7d')}
            >
              7D
            </button>
            <button 
              className={`px-2 py-1 rounded-r-md ${performanceTimeframe === '30d' ? 'bg-primary text-black' : 'bg-dark text-white/60'}`}
              onClick={() => setPerformanceTimeframe('30d')}
            >
              30D
            </button>
          </div>
        </div>
        
        <div className="h-32 sm:h-36">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceData}>
              <YAxis 
                domain={['dataMin', 'dataMax']} 
                tickFormatter={(value) => `${value}%`} 
                width={30}
                axisLine={false}
                tickLine={false}
                tick={{fill: '#999', fontSize: 10}}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: 'none' }}
                formatter={(value: number) => [`${value}%`, 'Daily Return']}
                labelFormatter={(label) => {
                  const date = new Date(label);
                  return `${date.toLocaleDateString()}`; 
                }}
              />
              <Line 
                type="monotone" 
                dataKey="profit"
                stroke="#10b981" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex justify-between mt-2">
          <div>
            <p className="text-xs text-white/60">Total Return</p>
            <p className="text-xs sm:text-sm font-semibold text-primary">+{totalProfit}%</p>
          </div>
          <div>
            <p className="text-xs text-white/60">Daily Average</p>
            <p className="text-xs sm:text-sm font-semibold text-primary">+{averageProfit}%</p>
          </div>
        </div>
      </div>

      <div className="mb-4 sm:mb-6">
        <h4 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">Strategy</h4>
        <p className="text-xs sm:text-sm text-white/80 line-clamp-3 hover:line-clamp-none transition-all duration-300">{strategy}</p>
      </div>
      
      {/* Individual Risk Management Section */}
      <div className="mb-4 sm:mb-6">
        <h4 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">Risk Management</h4>
        <p className="text-xs sm:text-sm text-white/80 mb-2 sm:mb-3">{riskManagement}</p>
        
        <div className="bg-dark-lighter p-2 sm:p-3 rounded-lg">
          <div className="flex justify-between text-xs text-white/60 mb-1">
            <span>Low Risk (1%)</span>
            <span>High Risk (50%)</span>
          </div>
          <input
            type="range"
            min="1"
            max="50"
            value={riskPercentage}
            onChange={handleRiskChange}
            className="w-full h-2 bg-dark rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-center mt-1 sm:mt-2">
            <span className="text-xs sm:text-sm text-primary font-medium">Current: {riskPercentage}% per trade</span>
          </div>
        </div>
      </div>

      <div className="mt-auto">
        {connected ? (
          <button className="btn-primary w-full py-2 sm:py-3 text-sm sm:text-base hover:scale-105 transition-transform duration-300 bg-gradient-to-r from-primary to-primary/70">
            Activate Bot
          </button>
        ) : (
          <WalletMultiButton className="w-full py-2 sm:py-3 justify-center text-sm sm:text-base hover:scale-105 transition-transform duration-300" />
        )}
      </div>
    </div>
  );
};

export default BotCard; 