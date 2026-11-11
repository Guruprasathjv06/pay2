'use client';

import React, { useMemo, useState, useRef, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent } from 'ag-grid-community';
import { Order } from '../types';
import { Search, Sparkles, Filter, ExternalLink, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';

interface OrdersAgGridProps {
  orders: Order[];
  onSelectOrder?: (orderId: string) => void;
}

export function OrdersAgGrid({ orders, onSelectOrder }: OrdersAgGridProps) {
  const gridRef = useRef<AgGridReact>(null);
  const [quickFilter, setQuickFilter] = useState('');
  const [nlQuery, setNlQuery] = useState('');
  const [nlAppliedNote, setNlAppliedNote] = useState<string | null>(null);

  // Column definitions with rich status cell renderers
  const columnDefs = useMemo<ColDef[]>(() => [
    {
      field: 'orderNumber',
      headerName: 'Order ID',
      width: 130,
      pinned: 'left',
      cellRenderer: (params: any) => (
        <Link
          href={`/orders/${params.data.id}`}
          className="font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
        >
          {params.value}
          <ExternalLink className="w-3 h-3 opacity-60" />
        </Link>
      ),
    },
    {
      field: 'buyerName',
      headerName: 'Buyer',
      width: 160,
      cellRenderer: (params: any) => (
        <div>
          <div className="font-medium text-slate-900 leading-tight">{params.value}</div>
          <div className="text-[11px] text-slate-400">{params.data.buyerEmail}</div>
        </div>
      ),
    },
    {
      headerName: 'Item & Requirement',
      width: 240,
      valueGetter: (params: any) => params.data.promiseCard?.productName || params.data.product?.name || 'Item',
      cellRenderer: (params: any) => (
        <div className="py-1">
          <div className="font-medium text-slate-800 truncate">{params.value}</div>
          {params.data.buyerRequirement ? (
            <div className="text-[11px] text-blue-600 truncate italic">
              Req: "{params.data.buyerRequirement}"
            </div>
          ) : (
            <div className="text-[11px] text-slate-400">Standard requirement</div>
          )}
        </div>
      ),
    },
    {
      field: 'totalCents',
      headerName: 'Total',
      width: 120,
      valueFormatter: (params: any) => `$${(params.value / 100).toFixed(2)} ${params.data.currency}`,
      cellClass: 'font-semibold text-slate-900',
    },
    {
      field: 'paymentState',
      headerName: 'Payment State',
      width: 150,
      cellRenderer: (params: any) => {
        const val = params.value;
        const isCompleted = val === 'COMPLETED';
        const isSim = params.data.payment?.isSimulation;

        return (
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase ${
              isCompleted
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {isCompleted ? (isSim ? 'Captured (Demo)' : 'Captured (PayPal)') : val}
          </span>
        );
      },
    },
    {
      field: 'fulfillmentState',
      headerName: 'Fulfillment State',
      width: 160,
      cellRenderer: (params: any) => {
        const val = params.value;
        const color =
          val === 'DELIVERED'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : val === 'SHIPPED'
            ? 'bg-blue-50 text-blue-700 border-blue-200'
            : val === 'DELAYED'
            ? 'bg-amber-50 text-amber-800 border-amber-300'
            : 'bg-slate-100 text-slate-700 border-slate-200';

        return (
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase border ${color}`}>
            {val.replace('_', ' ')}
          </span>
        );
      },
    },
    {
      field: 'driftStatus',
      headerName: 'Promise Drift',
      width: 170,
      cellRenderer: (params: any) => {
        const val = params.value;
        const isDrift = val === 'DRIFT_DETECTED';
        const isResolved = val === 'RESOLVED';

        return (
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase ${
              isDrift
                ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                : isResolved
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {isDrift ? '⚠️ Drift Detected' : isResolved ? 'Drift Resolved' : 'No Drift'}
          </span>
        );
      },
    },
    {
      field: 'createdAt',
      headerName: 'Date Placed',
      width: 150,
      valueFormatter: (params: any) => new Date(params.value).toLocaleDateString(),
    },
  ], []);

  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    filter: true,
    resizable: true,
  }), []);

  // Natural Language Query Handler
  const handleNlQuery = (e: React.FormEvent) => {
    e.preventDefault();
    const q = nlQuery.toLowerCase().trim();
    if (!gridRef.current?.api) return;

    if (!q) {
      gridRef.current.api.setFilterModel(null);
      setNlAppliedNote(null);
      return;
    }

    // Parse natural language intents:
    // e.g. "Show delayed orders with captured payments"
    if (q.includes('delayed') && (q.includes('captured') || q.includes('paid') || q.includes('payment'))) {
      gridRef.current.api.setFilterModel({
        fulfillmentState: { type: 'equals', filter: 'DELAYED' },
        paymentState: { type: 'equals', filter: 'COMPLETED' },
      });
      setNlAppliedNote('Applied Filter: Fulfillment State = DELAYED & Payment = COMPLETED');
    } else if (q.includes('drift')) {
      gridRef.current.api.setFilterModel({
        driftStatus: { type: 'equals', filter: 'DRIFT_DETECTED' },
      });
      setNlAppliedNote('Applied Filter: Promise Drift = DRIFT_DETECTED');
    } else if (q.includes('shipped')) {
      gridRef.current.api.setFilterModel({
        fulfillmentState: { type: 'equals', filter: 'SHIPPED' },
      });
      setNlAppliedNote('Applied Filter: Fulfillment State = SHIPPED');
    } else if (q.includes('delivered')) {
      gridRef.current.api.setFilterModel({
        fulfillmentState: { type: 'equals', filter: 'DELIVERED' },
      });
      setNlAppliedNote('Applied Filter: Fulfillment State = DELIVERED');
    } else if (q.includes('pending')) {
      gridRef.current.api.setFilterModel({
        paymentState: { type: 'equals', filter: 'PENDING' },
      });
      setNlAppliedNote('Applied Filter: Payment State = PENDING');
    } else {
      // Fallback: apply to quick filter
      (gridRef.current.api as any).setGridOption('quickFilterText', q);
      setNlAppliedNote(`Text Search: "${q}"`);
    }
  };

  const handleResetFilters = () => {
    setNlQuery('');
    setQuickFilter('');
    setNlAppliedNote(null);
    gridRef.current?.api?.setFilterModel(null);
    if (gridRef.current?.api) {
      (gridRef.current.api as any).setGridOption('quickFilterText', '');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
      {/* Header & Natural Language Query Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-slate-900">Orders Transaction Analytics</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              AG Grid Powered
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Sortable, filterable ledger with instant natural-language querying</p>
        </div>

        {/* Natural Language Query Bar */}
        <form onSubmit={handleNlQuery} className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[280px]">
            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
            <input
              type="text"
              value={nlQuery}
              onChange={e => setNlQuery(e.target.value)}
              placeholder="Ask: 'Show delayed orders with captured payments'..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium transition shadow-sm"
          >
            Query
          </button>
          {(nlAppliedNote || quickFilter) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {nlAppliedNote && (
        <div className="text-xs text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg flex items-center justify-between">
          <span>{nlAppliedNote}</span>
          <button onClick={handleResetFilters} className="font-medium underline ml-2">Reset</button>
        </div>
      )}

      {/* Grid Container */}
      <div className="ag-theme-quartz w-full h-[480px] rounded-xl overflow-hidden border border-slate-200 shadow-inner">
        <AgGridReact
          ref={gridRef}
          rowData={orders}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          pagination={true}
          paginationPageSize={10}
          paginationPageSizeSelector={[10, 25, 50]}
          rowSelection="single"
          animateRows={true}
        />
      </div>
    </div>
  );
}
