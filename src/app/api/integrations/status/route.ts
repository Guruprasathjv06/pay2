import { NextResponse } from 'next/server';
import { getPayPalConfig } from '@/lib/paypal';
import { isChannel3Configured } from '@/lib/integrations/channel3';
import { isElasticConfigured } from '@/lib/integrations/elastic';
import { isZapierConfigured } from '@/lib/integrations/zapier';
import { isAstropodsConfigured, getAstropodsTelemetry } from '@/lib/integrations/astropods';
import { checkPostgresConnection } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const paypalConfig = getPayPalConfig();
  const hasPostgres = await checkPostgresConnection();
  const hasAiKey = Boolean(process.env.AI_API_KEY && process.env.AI_API_KEY.length > 5);
  const astropodsConfigured = isAstropodsConfigured();
  const channel3Configured = isChannel3Configured();
  const elasticConfigured = isElasticConfigured();
  const zapierConfigured = isZapierConfigured();
  const telemetry = getAstropodsTelemetry();

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    integrations: {
      paypal: {
        name: 'PayPal Sandbox Orders & Capture',
        status: paypalConfig.isConfigured ? 'CONNECTED' : 'UNCONFIGURED_FALLBACK',
        environment: paypalConfig.environment,
        clientIdMasked: paypalConfig.clientIdMasked,
        details: paypalConfig.isConfigured
          ? 'Live PayPal Sandbox API credentials active.'
          : 'Missing credentials. Demo Sandbox Simulation flow is enabled.',
      },
      aiAgent: {
        name: 'Guarded AI Engine (PromiseCheck & Drift)',
        status: hasAiKey ? 'CONNECTED' : 'DETERMINISTIC_FALLBACK',
        model: process.env.AI_MODEL || 'gpt-4o-mini',
        details: hasAiKey
          ? 'Server-side LLM provider active with strict fact-summarization guardrails.'
          : 'AI_API_KEY not set. Deterministic rule-based template engine active.',
      },
      astropods: {
        name: 'Astropods Agent Observability',
        status: astropodsConfigured ? 'CONNECTED' : 'LOCAL_OBSERVABILITY',
        details: astropodsConfigured
          ? 'Remote Astropods telemetry reporting active.'
          : 'Local agent telemetry logging active with read-only permission enforcement.',
        recentRunsCount: telemetry.length,
      },
      channel3: {
        name: 'Channel3 Product Discovery',
        status: channel3Configured ? 'CONNECTED' : 'FALLBACK_DATASET',
        details: channel3Configured
          ? 'Channel3 API live search active.'
          : 'CHANNEL3_API_KEY not set. Curated discovery catalog active.',
      },
      agGrid: {
        name: 'AG Grid Enterprise-Grade Analytics',
        status: 'CONNECTED',
        details: 'AG Grid Community React grid active with sorting, filtering, and natural-language query bar.',
      },
      bryntum: {
        name: 'Bryntum Milestone Timeline',
        status: 'CONNECTED',
        details: 'Interactive visual milestone timeline active for order progression and drift inspection.',
      },
      elastic: {
        name: 'Elastic Searchable Order Knowledge',
        status: elasticConfigured ? 'CONNECTED' : 'DATABASE_FALLBACK',
        details: elasticConfigured
          ? 'Elasticsearch cluster connected.'
          : 'ELASTICSEARCH_URL not set. Authoritative database search active.',
      },
      zapier: {
        name: 'Zapier Seller Webhooks',
        status: zapierConfigured ? 'CONNECTED' : 'OFFLINE',
        details: zapierConfigured
          ? 'Zapier webhook dispatcher active.'
          : 'ZAPIER_WEBHOOK_URL not configured. Webhooks bypassed.',
      },
      database: {
        name: 'Database (PostgreSQL / Prisma)',
        status: hasPostgres ? 'POSTGRES_CONNECTED' : 'IN_MEMORY_FALLBACK',
        details: hasPostgres
          ? 'PostgreSQL server connected via Prisma Client.'
          : 'PostgreSQL offline. Resilient in-memory/file fallback active.',
      },
    },
  });
}
