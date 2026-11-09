'use client';

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Copy, Check, MessageSquare, ShieldAlert, Sparkles, ArrowRight } from 'lucide-react';
import { DriftAlert } from '@/types';

interface DriftAlertCardProps {
  alert: DriftAlert;
  onResolve?: (alertId: string) => void;
}

export function DriftAlertCard({ alert, onResolve }: DriftAlertCardProps) {
  const [copied, setCopied] = useState(false);
  const [resolving, setResolving] = useState(false);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(alert.suggestedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResolve = async () => {
    if (!onResolve) return;
    setResolving(true);
    await onResolve(alert.id);
    setResolving(false);
  };

  const isResolved = alert.isResolved;

  return (
    <div className={`rounded-2xl border-2 transition overflow-hidden shadow-lg ${
      isResolved
        ? 'border-emerald-300 bg-emerald-50/20'
        : alert.severity === 'CRITICAL'
        ? 'border-rose-400 bg-rose-50/20'
        : 'border-amber-400 bg-amber-50/20'
    }`}>
      {/* Alert Header */}
      <div className={`px-5 py-3.5 flex flex-wrap items-center justify-between gap-2 border-b ${
        isResolved
          ? 'bg-emerald-900 text-emerald-100 border-emerald-800'
          : alert.severity === 'CRITICAL'
          ? 'bg-rose-900 text-rose-100 border-rose-800'
          : 'bg-amber-900 text-amber-100 border-amber-800'
      }`}>
        <div className="flex items-center gap-2">
          {isResolved ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-300 animate-pulse" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm tracking-tight text-white">{alert.title}</h3>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isResolved
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  : 'bg-white/20 text-white border border-white/30'
              }`}>
                {isResolved ? 'Resolved' : `${alert.severity} SEVERITY`}
              </span>
            </div>
            <p className="text-[11px] opacity-80">
              Detected by Promise Drift Detector • {new Date(alert.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {!isResolved && onResolve && (
          <button
            onClick={handleResolve}
            disabled={resolving}
            className="px-3 py-1 rounded-lg text-xs font-semibold bg-white text-slate-900 hover:bg-slate-100 transition shadow-sm"
          >
            {resolving ? 'Resolving...' : 'Mark Resolved'}
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* Objective Mismatch Explanation */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Objective Mismatch Analysis
          </span>
          <p className="text-slate-800 text-sm font-medium leading-relaxed">
            {alert.mismatchExplanation}
          </p>
        </div>

        {/* Side-by-Side Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Agreed Side */}
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2">
            <div className="flex items-center justify-between border-b border-blue-200/80 pb-2">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                1. Agreed Promise Card
              </span>
              <span className="text-[10px] font-mono text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                Immutable
              </span>
            </div>
            <div className="space-y-1 text-xs text-slate-700">
              <p><strong>Item:</strong> {alert.agreedSnapshot.productName}</p>
              <p><strong>Shipping:</strong> {alert.agreedSnapshot.shippingOption}</p>
              <p><strong>Delivery Commitment:</strong> {alert.agreedSnapshot.sellerDeliveryEstimate}</p>
              {alert.agreedSnapshot.buyerRequirement && (
                <p className="text-blue-900 bg-blue-100/50 p-1.5 rounded text-[11px]">
                  <strong>Buyer Requirement:</strong> "{alert.agreedSnapshot.buyerRequirement}"
                </p>
              )}
            </div>
          </div>

          {/* Current Update Side */}
          <div className={`p-4 rounded-xl border space-y-2 ${
            isResolved ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'
          }`}>
            <div className="flex items-center justify-between border-b pb-2 border-rose-200/80">
              <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                2. Current Fulfillment Update
              </span>
              <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded">
                Status: {alert.currentUpdateSnapshot.status}
              </span>
            </div>
            <div className="space-y-1 text-xs text-slate-700">
              <p><strong>Carrier:</strong> {alert.currentUpdateSnapshot.carrier || 'Unassigned'}</p>
              <p><strong>Tracking:</strong> {alert.currentUpdateSnapshot.trackingNumber || 'Pending'}</p>
              {alert.currentUpdateSnapshot.estimatedDelivery && (
                <p className="font-semibold text-rose-900">
                  <strong>Revised ETA:</strong> {new Date(alert.currentUpdateSnapshot.estimatedDelivery).toLocaleDateString()}
                </p>
              )}
              {alert.currentUpdateSnapshot.note && (
                <p className="text-rose-950 bg-rose-100/50 p-1.5 rounded text-[11px]">
                  <strong>Seller/Warehouse Note:</strong> "{alert.currentUpdateSnapshot.note}"
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Suggested AI Message Draft */}
        <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold text-slate-200">
                Suggested Policy-Based Message Draft (For Review)
              </span>
            </div>
            <button
              onClick={handleCopyMessage}
              className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy Draft'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            "{alert.suggestedMessage}"
          </p>

          {/* AI Guardrail Disclaimer */}
          <div className="flex items-start gap-1.5 text-[10px] text-slate-400 pt-1">
            <ShieldAlert className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Guardrail Protection:</strong> Proofloop AI suggests drafts based strictly on published store policy. It does not decide disputes, adjudicate fault, claim legal authority, or issue refunds automatically. Human review is required.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
