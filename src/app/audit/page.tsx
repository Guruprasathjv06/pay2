'use client';

import React, { useEffect, useState } from 'react';
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  CreditCard,
  Sparkles,
  Truck,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { AuditEvent, EventSource } from '@/types';
import Link from 'next/link';

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [elasticResults, setElasticResults] = useState<any[] | null>(null);
  const [elasticSource, setElasticSource] = useState<string | null>(null);

  const fetchAudit = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (sourceFilter !== 'ALL') params.set('source', sourceFilter);
      if (search.trim()) params.set('query', search.trim());

      const res = await fetch(`/api/audit?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setEvents(data.events || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleKnowledgeSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) {
      setElasticResults(null);
      fetchAudit();
      return;
    }

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(search.trim())}`);
      const data = await res.json();
      if (data.success) {
        setElasticResults(data.results || []);
        setElasticSource(data.source);
      }
    } catch {
      setElasticResults(null);
    }
    fetchAudit();
  };

  useEffect(() => {
    fetchAudit();
  }, [sourceFilter]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Activity & Audit History
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Searchable factual system audit trail. Every event tags its exact verified origin.
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Knowledge Store</span>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            {elasticSource === 'elasticsearch' ? 'Elasticsearch Cluster' : 'Authoritative Database Fallback'}
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Source Origin:
          </span>

          <select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none"
          >
            <option value="ALL">All Event Sources</option>
            <option value="PAYPAL_SANDBOX">PayPal Sandbox [Factual]</option>
            <option value="APP_ACTION">App Action [Factual]</option>
            <option value="AI_GUARDED_AGENT">AI Guarded Agent [Suggestion]</option>
            <option value="DEMO_SIMULATION">Demo Simulation [Simulated]</option>
            <option value="ZAPIER_WEBHOOK">Zapier Webhook [Notification]</option>
          </select>
        </div>

        {/* Search */}
        <form onSubmit={handleKnowledgeSearch} className="flex gap-2 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search audit trail or knowledge store..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Elastic Search Cited Knowledge Results (if searched) */}
      {elasticResults && elasticResults.length > 0 && (
        <div className="bg-blue-50/70 border border-blue-200 p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Elastic Search Knowledge Hits ({elasticResults.length})
            </span>
            <span className="text-[10px] font-mono text-blue-700">
              Source: {elasticSource}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {elasticResults.map((hit, idx) => (
              <div key={idx} className="p-3 bg-white rounded-xl border border-blue-100 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{hit.orderNumber}: {hit.productName}</span>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                    {hit.sourceType}
                  </span>
                </div>
                <p className="text-slate-600 line-clamp-2">{hit.snippet}</p>
                <div className="text-[10px] text-slate-400 pt-1">
                  Buyer: {hit.buyerName} • Score: {hit.score.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Events List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
            System Event Records ({events.length})
          </span>
          <span className="text-[11px] text-slate-400">
            Immutable system logs
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs">Loading audit trail...</div>
          ) : events.length > 0 ? (
            events.map(e => {
              const isAi = e.source === 'AI_GUARDED_AGENT';
              const isPaypal = e.source === 'PAYPAL_SANDBOX';
              const isSim = e.source === 'DEMO_SIMULATION';

              return (
                <div key={e.id} className="p-4 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isPaypal
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : isAi
                          ? 'bg-purple-100 text-purple-800 border border-purple-300'
                          : isSim
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        [{e.source}]
                      </span>

                      <span className="font-semibold text-slate-900">{e.eventType}</span>

                      {/* Explicit distinction: Factual System Event vs AI Suggestion */}
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        isAi
                          ? 'bg-purple-50 text-purple-700 italic'
                          : 'bg-slate-50 text-slate-500'
                      }`}>
                        {isAi ? 'AI Policy Suggestion' : 'Factual System Action'}
                      </span>
                    </div>

                    <p className="text-slate-700 leading-relaxed">{e.description}</p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 flex-shrink-0 text-[11px] text-slate-400 font-mono">
                    <span>{new Date(e.createdAt).toLocaleString()}</span>
                    {e.orderId && (
                      <Link
                        href={`/orders/${e.orderId}`}
                        className="text-blue-600 hover:underline flex items-center gap-1 font-sans font-semibold text-xs"
                      >
                        <span>View Order</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-16 text-center text-slate-400 text-xs">
              No audit events found for selected filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
