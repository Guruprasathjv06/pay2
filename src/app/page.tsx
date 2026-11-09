'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CreditCard,
  Truck,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Lock,
  Sparkles,
  Layers,
  History,
  Search,
} from 'lucide-react';
import { Order } from '@/types';

export default function LandingPage() {
  const [stats, setStats] = useState({
    totalCapturesCents: 0,
    orderCount: 0,
    driftCount: 0,
  });

  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.orders) {
          const orders: Order[] = data.orders;
          const captured = orders.filter(o => o.paymentState === 'COMPLETED');
          const totalCents = captured.reduce((sum, o) => sum + o.totalCents, 0);
          const drift = orders.filter(o => o.driftStatus === 'DRIFT_DETECTED');
          setStats({
            totalCapturesCents: totalCents,
            orderCount: orders.length,
            driftCount: drift.length,
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-16 py-4">
      {/* Hero Section */}
      <div className="relative text-center max-w-4xl mx-auto space-y-6 pt-4">
        {/* Sandbox badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span>HACKATHON SANDBOX DEMONSTRATION</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
          A clear record of what was <span className="text-blue-600">agreed</span>, what was{' '}
          <span className="text-blue-600">paid</span>, and what happened next.
        </h1>

        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Proofloop protects buyers and small sellers. Before checkout, AI generates an immutable <strong>Promise Card</strong> from the seller’s verified delivery and return policy. After checkout, our <strong>Promise Drift Detector</strong> flags conflicts before they turn into disputes.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/checkout"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-blue-500/25"
          >
            <span>Start Buyer Checkout Demo</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 font-semibold rounded-xl text-sm transition shadow-sm"
          >
            <span>Open Seller Dashboard</span>
          </Link>

          <Link
            href="/analytics"
            className="inline-flex items-center gap-2 px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition"
          >
            <span>AG Grid Analytics</span>
          </Link>
        </div>

        {/* Live Demo Stats */}
        <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto pt-6 text-center">
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xl font-black text-slate-900">
              ${(stats.totalCapturesCents / 100).toFixed(0)}
            </span>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Sandbox Captures</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xl font-black text-slate-900">{stats.orderCount}</span>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Tracked Orders</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xl font-black text-rose-600">{stats.driftCount}</span>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Promise Drifts</p>
          </div>
        </div>
      </div>

      {/* 3-Step Flow: Agree -> Pay -> Track */}
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">How Proofloop Works</h2>
          <p className="text-xs text-slate-500">The 3-stage loop that eliminates post-checkout uncertainty</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition space-y-3 relative overflow-hidden group">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base border border-blue-100">
              1
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Stage One</span>
              <h3 className="font-bold text-slate-900 text-lg">Agree with Promise Card</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              The buyer describes their need (e.g. “Need it before Friday”). Guarded AI generates a concise, immutable <strong>Promise Card</strong> directly from the seller’s published shipping estimates and return policy.
            </p>
            <div className="pt-2 text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              <span>Immutable cryptographic hash</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition space-y-3 relative overflow-hidden group">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-base border border-indigo-100">
              2
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Stage Two</span>
              <h3 className="font-bold text-slate-900 text-lg">Pay with PayPal Sandbox</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              The buyer confirms the agreement to unlock PayPal Standard Checkout. Server-side handlers capture the exact validated order amount and link the verified payment to the immutable card.
            </p>
            <div className="pt-2 text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Server-verified capture only</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition space-y-3 relative overflow-hidden group">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-base border border-rose-100">
              3
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Stage Three</span>
              <h3 className="font-bold text-slate-900 text-lg">Track with Promise Drift</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              When fulfillment updates arrive (delays, carrier mismatches, premature delivery), the <strong>Promise Drift Detector</strong> compares reality against the agreed card and drafts an objective policy-based resolution.
            </p>
            <div className="pt-2 text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Side-by-side agreed vs actual diff</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Showcase Grid */}
      <div className="p-8 bg-slate-900 text-white rounded-3xl space-y-8">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Signature Innovation</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            The Promise Drift Detector in Action
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Most dispute tools start after an angry chargeback. Proofloop monitors the delta between what was promised at checkout and what is happening in the warehouse.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-3">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Scenario: Delivery Date Slipped Past Buyer Need</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              The buyer requested delivery before Friday Nov 7 for an executive presentation. The warehouse reports switchplate re-testing and pushes the ETA to Tuesday Nov 10.
            </p>
            <div className="p-3 bg-slate-950/60 rounded-xl text-xs text-slate-400 space-y-1 font-mono">
              <p className="text-blue-300 font-sans font-semibold">Agreed Promise Card: Nov 7 Delivery</p>
              <p className="text-rose-300 font-sans font-semibold">Fulfillment Update: Nov 10 Delivery (Delay +3 Days)</p>
              <p className="text-slate-400 font-sans pt-1">
                AI Action: Drafts polite notice offering expedited postage refund or immediate courier upgrade under store policy.
              </p>
            </div>
            <Link
              href="/orders/ord_1095"
              className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold pt-1"
            >
              <span>Inspect live example order PLF-1095</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-5 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-3">
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>Strict AI Guardrails & Truth Enforcement</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Proofloop AI acts as a neutral fact synthesizer, never an automated courtroom or payment controller.
            </p>
            <ul className="text-xs text-slate-300 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Does NOT decide disputes or claim legal authority</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Does NOT issue automatic refunds or modify PayPal state</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Does NOT invent delivery dates, stock, or policy terms</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Server confirms PayPal capture before marking paid</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
