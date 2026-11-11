'use client';

import React, { useEffect, useState } from 'react';
import { OrderTimelineComponent } from '../../components/OrderTimelineComponent';
import { Clock, Layers, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { Order } from '@/types';

export default function TimelinePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('ord_1095');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.orders.length > 0) {
          setOrders(d.orders);
          // Default to order with drift if exists
          const withDrift = d.orders.find((o: Order) => o.driftStatus === 'DRIFT_DETECTED');
          if (withDrift) {
            setSelectedOrderId(withDrift.id);
          } else {
            setSelectedOrderId(d.orders[0].id);
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Order Milestone Timeline
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visual progression of buyer promises, PayPal capture verifications, carrier milestones, and drift alerts over time.
          </p>
        </div>

        {/* Order Selector */}
        {orders.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-600">Select Order:</span>
            <select
              value={selectedOrderId}
              onChange={e => setSelectedOrderId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {orders.map(o => (
                <option key={o.id} value={o.id}>
                  {o.orderNumber} - {o.buyerName} ({o.driftStatus === 'DRIFT_DETECTED' ? '⚠️ Drift' : o.fulfillmentState})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-24 text-center text-slate-500">Loading timeline data...</div>
      ) : selectedOrder ? (
        <div className="space-y-6">
          <OrderTimelineComponent order={selectedOrder} />

          {/* Bryntum Technology Note */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-sm text-white">Bryntum Order Timeline Integration</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This interactive timeline component maps the life cycle of Proofloop commitments: from cryptographic Promise Card agreement to PayPal Sandbox capture, fulfillment events, and Promise Drift detection. It is designed to pair seamlessly with the Bryntum Scheduler / Timeline suite via trial license or npm registry authentication.
            </p>
          </div>
        </div>
      ) : (
        <div className="py-16 text-center text-slate-500 text-xs">No orders available.</div>
      )}
    </div>
  );
}
