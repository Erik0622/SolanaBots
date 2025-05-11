'use client';

import React, { FC, useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useRouter } from 'next/navigation';
import { useBotController } from './BotController';

interface BotDetailProps {
  id: string;
}

const BotDetail: FC<BotDetailProps> = ({ id }) => {
  const router = useRouter();
  const wallet = useWallet();
  const { connected, publicKey } = wallet;
  
  // Bot-Controller verwenden
  const {
    activateBot,
    deactivateBot,
    updateBotConfig,
    isActivated,
    isLoading,
    error,
    walletBalance,
    botStatus
  } = useBotController(id);

  // Bot-Daten basierend auf der ID abrufen
  const bot = getBotData(id);

  // Beispieldaten für die Performance-Grafik
  const performanceData = [
    { date: '01.04', value: 100 },
    { date: '05.04', value: 105 },
    { date: '10.04', value: 102 },
    { date: '15.04', value: 108 },
    { date: '20.04', value: 112 },
    { date: '25.04', value: 115 },
    { date: '30.04', value: 118 },
    { date: '05.05', value: 124 },
    { date: '10.05', value: 127 },
  ];

  // Bot aktivieren
  const handleActivateBot = useCallback(async () => {
    if (!connected) {
      return;
    }

    const result = await activateBot();
    if (result.success) {
      console.log('Bot erfolgreich aktiviert');
    }
  }, [connected, activateBot]);

  // Bot deaktivieren
  const handleDeactivateBot = useCallback(() => {
    deactivateBot();
  }, [deactivateBot]);

  // Bot-Position schließen
  const handleClosePosition = useCallback(() => {
    // Würde in einer realen Anwendung die Position schließen
    if (botStatus && botStatus.currentPosition !== 'neutral') {
      // In einer echten Implementierung würde hier direkt die Position geschlossen werden
      console.log('Position wird geschlossen...');
    }
  }, [botStatus]);

  return (
    <div className="container mx-auto px-4 py-8">
      <button 
        className="text-primary hover:underline mb-4 flex items-center" 
        onClick={() => router.push('/dashboard')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Zurück zum Dashboard
      </button>

      <div className="bg-dark-lighter rounded-xl p-6 shadow-lg mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">{bot.name}</h1>
            <p className="text-white/60">{bot.description}</p>
          </div>
          <div className="mt-4 md:mt-0">
            {!connected ? (
              <WalletMultiButton className="btn-primary" />
            ) : isActivated ? (
              <button 
                className="btn-secondary"
                onClick={handleDeactivateBot}
              >
                Bot deaktivieren
              </button>
            ) : (
              <button 
                className="btn-primary"
                onClick={handleActivateBot}
                disabled={isLoading}
              >
                {isLoading ? 'Aktiviere...' : 'Bot aktivieren'}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500 text-white rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        {connected && walletBalance !== null && (
          <div className="bg-dark rounded-lg p-4 mb-6">
            <h3 className="text-lg font-bold mb-2">Wallet-Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-white/60 mb-1">Adresse:</p>
                <p className="font-mono text-sm">{publicKey?.toString()}</p>
              </div>
              <div>
                <p className="text-white/60 mb-1">Balance:</p>
                <p className="text-xl font-bold">{walletBalance.toFixed(4)} SOL</p>
              </div>
            </div>
          </div>
        )}

        {isActivated && botStatus && (
          <div className="bg-dark rounded-lg p-4 mb-6">
            <h3 className="text-lg font-bold mb-2">Bot-Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-white/60 mb-1">Status:</p>
                <p className="font-bold text-green-500">Aktiv</p>
              </div>
              <div>
                <p className="text-white/60 mb-1">Aktuelle Position:</p>
                <p className="font-bold">
                  {botStatus.currentPosition === 'long' ? '🔼 Long' : 
                   botStatus.currentPosition === 'short' ? '🔽 Short' : 
                   '⚪ Neutral'}
                </p>
              </div>
              {botStatus.currentPosition !== 'neutral' && (
                <>
                  <div>
                    <p className="text-white/60 mb-1">Einstiegspreis:</p>
                    <p className="font-bold">${botStatus.entryPrice?.toFixed(2) || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-white/60 mb-1">Positionsgröße:</p>
                    <p className="font-bold">{botStatus.entrySize?.toFixed(4) || 'N/A'} SOL</p>
                  </div>
                  <div>
                    <button 
                      className="btn-secondary-sm"
                      onClick={handleClosePosition}
                    >
                      Position schließen
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Performance</h3>
            <div className="bg-dark p-6 rounded-lg" style={{height: "300px"}}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={performanceData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="date" stroke="#999" />
                  <YAxis stroke="#999" />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#1a1a1a', borderColor: '#333'}}
                    formatter={(value: number) => [`${value.toFixed(2)}%`, 'Wert']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4">Einstellungen</h3>
            <div className="bg-dark p-6 rounded-lg">
              <div className="space-y-4">
                <div>
                  <label className="block text-white/60 mb-2">
                    Stop Loss (%)
                  </label>
                  <input 
                    type="number" 
                    className="w-full bg-dark-lighter rounded-lg p-2 border border-dark-lighter focus:border-primary transition"
                    value={botStatus?.stopLossPercentage || 2.5}
                    disabled={!isActivated}
                    onChange={(e) => {
                      updateBotConfig({ 
                        stopLossPercentage: parseFloat(e.target.value) 
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-white/60 mb-2">
                    Take Profit (%)
                  </label>
                  <input 
                    type="number" 
                    className="w-full bg-dark-lighter rounded-lg p-2 border border-dark-lighter focus:border-primary transition"
                    value={botStatus?.takeProfitPercentage || 5.0}
                    disabled={!isActivated}
                    onChange={(e) => {
                      updateBotConfig({ 
                        takeProfitPercentage: parseFloat(e.target.value) 
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-white/60 mb-2">
                    Max. Positionsgröße (% der Wallet)
                  </label>
                  <input 
                    type="number" 
                    className="w-full bg-dark-lighter rounded-lg p-2 border border-dark-lighter focus:border-primary transition"
                    value={(botStatus?.maxPositionSize || 0.5) * 100}
                    disabled={!isActivated}
                    min="1"
                    max="100"
                    onChange={(e) => {
                      updateBotConfig({ 
                        maxPositionSize: parseFloat(e.target.value) / 100 
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-dark p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-4">Strategie & Details</h3>
          <div className="prose prose-sm prose-invert max-w-none">
            <p>{bot.longDescription}</p>
            <h4>Funktionsweise</h4>
            <ul>
              {bot.features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
            <h4>Risikomanagement</h4>
            <p>{bot.riskManagement}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hilfsfunktion, um Bot-Daten zu erhalten (in einer realen Anwendung würde dies von einer API kommen)
function getBotData(id: string) {
  const bots = [
    {
      id: 'trend-surfer',
      name: 'Trend Surfer',
      description: 'Erkennt und folgt Markttrends mit automatischen Gewinnmitnahmen',
      longDescription: 'Der Trend Surfer Bot nutzt fortschrittliche technische Analysen, um Markttrends zu identifizieren und profitabel zu handeln. Er nutzt mehrere Indikatoren zur Bestätigung von Trendrichtungen und setzt auf Positionsgrößenmanagement zur Risikobegrenzung.',
      features: [
        'Erkennung von Trendwechseln mit mehrfacher Indikatorbestätigung',
        'Automatische Anpassung an Marktvolatilität',
        'Implementierung von Take-Profit und Stop-Loss für jede Position',
        'Teilweise Gewinnmitnahme bei Erreichen bestimmter Kursziele'
      ],
      riskManagement: 'Jede Position wird mit einem konfigurierbaren Stop-Loss abgesichert. Das Maximum-Drawdown-Limit verhindert übermäßige Verluste an volatilen Tagen. Die Positionsgröße wird dynamisch basierend auf der historischen Volatilität angepasst.',
      apy: 36.5
    },
    {
      id: 'volume-tracker',
      name: 'Volume Tracker',
      description: 'Verfolgt Volumenänderungen und handelt basierend auf 5-Minuten-Fenstern',
      longDescription: 'Der Volume Tracker Bot identifiziert ungewöhnliche Handelsmuster, die oft großen Preisbewegungen vorausgehen. Durch das Erkennen von plötzlichen Volumenanstiegen kann der Bot frühzeitig in vielversprechende Bewegungen einsteigen.',
      features: [
        'Echtzeitanalyse von Handelsvolumen über mehrere Zeitfenster',
        'Erkennung von Volumenspitzen und plötzlichen Anstiegen',
        'Korrelation zwischen Preis- und Volumenbewegungen',
        'Automatische Anpassung der Einstiegspunkte je nach Marktbedingungen'
      ],
      riskManagement: 'Dieses System arbeitet mit engeren Stop-Losses, da es auf kurzfristige Bewegungen setzt. Zur Risikobegrenzung wird ein Trailing-Stop verwendet, um Gewinne zu sichern, sobald der Markt in die vorhergesagte Richtung läuft.',
      apy: 29.8
    },
    {
      id: 'arbitrage-finder',
      name: 'Arbitrage Finder',
      description: 'Nutzt Preisunterschiede zwischen verschiedenen DEXes auf Solana',
      longDescription: 'Der Arbitrage Finder Bot identifiziert und nutzt Preisunterschiede für das gleiche Asset zwischen verschiedenen dezentralen Börsen im Solana-Ökosystem. Durch den Kauf des Assets an der günstigeren Börse und den sofortigen Verkauf an der teureren Börse werden risikoarme Gewinne ermöglicht.',
      features: [
        'Gleichzeitige Überwachung mehrerer DEXes (Serum, Raydium, Orca, etc.)',
        'Berechnung von Transaktionskosten zur Sicherstellung profitabler Trades',
        'Blitzschnelle Ausführung für maximale Erfolgsquote',
        'MEV-Schutz durch optimierte Transaktionsrouting'
      ],
      riskManagement: 'Arbitrage-Strategien sind von Natur aus risikoärmer, da sie Marktineffizienzen nutzen, statt auf Kursbewegungen zu spekulieren. Das Hauptrisiko besteht in der Slippage und verzögerten Ausführung, wobei dieses System nur Trades ausführt, die auch nach Berücksichtigung aller Gebühren profitabel sind.',
      apy: 18.2
    }
  ];

  return bots.find(bot => bot.id === id) || bots[0];
}

export default BotDetail;