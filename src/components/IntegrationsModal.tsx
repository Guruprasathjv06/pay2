'use client';

import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertTriangle, Shield, RefreshCw, ExternalLink } from 'lucide-react';

interface IntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IntegrationsModal({ isOpen, onClose }: IntegrationsModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/integrations/status');
      const json = await res.json();
      if (json.success) {
        setData(json.integrations);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="font-semibold text-base text-white">Technology & Sponsor Integrations</h2>
              <p className="text-xs text-slate-400">Live operational status and configuration checks</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Refresh status"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
            Proofloop adheres strictly to honesty guidelines: integrations only show a green “connected” state when active configuration is verified. All sponsor features feature robust, functional local fallbacks.
          </p>

          {loading && !data ? (
            <div className="py-12 text-center text-slate-500">Checking integration endpoints...</div>
          ) : data ? (
            <div className="space-y-3">
              {Object.entries(data).map(([key, item]: [string, any]) => {
                const isConnected = item.status === 'CONNECTED' || item.status === 'POSTGRES_CONNECTED';
                const isFallback = item.status.includes('FALLBACK') || item.status.includes('LOCAL');

                return (
                  <div
                    key={key}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-slate-900">{item.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${
                            isConnected
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isFallback
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {isConnected ? 'Active / Connected' : item.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{item.details}</p>
                      {item.clientIdMasked && (
                        <p className="text-[11px] text-slate-500 font-mono">App Client ID: {item.clientIdMasked}</p>
                      )}
                    </div>
                    {isConnected ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-sm text-rose-600">Failed to load integration states.</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>Inspect or edit environment variables in <code className="bg-slate-200 px-1 py-0.5 rounded">.env</code></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
