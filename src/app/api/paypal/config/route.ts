import { NextResponse } from 'next/server';
import { getPayPalConfig } from '../../../../lib/paypal';

export async function GET() {
  const config = getPayPalConfig();
  return NextResponse.json({
    isConfigured: config.isConfigured,
    environment: config.environment,
    clientId: config.isConfigured ? process.env.PAYPAL_CLIENT_ID : null,
  });
}
