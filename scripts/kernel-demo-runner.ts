/**
 * KERNEL Demo Automation Runner for Proofloop
 * 
 * Simulates an isolated end-to-end buyer checkout, Promise Card generation,
 * sandbox payment confirmation, fulfillment update, and Promise Drift detection.
 * 
 * Usage: node scripts/kernel-demo-runner.ts [baseUrl]
 */

const BASE_URL = process.argv[2] || process.env.APP_BASE_URL || 'http://localhost:3000';

async function logStep(stepNum: number, name: string, detail: string) {
  console.log(`\n[STEP ${stepNum}] ${name}`);
  console.log(`         ${detail}`);
}

async function runKernelDemo() {
  console.log('='.repeat(70));
  console.log(' PROOFLOOP KERNEL ISOLATED AUTOMATION RUNNER');
  console.log(` Target Base URL: ${BASE_URL}`);
  console.log(' Mode: Sandbox Demo Simulation');
  console.log('='.repeat(70));

  try {
    // 1. Fetch catalog
    await logStep(1, 'Fetch Catalog', 'Inspecting verified demo seller products...');
    const prodRes = await fetch(`${BASE_URL}/api/products`);
    const { products } = await prodRes.json();
    console.log(`   Found ${products.length} products. Selecting: "${products[0].name}"`);
    const product = products[0];

    // 2. Generate Promise Card
    await logStep(2, 'PromiseCheck AI', 'Submitting buyer need: "Urgent: Must arrive by Friday Nov 14 for wedding"');
    const promiseRes = await fetch(`${BASE_URL}/api/promise/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: product.id,
        quantity: 1,
        shippingOptionId: product.shippingOptions[0].id,
        buyerRequirement: 'Urgent: Must arrive by Friday Nov 14 for wedding gift presentation',
      }),
    });
    const promiseData = await promiseRes.json();
    console.log(`   Promise Card Hash: ${promiseData.promiseCardPreview.hash}`);
    console.log(`   Warnings Flagged: ${promiseData.promiseCardPreview.warnings.length}`);

    // 3. Create Draft Order
    await logStep(3, 'Create Draft Order', 'Initializing order record for buyer "Jordan Reed"...');
    const orderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyerName: 'Jordan Reed',
        buyerEmail: 'jordan.reed@demo.example',
        buyerRequirement: 'Urgent: Must arrive by Friday Nov 14 for wedding gift presentation',
        productId: product.id,
        quantity: 1,
        shippingOptionId: product.shippingOptions[0].id,
      }),
    });
    const { order } = await orderRes.json();
    console.log(`   Order created: ${order.orderNumber} (ID: ${order.id})`);

    // 4. Confirm Promise Card
    await logStep(4, 'Confirm Promise Card', 'Buyer confirms immutable agreement before payment unlock...');
    const confirmRes = await fetch(`${BASE_URL}/api/orders/${order.id}/confirm-promise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyerConfirmed: true,
        sellerDeliveryEstimate: promiseData.promiseCardPreview.sellerDeliveryEstimate,
        returnPolicySummary: promiseData.promiseCardPreview.returnPolicySummary,
        warnings: promiseData.promiseCardPreview.warnings,
        hash: promiseData.promiseCardPreview.hash,
      }),
    });
    const confirmData = await confirmRes.json();
    console.log(`   Promise Card locked immutably (v${confirmData.promiseCard.version}).`);

    // 5. Simulate Sandbox Payment
    await logStep(5, 'Execute Sandbox Payment', 'Processing authorized sandbox payment capture...');
    const payRes = await fetch(`${BASE_URL}/api/orders/${order.id}/simulate-payment`, {
      method: 'POST',
    });
    const payData = await payRes.json();
    console.log(`   Payment status: ${payData.payment.status} (Capture: ${payData.payment.paypalCaptureId})`);

    // 6. Simulate Fulfillment Event with Promise Drift
    await logStep(6, 'Fulfillment Update', 'Warehouse reports transit delay past buyer wedding deadline...');
    const fulfillRes = await fetch(`${BASE_URL}/api/orders/${order.id}/fulfillment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'DELAYED',
        carrier: 'Standard Ground Transit',
        trackingNumber: 'TRK-9920148102',
        note: 'Severe mountain snowstorm route closure. Delivery revised to Tuesday Nov 18.',
        estimatedDelivery: '2026-11-18T18:00:00.000Z',
      }),
    });
    const fulfillData = await fulfillRes.json();

    // 7. Inspect Promise Drift Detection
    await logStep(7, 'Promise Drift Detector', 'Evaluating order conflict against agreed Promise Card...');
    if (fulfillData.driftResult?.hasDrift) {
      console.log(`   [DRIFT DETECTED] ${fulfillData.driftResult.title}`);
      console.log(`   Severity: ${fulfillData.driftResult.severity}`);
      console.log(`   Explanation: ${fulfillData.driftResult.mismatchExplanation}`);
      console.log(`   Suggested Draft Message: \n   "${fulfillData.driftResult.suggestedMessage}"`);
    } else {
      console.log('   No drift flagged.');
    }

    console.log('\n' + '='.repeat(70));
    console.log(' KERNEL AUTOMATION RUN COMPLETED SUCCESSFULLY!');
    console.log(` View in dashboard: ${BASE_URL}/orders/${order.id}`);
    console.log('='.repeat(70));
  } catch (err: any) {
    console.error('Kernel demo error:', err.message);
  }
}

runKernelDemo();
