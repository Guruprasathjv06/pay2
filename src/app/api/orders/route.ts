import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

const CreateOrderSchema = z.object({
  buyerName: z.string().min(2, 'Name must be at least 2 characters'),
  buyerEmail: z.string().email('Please provide a valid email address'),
  buyerRequirement: z.string().max(500).optional().nullable(),
  productId: z.string().min(1, 'Product selection is required'),
  quantity: z.number().int().min(1).max(20).default(1),
  shippingOptionId: z.string().min(1, 'Shipping option is required'),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentState = searchParams.get('paymentState');
    const fulfillmentState = searchParams.get('fulfillmentState');
    const driftStatus = searchParams.get('driftStatus');
    const search = searchParams.get('search')?.toLowerCase();

    let orders = await db.orders.findMany();

    if (paymentState && paymentState !== 'ALL') {
      orders = orders.filter(o => o.paymentState === paymentState);
    }
    if (fulfillmentState && fulfillmentState !== 'ALL') {
      orders = orders.filter(o => o.fulfillmentState === fulfillmentState);
    }
    if (driftStatus && driftStatus !== 'ALL') {
      orders = orders.filter(o => o.driftStatus === driftStatus);
    }
    if (search) {
      orders = orders.filter(
        o =>
          o.orderNumber.toLowerCase().includes(search) ||
          o.buyerName.toLowerCase().includes(search) ||
          o.buyerEmail.toLowerCase().includes(search) ||
          (o.promiseCard?.productName || '').toLowerCase().includes(search)
      );
    }

    return NextResponse.json({ success: true, orders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Failed to query orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateOrderSchema.parse(body);

    // Look up product from server database to strictly enforce factual pricing
    const product = await db.products.findUnique(validated.productId);
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found in catalog' }, { status: 404 });
    }

    // Verify shipping option from server product definition
    const shippingOptions: any[] = product.shippingOptions || [];
    const shippingOption = shippingOptions.find((o: any) => o.id === validated.shippingOptionId);
    if (!shippingOption) {
      return NextResponse.json(
        { success: false, error: 'Invalid shipping option chosen for this product' },
        { status: 400 }
      );
    }

    // Compute prices safely on server (no client pricing trusted)
    const subtotalCents = product.priceCents * validated.quantity;
    const shippingFeeCents = shippingOption.priceCents;
    const totalCents = subtotalCents + shippingFeeCents;

    const order = await db.orders.create({
      buyerName: validated.buyerName,
      buyerEmail: validated.buyerEmail,
      buyerRequirement: validated.buyerRequirement,
      productId: product.id,
      quantity: validated.quantity,
      subtotalCents,
      shippingFeeCents,
      totalCents,
      currency: product.currency,
      shippingOptionId: shippingOption.id,
      shippingOptionName: shippingOption.name,
    });

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: err.errors[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 500 });
  }
}
