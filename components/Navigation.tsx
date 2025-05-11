'use client';

import React, { FC, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';

const Navigation: FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { connected } = useWallet();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 transition-all duration-300 ${isScrolled ? 'bg-dark shadow-lg' : 'bg-transparent'}`}>
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-primary">
          SolanaBots
        </Link>
        
        <div className="flex items-center space-x-8">
          <Link href="#bots" className="text-white/80 hover:text-primary transition-colors">
            Bots
          </Link>
          {connected && (
            <Link href="/dashboard" className="text-white/80 hover:text-primary transition-colors">
              Dashboard
            </Link>
          )}
          <a href="#features" className="text-white/80 hover:text-primary transition-colors">
            Features
          </a>
          <a href="#faq" className="text-white/80 hover:text-primary transition-colors">
            FAQ
          </a>
          <WalletMultiButton />
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 