import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, TransactionInstruction, sendAndConfirmTransaction } from '@solana/web3.js';
import { Market, DexInstructions } from '@project-serum/serum';
import { TokenInstructions } from '@project-serum/serum';
import { WalletContextState } from '@solana/wallet-adapter-react';

// Custom interfaces for the bot
interface Fill {
  eventTimestamp: number;
  size: number;
  price: number;
}

interface Orderbook {
  asks: Array<{price: number; size: number}>;
  bids: Array<{price: number; size: number}>;
}

interface TradeResult {
  signature: string;
  price: number;
  size: number;
  timestamp: number;
  type: 'entry' | 'exit' | 'partial_exit';
  profit: number;
}

interface TokenInfo {
  marketCap: number;
  launchTimestamp: number;
  priceHistory: Array<{time: number; price: number}>;
  volume5Min: number;
}

interface MomentumIndicator {
  consecutiveGreenCandles: number;
  priceChangePercent15Min: number;
  volumeIncreasing: boolean;
  breakingPreviousHigh: boolean;
}

export class TrendSurfer {
  private connection: Connection;
  private wallet: WalletContextState | null = null;
  private marketAddress: PublicKey;
  private isActive: boolean = false;
  private currentPosition: 'long' | 'short' | 'neutral' = 'neutral';
  private entryPrice: number | null = null;
  private entrySize: number | null = null;
  private entryTimestamp: number | null = null;
  private stopLossPercentage: number = 2.5;
  private takeProfitPercentage: number = 5.0;
  private maxPositionSize: number = 0.5; // 50% des verfügbaren Kapitals
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(connection: Connection, marketAddressStr: string) {
    this.connection = connection;
    this.marketAddress = new PublicKey(marketAddressStr);
  }

  // Wallet setzen
  public setWallet(wallet: WalletContextState) {
    this.wallet = wallet;
    console.log('Wallet verbunden:', wallet.publicKey?.toBase58());
  }

  // Balance des Wallets abrufen
  public async getWalletBalance(): Promise<number> {
    if (!this.wallet || !this.wallet.publicKey) {
      throw new Error('Wallet nicht verbunden');
    }
    
    const balance = await this.connection.getBalance(this.wallet.publicKey);
    return balance / LAMPORTS_PER_SOL;
  }

  // Bot aktivieren
  public async activate() {
    if (!this.wallet || !this.wallet.publicKey) {
      throw new Error('Wallet nicht verbunden');
    }

    if (this.isActive) {
      console.log('Bot ist bereits aktiv');
      return;
    }

    this.isActive = true;
    console.log('TrendSurfer Bot aktiviert');
    
    // Marktdaten regelmäßig prüfen
    this.checkInterval = setInterval(async () => {
      try {
        await this.checkMarketAndExecute();
      } catch (error) {
        console.error('Fehler bei Marktprüfung:', error);
      }
    }, 60000); // Alle 60 Sekunden prüfen
    
    // Sofort erste Prüfung durchführen
    await this.checkMarketAndExecute();
  }

  // Bot deaktivieren
  public deactivate() {
    if (!this.isActive) {
      console.log('Bot ist bereits inaktiv');
      return;
    }

    this.isActive = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    console.log('TrendSurfer Bot deaktiviert');
  }

