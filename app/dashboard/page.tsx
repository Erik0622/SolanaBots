import React from 'react';
import Navigation from '@/components/Navigation';
import Dashboard from '@/components/Dashboard';
import Footer from '@/components/Footer';

export default function DashboardPage() {
  return (
    <main className="bg-dark text-white min-h-screen">
      <Navigation />
      <div className="pt-20">
        <Dashboard />
      </div>
      <Footer />
    </main>
  );
} 