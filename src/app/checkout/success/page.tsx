'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, ShieldCheck, Truck } from 'lucide-react';

export default function CheckoutSuccessPage() {
  return (
    <div className="max-w-lg mx-auto py-16 text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
          PayPal Sandbox Payment Verified
        </span>
        <h1 className="text-2xl font-bold text-slate-900">Payment Captured Successfully</h1>
        <p className="text-xs text-slate-600 leading-relaxed">
          Your payment was confirmed and permanently linked to your buyer-approved Promise Card. The seller’s fulfillment updates are now actively monitored by the Promise Drift Detector.
        </p>
      </div>

      <div className="p-4 bg-white rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5 text-left">
        <div className="flex justify-between font-semibold text-slate-900">
          <span>Sandbox Mode Notice:</span>
          <span className="text-blue-600 font-mono">Verified Demo Capture</span>
        </div>
        <p>No real funds were charged to your account. Your order is now ready for simulated fulfillment tracking.</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link
          href="/dashboard"
          className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2"
        >
          <span>Open Order in Seller Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/checkout"
          className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition"
        >
          <span>Create Another Demo Order</span>
        </Link>
      </div>
    </div>
  );
}
