import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createPayPalOrder, getPayPalConfig } from '@/lib/paypal';

const Schema = z.object({
  orderId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId } = Schema.parse(body);

    const order = await db.orders.findUnique(orderId);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Require confirmed Promise Card before checkout!
    if (!order.promiseCard) {
      return NextResponse.json(
        { success: false, error: 'A buyer-confirmed Promise Card is required before creating a PayPal order.' },
        { status: 400 }
      );
    }

    const config = getPayPalConfig();
    if (!config.isConfigured) {
      return NextResponse.json(
        {
          success: false,
          needsConfiguration: true,
          error: 'PayPal Sandbox credentials (PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET) are not configured on the server. You can configure them in .env, or use the clearly labeled Demo Sandbox Simulation flow below.',
        },
        { status: 400 }
      );
    }

    const { paypalOrderId } = await createPayPalOrder({
      orderNumber: order.orderNumber,
      amountCents: order.totalCents,
      currency: order.currency,
      description: `Proofloop Demo: ${order.product?.name || 'Order'} (${order.orderNumber})`,
    });

    // Record audit event
    await db.audit.create({
      orderId: order.id,
      eventType: 'PAYPAL_ORDER_CREATED',
      source: 'PAYPAL_SANDBOX',
      description: `PayPal Sandbox checkout order created: ${paypalOrderId} for $${(order.totalCents / 100).toFixed(2)} ${order.currency}.`,
      metadata: { paypalOrderId },
    });

    return NextResponse.json({ success: true, paypalOrderId });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'PayPal order creation failed' },
      { status: 500 }
    );
  }
}
