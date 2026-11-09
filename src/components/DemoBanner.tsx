'use client';

import React, { useState } from 'react';
import { AlertCircle, RotateCcw, CheckCircle2, ShieldAlert } from 'lucide-react';

interface DemoBannerProps {
  onOpenIntegrations?: () => void;
}

export function DemoBanner({ onOpenIntegrations }: DemoBannerProps) {
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleReset = async () => {
    if (!confirm('Reset all demo data back to initial seed products and sample orders?')) return;
    setResetting(true);
    try {
      const res = await fetch('/api/demo/reset', { method: 'POST' });
      if (res.ok) {
        setResetMessage('Store reset to seeded state.');
        setTimeout(() => {
          setResetMessage(null);
          window.location.reload();
        }, 1000);
      }
    } catch {
      setResetMessage('Reset failed.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="bg-slate-900 text-slate-100 text-xs px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
          <ShieldAlert className="w-3.5 h-3.5" />
          SANDBOX DEMO
        </span>
        <span className="text-slate-300 hidden sm:inline">
          Fictional products, PayPal Sandbox checkout, & simulated fulfillment. Not real currency or real shipments.
        </span>
      </div>

      <div className="flex items-center gap-3">
        {resetMessage && (
          <span className="text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {resetMessage}
          </span>
        )}
        <button
          onClick={handleReset}
          disabled={resetting}
          className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
          title="Reset database to seed demo orders"
        >
          <RotateCcw className={`w-3 h-3 ${resetting ? 'animate-spin' : ''}`} />
          Reset Demo Data
        </button>
        {onOpenIntegrations && (
          <button
            onClick={onOpenIntegrations}
            className="text-blue-400 hover:text-blue-300 font-medium underline underline-offset-2"
          >
            Check Sponsor Tech
          </button>
        )}
      </div>
    </div>
  );
}
