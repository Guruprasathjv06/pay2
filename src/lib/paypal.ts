export interface PayPalConfigStatus {
  isConfigured: boolean;
  environment: 'sandbox' | 'production';
  clientIdMasked: string | null;
}

export function getPayPalConfig(): PayPalConfigStatus {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const isConfigured = Boolean(
    clientId &&
    clientSecret &&
    clientId !== 'your-paypal-sandbox-client-id' &&
    !clientId.includes('your-')
  );

  return {
    isConfigured,
    environment: (process.env.PAYPAL_ENV as any) || 'sandbox',
    clientIdMasked: clientId
      ? `${clientId.substring(0, 6)}...${clientId.substring(clientId.length - 4)}`
      : null,
  };
}

const PAYPAL_BASE_URL =
  process.env.PAYPAL_ENV === 'production'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal Sandbox credentials are not configured.');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to authenticate with PayPal Sandbox: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function createPayPalOrder(params: {
  orderNumber: string;
  amountCents: number;
  currency: string;
  description: string;
}): Promise<{ paypalOrderId: string }> {
  const accessToken = await getAccessToken();

  const formattedAmount = (params.amountCents / 100).toFixed(2);

  const payload = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: params.orderNumber,
        description: params.description,
        amount: {
          currency_code: params.currency,
          value: formattedAmount,
        },
      },
    ],
    application_context: {
      brand_name: 'Proofloop Demo Store',
      landing_page: 'NO_PREFERENCE',
      user_action: 'PAY_NOW',
      return_url: `${process.env.APP_BASE_URL || 'http://localhost:3000'}/checkout/success`,
      cancel_url: `${process.env.APP_BASE_URL || 'http://localhost:3000'}/checkout/cancel`,
    },
  };

  const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`PayPal order creation failed: ${JSON.stringify(errorData)}`);
  }

  const orderData = await response.json();
  return { paypalOrderId: orderData.id };
}

export async function capturePayPalOrder(paypalOrderId: string): Promise<{
  captureId: string;
  status: string;
  amount: string;
  currency: string;
  rawResponse: any;
}> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  const captureData = await response.json();

  if (!response.ok) {
    throw new Error(`PayPal capture failed (${response.status}): ${JSON.stringify(captureData)}`);
  }

  const capture = captureData.purchase_units?.[0]?.payments?.captures?.[0];
  const captureId = capture?.id || captureData.id;
  const status = capture?.status || captureData.status;
  const amount = capture?.amount?.value || '0.00';
  const currency = capture?.amount?.currency_code || 'USD';

  if (status !== 'COMPLETED') {
    throw new Error(`PayPal capture was not completed. Status: ${status}`);
  }

  return {
    captureId,
    status,
    amount,
    currency,
    rawResponse: captureData,
  };
}
