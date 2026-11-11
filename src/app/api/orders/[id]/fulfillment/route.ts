import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { detectPromiseDrift } from '@/lib/ai/promise-ai';
import { dispatchZapierWebhook } from '@/lib/integrations/zapier';

const FulfillmentSchema = z.object({
  status: z.enum(['PROCESSING', 'SHIPPED', 'DELAYED', 'DELIVERED', 'CANCELLED']),
  carrier: z.string().optional().nullable(),
  trackingNumber: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  estimatedDelivery: z.string().optional().nullable(),
  createdBy: z.string().default('Seller Demo Console'),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const order = await db.orders.findUnique(params.id);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const body = await request.json();
    const validated = FulfillmentSchema.parse(body);

    const previousStatus = order.fulfillmentState;

    // Record fulfillment event
    const event = await db.orders.addFulfillmentEvent(order.id, {
      status: validated.status,
      carrier: validated.carrier,
      trackingNumber: validated.trackingNumber,
      note: validated.note,
      estimatedDelivery: validated.estimatedDelivery,
      createdBy: validated.createdBy,
    });

    // Run Promise Drift Detector
    let driftResult: any = null;
    if (order.promiseCard) {
      driftResult = await detectPromiseDrift({
        promiseCard: {
          productName: order.promiseCard.productName,
          shippingOptionName: order.promiseCard.shippingOptionName,
          buyerRequirement: order.promiseCard.buyerRequirement,
          sellerDeliveryEstimate: order.promiseCard.sellerDeliveryEstimate,
          returnPolicySummary: order.promiseCard.returnPolicySummary,
        },
        fulfillmentUpdate: {
          status: validated.status,
          carrier: validated.carrier,
          trackingNumber: validated.trackingNumber,
          estimatedDelivery: validated.estimatedDelivery,
          note: validated.note,
        },
        previousStatus,
      });

      if (driftResult.hasDrift) {
        await db.orders.addDriftAlert(order.id, {
          fulfillmentEventId: event.id,
          title: driftResult.title,
          severity: driftResult.severity,
          agreedSnapshot: {
            productName: order.promiseCard.productName,
            shippingOption: order.promiseCard.shippingOptionName,
            buyerRequirement: order.promiseCard.buyerRequirement,
            sellerDeliveryEstimate: order.promiseCard.sellerDeliveryEstimate,
            returnPolicySummary: order.promiseCard.returnPolicySummary,
          },
          currentUpdateSnapshot: {
            status: validated.status,
            carrier: validated.carrier,
            trackingNumber: validated.trackingNumber,
            estimatedDelivery: validated.estimatedDelivery,
            note: validated.note,
          },
          mismatchExplanation: driftResult.mismatchExplanation,
          suggestedMessage: driftResult.suggestedMessage,
        });

        // Notify Zapier if configured
        dispatchZapierWebhook({
          event: 'PROMISE_DRIFT_DETECTED',
          timestamp: new Date().toISOString(),
          orderNumber: order.orderNumber,
          orderId: order.id,
          productName: order.promiseCard.productName,
          buyerName: order.buyerName,
          buyerEmail: order.buyerEmail,
          amountFormatted: `$${(order.totalCents / 100).toFixed(2)}`,
          currency: order.currency,
          status: validated.status,
          severity: driftResult.severity,
          summary: `Promise Drift Alert: ${driftResult.title}`,
          details: {
            mismatchExplanation: driftResult.mismatchExplanation,
            carrier: validated.carrier,
            trackingNumber: validated.trackingNumber,
          },
          idempotencyKey: `drift_${order.id}_${event.id}`,
        }).catch(() => {});
      } else {
        // Milestone update webhook
        dispatchZapierWebhook({
          event: 'FULFILLMENT_UPDATED',
          timestamp: new Date().toISOString(),
          orderNumber: order.orderNumber,
          orderId: order.id,
          productName: order.promiseCard.productName,
          buyerName: order.buyerName,
          buyerEmail: order.buyerEmail,
          amountFormatted: `$${(order.totalCents / 100).toFixed(2)}`,
          currency: order.currency,
          status: validated.status,
          summary: `Fulfillment status changed to ${validated.status}`,
          details: {
            carrier: validated.carrier,
            trackingNumber: validated.trackingNumber,
            note: validated.note,
          },
          idempotencyKey: `fulfil_${order.id}_${event.id}`,
        }).catch(() => {});
      }
    }

    const updatedOrder = await db.orders.findUnique(order.id);

    return NextResponse.json({
      success: true,
      event,
      driftResult,
      order: updatedOrder,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: err.errors[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Failed to record fulfillment update' }, { status: 500 });
  }
}
