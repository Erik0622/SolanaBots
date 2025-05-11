'use client';

import React from 'react';
import WalletContextProvider from './WalletContextProvider';

interface ClientLayoutProps {
  children: React.ReactNode;
}

const ClientLayout = ({ children }: ClientLayoutProps) => {
  return (
    <WalletContextProvider>
      {children}
    </WalletContextProvider>
  );
};

export default ClientLayout; 