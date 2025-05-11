'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { TrendSurfer } from '../bots/TrendSurfer';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

// Bot-Typen für Typensicherheit
type BotType = 'trend-surfer' | 'volume-tracker' | 'arbitrage-finder';

interface BotControllerProps {
  botId: string;
  onStatusChange?: (status: any) => void;
}

// Market-Adressen für die verschiedenen Bots
const MARKET_ADDRESSES = {
  'trend-surfer': 'Es3LfbbypmexxsSLLE6n1hXfMUhZ7FYxcgGpNHxrHqCY', // SOL/USDC
  'volume-tracker': 'C1EuT9VokAKLiW7i2ASnZUvxDoKuKkCpDDeNxAptuNe4', // Beispiel: BTC/USDC
  'arbitrage-finder': '8BnEgHoWFysVcuFFX7QztDmzuH8r5ZFvyP3sYwn1XTh6', // Beispiel: SOL/USDT
};

// Einen Custom Hook anstelle einer FC erstellen
export function useBotController(botId: string, onStatusChange?: (status: any) => void) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { connected, publicKey } = wallet;

  const [botInstance, setBotInstance] = useState<TrendSurfer | null>(null);
  const [isActivated, setIsActivated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [botStatus, setBotStatus] = useState<any>(null);

  // Bot initialisieren
  useEffect(() => {
    if (connection && botId) {
      try {
        // Market-Adresse für den Bot basierend auf der ID auswählen
        const marketAddress = MARKET_ADDRESSES[botId as BotType] || MARKET_ADDRESSES['trend-surfer'];
        
        const newBotInstance = new TrendSurfer(connection, marketAddress);
        setBotInstance(newBotInstance);
        
        console.log(`Bot für ${botId} initialisiert mit Market ${marketAddress}`);
      } catch (err) {
        console.error('Fehler bei Bot-Initialisierung:', err);
        setError('Fehler bei der Bot-Initialisierung. Bitte versuchen Sie es später erneut.');
      }
    }
  }, [connection, botId]);

  // Wallet mit dem Bot verbinden, wenn sich der Verbindungsstatus ändert
  useEffect(() => {
    if (connected && publicKey && botInstance) {
      try {
        botInstance.setWallet(wallet);
        updateWalletBalance();
      } catch (err) {
        console.error('Fehler beim Verbinden des Wallets:', err);
        setError('Wallet konnte nicht mit dem Bot verbunden werden.');
      }
    }
  }, [connected, publicKey, botInstance, wallet]);

  // Wallet-Balance aktualisieren
  const updateWalletBalance = async () => {
    if (connected && publicKey && connection) {
      try {
        const balance = await connection.getBalance(publicKey);
        setWalletBalance(balance / LAMPORTS_PER_SOL);
      } catch (err) {
        console.error('Fehler beim Abrufen der Wallet-Balance:', err);
      }
    }
  };

  // Status-Updates für den Bot in regelmäßigen Abständen abrufen
  useEffect(() => {
    if (isActivated && botInstance) {
      const statusInterval = setInterval(() => {
        const status = botInstance.getStatus();
        setBotStatus(status);
        
        // Status an übergeordnete Komponente weitergeben
        if (onStatusChange) {
          onStatusChange({
            ...status,
            walletBalance,
            walletAddress: publicKey?.toString(),
          });
        }
        
        updateWalletBalance();
      }, 5000); // Alle 5 Sekunden aktualisieren
      
      return () => clearInterval(statusInterval);
    }
  }, [isActivated, botInstance, walletBalance, publicKey, onStatusChange]);

  // Bot aktivieren
  const activateBot = useCallback(async () => {
    if (!connected || !botInstance) {
      setError('Bitte verbinden Sie zuerst Ihr Wallet.');
      return { success: false, error: 'Wallet nicht verbunden' };
    }

    setIsLoading(true);
    setError(null);

    try {
      // Bot aktivieren und mit Trading beginnen
      await botInstance.activate();
      setIsActivated(true);
      
      // Ersten Status abrufen
      const status = botInstance.getStatus();
      setBotStatus(status);
      
      console.log('Bot erfolgreich aktiviert:', status);
      return { success: true, status };
    } catch (err: any) {
      console.error('Fehler bei Bot-Aktivierung:', err);
      const errorMessage = `Aktivierung fehlgeschlagen: ${err.message || 'Unbekannter Fehler'}`;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [connected, botInstance]);

  // Bot deaktivieren
  const deactivateBot = useCallback(() => {
    if (botInstance) {
      botInstance.deactivate();
      setIsActivated(false);
      console.log('Bot deaktiviert');
      return { success: true };
    }
    return { success: false, error: 'Bot nicht initialisiert' };
  }, [botInstance]);

  // Bot-Konfiguration aktualisieren
  const updateBotConfig = useCallback((config: any) => {
    if (botInstance) {
      const updatedStatus = botInstance.updateConfig(config);
      setBotStatus(updatedStatus);
      return { success: true, status: updatedStatus };
    }
    return { success: false, error: 'Bot nicht initialisiert' };
  }, [botInstance]);

  // Bot-Status abrufen
  const getBotStatus = useCallback(() => {
    if (botInstance) {
      const status = botInstance.getStatus();
      return {
        ...status,
        walletBalance,
        walletAddress: publicKey?.toString(),
        isActivated,
        isLoading,
        error,
      };
    }
    return {
      isActivated: false,
      error: 'Bot nicht initialisiert',
    };
  }, [botInstance, walletBalance, publicKey, isActivated, isLoading, error]);

  // Öffentliche API für andere Komponenten
  return {
    activateBot,
    deactivateBot,
    updateBotConfig,
    getBotStatus,
    isActivated,
    isLoading,
    error,
    walletBalance,
    botStatus,
  };
}

export default useBotController; 