import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '../../../../../lib/db';
import { dispatchZapierWebhook } from '../../../../../lib/integrations/zapier';

const ConfirmPromiseSchema = z.object({
  buyerConfirmed: z.boolean().refine(v => v === true, 'You must review and confirm the Promise Card agreement to proceed.'),
  sellerDeliveryEstimate: z.string().min(1),
  returnPolicySummary: z.string().min(1),
  warnings: z.array(z.string()).default([]),
  hash: z.string().min(1),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const order = await db.orders.findUnique(params.id);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    if (order.promiseCard && order.promiseCard.isImmutable) {
      return NextResponse.json(
        { success: false, error: 'A confirmed immutable Promise Card is already locked for this order.' },
        { status: 409 }
      );
    }

    const body = await request.json();
    const validated = ConfirmPromiseSchema.parse(body);

    const savedCard = await db.orders.savePromiseCard(order.id, {
      version: 1,
      hash: validated.hash,
      productName: order.product?.name || 'Item',
      quantity: order.quantity,
      totalCents: order.totalCents,
      currency: order.currency,
      shippingOptionName: order.shippingOptionName,
      buyerRequirement: order.buyerRequirement,
      sellerDeliveryEstimate: validated.sellerDeliveryEstimate,
      returnPolicySummary: validated.returnPolicySummary,
      warnings: validated.warnings,
      agreedAt: new Date().toISOString(),
      isImmutable: true,
      demoNotice: 'Proofloop Sandbox Demo Order - No real funds or real-world shipment.',
    });

    // Notify Zapier if configured
    dispatchZapierWebhook({
      event: 'PROMISE_CONFIRMED',
      timestamp: new Date().toISOString(),
      orderId: order.id,
      orderNumber: order.orderNumber,
      productName: savedCard.productName,
      buyerName: order.buyerName,
      buyerEmail: order.buyerEmail,
      buyerRequirement: order.buyerRequirement,
      amountFormatted: `$${(order.totalCents / 100).toFixed(2)}`,
      currency: order.currency,
      status: 'PROMISE_LOCKED',
      summary: `Buyer confirmed immutable Promise Card for ${order.orderNumber}.`,
      details: {
        hash: validated.hash,
        sellerDeliveryEstimate: validated.sellerDeliveryEstimate,
        returnPolicySummary: validated.returnPolicySummary,
      },
      idempotencyKey: `promise_lock_${order.id}`,
    }).catch(() => {});

    return NextResponse.json({ success: true, promiseCard: savedCard });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: err.errors[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Failed to confirm Promise Card' }, { status: 500 });
  }
}
