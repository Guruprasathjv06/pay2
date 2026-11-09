import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PRODUCTS = [
  {
    id: 'prod_aero_01',
    sku: 'PLP-AERO-01',
    name: 'AeroPeak ANC Wireless Studio Headphones',
    description: 'Precision engineered active noise-cancelling headphones featuring 40mm beryllium drivers, 38-hour battery, and ultra-plush memory foam earcups.',
    priceCents: 18900,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    stockCount: 42,
    category: 'Audio & Electronics',
    returnPolicy: '30-day money-back guarantee with free return shipping on unopened or defective units. 15% restocking fee applies if opened in working condition.',
    deliveryEstimateDays: '3-4 business days',
    shippingOptionsJson: JSON.stringify([
      { id: 'ship_std', name: 'Standard Tracked Ground', priceCents: 0, daysEstimate: '3-5 business days' },
      { id: 'ship_exp', name: 'Express Priority Air', priceCents: 1500, daysEstimate: '1-2 business days' },
      { id: 'ship_ovn', name: 'Guaranteed Overnight Delivery', priceCents: 2800, daysEstimate: '1 business day' },
    ]),
    isDemo: true,
  },
  {
    id: 'prod_keyb_02',
    sku: 'PLP-KEYB-02',
    name: 'Artisan Mechanical Keyboard (Solid Walnut)',
    description: 'Bespoke CNC-milled black walnut casing, hot-swappable tactile switches, lubricated stabilizers, and custom double-shot PBT keycaps.',
    priceCents: 24500,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
    stockCount: 18,
    category: 'Computing & Workspace',
    returnPolicy: '14-day inspection window. Accept returns for manufacturing defects or switch failures. Buyer covers insured return shipping for remorse.',
    deliveryEstimateDays: '5-7 business days',
    shippingOptionsJson: JSON.stringify([
      { id: 'ship_ins', name: 'Insured Courier Ground', priceCents: 1200, daysEstimate: '4-6 business days' },
      { id: 'ship_air', name: 'Express Insured Air Priority', priceCents: 2400, daysEstimate: '2 business days' },
    ]),
    isDemo: true,
  },
  {
    id: 'prod_roast_03',
    sku: 'PLP-ROAST-03',
    name: 'Nordic Roast Single-Origin Coffee Trio (Monthly Reserve)',
    description: 'Three 250g bags of specialty grade single-origin beans from Ethiopia, Colombia, and Kenya. Roasted within 24 hours of dispatch.',
    priceCents: 4800,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=600&q=80',
    stockCount: 65,
    category: 'Gourmet & Pantry',
    returnPolicy: 'Perishable food product: final sale upon dispatch. Freshness guarantee: free replacement or credit if package arrives damaged or spoiled.',
    deliveryEstimateDays: '2-3 business days',
    shippingOptionsJson: JSON.stringify([
      { id: 'ship_fresh_std', name: 'Fresh Dispatch Tracked', priceCents: 450, daysEstimate: '2-3 business days' },
      { id: 'ship_fresh_exp', name: 'Next-Flight Roast Priority', priceCents: 900, daysEstimate: '1-2 business days' },
    ]),
    isDemo: true,
  },
  {
    id: 'prod_duffle_04',
    sku: 'PLP-DUFFLE-04',
    name: 'Heritage Waxed Canvas & Leather Travel Duffle',
    description: 'Weatherproof 18oz Scottish waxed canvas with full-grain vegetable-tanned bridle leather straps and solid antiqued brass hardware.',
    priceCents: 16500,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
    stockCount: 29,
    category: 'Travel & Bags',
    returnPolicy: 'Lifetime warranty against zipper or seam defects. 45-day return window in unused condition with all original tags attached.',
    deliveryEstimateDays: '3-5 business days',
    shippingOptionsJson: JSON.stringify([
      { id: 'ship_duffle_std', name: 'Standard Tracked Delivery', priceCents: 0, daysEstimate: '3-5 business days' },
      { id: 'ship_duffle_exp', name: '2-Day Air Priority', priceCents: 1800, daysEstimate: '2 business days' },
    ]),
    isDemo: true,
  },
];

