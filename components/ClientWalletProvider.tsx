'use client';

import React, { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl, Connection } from '@solana/web3.js';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';

// Importiere den Standard-Style für die Wallet-Adapter-UI-Komponenten
import '@solana/wallet-adapter-react-ui/styles.css';

interface ClientWalletProviderProps {
  children: ReactNode;
}

const ClientWalletProvider: FC<ClientWalletProviderProps> = ({ children }) => {
  // Für Produktionsumgebung sollten Sie einen RPC-Dienst wie QuickNode, Helius oder Alchemy verwenden
  const network = WalletAdapterNetwork.Mainnet;
  
  // Verwenden Sie einen zuverlässigen RPC-Endpunkt
  const endpoint = useMemo(() => {
    // Für Produktionsanwendungen sollten Sie einen eigenen RPC-Endpunkt verwenden
    // z.B. von QuickNode, Helius oder Alchemy
    const defaultEndpoint = clusterApiUrl(network);
    
    // Die Verbindungsoptionen helfen bei der Stabilität
    const connection = new Connection(defaultEndpoint, {
      commitment: 'confirmed',
      disableRetryOnRateLimit: false,
      confirmTransactionInitialTimeout: 60000,
    });
    
    return defaultEndpoint;
  }, [network]);

  // Nur die bekannten verfügbaren Wallets verwenden
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default ClientWalletProvider; 