  // Marktdaten prüfen und Handelslogik ausführen
  private async checkMarketAndExecute() {
    try {
      if (!this.isActive || !this.wallet || !this.wallet.publicKey) {
        return;
      }

      // Market-Instanz laden
      const market = await Market.load(
        this.connection,
        this.marketAddress,
        {},
        new PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX') // Serum Program ID
      );

      // Marktdaten abfragen
      const orderbook = await market.loadOrderbook(this.connection);
      const bids = orderbook.bids;
      const asks = orderbook.asks;
      
      if (bids.length === 0 || asks.length === 0) {
        console.log('Unzureichende Orderbuch-Daten');
        return;
      }

      // Aktuelle Preisermittlung (Mittelwert aus bestem Bid und Ask)
      const bestBid = bids[0].price;
      const bestAsk = asks[0].price;
      const currentPrice = (bestBid + bestAsk) / 2;
      
      // Markttrend anhand mehrerer Faktoren ermitteln
      const recentTrades = await market.loadFills(this.connection, 100);
      
      // Trend berechnen basierend auf den letzten Trades
      let bullishCount = 0;
      let bearishCount = 0;
      
      for (const trade of recentTrades) {
        if (trade.side === 'buy') {
          bullishCount++;
        } else {
          bearishCount++;
        }
      }
      
      // Handelsvolumen berechnen
      const totalVolume = recentTrades.reduce((acc, trade) => acc + trade.size, 0);
      
      // Trend bestimmen
      const bullishPercentage = (bullishCount / recentTrades.length) * 100;
      const trend = bullishPercentage > 55 ? 'bullish' : bullishPercentage < 45 ? 'bearish' : 'neutral';
      
      console.log(`Aktuelle Marktanalyse:
        Preis: ${currentPrice}
        Trend: ${trend}
        Bullish: ${bullishPercentage.toFixed(2)}%
        Volumen: ${totalVolume}
      `);
      
      // Trading-Logik
      if (this.currentPosition === 'neutral') {
        // Neue Position eröffnen, wenn ein starker Trend erkannt wird
        if (trend === 'bullish' && bullishPercentage > 60) {
          await this.openLongPosition(market, currentPrice);
        } else if (trend === 'bearish' && bullishPercentage < 40) {
          await this.openShortPosition(market, currentPrice);
        }
      } else if (this.currentPosition === 'long') {
        // Position überprüfen
        if (this.entryPrice) {
          const profitPercentage = ((currentPrice - this.entryPrice) / this.entryPrice) * 100;
          
          // Take Profit oder Stop Loss
          if (profitPercentage >= this.takeProfitPercentage) {
            await this.closePosition(market, currentPrice, 'take profit');
          } else if (profitPercentage <= -this.stopLossPercentage) {
            await this.closePosition(market, currentPrice, 'stop loss');
          } else if (trend === 'bearish' && bullishPercentage < 35) {
            await this.closePosition(market, currentPrice, 'trend reversal');
          }
        }
      } else if (this.currentPosition === 'short') {
        // Position überprüfen
        if (this.entryPrice) {
          const profitPercentage = ((this.entryPrice - currentPrice) / this.entryPrice) * 100;
          
          // Take Profit oder Stop Loss
          if (profitPercentage >= this.takeProfitPercentage) {
            await this.closePosition(market, currentPrice, 'take profit');
          } else if (profitPercentage <= -this.stopLossPercentage) {
            await this.closePosition(market, currentPrice, 'stop loss');
          } else if (trend === 'bullish' && bullishPercentage > 65) {
            await this.closePosition(market, currentPrice, 'trend reversal');
          }
        }
      }
      
    } catch (error) {
      console.error('Fehler bei Marktausführung:', error);
    }
  }
  
  // Long-Position eröffnen
  private async openLongPosition(market: Market, price: number) {
    if (!this.wallet || !this.wallet.publicKey) {
      throw new Error('Wallet nicht verbunden');
    }
    
    try {
      // Wallet-Balance für Position berechnen
      const balance = await this.connection.getBalance(this.wallet.publicKey);
      const balanceInSol = balance / LAMPORTS_PER_SOL;
      const positionSize = balanceInSol * this.maxPositionSize;
      
      // Einfache Simulation der Positionseröffnung
      console.log(`Eröffne LONG-Position: Preis ${price}, Größe ${positionSize} SOL`);
      
      // In einer echten Implementierung würde hier die Order über das Serum DEX platziert werden
      // Dies ist eine vereinfachte Simulation
      this.currentPosition = 'long';
      this.entryPrice = price;
      this.entrySize = positionSize;
      this.entryTimestamp = Date.now();
      
      console.log(`LONG-Position eröffnet: Preis ${price}, Größe ${positionSize} SOL`);
      
      // Websocket-Event senden für UI-Updates
      return {
        success: true,
        position: 'long',
        price,
        size: positionSize,
        timestamp: this.entryTimestamp
      };
    } catch (error) {
      console.error('Fehler beim Eröffnen der LONG-Position:', error);
      throw error;
    }
  }
  
