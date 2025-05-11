'use client';

import { FC, ReactNode } from 'react';
import dynamic from 'next/dynamic';

// Importiere den Wallet-Provider dynamisch ohne SSR
const WalletComponent = dynamic(
  () => import('./ClientWalletProvider'),
  { 
    ssr: false,
    loading: () => <div>Lade Wallet...</div>
  }
);

interface WalletContextProviderProps {
  children: ReactNode;
}

const WalletContextProvider: FC<WalletContextProviderProps> = ({ children }) => {
  return <WalletComponent>{children}</WalletComponent>;
};

export default WalletContextProvider; 