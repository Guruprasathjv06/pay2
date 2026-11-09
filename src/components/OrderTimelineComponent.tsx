'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Truck,
  CreditCard,
  AlertTriangle,
  FileText,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Order } from '@/types';

interface OrderTimelineComponentProps {
  order: Order;
}

export function OrderTimelineComponent({ order }: OrderTimelineComponentProps) {
  const [filterType, setFilterType] = useState<'ALL' | 'PAYMENT' | 'FULFILLMENT' | 'DRIFT'>('ALL');

  // Build unified chronological milestones
  const events: Array<{
    id: string;
    title: string;
    category: 'PROMISE' | 'PAYMENT' | 'FULFILLMENT' | 'DRIFT';
    timestamp: string;
    description: string;
    status: string;
    icon: any;
    color: string;
  }> = [];

  // 1. Order Creation
  events.push({
    id: 'evt_created',
    title: 'Order Created',
    category: 'PROMISE',
    timestamp: order.createdAt,
    description: `Draft order ${order.orderNumber} initiated by buyer ${order.buyerName}.`,
    status: 'COMPLETED',
    icon: FileText,
    color: 'blue',
  });

  // 2. Promise Card Agreed
  if (order.promiseCard) {
    events.push({
      id: 'evt_promise',
      title: 'Promise Card Confirmed (Immutable)',
      category: 'PROMISE',
      timestamp: order.promiseCard.agreedAt || order.promiseCard.createdAt,
      description: `Buyer confirmed Promise Card v${order.promiseCard.version} (Hash: ${order.promiseCard.hash}). Delivery agreed: ${order.promiseCard.sellerDeliveryEstimate}.`,
      status: 'LOCKED',
      icon: CheckCircle2,
      color: 'emerald',
    });
  }

  // 3. Payment
  if (order.payment) {
    events.push({
      id: 'evt_pay',
      title: order.payment.isSimulation ? 'Simulated Sandbox Payment Completed' : 'PayPal Sandbox Payment Captured',
      category: 'PAYMENT',
      timestamp: order.payment.createdAt,
      description: order.payment.isSimulation
        ? `Simulated sandbox capture for $${(order.payment.amountCents / 100).toFixed(2)} ${order.payment.currency}. (Capture ID: ${order.payment.paypalCaptureId})`
        : `PayPal verified capture for $${(order.payment.amountCents / 100).toFixed(2)} ${order.payment.currency} (Capture ID: ${order.payment.paypalCaptureId}).`,
      status: order.payment.status,
      icon: CreditCard,
      color: 'indigo',
    });
  }

  // 4. Fulfillment events
  if (order.fulfillmentEvents) {
    for (const fe of order.fulfillmentEvents) {
      events.push({
        id: fe.id,
        title: `Fulfillment: ${fe.status}`,
        category: 'FULFILLMENT',
        timestamp: fe.createdAt,
        description: `${fe.note || 'Status update'}${fe.carrier ? ` • Carrier: ${fe.carrier}` : ''}${fe.trackingNumber ? ` (Tracking: ${fe.trackingNumber})` : ''}`,
        status: fe.status,
        icon: fe.status === 'DELIVERED' ? CheckCircle2 : fe.status === 'SHIPPED' ? Truck : Clock,
        color: fe.status === 'DELAYED' ? 'amber' : 'slate',
      });
    }
  }

  // 5. Drift alerts
  if (order.driftAlerts) {
    for (const da of order.driftAlerts) {
      events.push({
        id: da.id,
        title: `Drift Detected: ${da.title}`,
        category: 'DRIFT',
        timestamp: da.createdAt,
        description: `${da.mismatchExplanation} (Severity: ${da.severity})`,
        status: da.isResolved ? 'RESOLVED' : 'ACTIVE_DRIFT',
        icon: AlertTriangle,
        color: da.isResolved ? 'emerald' : 'rose',
      });
    }
  }

  // Sort chronological
  events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const filteredEvents = events.filter(e => {
    if (filterType === 'ALL') return true;
    return e.category === filterType;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Top Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-base text-slate-900">Order Milestone Timeline</h3>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              Bryntum Timeline View
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Chronological record of promise, payment capture, and fulfillment progression</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
          {(['ALL', 'PAYMENT', 'FULFILLMENT', 'DRIFT'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilterType(tab)}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                filterType === tab
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'ALL' ? 'All Milestones' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Timeline Track */}
      <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {filteredEvents.map((evt, idx) => {
          const Icon = evt.icon;

          const badgeColor =
            evt.category === 'DRIFT'
              ? evt.status === 'RESOLVED'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-rose-100 text-rose-800 border-rose-300'
              : evt.category === 'PAYMENT'
              ? 'bg-blue-100 text-blue-800 border-blue-300'
              : evt.category === 'PROMISE'
              ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
              : 'bg-slate-100 text-slate-800 border-slate-300';

          return (
            <div key={evt.id} className="relative group">
              {/* Timeline Node Point */}
              <div
                className={`absolute -left-[30px] sm:-left-[38px] top-0.5 w-6 h-6 rounded-full border-2 bg-white flex items-center justify-center shadow-sm transition ${
                  evt.category === 'DRIFT'
                    ? 'border-rose-500 text-rose-600'
                    : evt.category === 'PAYMENT'
                    ? 'border-blue-600 text-blue-600'
                    : evt.category === 'PROMISE'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-slate-500 text-slate-600'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>

              {/* Event Content Box */}
              <div className="bg-slate-50/70 hover:bg-slate-50 transition border border-slate-200/80 rounded-xl p-4 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900">{evt.title}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeColor}`}>
                      {evt.category} • {evt.status}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-500">
                    {new Date(evt.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{evt.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {filteredEvents.length === 0 && (
        <div className="py-8 text-center text-xs text-slate-500">
          No events found for category "{filterType}".
        </div>
      )}
    </div>
  );
}
