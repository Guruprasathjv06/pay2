// Direct integration test for Proofloop Zapier Webhook Dispatcher
// Tests:
// 1. Live HTTP POST to Zapier Webhook URL
// 2. Event type, order ID, product name, buyer details, and timestamp inclusion
// 3. Deduplication logic (preventing duplicate notifications on retry)
// 4. Graceful error handling on network failure

const webhookUrl = 'https://hooks.zapier.com/hooks/catch/29413926/4539pyg/';

// In-memory deduplication cache
const deliveredEventsCache = new Map();

async function dispatchZapier(payload, options = {}) {
  const idempotencyKey = payload.idempotencyKey || `${payload.event}:${payload.orderId}:${payload.status || ''}:${payload.summary}`;

  if (!options.force && deliveredEventsCache.has(idempotencyKey)) {
    return {
      delivered: true,
      deduplicated: true,
      statusCode: 200,
      idempotencyKey,
      note: 'Duplicate event suppressed via idempotency key'
    };
  }

  const bodyPayload = {
    event: payload.event,
    eventType: payload.eventType || payload.event,
    timestamp: payload.timestamp || new Date().toISOString(),
    orderId: payload.orderId,
    orderNumber: payload.orderNumber,
    productName: payload.productName,
    buyerName: payload.buyerName || 'N/A',
    buyerEmail: payload.buyerEmail || 'N/A',
    buyerRequirement: payload.buyerRequirement || '',
    amountFormatted: payload.amountFormatted || '$0.00',
    currency: payload.currency || 'USD',
    status: payload.status || 'OK',
    severity: payload.severity,
    summary: payload.summary,
    details: payload.details || {},
    idempotencyKey,
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Proofloop-Webhook-Dispatcher/1.0',
        'X-Proofloop-Event': payload.event,
        'X-Proofloop-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(bodyPayload),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      deliveredEventsCache.set(idempotencyKey, Date.now());
      return {
        delivered: true,
        statusCode: res.status,
        zapierResponse: data,
        idempotencyKey
      };
    } else {
      return {
        delivered: false,
        statusCode: res.status,
        error: `Zapier returned HTTP ${res.status}`,
      };
    }
  } catch (err) {
    return {
      delivered: false,
      error: err.message,
    };
  }
}

async function runTests() {
  console.log('=== TEST 1: PAYMENT_CAPTURED Webhook ===');
  const res1 = await dispatchZapier({
    event: 'PAYMENT_CAPTURED',
    orderId: 'test-order-zapier-001',
    orderNumber: 'PLF-TEST-ZAP-1',
    productName: 'Sony WH-1000XM5 Noise Canceling Headphones',
    buyerName: 'David Zhang',
    buyerEmail: 'david.zhang@example.com',
    buyerRequirement: 'Deliver by Friday before 5pm. Fragile packaging.',
    amountFormatted: '$399.99',
    currency: 'USD',
    status: 'COMPLETED',
    summary: 'PayPal Sandbox captured $399.99 USD for PLF-TEST-ZAP-1.',
    idempotencyKey: 'test_pay_capture_001'
  });
  console.log('Test 1 Result:', JSON.stringify(res1, null, 2));

  console.log('\n=== TEST 2: Duplicate Prevention (Retry same event) ===');
  const res2 = await dispatchZapier({
    event: 'PAYMENT_CAPTURED',
    orderId: 'test-order-zapier-001',
    orderNumber: 'PLF-TEST-ZAP-1',
    productName: 'Sony WH-1000XM5 Noise Canceling Headphones',
    buyerName: 'David Zhang',
    buyerEmail: 'david.zhang@example.com',
    buyerRequirement: 'Deliver by Friday before 5pm. Fragile packaging.',
    amountFormatted: '$399.99',
    currency: 'USD',
    status: 'COMPLETED',
    summary: 'PayPal Sandbox captured $399.99 USD for PLF-TEST-ZAP-1.',
    idempotencyKey: 'test_pay_capture_001'
  });
  console.log('Test 2 Result (Should be deduplicated: true):', JSON.stringify(res2, null, 2));

  console.log('\n=== TEST 3: PROMISE_DRIFT_DETECTED Webhook ===');
  const res3 = await dispatchZapier({
    event: 'PROMISE_DRIFT_DETECTED',
    orderId: 'test-order-zapier-002',
    orderNumber: 'PLF-TEST-ZAP-2',
    productName: 'Herman Miller Aeron Ergonomic Office Chair',
    buyerName: 'Elena Rostova',
    buyerEmail: 'elena.rostova@example.com',
    buyerRequirement: 'White glove room-of-choice setup required.',
    amountFormatted: '$1,495.00',
    currency: 'USD',
    status: 'IN_TRANSIT',
    severity: 'HIGH',
    summary: 'Promise Drift Alert: Delivery Delayed by Carrier past promised Friday window',
    details: {
      carrier: 'FedEx Freight',
      trackingNumber: '782910384719',
      mismatchExplanation: 'Carrier delayed estimated delivery to next Monday.'
    },
    idempotencyKey: 'test_drift_alert_002'
  });
  console.log('Test 3 Result:', JSON.stringify(res3, null, 2));
}

runTests();