  // Short-Position eröffnen
  private async openShortPosition(market: Market, price: number) {
    if (!this.wallet || !this.wallet.publicKey) {
      throw new Error('Wallet nicht verbunden');
    }
    
    try {
      // Wallet-Balance für Position berechnen
      const balance = await this.connection.getBalance(this.wallet.publicKey);
      const balanceInSol = balance / LAMPORTS_PER_SOL;
      const positionSize = balanceInSol * this.maxPositionSize;
      
      // Einfache Simulation der Positionseröffnung
      console.log(`Eröffne SHORT-Position: Preis ${price}, Größe ${positionSize} SOL`);
      
      // In einer echten Implementierung würde hier die Order über das Serum DEX platziert werden
      // Dies ist eine vereinfachte Simulation
      this.currentPosition = 'short';
      this.entryPrice = price;
      this.entrySize = positionSize;
      this.entryTimestamp = Date.now();
      
      console.log(`SHORT-Position eröffnet: Preis ${price}, Größe ${positionSize} SOL`);
      
      // Websocket-Event senden für UI-Updates
      return {
        success: true,
        position: 'short',
        price,
        size: positionSize,
        timestamp: this.entryTimestamp
      };
    } catch (error) {
      console.error('Fehler beim Eröffnen der SHORT-Position:', error);
      throw error;
    }
  }
  
  // Position schließen
  private async closePosition(market: Market, price: number, reason: string) {
    if (!this.wallet || !this.wallet.publicKey || !this.entryPrice || !this.entrySize) {
      throw new Error('Unvollständige Positionsdaten');
    }
    
    try {
      const profitPercentage = this.currentPosition === 'long'
        ? ((price - this.entryPrice) / this.entryPrice) * 100
        : ((this.entryPrice - price) / this.entryPrice) * 100;
        
      const profit = (this.entrySize * profitPercentage) / 100;
      
      console.log(`Schließe ${this.currentPosition}-Position: Preis ${price}, Grund: ${reason}`);
      console.log(`Gewinn/Verlust: ${profit.toFixed(4)} SOL (${profitPercentage.toFixed(2)}%)`);
      
      // In einer echten Implementierung würde hier die Order über das Serum DEX platziert werden
      // Dies ist eine vereinfachte Simulation
      this.currentPosition = 'neutral';
      this.entryPrice = null;
      this.entrySize = null;
      this.entryTimestamp = null;
      
      console.log(`Position geschlossen: Preis ${price}, Grund: ${reason}`);
      
      // Websocket-Event senden für UI-Updates
      return {
        success: true,
        closedPosition: this.currentPosition,
        closePrice: price,
        profit,
        profitPercentage,
        reason
      };
    } catch (error) {
      console.error('Fehler beim Schließen der Position:', error);
      throw error;
    }
  }
  
  // Status des Bots abfragen
  public getStatus() {
    return {
      isActive: this.isActive,
      currentPosition: this.currentPosition,
      entryPrice: this.entryPrice,
      entrySize: this.entrySize,
      entryTimestamp: this.entryTimestamp,
      stopLossPercentage: this.stopLossPercentage,
      takeProfitPercentage: this.takeProfitPercentage,
      maxPositionSize: this.maxPositionSize,
    };
  }
  
  // Konfiguration aktualisieren
  public updateConfig(config: {
    stopLossPercentage?: number;
    takeProfitPercentage?: number;
    maxPositionSize?: number;
  }) {
    if (config.stopLossPercentage !== undefined) {
      this.stopLossPercentage = config.stopLossPercentage;
    }
    if (config.takeProfitPercentage !== undefined) {
      this.takeProfitPercentage = config.takeProfitPercentage;
    }
    if (config.maxPositionSize !== undefined && config.maxPositionSize > 0 && config.maxPositionSize <= 1) {
      this.maxPositionSize = config.maxPositionSize;
    }
    
    console.log('Bot-Konfiguration aktualisiert:', {
      stopLossPercentage: this.stopLossPercentage,
      takeProfitPercentage: this.takeProfitPercentage,
      maxPositionSize: this.maxPositionSize,
    });
    
    return this.getStatus();
  }
} 