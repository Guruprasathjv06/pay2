import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dispatchZapierWebhook } from '@/lib/integrations/zapier';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const order = await db.orders.findUnique(params.id);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    if (!order.promiseCard) {
      return NextResponse.json(
        { success: false, error: 'Cannot simulate payment before Promise Card is confirmed.' },
        { status: 400 }
      );
    }

    if (order.paymentState === 'COMPLETED') {
      return NextResponse.json({
        success: true,
        alreadyCaptured: true,
        payment: order.payment,
      });
    }

    const simCaptureId = `SIM-CAP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const payment = await db.orders.recordPayment(order.id, {
      paypalOrderId: `SIM-ORD-${Date.now().toString(36).toUpperCase()}`,
      paypalCaptureId: simCaptureId,
      status: 'COMPLETED',
      amountCents: order.totalCents,
      currency: order.currency,
      paymentMethod: 'DEMO_SANDBOX_SIMULATION',
      isSimulation: true,
      rawResponse: {
        note: 'SIMULATED DEMO TRANSACTION ONLY - NOT A REAL PAYPAL CAPTURE',
        simulatedAt: new Date().toISOString(),
      },
      idempotencyKey: `sim_${order.id}`,
    });

    // Notify Zapier if configured
    dispatchZapierWebhook({
      event: 'PAYMENT_CAPTURED',
      timestamp: new Date().toISOString(),
      orderNumber: order.orderNumber,
      orderId: order.id,
      productName: order.promiseCard?.productName || order.product?.name || 'Item',
      buyerName: order.buyerName,
      buyerEmail: order.buyerEmail,
      amountFormatted: `$${(order.totalCents / 100).toFixed(2)}`,
      currency: order.currency,
      status: 'COMPLETED (SIMULATED)',
      summary: `Simulated Demo capture completed for ${order.orderNumber}.`,
      idempotencyKey: `zapier_sim_${order.id}`,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      isSimulation: true,
      captureId: simCaptureId,
      payment,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Failed to simulate payment' }, { status: 500 });
  }
}
