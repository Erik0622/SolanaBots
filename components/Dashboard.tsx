'use client';

import React, { FC, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface Position {
  id: string;
  botType: string;
  entryDate: string;
  entryPrice: number;
  currentPrice: number;
  size: number;
  profit: number;
  profitPercentage: number;
}

interface PerformanceData {
  date: string;
  profit: number;
  cumulative: number;
}

interface ConnectedBot {
  id: string;
  name: string;
  status: 'active' | 'paused';
  trades: number;
  profitToday: number;
  profitWeek: number;
  profitMonth: number;
}

const Dashboard: FC = () => {
  const { connected, publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState<'positions' | 'performance' | 'bots'>('positions');
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'all'>('30d');
  const [positions, setPositions] = useState<Position[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [connectedBots, setConnectedBots] = useState<ConnectedBot[]>([]);
  const [totalProfit, setTotalProfit] = useState({ today: 0, week: 0, month: 0, all: 0 });
  const [devFees, setDevFees] = useState({ total: 0, month: 0 });

  // Simulate fetching data when wallet is connected
  useEffect(() => {
    if (connected && publicKey) {
      // Mock data - would be replaced with actual API calls
      fetchPositions();
      fetchPerformanceData();
      fetchConnectedBots();
    }
  }, [connected, publicKey, timeframe]);

  const fetchPositions = () => {
    // Mock data - in a real app, this would be an API call
    const mockPositions: Position[] = [
      {
        id: 'pos-123',
        botType: 'Volume Tracker',
        entryDate: '2023-12-01',
        entryPrice: 22.45,
        currentPrice: 25.78,
        size: 2.5,
        profit: 16.65,
        profitPercentage: 29.6
      },
      {
        id: 'pos-456',
        botType: 'Momentum Bot',
        entryDate: '2023-12-10',
        entryPrice: 105.22,
        currentPrice: 128.67,
        size: 0.75,
        profit: 35.18,
        profitPercentage: 44.6
      },
      {
        id: 'pos-789',
        botType: 'Dip Hunter',
        entryDate: '2023-12-15',
        entryPrice: 43.12,
        currentPrice: 45.03,
        size: 5.2,
        profit: 29.79,
        profitPercentage: 13.2
      }
    ];
    
    setPositions(mockPositions);
    
    // Calculate total profits
    const totalProfit = mockPositions.reduce((sum, pos) => sum + pos.profit, 0);
    const devFee = totalProfit * 0.1; // 10% of profits
    
    setTotalProfit(prev => ({ ...prev, all: totalProfit }));
    setDevFees(prev => ({ ...prev, total: devFee }));
  };

  const fetchPerformanceData = () => {
    // Generate mock performance data
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    const data: PerformanceData[] = [];
    const now = new Date();
    
    let totalProfit = 0;
    let weekProfit = 0;
    let monthProfit = 0;
    let todayProfit = 0;
    let cumulativeReturn = 100; // Starting value for cumulative return (100%)
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Generate daily percent returns (0.5-2.5%)
      const profit = 0.5 + Math.sin(i * 0.3) * 0.8 + Math.random() * 1.2;
      
      if (i === 0) todayProfit = profit;
      if (i < 7) weekProfit += profit;
      if (i < 30) monthProfit += profit;
      
      totalProfit += profit;
      cumulativeReturn *= (1 + profit/100);
      
      data.push({
        date: dateStr,
        profit: parseFloat(profit.toFixed(2)),
        cumulative: parseFloat((cumulativeReturn - 100).toFixed(2)) // Show percent gain from starting point
      });
    }
    
    setPerformanceData(data);
    setTotalProfit({
      today: parseFloat(todayProfit.toFixed(2)),
      week: parseFloat(weekProfit.toFixed(2)),
      month: parseFloat(monthProfit.toFixed(2)),
      all: parseFloat(totalProfit.toFixed(2))
    });
    
    // Calculate dev fees
    setDevFees({
      total: parseFloat((totalProfit * 0.1).toFixed(2)),
      month: parseFloat((monthProfit * 0.1).toFixed(2))
    });
  };

  const fetchConnectedBots = () => {
    // Mock connected bots data
    const mockBots: ConnectedBot[] = [
      {
        id: 'bot-vol-123',
        name: 'Volume Tracker',
        status: 'active',
        trades: 24,
        profitToday: 5.5,
        profitWeek: 25.0,
        profitMonth: 71.6
      },
      {
        id: 'bot-trend-456',
        name: 'Momentum Bot',
        status: 'active',
        trades: 12,
        profitToday: 10.9,
        profitWeek: 38.4,
        profitMonth: 109.4
      },
      {
        id: 'bot-arb-789',
        name: 'Dip Hunter',
        status: 'paused',
        trades: 38,
        profitToday: 4.26,
        profitWeek: 23.4,
        profitMonth: 67.2
      }
    ];
    
    setConnectedBots(mockBots);
  };

  const toggleBotStatus = (botId: string) => {
    setConnectedBots(bots => 
      bots.map(bot => 
        bot.id === botId ? 
          {...bot, status: bot.status === 'active' ? 'paused' : 'active'} : 
          bot
      )
    );
  };

  if (!connected) {
    return (
      <div className="py-20 px-6 bg-dark-light min-h-[60vh]">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Trading Dashboard</h2>
          <p className="text-white/80 mb-8">Connect your wallet to access your trading dashboard.</p>
          <WalletMultiButton className="btn-primary px-8 py-3" />
        </div>
      </div>
    );
  }

  return (
    <section className="py-16 px-6 bg-dark-light min-h-screen">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold mb-8">Trading Dashboard</h2>
        
        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="stat-card bg-dark-lighter p-6 rounded-lg backdrop-blur-sm hover:border-primary hover:border border-transparent transition-all">
            <p className="text-white/60 mb-1">Today's Return</p>
            <p className="text-3xl font-bold text-primary">+{totalProfit.today}%</p>
          </div>
          <div className="stat-card bg-dark-lighter p-6 rounded-lg backdrop-blur-sm hover:border-primary hover:border border-transparent transition-all">
            <p className="text-white/60 mb-1">7-Day Return</p>
            <p className="text-3xl font-bold text-primary">+{totalProfit.week}%</p>
          </div>
          <div className="stat-card bg-dark-lighter p-6 rounded-lg backdrop-blur-sm hover:border-primary hover:border border-transparent transition-all">
            <p className="text-white/60 mb-1">30-Day Return</p>
            <p className="text-3xl font-bold text-primary">+{totalProfit.month}%</p>
          </div>
          <div className="stat-card bg-dark-lighter p-6 rounded-lg backdrop-blur-sm hover:border-primary hover:border border-transparent transition-all">
            <p className="text-white/60 mb-1">Dev Fees (10% of profits)</p>
            <p className="text-3xl font-bold text-white">{devFees.month}%</p>
            <p className="text-xs text-white/40">Total paid: {devFees.total}% of returns</p>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-dark-lighter mb-6">
          <button 
            className={`px-6 py-3 ${activeTab === 'positions' ? 'text-primary border-b-2 border-primary' : 'text-white/60'}`}
            onClick={() => setActiveTab('positions')}
          >
            Open Positions
          </button>
          <button 
            className={`px-6 py-3 ${activeTab === 'performance' ? 'text-primary border-b-2 border-primary' : 'text-white/60'}`}
            onClick={() => setActiveTab('performance')}
          >
            Performance
          </button>
          <button 
            className={`px-6 py-3 ${activeTab === 'bots' ? 'text-primary border-b-2 border-primary' : 'text-white/60'}`}
            onClick={() => setActiveTab('bots')}
          >
            Connected Bots
          </button>
        </div>
        
        {/* Tab content */}
        {activeTab === 'positions' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-dark-lighter">
                  <th className="p-4 rounded-tl-lg">Bot</th>
                  <th className="p-4">Entry Date</th>
                  <th className="p-4">Entry Price</th>
                  <th className="p-4">Current Price</th>
                  <th className="p-4">Size</th>
                  <th className="p-4">Profit</th>
                  <th className="p-4 rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody>
                {positions.map(position => (
                  <tr key={position.id} className="border-b border-dark-lighter hover:bg-dark transition-colors">
                    <td className="p-4">{position.botType}</td>
                    <td className="p-4">{position.entryDate}</td>
                    <td className="p-4">${position.entryPrice.toFixed(2)}</td>
                    <td className="p-4">${position.currentPrice.toFixed(2)}</td>
                    <td className="p-4">{position.size}</td>
                    <td className="p-4">
                      <span className="text-primary">+${position.profit.toFixed(2)}</span>
                      <span className="text-primary ml-2">({position.profitPercentage}%)</span>
                    </td>
                    <td className="p-4">
                      <button className="btn-secondary-sm">Close Position</button>
                    </td>
                  </tr>
                ))}
                {positions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-white/60">
                      No open positions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {activeTab === 'performance' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Performance History</h3>
              <div className="flex gap-2">
                <button 
                  className={`px-3 py-1 rounded-full text-xs ${timeframe === '7d' ? 'bg-primary text-black' : 'bg-dark-lighter text-white/60'}`}
                  onClick={() => setTimeframe('7d')}
                >
                  7 Days
                </button>
                <button 
                  className={`px-3 py-1 rounded-full text-xs ${timeframe === '30d' ? 'bg-primary text-black' : 'bg-dark-lighter text-white/60'}`}
                  onClick={() => setTimeframe('30d')}
                >
                  30 Days
                </button>
                <button 
                  className={`px-3 py-1 rounded-full text-xs ${timeframe === 'all' ? 'bg-primary text-black' : 'bg-dark-lighter text-white/60'}`}
                  onClick={() => setTimeframe('all')}
                >
                  All Time
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-dark-lighter p-6 rounded-lg backdrop-blur-sm" style={{height: '400px'}}>
                <h4 className="text-lg font-bold mb-4">Daily Returns</h4>
                <ResponsiveContainer width="100%" height="90%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis 
                      dataKey="date" 
                      tick={{fill: '#999'}} 
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis 
                      tick={{fill: '#999'}}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip 
                      contentStyle={{backgroundColor: '#1a1a1a', border: 'none'}}
                      formatter={(value: number) => [`${value}%`, 'Daily Return']}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="profit" 
                      name="Daily Return" 
                      stroke="#10b981" 
                      strokeWidth={2} 
                      dot={false}
                      activeDot={{r: 6}}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="bg-dark-lighter p-6 rounded-lg backdrop-blur-sm" style={{height: '400px'}}>
                <h4 className="text-lg font-bold mb-4">Cumulative Return</h4>
                <ResponsiveContainer width="100%" height="90%">
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis 
                      dataKey="date" 
                      tick={{fill: '#999'}} 
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis 
                      tick={{fill: '#999'}}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip 
                      contentStyle={{backgroundColor: '#1a1a1a', border: 'none'}}
                      formatter={(value: number) => [`${value}%`, 'Total Return']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cumulative" 
                      name="Cumulative Return" 
                      stroke="#10b981"
                      fill="url(#colorGradient)"
                      strokeWidth={2}
                    />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-dark-lighter p-6 rounded-lg backdrop-blur-sm hover:border-primary hover:border border-transparent transition-all">
                <h4 className="text-lg font-bold mb-2">Total Trades</h4>
                <p className="text-3xl font-bold text-white">74</p>
              </div>
              <div className="bg-dark-lighter p-6 rounded-lg backdrop-blur-sm hover:border-primary hover:border border-transparent transition-all">
                <h4 className="text-lg font-bold mb-2">Win Rate</h4>
                <p className="text-3xl font-bold text-primary">81.2%</p>
              </div>
              <div className="bg-dark-lighter p-6 rounded-lg backdrop-blur-sm hover:border-primary hover:border border-transparent transition-all">
                <h4 className="text-lg font-bold mb-2">Average Return per Trade</h4>
                <p className="text-3xl font-bold text-primary">+1.85%</p>
              </div>
            </div>
          </>
        )}
        
        {activeTab === 'bots' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {connectedBots.map(bot => (
              <div key={bot.id} className="bg-dark-lighter p-6 rounded-lg backdrop-blur-sm border border-dark hover:border-primary transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-xl font-bold">{bot.name}</h4>
                  <span className={`px-3 py-1 rounded-full text-xs ${bot.status === 'active' ? 'bg-green-500 text-black' : 'bg-yellow-500 text-black'}`}>
                    {bot.status.charAt(0).toUpperCase() + bot.status.slice(1)}
                  </span>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-white/60">Trades (30d):</span>
                    <span>{bot.trades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Today's Return:</span>
                    <span className="text-primary">+{bot.profitToday.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">7-Day Return:</span>
                    <span className="text-primary">+{bot.profitWeek.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">30-Day Return:</span>
                    <span className="text-primary">+{bot.profitMonth.toFixed(2)}%</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    className={`flex-1 py-2 rounded ${bot.status === 'active' ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-green-600 hover:bg-green-500'} transition-colors text-white`}
                    onClick={() => toggleBotStatus(bot.id)}
                  >
                    {bot.status === 'active' ? 'Pause' : 'Resume'}
                  </button>
                  <button className="flex-1 py-2 rounded bg-blue-600 hover:bg-blue-500 transition-colors text-white">
                    Settings
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Dashboard; 