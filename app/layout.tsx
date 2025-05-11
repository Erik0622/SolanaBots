import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Solana Trading Bots | Automated Trading Solutions',
  description: 'Boost your trading profits with our high-performance, fully automated trading bots for the Solana blockchain. Up to 837% yearly returns with sophisticated risk management.',
  keywords: 'solana, trading bot, cryptocurrency, automated trading, defi, blockchain, arbitrage',
  authors: [{ name: 'SolanaBots Team' }],
  openGraph: {
    title: 'Solana Trading Bots | Automated Trading Solutions',
    description: 'High-performance trading bots for Solana with proven track record.',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Solana Trading Bots',
    description: 'Automated trading solutions for Solana',
    images: ['/twitter-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
} 