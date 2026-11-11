'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  CreditCard,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  ExternalLink,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { Order, PaymentState, FulfillmentState, DriftStatus } from '../../types';

export default function SellerDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [fulfillmentFilter, setFulfillmentFilter] = useState('ALL');
  const [driftFilter, setDriftFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (paymentFilter !== 'ALL') params.set('paymentState', paymentFilter);
      if (fulfillmentFilter !== 'ALL') params.set('fulfillmentState', fulfillmentFilter);
      if (driftFilter !== 'ALL') params.set('driftStatus', driftFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [paymentFilter, fulfillmentFilter, driftFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  // Metrics computation from all orders
  const capturedOrders = orders.filter(o => o.paymentState === 'COMPLETED');
  const totalCapturesCents = capturedOrders.reduce((acc, o) => acc + o.totalCents, 0);
  const pendingOrders = orders.filter(o => o.paymentState === 'PENDING' || o.fulfillmentState === 'PENDING_PROCESSING');
  const fulfilledOrders = orders.filter(o => o.fulfillmentState === 'DELIVERED');
  const driftOrders = orders.filter(o => o.driftStatus === 'DRIFT_DETECTED');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Seller Dashboard
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitor verified sandbox captures, order fulfillment progression, and active Promise Drift alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            title="Refresh order table"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/checkout"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            + Create Demo Order
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Captures */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Sandbox Captures</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            ${(totalCapturesCents / 100).toFixed(2)}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium">
            {capturedOrders.length} verified completed captures
          </p>
        </div>

        {/* Pending Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Orders</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{pendingOrders.length}</div>
          <p className="text-[11px] text-slate-500 font-medium">Awaiting checkout or warehouse pickup</p>
        </div>

        {/* Fulfilled Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Fulfilled Orders</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{fulfilledOrders.length}</div>
          <p className="text-[11px] text-slate-500 font-medium">Completed delivery cycle</p>
        </div>

        {/* Promise Drift Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Promise Drift Alerts</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600">{driftOrders.length}</div>
          <p className="text-[11px] text-rose-600 font-medium">Fulfillment conflicts requiring review</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter by:
          </span>

          <select
            value={paymentFilter}
            onChange={e => setPaymentFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none"
          >
            <option value="ALL">All Payment States</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>

          <select
            value={fulfillmentFilter}
            onChange={e => setFulfillmentFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none"
          >
            <option value="ALL">All Fulfillment</option>
            <option value="PENDING_PROCESSING">Pending Processing</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELAYED">Delayed</option>
            <option value="DELIVERED">Delivered</option>
          </select>

          <select
            value={driftFilter}
            onChange={e => setDriftFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none"
          >
            <option value="ALL">All Drift Status</option>
            <option value="DRIFT_DETECTED">Drift Detected</option>
            <option value="NONE">No Drift</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>

        {/* Text Search */}
        <form onSubmit={handleSearchSubmit} className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search order ID, buyer, item..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Order ID</th>
                <th className="px-5 py-3.5">Buyer</th>
                <th className="px-5 py-3.5">Item & Requirement</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Payment State</th>
                <th className="px-5 py-3.5">Fulfillment State</th>
                <th className="px-5 py-3.5">Drift Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map(order => {
                  const isDrift = order.driftStatus === 'DRIFT_DETECTED';
                  const isResolved = order.driftStatus === 'RESOLVED';

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                      onClick={() => (window.location.href = `/orders/${order.id}`)}
                    >
                      <td className="px-5 py-4 font-bold text-blue-600 flex items-center gap-1.5">
                        <span>{order.orderNumber}</span>
                        <ExternalLink className="w-3 h-3 opacity-40" />
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">{order.buyerName}</div>
                        <div className="text-[11px] text-slate-400">{order.buyerEmail}</div>
                      </td>
                      <td className="px-5 py-4 max-w-xs">
                        <div className="font-medium text-slate-900 truncate">
                          {order.promiseCard?.productName || order.product?.name || 'Item'}
                        </div>
                        {order.buyerRequirement ? (
                          <div className="text-[11px] text-blue-600 truncate italic">
                            Req: "{order.buyerRequirement}"
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400">Standard requirement</div>
                        )}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-900">
                        ${(order.totalCents / 100).toFixed(2)} {order.currency}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${
                            order.paymentState === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {order.paymentState}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${
                            order.fulfillmentState === 'DELIVERED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : order.fulfillmentState === 'DELAYED'
                              ? 'bg-amber-50 text-amber-800 border border-amber-300'
                              : order.fulfillmentState === 'SHIPPED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {order.fulfillmentState.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                            isDrift
                              ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                              : isResolved
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isDrift ? '⚠️ Drift Detected' : isResolved ? 'Resolved' : 'No Drift'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/orders/${order.id}`}
                          onClick={e => e.stopPropagation()}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                    No orders matching selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
