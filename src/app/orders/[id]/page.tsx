'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Truck,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Lock,
  Send,
  CreditCard,
  History,
} from 'lucide-react';
import { Order, FulfillmentState } from '@/types';
import { PromiseCardView } from '@/components/PromiseCardView';
import { DriftAlertCard } from '@/components/DriftAlertCard';
import { OrderTimelineComponent } from '@/components/OrderTimelineComponent';

function OrderDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(
    searchParams.get('paymentSuccess') ? 'Payment captured and verified on server!' : null
  );

  // Demo Fulfillment Simulator Form
  const [simStatus, setSimStatus] = useState<FulfillmentState>('SHIPPED');
  const [carrier, setCarrier] = useState('USPS Priority Mail');
  const [trackingNumber, setTrackingNumber] = useState('9400111899562549301284');
  const [simNote, setSimNote] = useState('Package received at distribution center.');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [simulatingFulfillment, setSimulatingFulfillment] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (data.success && data.order) {
        setOrder(data.order);
      } else {
        setErrorMessage(data.error || 'Failed to retrieve order');
      }
    } catch {
      setErrorMessage('Network error fetching order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleSimulateFulfillment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulatingFulfillment(true);
    setErrorMessage(null);
    setSuccessNote(null);

    try {
      const res = await fetch(`/api/orders/${orderId}/fulfillment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: simStatus,
          carrier: carrier.trim() || null,
          trackingNumber: trackingNumber.trim() || null,
          note: simNote.trim() || null,
          estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery).toISOString() : null,
          createdBy: 'Warehouse Team (Demo Simulator)',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOrder(data.order);
        if (data.driftResult?.hasDrift) {
          setSuccessNote(`Fulfillment event recorded. Promise Drift Flagged: ${data.driftResult.title}`);
        } else {
          setSuccessNote(`Fulfillment status updated to ${simStatus}. No promise drift detected.`);
        }
      } else {
        setErrorMessage(data.error || 'Failed to record fulfillment update');
      }
    } catch {
      setErrorMessage('Network error while simulating fulfillment.');
    } finally {
      setSimulatingFulfillment(false);
    }
  };

  const handleResolveDrift = async (alertId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/resolve-drift`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId }),
      });
      const data = await res.json();
      if (data.success) {
        setOrder(data.order);
        setSuccessNote('Drift alert resolved and recorded in audit log.');
      }
    } catch {
      setErrorMessage('Failed to resolve drift alert.');
    }
  };

  if (loading) {
    return <div className="py-24 text-center text-slate-500">Loading order records...</div>;
  }

  if (!order) {
    return (
      <div className="py-16 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Order Not Found</h2>
        <p className="text-xs text-slate-500">{errorMessage || 'The specified order record does not exist.'}</p>
        <Link href="/dashboard" className="inline-block mt-2 text-xs font-semibold text-blue-600 underline">
          Return to Seller Dashboard
        </Link>
      </div>
    );
  }

  const isDrift = order.driftStatus === 'DRIFT_DETECTED';

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Breadcrumb & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Order {order.orderNumber}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                isDrift
                  ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                  : order.driftStatus === 'RESOLVED'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}
            >
              {isDrift ? '⚠️ Promise Drift Active' : order.driftStatus === 'RESOLVED' ? 'Drift Resolved' : 'No Drift Detected'}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Placed on {new Date(order.createdAt).toLocaleString()} by {order.buyerName} ({order.buyerEmail})
          </p>
        </div>

        {/* Payment & Fulfillment Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs space-y-0.5 shadow-sm">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Payment</span>
            <span className="font-bold text-slate-900">{order.paymentState}</span>
            {order.payment?.isSimulation && <span className="text-[10px] text-blue-600 block">(Simulated)</span>}
          </div>

          <div className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs space-y-0.5 shadow-sm">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Fulfillment</span>
            <span className="font-bold text-slate-900">{order.fulfillmentState.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      {successNote && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successNote}</span>
        </div>
      )}

      {/* Main Grid: Immutable Promise Card vs Order Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Immutable Promise Card */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              Immutable Agreement Record
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Hash: {order.promiseCard?.hash || 'N/A'}
            </span>
          </div>

          {order.promiseCard ? (
            <PromiseCardView card={order.promiseCard} />
          ) : (
            <div className="p-6 bg-white rounded-2xl border border-dashed text-center text-xs text-slate-400">
              No Promise Card sealed for this draft order.
            </div>
          )}

          {/* Payment Record Box */}
          {order.payment && (
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-slate-500" />
                  Verified Payment Capture Record
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {order.payment.paymentMethod}
                </span>
              </div>
              <div className="space-y-1 text-slate-600 pt-1">
                <p><strong>Capture ID:</strong> <span className="font-mono">{order.payment.paypalCaptureId || 'N/A'}</span></p>
                <p><strong>Captured Amount:</strong> ${(order.payment.amountCents / 100).toFixed(2)} {order.payment.currency}</p>
                <p><strong>Timestamp:</strong> {new Date(order.payment.createdAt).toLocaleString()}</p>
                <p className="text-[11px] text-slate-400 pt-1">
                  Card details are never stored. Payment captured only after server verification.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Demo Fulfillment Simulator & Drift Controls */}
        <div className="lg:col-span-6 space-y-6">
          {/* Active Drift Alerts */}
          {order.driftAlerts && order.driftAlerts.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Promise Drift Alert
                </span>
                <span className="text-[11px] text-slate-500">
                  {order.driftAlerts.filter(a => !a.isResolved).length} active
                </span>
              </div>

              {order.driftAlerts.map(alert => (
                <DriftAlertCard
                  key={alert.id}
                  alert={alert}
                  onResolve={handleResolveDrift}
                />
              ))}
            </div>
          ) : (
            <div className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-bold text-emerald-950">No Promise Drift Detected</p>
                <p className="text-emerald-800 leading-relaxed">
                  All recorded fulfillment milestones strictly conform to the buyer-confirmed Promise Card and published store policy.
                </p>
              </div>
            </div>
          )}

          {/* Demo Fulfillment Controls */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                  Demo Fulfillment Control Console
                </h3>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                Simulation Mode
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Simulate warehouse and carrier milestone updates to test how the <strong>Promise Drift Detector</strong> analyzes conflicts against the agreed Promise Card.
            </p>

            <form onSubmit={handleSimulateFulfillment} className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-slate-600 block mb-1">Fulfillment Event Status</label>
                <select
                  value={simStatus}
                  onChange={e => {
                    const st = e.target.value as FulfillmentState;
                    setSimStatus(st);
                    if (st === 'DELAYED') {
                      setSimNote('Quality inspection switchplate re-testing required. Transit delayed.');
                      const nextWeek = new Date();
                      nextWeek.setDate(nextWeek.getDate() + 4);
                      setEstimatedDelivery(nextWeek.toISOString().split('T')[0]);
                    } else if (st === 'SHIPPED') {
                      setSimNote('Dispatched via carrier. In transit.');
                    } else if (st === 'DELIVERED') {
                      setSimNote('Package delivered to customer.');
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PROCESSING">Processing in Warehouse</option>
                  <option value="SHIPPED">Shipped with Tracking</option>
                  <option value="DELAYED">Report Delay (Triggers Promise Drift)</option>
                  <option value="DELIVERED">Delivered to Buyer</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-600 block mb-1">Carrier Name</label>
                  <input
                    type="text"
                    value={carrier}
                    onChange={e => setCarrier(e.target.value)}
                    placeholder="e.g. USPS Priority, FedEx"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-600 block mb-1">Tracking Number</label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={e => setTrackingNumber(e.target.value)}
                    placeholder="e.g. 940011189956254930"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-600 block mb-1">
                  Revised Estimated Delivery Date (Optional)
                </label>
                <input
                  type="date"
                  value={estimatedDelivery}
                  onChange={e => setEstimatedDelivery(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-medium text-slate-600 block mb-1">Seller / Warehouse Note</label>
                <textarea
                  rows={2}
                  value={simNote}
                  onChange={e => setSimNote(e.target.value)}
                  placeholder="Notes explaining current transit or delay reason..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={simulatingFulfillment}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>{simulatingFulfillment ? 'Evaluating Promise Drift...' : 'Submit Fulfillment Update & Check Drift'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bryntum / Visual Timeline Component */}
      <OrderTimelineComponent order={order} />
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-slate-500">Loading order...</div>}>
      <OrderDetailContent />
    </Suspense>
  );
}
