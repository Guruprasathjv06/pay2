export interface AstropodsTelemetryEvent {
  runId: string;
  agentName: string;
  action: 'PROMISE_CHECK' | 'DRIFT_ANALYSIS';
  inputSummary: string;
  outputSummary: string;
  latencyMs: number;
  status: 'SUCCESS' | 'FALLBACK' | 'ERROR';
  readOnlyEnforced: boolean;
  timestamp: string;
}

// In-memory telemetry log for local demo and observability inspection
declare global {
  // eslint-disable-next-line no-var
  var __astropods_telemetry: AstropodsTelemetryEvent[] | undefined;
}

if (!global.__astropods_telemetry) {
  global.__astropods_telemetry = [];
}

export function recordAstropodsRun(event: Omit<AstropodsTelemetryEvent, 'runId' | 'timestamp'>): AstropodsTelemetryEvent {
  const telemetry: AstropodsTelemetryEvent = {
    ...event,
    runId: `run_astro_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
  };

  if (!global.__astropods_telemetry) {
    global.__astropods_telemetry = [];
  }
  global.__astropods_telemetry.unshift(telemetry);

  // Keep last 50 events in memory
  if (global.__astropods_telemetry.length > 50) {
    global.__astropods_telemetry.pop();
  }

  // If Astropods API Key is configured in environment, dispatch to remote Astropods endpoint asynchronously
  const apiKey = process.env.ASTROPODS_API_KEY;
  if (apiKey) {
    // Non-blocking telemetry push
    fetch('https://api.astropods.ai/v1/telemetry', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(telemetry),
    }).catch(() => {
      // Telemetry error must never block user operations
    });
  }

  return telemetry;
}

export function getAstropodsTelemetry(): AstropodsTelemetryEvent[] {
  return global.__astropods_telemetry || [];
}

export function isAstropodsConfigured(): boolean {
  return Boolean(process.env.ASTROPODS_API_KEY && process.env.ASTROPODS_API_KEY.length > 5);
}