async function main() {
  console.log('Seeding Proofloop PostgreSQL database on Neon...');

  // Delete existing records
  await prisma.auditEvent.deleteMany({});
  await prisma.driftAlert.deleteMany({});
  await prisma.fulfillmentEvent.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.promiseCard.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});

  // Seed Products
  for (const prod of PRODUCTS) {
    await prisma.product.create({
      data: prod,
    });
  }

  // Seed Order 1 (Clean shipped order PLF-1082)
  const ord1082 = await prisma.order.create({
    data: {
      id: 'ord_1082',
      orderNumber: 'PLF-1082',
      buyerName: 'Alex Mercer',
      buyerEmail: 'alex.mercer@example.com',
      buyerRequirement: 'Standard dispatch is fine. Please leave by front porch if not home.',
      productId: 'prod_aero_01',
      quantity: 1,
      subtotalCents: 18900,
      shippingFeeCents: 0,
      totalCents: 18900,
      currency: 'USD',
      shippingOptionId: 'ship_std',
      shippingOptionName: 'Standard Tracked Ground',
      paymentState: 'COMPLETED',
      fulfillmentState: 'SHIPPED',
      driftStatus: 'NONE',
      createdAt: new Date('2026-11-05T14:20:00.000Z'),
    },
  });

  await prisma.promiseCard.create({
    data: {
      id: 'pc_1082',
      orderId: ord1082.id,
      version: 1,
      hash: 'sha256_8f0a3e91b2c4d6',
      productName: 'AeroPeak ANC Wireless Studio Headphones',
      quantity: 1,
      totalCents: 18900,
      currency: 'USD',
      shippingOptionName: 'Standard Tracked Ground',
      buyerRequirement: 'Standard dispatch is fine. Please leave by front porch if not home.',
      sellerDeliveryEstimate: '3-5 business days (Estimated delivery: Nov 10, 2026)',
      returnPolicySummary: '30-day money-back guarantee; free returns on defective/unopened units.',
      warningsJson: '[]',
      isImmutable: true,
      agreedAt: new Date('2026-11-05T14:22:10.000Z'),
    },
  });

  await prisma.payment.create({
    data: {
      id: 'pay_1082',
      orderId: ord1082.id,
      paypalOrderId: '9XX83719LK201824P',
      paypalCaptureId: '4CP2910485910243M',
      status: 'COMPLETED',
      amountCents: 18900,
      currency: 'USD',
      paymentMethod: 'PAYPAL_SANDBOX',
      isSimulation: false,
    },
  });

  await prisma.fulfillmentEvent.create({
    data: {
      id: 'fe_1082_2',
      orderId: ord1082.id,
      status: 'SHIPPED',
      carrier: 'USPS Priority Ground',
      trackingNumber: '9400111899562549301284',
      note: 'Package handed over to carrier. En route on schedule.',
      estimatedDelivery: new Date('2026-11-09T17:00:00.000Z'),
      isSimulation: true,
      createdBy: 'Shipping Dept (Demo)',
    },
  });

  // Seed Order 2 (Order PLF-1095 with Active Promise Drift!)
  const ord1095 = await prisma.order.create({
    data: {
      id: 'ord_1095',
      orderNumber: 'PLF-1095',
      buyerName: 'Sophia Lin',
      buyerEmail: 'sophia.lin@company.org',
      buyerRequirement: 'Urgent: Must arrive by Friday Nov 7 for an executive presentation.',
      productId: 'prod_keyb_02',
      quantity: 1,
      subtotalCents: 24500,
      shippingFeeCents: 2400,
      totalCents: 26900,
      currency: 'USD',
      shippingOptionId: 'ship_air',
      shippingOptionName: 'Express Insured Air Priority',
      paymentState: 'COMPLETED',
      fulfillmentState: 'DELAYED',
      driftStatus: 'DRIFT_DETECTED',
      createdAt: new Date('2026-11-04T11:15:00.000Z'),
    },
  });

  await prisma.promiseCard.create({
    data: {
      id: 'pc_1095',
      orderId: ord1095.id,
      version: 1,
      hash: 'sha256_e4c27a909f1837a',
      productName: 'Artisan Mechanical Keyboard (Solid Walnut)',
      quantity: 1,
      totalCents: 26900,
      currency: 'USD',
      shippingOptionName: 'Express Insured Air Priority',
      buyerRequirement: 'Urgent: Must arrive by Friday Nov 7 for an executive presentation.',
      sellerDeliveryEstimate: '2 business days (Guaranteed delivery on or before Friday Nov 7, 2026)',
      returnPolicySummary: '14-day defect warranty. Insured return shipping for remorse.',
      warningsJson: '[]',
      isImmutable: true,
      agreedAt: new Date('2026-11-04T11:17:30.000Z'),
    },
  });

  await prisma.payment.create({
    data: {
      id: 'pay_1095',
      orderId: ord1095.id,
      paypalOrderId: '3BA91048SK918239A',
      paypalCaptureId: '7DF1940182471902K',
      status: 'COMPLETED',
      amountCents: 26900,
      currency: 'USD',
      paymentMethod: 'PAYPAL_SANDBOX',
      isSimulation: false,
    },
  });

  const feDelay = await prisma.fulfillmentEvent.create({
    data: {
      id: 'fe_1095_2',
      orderId: ord1095.id,
      status: 'DELAYED',
      carrier: 'FedEx 2-Day Air',
      trackingNumber: '782910482910',
      note: 'Custom walnut switchplate quality inspection re-test required. ETA revised to Tuesday Nov 10.',
      estimatedDelivery: new Date('2026-11-10T17:00:00.000Z'),
      isSimulation: true,
      createdBy: 'Quality Assurance (Demo)',
    },
  });

  await prisma.driftAlert.create({
    data: {
      id: 'da_1095_1',
      orderId: ord1095.id,
      fulfillmentEventId: feDelay.id,
      title: 'Promise Drift: Delivery Postponed Past Buyer Required Date',
      severity: 'CRITICAL',
      agreedSnapshotJson: JSON.stringify({
        productName: 'Artisan Mechanical Keyboard (Solid Walnut)',
        shippingOption: 'Express Insured Air Priority (2 business days)',
        buyerRequirement: 'Urgent: Must arrive by Friday Nov 7 for an executive presentation.',
        sellerDeliveryEstimate: 'On or before Friday Nov 7, 2026',
        returnPolicySummary: '14-day defect warranty; seller customer support.',
      }),
      currentUpdateSnapshot: JSON.stringify({
        status: 'DELAYED',
        carrier: 'FedEx 2-Day Air',
        trackingNumber: '782910482910',
        estimatedDelivery: 'Tuesday Nov 10, 2026 (3 days past agreed requirement)',
        note: 'Custom walnut switchplate quality inspection re-test required.',
      }),
      mismatchExplanation: 'The buyer explicitly required delivery on or before Friday, Nov 7 for an executive presentation. The latest fulfillment update revised the delivery estimate to Tuesday, Nov 10 (a 3-day delay).',
      suggestedMessage: 'Dear Sophia, we noticed your order PLF-1095 has experienced a quality assurance delay and will now arrive on Tuesday, Nov 10, which misses your required date of Friday, Nov 7. In accordance with our store policy for expedited delivery commitments, we would like to refund your $24.00 express shipping surcharge or arrange a same-day alternative if desired. Please let us know how you would prefer to proceed.',
      isResolved: false,
    },
  });

  // Seed Audit events
  await prisma.auditEvent.create({
    data: {
      id: 'aud_sys_neon',
      eventType: 'SYSTEM_BOOT',
      source: 'APP_ACTION',
      description: 'Proofloop PostgreSQL connected live to Neon cloud database.',
    },
  });

  console.log('Seeded products and scenario orders into Neon PostgreSQL successfully.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
