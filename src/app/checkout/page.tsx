'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Search,
  Lock,
} from 'lucide-react';
import { Product, ShippingOption } from '../../types';
import { PromiseCardView } from '../../components/PromiseCardView';
import { PayPalButtonWrapper } from '../../components/PayPalButtonWrapper';
import { Channel3SearchModal } from '../../components/Channel3SearchModal';

export default function CheckoutPage() {
  const router = useRouter();

  // Catalog state
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);

  // Buyer inputs
  const [buyerName, setBuyerName] = useState('Jordan Reed');
  const [buyerEmail, setBuyerEmail] = useState('jordan.reed@example.com');
  const [buyerRequirement, setBuyerRequirement] = useState('I need it delivered before Friday for an upcoming flight presentation');
  const [quantity, setQuantity] = useState(1);

  // Flow states
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [generatingCard, setGeneratingCard] = useState(false);
  const [cardPreview, setCardPreview] = useState<any | null>(null);
  const [buyerConfirmed, setBuyerConfirmed] = useState(false);
  const [confirmingCard, setConfirmingCard] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any | null>(null);
  const [channel3ModalOpen, setChannel3ModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.products.length > 0) {
          setProducts(data.products);
          setSelectedProduct(data.products[0]);
          setSelectedShipping(data.products[0].shippingOptions[0]);
        }
      })
      .finally(() => setLoadingProducts(false));
  }, []);

  const handleProductChange = (prod: Product) => {
    setSelectedProduct(prod);
    setSelectedShipping(prod.shippingOptions[0]);
    setCardPreview(null);
    setBuyerConfirmed(false);
    setCreatedOrder(null);
  };

  // Step 1: Generate Promise Card Preview
  const handleGeneratePromiseCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !selectedShipping) return;

    setGeneratingCard(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/promise/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          quantity,
          shippingOptionId: selectedShipping.id,
          buyerRequirement: buyerRequirement.trim() || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCardPreview(data.promiseCardPreview);
        setBuyerConfirmed(false);
        setCreatedOrder(null);
      } else {
        setErrorMessage(data.error || 'Failed to generate Promise Card');
      }
    } catch {
      setErrorMessage('Network error while generating Promise Card.');
    } finally {
      setGeneratingCard(false);
    }
  };

  // Step 2: Buyer confirms Promise Card -> Create Order & Lock Immutable Card
  const handleConfirmAndProceedToPayment = async () => {
    if (!selectedProduct || !selectedShipping || !cardPreview || !buyerConfirmed) return;

    setConfirmingCard(true);
    setErrorMessage(null);

    try {
      // Create draft order
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerName,
          buyerEmail,
          buyerRequirement: buyerRequirement.trim() || null,
          productId: selectedProduct.id,
          quantity,
          shippingOptionId: selectedShipping.id,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to initialize order');
      }

      const order = orderData.order;

      // Lock confirmed Promise Card into order
      const confirmRes = await fetch(`/api/orders/${order.id}/confirm-promise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerConfirmed: true,
          sellerDeliveryEstimate: cardPreview.sellerDeliveryEstimate,
          returnPolicySummary: cardPreview.returnPolicySummary,
          warnings: cardPreview.warnings,
          hash: cardPreview.hash,
        }),
      });

      const confirmData = await confirmRes.json();
      if (!confirmData.success) {
        throw new Error(confirmData.error || 'Failed to lock Promise Card');
      }

      setCreatedOrder({
        ...order,
        promiseCard: confirmData.promiseCard,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Error locking agreement');
    } finally {
      setConfirmingCard(false);
    }
  };

  const handlePaymentSuccess = (payment: any) => {
    if (createdOrder) {
      router.push(`/orders/${createdOrder.id}?paymentSuccess=true`);
    }
  };

  if (loadingProducts) {
    return <div className="py-24 text-center text-slate-500">Loading demo catalog...</div>;
  }

  const subtotalCents = selectedProduct ? selectedProduct.priceCents * quantity : 0;
  const shippingCents = selectedShipping ? selectedShipping.priceCents : 0;
  const totalCents = subtotalCents + shippingCents;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Buyer Checkout & PromiseCheck
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Specify your requirements, review the generated Promise Card, and complete Sandbox checkout.
          </p>
        </div>

        {/* Channel3 Integration Button */}
        <button
          onClick={() => setChannel3ModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Find with Channel3</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form & Catalog */}
        <div className="lg:col-span-7 space-y-6">
          {/* Product Selector */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              1. Choose Product to Purchase
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {products.map(p => {
                const isSelected = selectedProduct?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleProductChange(p)}
                    className={`p-3 rounded-xl border text-left transition flex gap-3 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-slate-200"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-xs text-slate-900 truncate">{p.name}</p>
                      <p className="text-[11px] font-bold text-blue-700 mt-0.5">
                        ${(p.priceCents / 100).toFixed(2)} {p.currency}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{p.category}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Product Policy Summary */}
            {selectedProduct && (
              <div className="pt-3 border-t border-slate-100 text-xs space-y-2 text-slate-600 bg-slate-50 p-3 rounded-xl">
                <p><strong>Seller Description:</strong> {selectedProduct.description}</p>
                <div className="flex flex-wrap items-center gap-4 text-[11px] pt-1 text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Estimate: <strong>{selectedProduct.deliveryEstimateDays}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                    Policy: <strong>{selectedProduct.returnPolicy.substring(0, 45)}...</strong>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Buyer Details & Requirement Form */}
          <form onSubmit={handleGeneratePromiseCard} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              2. Buyer Details & Specific Requirements
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={buyerName}
                  onChange={e => setBuyerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={buyerEmail}
                  onChange={e => setBuyerEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Buyer Delivery Requirement Note */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-600">
                  What is your delivery requirement? (Optional)
                </label>
                <span className="text-[10px] text-slate-400">AI evaluates this against seller options</span>
              </div>
              <textarea
                rows={2}
                value={buyerRequirement}
                onChange={e => setBuyerRequirement(e.target.value)}
                placeholder="e.g., 'I need it delivered before Friday Nov 14 for an executive gift'..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Shipping Option Selector */}
            {selectedProduct && (
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  Choose Shipping Speed
                </label>
                <div className="space-y-2">
                  {selectedProduct.shippingOptions.map(opt => {
                    const isSelected = selectedShipping?.id === opt.id;
                    return (
                      <label
                        key={opt.id}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="shipping"
                            checked={isSelected}
                            onChange={() => setSelectedShipping(opt)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <span className="font-semibold text-slate-800">{opt.name}</span>
                            <span className="text-slate-500 ml-2">({opt.daysEstimate})</span>
                          </div>
                        </div>
                        <span className="font-bold text-slate-900">
                          {opt.priceCents === 0 ? 'FREE' : `$${(opt.priceCents / 100).toFixed(2)}`}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Submit to Generate Promise Card */}
            <button
              type="submit"
              disabled={generatingCard}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-blue-200" />
              <span>{generatingCard ? 'Synthesizing with Guarded AI...' : 'Generate Promise Card'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Promise Card Review & PayPal Sandbox Checkout */}
        <div className="lg:col-span-5 space-y-6">
          {/* Price Breakdown Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Order Summary</h3>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>{selectedProduct?.name} (x{quantity})</span>
                <span>${(subtotalCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping ({selectedShipping?.name})</span>
                <span>${(shippingCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200 text-sm">
                <span>Total</span>
                <span className="text-blue-700">${(totalCents / 100).toFixed(2)} {selectedProduct?.currency}</span>
              </div>
            </div>
          </div>

          {/* Promise Card Section */}
          {cardPreview ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Review Promise Card Agreement
                </span>
                <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-mono">
                  {cardPreview.isAiGenerated ? 'Guarded AI Generated' : 'Deterministic Template'}
                </span>
              </div>

              {/* Render the Promise Card */}
              <PromiseCardView card={cardPreview} isDraftPreview={!createdOrder} />

              {/* Step 2 Confirmation Checkbox */}
              {!createdOrder ? (
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={buyerConfirmed}
                      onChange={e => setBuyerConfirmed(e.target.checked)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="text-xs text-slate-700 leading-relaxed">
                      I have reviewed and confirmed this <strong>Promise Card agreement</strong>. I understand it will be permanently sealed and compared against subsequent fulfillment updates.
                    </span>
                  </label>

                  <button
                    onClick={handleConfirmAndProceedToPayment}
                    disabled={!buyerConfirmed || confirmingCard}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    <Lock className="w-3.5 h-3.5 text-blue-400" />
                    <span>{confirmingCard ? 'Sealing Agreement...' : 'Confirm Promise Card & Unlock Payment'}</span>
                  </button>
                </div>
              ) : (
                /* Step 3: Payment Section */
                <div className="bg-white p-5 rounded-2xl border-2 border-blue-600 shadow-md space-y-4">
                  <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Promise Card Sealed (Order {createdOrder.orderNumber})</span>
                  </div>

                  <PayPalButtonWrapper
                    orderId={createdOrder.id}
                    orderNumber={createdOrder.orderNumber}
                    amountFormatted={(createdOrder.totalCents / 100).toFixed(2)}
                    currency={createdOrder.currency}
                    onSuccess={handlePaymentSuccess}
                    paypalClientId={process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 bg-white rounded-2xl border border-dashed border-slate-300 text-center text-xs text-slate-400 space-y-2">
              <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-600">No Promise Card Generated Yet</p>
              <p>Configure your details on the left and click "Generate Promise Card" to preview what will be promised.</p>
            </div>
          )}
        </div>
      </div>

      {/* Channel3 Search Modal */}
      <Channel3SearchModal
        isOpen={channel3ModalOpen}
        onClose={() => setChannel3ModalOpen(false)}
        onSelectProduct={handleProductChange}
      />
    </div>
  );
}
