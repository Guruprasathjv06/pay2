'use client';

import React, { useState } from 'react';
import './globals.css';
import { Navbar } from '../components/Navbar';
import { DemoBanner } from '../components/DemoBanner';
import { IntegrationsModal } from '../components/IntegrationsModal';
import { ShieldCheck, Heart } from 'lucide-react';
import Link from 'next/link';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [integrationsOpen, setIntegrationsOpen] = useState(false);

  return (
    <html lang="en">
      <head>
        <title>Proofloop | Clear Records of What Was Agreed, Paid, and Fulfilled</title>
        <meta
          name="description"
          content="Proofloop helps buyers and small sellers keep a clear record of what was agreed, what was paid, and what happened after checkout."
        />
      </head>
      <body className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
        {/* Top Demo Banner */}
        <DemoBanner onOpenIntegrations={() => setIntegrationsOpen(true)} />

        {/* Global Nav */}
        <Navbar onOpenIntegrations={() => setIntegrationsOpen(true)} />

        {/* Main View */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 mt-auto py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-slate-700">Proofloop</span>
              <span>• Hackathon Demonstration Application</span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => setIntegrationsOpen(true)}
                className="hover:text-blue-600 transition underline underline-offset-2"
              >
                Technology & Integrations Status
              </button>
              <Link href="/api-docs" className="hover:text-blue-600 transition underline underline-offset-2">
                OpenAPI Specification
              </Link>
              <Link href="/audit" className="hover:text-blue-600 transition underline underline-offset-2">
                System Audit Trail
              </Link>
            </div>

            <div>
              <span>PayPal Sandbox Demo • No live funds processed</span>
            </div>
          </div>
        </footer>

        {/* Live Integrations Status Modal */}
        <IntegrationsModal
          isOpen={integrationsOpen}
          onClose={() => setIntegrationsOpen(false)}
        />
      </body>
    </html>
  );
}
