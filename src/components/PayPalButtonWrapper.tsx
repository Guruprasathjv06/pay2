'use client';

import React, { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { ShieldCheck, AlertCircle, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PayPalButtonWrapperProps {
  orderId: string;
  orderNumber: string;
  amountFormatted: string;
  currency: string;
  onSuccess: (payment: any) => void;
  paypalClientId?: string;
}

export function PayPalButtonWrapper({
  orderId,
  orderNumber,
  amountFormatted,
  currency,
  onSuccess,
  paypalClientId,
}: PayPalButtonWrapperProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [activeClientId, setActiveClientId] = useState<string | null>(paypalClientId || null);

  React.useEffect(() => {
    if (!activeClientId) {
      fetch('/api/paypal/config')
        .then(r => r.json())
        .then(d => {
          if (d.clientId) setActiveClientId(d.clientId);
        })
        .catch(() => {});
    }
  }, [activeClientId]);

  const hasRealClientId = Boolean(
    activeClientId &&
    activeClientId !== 'your-paypal-sandbox-client-id' &&
    !activeClientId.includes('your-')
  );

  const handleSimulatePayment = async () => {
    setSimulating(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/simulate-payment`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        onSuccess(data.payment);
      } else {
        setErrorMessage(data.error || 'Failed to simulate payment');
      }
    } catch {
      setErrorMessage('Network error during simulation');
    } finally {
      setSimulating(false);
    }
  };

  const handleCreateOrder = async () => {
    setErrorMessage(null);
    const res = await fetch('/api/paypal/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to create PayPal order');
    }
    return data.paypalOrderId;
  };

  const handleApprove = async (data: any) => {
    setCapturing(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          paypalOrderId: data.orderID,
        }),
      });

      const captureData = await res.json();
      if (captureData.success) {
        onSuccess(captureData.payment);
      } else {
        setErrorMessage(captureData.error || 'Server failed to verify PayPal capture.');
      }
    } catch {
      setErrorMessage('Network error capturing PayPal payment.');
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Payment Error</p>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {capturing && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs text-center space-y-1">
          <p className="font-semibold">Verifying PayPal Capture on Server...</p>
          <p className="text-blue-700">Connecting to PayPal Sandbox API to confirm captured funds.</p>
        </div>
      )}

      {/* Official PayPal Buttons SDK if live client ID configured */}
      {hasRealClientId ? (
        <div className="space-y-3">
          <div className="text-xs text-slate-500 flex items-center justify-between pb-1">
            <span>PayPal Sandbox Standard Checkout</span>
            <span className="font-semibold text-slate-700">${amountFormatted} {currency}</span>
          </div>

          <PayPalScriptProvider
            options={{
              clientId: activeClientId!,
              currency,
              intent: 'capture',
              components: 'buttons',
            }}
          >
            <PayPalButtons
              style={{ layout: 'vertical', shape: 'rect', label: 'pay' }}
              createOrder={handleCreateOrder}
              onApprove={handleApprove}
              onError={err => setErrorMessage(err?.toString() || 'PayPal checkout error')}
              onCancel={() => setErrorMessage('Checkout cancelled by user in PayPal dialog.')}
            />
          </PayPalScriptProvider>
        </div>
      ) : (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-3">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span>PayPal Sandbox Credentials Notice</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            PayPal client credentials are not configured in <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">.env</code>.
            To test the full app workflow without PayPal keys, use the clearly separated <strong>Demo Simulation</strong> flow below.
          </p>
        </div>
      )}

      {/* Clearly Separated Demo Simulation Flow */}
      <div className="pt-2 border-t border-slate-200">
        <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Demo Sandbox Simulation
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-200 text-blue-800">
              Simulation Only
            </span>
          </div>
          <p className="text-[11px] text-slate-600">
            Instantly records a simulated sandbox capture to explore downstream fulfillment tracking and the Promise Drift Detector. Not a real payment.
          </p>
          <button
            onClick={handleSimulatePayment}
            disabled={simulating || capturing}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {simulating ? (
              <span>Simulating Capture...</span>
            ) : (
              <>
                <span>Complete Simulated Sandbox Payment (${amountFormatted} {currency})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
