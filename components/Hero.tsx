'use client';

import React, { FC } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const Hero: FC = () => {
  const { connected } = useWallet();
  
  return (
    <section className="pt-32 pb-20 px-6">
      <div className="container mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          <span className="text-primary">Automated</span> Trading Bots for Solana
        </h1>
        
        <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto mb-10">
          Boost your trading profits with our high-performance, fully automated trading bots for the Solana blockchain.
        </p>
        
        <div className="flex flex-col items-center justify-center gap-4 md:flex-row">
          {!connected ? (
            <>
              <div className="md:mr-4">
                <WalletMultiButton className="btn-primary text-lg px-8 py-3" />
              </div>
              <a href="#bots" className="btn-secondary text-lg px-8 py-3">
                Discover Bots
              </a>
            </>
          ) : (
            <a href="#bots" className="btn-primary text-lg px-8 py-3">
              Launch My Bots
            </a>
          )}
        </div>
        
        <div className="mt-16 flex flex-wrap justify-center gap-8">
          <div className="stat-card w-60">
            <p className="text-4xl font-bold text-primary">+615%</p>
            <p className="text-white/60">Average Annual Return</p>
          </div>
          <div className="stat-card w-60">
            <p className="text-4xl font-bold text-primary">+37%</p>
            <p className="text-white/60">Last 30 Days Performance</p>
          </div>
          <div className="stat-card w-60">
            <p className="text-4xl font-bold text-primary">1,300+</p>
            <p className="text-white/60">Active Users</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero; 