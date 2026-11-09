'use client';

import React, { useEffect, useState } from 'react';
import { FileCode2, Download, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<any>(null);

  useEffect(() => {
    fetch('/openapi.json')
      .then(res => res.json())
      .then(data => setSpec(data))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCode2 className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              API Documentation & APIMatic Context
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            OpenAPI 3.0 specification for Proofloop endpoints: PromiseCheck, PayPal Sandbox Checkout, and Drift Detection.
          </p>
        </div>

        {/* Downloads */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/openapi.json"
            download="proofloop-openapi.json"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>OpenAPI JSON</span>
          </a>

          <a
            href="/Proofloop.postman_collection.json"
            download="Proofloop.postman_collection.json"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Postman Collection</span>
          </a>
        </div>
      </div>

      {/* APIMatic Technology Note */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-sm text-white">APIMatic API Context & Postman Suite</h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Proofloop's backend routes align strictly with the OpenAPI 3.0 contract below. All endpoints feature Zod input validation, server-side idempotency safeguards, and safe error masking. You can import the exported Postman collection and environment to execute test calls against your local server.
        </p>
      </div>

      {/* Endpoints List */}
      {spec && spec.paths ? (
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Available Endpoints ({Object.keys(spec.paths).length})
          </h2>

          <div className="space-y-3">
            {Object.entries(spec.paths).map(([path, methods]: [string, any]) => {
              return Object.entries(methods).map(([method, details]: [string, any]) => {
                const methodUpper = method.toUpperCase();
                const badgeColor =
                  methodUpper === 'GET'
                    ? 'bg-blue-100 text-blue-800'
                    : methodUpper === 'POST'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800';

                return (
                  <div
                    key={`${method}-${path}`}
                    className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className={`px-2 py-0.5 rounded font-bold ${badgeColor}`}>
                          {methodUpper}
                        </span>
                        <span className="font-bold text-slate-900">{path}</span>
                      </div>
                      <span className="text-xs text-slate-500 font-sans">{details.summary}</span>
                    </div>

                    {details.parameters && (
                      <div className="text-[11px] text-slate-500 pt-1">
                        <strong>Parameters:</strong>{' '}
                        {details.parameters.map((p: any) => p.name).join(', ')}
                      </div>
                    )}
                  </div>
                );
              });
            })}
          </div>
        </div>
      ) : (
        <div className="py-16 text-center text-slate-400 text-xs">Loading OpenAPI schema...</div>
      )}
    </div>
  );
}
