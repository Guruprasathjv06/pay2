import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { capturePayPalOrder } from '@/lib/paypal';
import { dispatchZapierWebhook } from '@/lib/integrations/zapier';

const Schema = z.object({
  orderId: z.string().min(1),
  paypalOrderId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, paypalOrderId } = Schema.parse(body);

    const order = await db.orders.findUnique(orderId);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Idempotency check: don't double capture
    if (order.paymentState === 'COMPLETED' && order.payment?.paypalCaptureId) {
      return NextResponse.json({
        success: true,
        alreadyCaptured: true,
        payment: order.payment,
      });
    }

    // Server-side capture call to PayPal API
    const captureResult = await capturePayPalOrder(paypalOrderId);

    if (captureResult.status !== 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: `PayPal capture unverified. Status: ${captureResult.status}` },
        { status: 400 }
      );
    }

    // Save payment record in DB
    const payment = await db.orders.recordPayment(order.id, {
      paypalOrderId,
      paypalCaptureId: captureResult.captureId,
      status: 'COMPLETED',
      amountCents: order.totalCents,
      currency: order.currency,
      paymentMethod: 'PAYPAL_SANDBOX',
      isSimulation: false,
      rawResponse: captureResult.rawResponse,
      idempotencyKey: `paypal_cap_${captureResult.captureId}`,
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
      status: 'COMPLETED',
      summary: `PayPal Sandbox captured $${(order.totalCents / 100).toFixed(2)} USD for ${order.orderNumber}.`,
      idempotencyKey: `zapier_pay_${captureResult.captureId}`,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      captureId: captureResult.captureId,
      status: captureResult.status,
      payment,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'PayPal capture failed' },
      { status: 500 }
    );
  }
}
