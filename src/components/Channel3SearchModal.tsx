'use client';

import React, { useState } from 'react';
import { X, Search, Sparkles, ArrowRight, ExternalLink, ShieldCheck } from 'lucide-react';
import { Channel3ProductResult } from '../types';

interface Channel3SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: any) => void;
}

export function Channel3SearchModal({ isOpen, onClose, onSelectProduct }: Channel3SearchModalProps) {
  const [query, setQuery] = useState('noise cancelling headphones for travel');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Channel3ProductResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [source, setSource] = useState<string>('');

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch('/api/channel3/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.results || []);
        setSource(data.source);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChoose = (item: Channel3ProductResult) => {
    // Transform into standard product format for checkout
    const importedProduct = {
      id: `c3_${Date.now()}`,
      sku: `C3-${item.merchant.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`,
      name: item.title,
      description: item.description,
      priceCents: item.priceCents,
      currency: item.currency,
      imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80',
      stockCount: 20,
      category: item.category,
      returnPolicy: item.returnPolicy,
      deliveryEstimateDays: item.deliveryEstimateDays,
      shippingOptions: item.shippingOptions,
      isDemo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isExternalDiscovery: true,
      merchant: item.merchant,
    };

    onSelectProduct(importedProduct);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-200" />
            <div>
              <h3 className="font-semibold text-base">Channel3 Product Discovery</h3>
              <p className="text-xs text-blue-100">Find external items with natural language and create a Proofloop Promise Card</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-5 border-b border-slate-200 bg-slate-50">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Describe what you want to buy (e.g. noise cancelling headphones, fast charger)..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition shadow-sm flex items-center gap-1.5"
            >
              {loading ? 'Searching...' : 'Discover'}
            </button>
          </form>

          {source && (
            <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
              <span className="font-medium text-slate-700">Source:</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono">
                {source === 'channel3_api' ? 'Live Channel3 API' : 'Channel3 Curated Discovery (Demo)'}
              </span>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {loading ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Sparkles className="w-6 h-6 text-blue-500 animate-spin mx-auto" />
              <p className="text-sm">Querying Channel3 product discovery index...</p>
            </div>
          ) : results.length > 0 ? (
            results.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/20 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {item.merchant}
                    </span>
                    <span className="text-xs text-slate-500">• {item.category}</span>
                  </div>
                  <h4 className="font-semibold text-slate-900 text-sm leading-snug">{item.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2">{item.description}</p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                    <span>Est. Delivery: <strong className="text-slate-700">{item.deliveryEstimateDays}</strong></span>
                    <span>Policy: <strong className="text-slate-700">{item.returnPolicy.substring(0, 35)}...</strong></span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 flex-shrink-0">
                  <div className="text-lg font-bold text-slate-900">
                    ${(item.priceCents / 100).toFixed(2)} <span className="text-xs font-normal text-slate-500">{item.currency}</span>
                  </div>
                  <button
                    onClick={() => handleChoose(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition shadow-sm"
                  >
                    <span>Import to Checkout</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : searched ? (
            <div className="py-12 text-center text-slate-500">
              No products found for "{query}". Try a broader query like "bag", "charger", or "stand".
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500">
              Enter a search description above to discover real merchant offerings via Channel3.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
