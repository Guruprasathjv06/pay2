export interface ZapierWebhookPayload {
  event: 'PAYMENT_CAPTURED' | 'PROMISE_DRIFT_DETECTED' | 'FULFILLMENT_UPDATED';
  timestamp: string;
  orderNumber: string;
  orderId: string;
  productName: string;
  amountFormatted: string;
  currency: string;
  status: string;
  summary: string;
}

export function isZapierConfigured(): boolean {
  const url = process.env.ZAPIER_WEBHOOK_URL;
  return Boolean(url && url.startsWith('http') && !url.includes('your-zapier'));
}

export async function dispatchZapierWebhook(payload: ZapierWebhookPayload): Promise<{
  delivered: boolean;
  statusCode?: number;
  error?: string;
}> {
  const webhookUrl = process.env.ZAPIER_WEBHOOK_URL;

  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return {
      delivered: false,
      error: 'ZAPIER_WEBHOOK_URL is not configured. Webhook dispatch bypassed.',
    };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Proofloop-Webhook-Dispatcher/1.0',
      },
      body: JSON.stringify(payload),
    });

    return {
      delivered: res.ok,
      statusCode: res.status,
      error: res.ok ? undefined : `Zapier returned HTTP ${res.status}`,
    };
  } catch (err: any) {
    return {
      delivered: false,
      error: err.message || 'Network error reaching Zapier webhook URL',
    };
  }
}
