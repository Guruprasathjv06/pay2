'use client';

import React from 'react';
import { ShieldCheck, Clock, RotateCcw, AlertTriangle, Truck, Tag, Lock } from 'lucide-react';
import { PromiseCard } from '@/types';

interface PromiseCardViewProps {
  card: Partial<PromiseCard> & {
    warnings?: string[];
  };
  isDraftPreview?: boolean;
}

export function PromiseCardView({ card, isDraftPreview = false }: PromiseCardViewProps) {
  const warnings = card.warnings || [];

  return (
    <div className="relative rounded-2xl border-2 border-blue-500/30 bg-gradient-to-b from-blue-50/50 via-white to-white shadow-xl overflow-hidden">
      {/* Top Banner */}
      <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white">PROMISE CARD</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                v{card.version || 1}
              </span>
              {card.isImmutable && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Lock className="w-2.5 h-2.5" /> Immutable Lock
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">Pre-checkout agreement record</p>
          </div>
        </div>

        {card.hash && (
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Integrity Seal</span>
            <span className="text-[11px] font-mono font-medium text-blue-300">{card.hash}</span>
          </div>
        )}
      </div>

      {/* Warnings Banner if shipping option cannot satisfy buyer need */}
      {warnings.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-3 text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-amber-950">Promise Conflict Warning Detected:</p>
            {warnings.map((w, idx) => (
              <p key={idx} className="text-amber-800">{w}</p>
            ))}
          </div>
        </div>
      )}

      {/* Card Content Grid */}
      <div className="p-5 space-y-4 text-xs">
        {/* Product & Total */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-200">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              Agreed Item & Quantity
            </span>
            <p className="font-bold text-slate-900 text-sm mt-0.5">{card.productName}</p>
            <p className="text-slate-500 mt-0.5">Quantity: {card.quantity || 1} unit(s)</p>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Authorized Amount
            </span>
            <p className="font-extrabold text-blue-700 text-lg mt-0.5">
              ${card.totalCents ? (card.totalCents / 100).toFixed(2) : '0.00'} <span className="text-xs font-normal text-slate-500">{card.currency || 'USD'}</span>
            </p>
            <p className="text-[11px] text-slate-500">Includes items, shipping & taxes</p>
          </div>
        </div>

        {/* Shipping & Delivery Commitment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-200">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-slate-400" />
              Agreed Shipping Method
            </span>
            <p className="font-semibold text-slate-800 text-sm mt-0.5">{card.shippingOptionName}</p>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Seller Delivery Estimate
            </span>
            <p className="font-semibold text-slate-800 text-sm mt-0.5">{card.sellerDeliveryEstimate}</p>
          </div>
        </div>

        {/* Buyer Stated Need */}
        {card.buyerRequirement && (
          <div className="pb-4 border-b border-slate-200 bg-blue-50/40 p-3 rounded-xl border border-blue-100">
            <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
              Buyer Stated Delivery Requirement:
            </span>
            <p className="text-slate-800 font-medium mt-1 italic">
              "{card.buyerRequirement}"
            </p>
          </div>
        )}

        {/* Return Policy Summary */}
        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            Seller Published Return Policy Summary
          </span>
          <p className="text-slate-700 mt-1 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            {card.returnPolicySummary}
          </p>
        </div>

        {/* Demo Notice */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 gap-1">
          <span>{card.demoNotice || 'Proofloop Sandbox Demo Order - No real funds or real-world shipment.'}</span>
          {card.agreedAt && (
            <span>Agreed: {new Date(card.agreedAt).toLocaleString()}</span>
          )}
        </div>
      </div>
    </div>
  );
}
