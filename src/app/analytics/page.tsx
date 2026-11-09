'use client';

import React, { useEffect, useState } from 'react';
import { OrdersAgGrid } from '@/components/OrdersAgGrid';
import { BarChart3, TrendingUp, AlertTriangle, ShieldCheck, CreditCard, Sparkles } from 'lucide-react';
import { Order } from '@/types';

export default function AnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orders')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.orders) {
          setOrders(data.orders);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const capturedOrders = orders.filter(o => o.paymentState === 'COMPLETED');
  const totalCapturesCents = capturedOrders.reduce((sum, o) => sum + o.totalCents, 0);
  const driftOrders = orders.filter(o => o.driftStatus === 'DRIFT_DETECTED');
  const delayedOrders = orders.filter(o => o.fulfillmentState === 'DELAYED');
  const driftRate = orders.length > 0 ? ((driftOrders.length / orders.length) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Transaction Analytics & AG Grid
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise data grid with interactive sorting, multi-column filtering, pagination, and natural-language query engine.
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Grid Engine</span>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            AG Grid Community v32
          </span>
        </div>
      </div>

      {/* Analytics KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Verified Revenue</span>
            <CreditCard className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            ${(totalCapturesCents / 100).toFixed(2)}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium">
            100% server verified sandbox captures
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Promise Drift Rate</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600">{driftRate}%</div>
          <p className="text-[11px] text-slate-500 font-medium">
            {driftOrders.length} of {orders.length} orders experiencing promise drift
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Transit Delays</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">{delayedOrders.length}</div>
          <p className="text-[11px] text-slate-500 font-medium">
            Shipments flagged with rescheduled ETA
          </p>
        </div>
      </div>

      {/* Embedded AG Grid Component */}
      {loading ? (
        <div className="py-24 text-center text-slate-500">Initializing AG Grid...</div>
      ) : (
        <OrdersAgGrid orders={orders} />
      )}

      {/* AG Studio Integration Documentation Note */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-sm text-white">AG Grid / AG Studio Sponsor Technology</h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          This dashboard integrates AG Grid Community with full interactive sorting, multi-column filtering, pagination, custom cell renderers, and an intelligent natural-language query parser (e.g. <em>"Show delayed orders with captured payments"</em>). If an AG Studio enterprise license key is supplied, advanced pivot charting and dashboard widget customizers can be unlocked.
        </p>
      </div>
    </div>
  );
}
