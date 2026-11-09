import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { generatePromiseCard } from '@/lib/ai/promise-ai';

const GeneratePromiseSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).default(1),
  shippingOptionId: z.string().min(1),
  buyerRequirement: z.string().max(500).optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = GeneratePromiseSchema.parse(body);

    const product = await db.products.findUnique(validated.productId);
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const shippingOptions: any[] = product.shippingOptions || [];
    const shippingOption = shippingOptions.find((o: any) => o.id === validated.shippingOptionId);
    if (!shippingOption) {
      return NextResponse.json({ success: false, error: 'Invalid shipping option' }, { status: 400 });
    }

    const subtotalCents = product.priceCents * validated.quantity;
    const totalCents = subtotalCents + shippingOption.priceCents;

    const result = await generatePromiseCard({
      productName: product.name,
      quantity: validated.quantity,
      totalCents,
      currency: product.currency,
      shippingOptionName: shippingOption.name,
      shippingOptionDaysEstimate: shippingOption.daysEstimate,
      buyerRequirement: validated.buyerRequirement,
      sellerDeliveryEstimateDays: product.deliveryEstimateDays,
      sellerReturnPolicy: product.returnPolicy,
    });

    return NextResponse.json({
      success: true,
      promiseCardPreview: {
        productName: product.name,
        quantity: validated.quantity,
        totalCents,
        currency: product.currency,
        shippingOptionName: shippingOption.name,
        buyerRequirement: validated.buyerRequirement || null,
        sellerDeliveryEstimate: result.sellerDeliveryEstimate,
        returnPolicySummary: result.returnPolicySummary,
        warnings: result.warnings,
        hash: result.hash,
        isAiGenerated: result.isAiGenerated,
        demoNotice: 'Proofloop Sandbox Demo Order - No real funds or real-world shipment.',
      },
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: err.errors[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Promise check generation failed' }, { status: 500 });
  }
}
