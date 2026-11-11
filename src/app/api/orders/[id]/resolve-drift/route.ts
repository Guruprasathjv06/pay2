import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { dispatchZapierWebhook } from '@/lib/integrations/zapier';

const Schema = z.object({
  alertId: z.string().min(1),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { alertId } = Schema.parse(body);

    const alert = await db.orders.resolveDriftAlert(params.id, alertId);
    if (!alert) {
      return NextResponse.json({ success: false, error: 'Alert not found' }, { status: 404 });
    }

    const updatedOrder = await db.orders.findUnique(params.id);

    if (updatedOrder) {
      dispatchZapierWebhook({
        event: 'PROMISE_RESOLVED',
        timestamp: new Date().toISOString(),
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        productName: updatedOrder.promiseCard?.productName || updatedOrder.product?.name || 'Order Item',
        buyerName: updatedOrder.buyerName,
        buyerEmail: updatedOrder.buyerEmail,
        amountFormatted: `$${(updatedOrder.totalCents / 100).toFixed(2)}`,
        currency: updatedOrder.currency,
        status: 'RESOLVED',
        summary: `Promise drift alert resolved: ${alert.title}`,
        details: {
          resolvedAlertId: alert.id,
          resolvedAt: alert.resolvedAt,
        },
        idempotencyKey: `resolve_${updatedOrder.id}_${alert.id}`,
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, alert, order: updatedOrder });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Failed to resolve drift alert' }, { status: 500 });
  }
}
