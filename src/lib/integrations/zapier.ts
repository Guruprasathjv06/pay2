export interface ZapierWebhookPayload {
  event:
    | 'PAYMENT_CAPTURED'
    | 'PROMISE_DRIFT_DETECTED'
    | 'FULFILLMENT_UPDATED'
    | 'PROMISE_RESOLVED'
    | 'PROMISE_CONFIRMED';
  eventType?: string;
  timestamp: string;
  orderId: string;
  orderNumber: string;
  productName: string;
  buyerName?: string | null;
  buyerEmail?: string | null;
  buyerRequirement?: string | null;
  amountFormatted?: string | null;
  currency?: string | null;
  status?: string | null;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  summary: string;
  details?: Record<string, any>;
  idempotencyKey?: string;
}

export interface ZapierDispatchResult {
  delivered: boolean;
  statusCode?: number;
  deduplicated?: boolean;
  error?: string;
}

// In-memory deduplication cache with timestamps to prevent duplicate webhook dispatches
const deliveredEventsCache = new Map<string, number>();
const DEDUPLICATION_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

function cleanDeliveredCache() {
  const now = Date.now();
  deliveredEventsCache.forEach((timestamp, key) => {
    if (now - timestamp > DEDUPLICATION_WINDOW_MS) {
      deliveredEventsCache.delete(key);
    }
  });
}

export function getCleanZapierUrl(): string | null {
  const rawUrl = process.env.ZAPIER_WEBHOOK_URL;
  if (!rawUrl) return null;
  // Clean potential leading colons or whitespace from config copy-paste
  const cleaned = rawUrl.replace(/^:+/, '').trim();
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    return cleaned;
  }
  return null;
}

export function isZapierConfigured(): boolean {
  const url = getCleanZapierUrl();
  return Boolean(url && !url.includes('your-zapier'));
}

export async function dispatchZapierWebhook(
  payload: ZapierWebhookPayload,
  options: { force?: boolean } = {}
): Promise<ZapierDispatchResult> {
  const webhookUrl = getCleanZapierUrl();

  if (!webhookUrl) {
    return {
      delivered: false,
      error: 'ZAPIER_WEBHOOK_URL is not configured. Webhook dispatch bypassed.',
    };
  }

  // Generate deterministic idempotency key if not explicitly supplied
  const idempotencyKey =
    payload.idempotencyKey ||
    `${payload.event}:${payload.orderId}:${payload.status || ''}:${payload.summary}`;

  // Deduplication check: do not resend if this event was already delivered
  if (!options.force && deliveredEventsCache.has(idempotencyKey)) {
    console.log(`[Zapier Webhook] Deduplicated duplicate event for key: ${idempotencyKey}`);
    return {
      delivered: true,
      deduplicated: true,
      statusCode: 200,
    };
  }

  // Format canonical payload ensuring eventType, buyer details, and timestamps are always present
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Proofloop-Webhook-Dispatcher/1.0',
        'X-Proofloop-Event': payload.event,
        'X-Proofloop-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(bodyPayload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (res.ok) {
      // Record successful delivery for deduplication
      deliveredEventsCache.set(idempotencyKey, Date.now());
      cleanDeliveredCache();

      return {
        delivered: true,
        statusCode: res.status,
      };
    } else {
      return {
        delivered: false,
        statusCode: res.status,
        error: `Zapier returned HTTP ${res.status}: ${res.statusText}`,
      };
    }
  } catch (err: any) {
    // Graceful failure handling: Never throw or crash the main app
    console.error('[Zapier Webhook Error]', err.message || err);
    return {
      delivered: false,
      error: err.name === 'AbortError' ? 'Webhook request timed out after 8s' : err.message,
    };
  }
}
