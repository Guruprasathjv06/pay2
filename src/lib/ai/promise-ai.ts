import { recordAstropodsRun } from '../integrations/astropods';

export interface GeneratePromiseCardInput {
  productName: string;
  quantity: number;
  totalCents: number;
  currency: string;
  shippingOptionName: string;
  shippingOptionDaysEstimate: string;
  buyerRequirement?: string | null;
  sellerDeliveryEstimateDays: string;
  sellerReturnPolicy: string;
}

export interface GeneratedPromiseCardResult {
  sellerDeliveryEstimate: string;
  returnPolicySummary: string;
  warnings: string[];
  hash: string;
  isAiGenerated: boolean;
}

export interface DetectDriftInput {
  promiseCard: {
    productName: string;
    shippingOptionName: string;
    buyerRequirement?: string | null;
    sellerDeliveryEstimate: string;
    returnPolicySummary: string;
  };
  fulfillmentUpdate: {
    status: string;
    carrier?: string | null;
    trackingNumber?: string | null;
    estimatedDelivery?: string | null;
    note?: string | null;
  };
  previousStatus?: string;
}

export interface DriftDetectionResult {
  hasDrift: boolean;
  title: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  mismatchExplanation: string;
  suggestedMessage: string;
  isAiGenerated: boolean;
  citedPolicySnippet?: string;
}

// Compute deterministic integrity hash for immutable agreement
function computeCardHash(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `plp_${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

export async function generatePromiseCard(input: GeneratePromiseCardInput): Promise<GeneratedPromiseCardResult> {
  const startTime = Date.now();
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.AI_MODEL || 'gpt-4o-mini';

  // Rule-based deterministic baseline
  const warnings: string[] = [];
  const reqLower = (input.buyerRequirement || '').toLowerCase();

  // Inspect buyer requirement vs shipping speed
  if (
    (reqLower.includes('urgent') || reqLower.includes('asap') || reqLower.includes('tomorrow') || reqLower.includes('friday') || reqLower.includes('before')) &&
    (input.shippingOptionName.toLowerCase().includes('standard') || input.shippingOptionDaysEstimate.includes('5') || input.shippingOptionDaysEstimate.includes('6'))
  ) {
    warnings.push(
      `Buyer noted an urgent requirement ("${input.buyerRequirement}"), but selected "${input.shippingOptionName}" which typically takes ${input.shippingOptionDaysEstimate}. Consider selecting an expedited shipping option.`
    );
  }

  let sellerDeliveryEstimate = `${input.shippingOptionDaysEstimate} (Seller processing + ${input.shippingOptionName})`;
  let returnPolicySummary = input.sellerReturnPolicy.length > 180
    ? `${input.sellerReturnPolicy.substring(0, 177)}...`
    : input.sellerReturnPolicy;

  let isAiGenerated = false;

  if (apiKey && apiKey.length > 5) {
    try {
      const prompt = `You are a guarded e-commerce AI assistant for Proofloop.
Summarize the agreed delivery estimate and return policy for an immutable Promise Card.
Strict rules:
1. Simplify and summarize ONLY the supplied facts below.
2. DO NOT invent delivery dates, stock counts, legal guarantees, or warranty terms.
3. Keep summaries concise and factual (under 2 sentences each).

Supplied Facts:
- Product: ${input.productName}
- Shipping Option Chosen: ${input.shippingOptionName} (${input.shippingOptionDaysEstimate})
- Seller Standard Delivery: ${input.sellerDeliveryEstimateDays}
- Buyer Requirement Note: "${input.buyerRequirement || 'None specified'}"
- Seller Return Policy: "${input.sellerReturnPolicy}"

Output strictly in JSON format:
{
  "sellerDeliveryEstimate": "concise delivery estimate summary",
  "returnPolicySummary": "concise return policy summary",
  "additionalWarning": "string warning if shipping option cannot satisfy buyer note, or null"
}`;

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          response_format: { type: 'json_object' },
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const content = json.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          if (parsed.sellerDeliveryEstimate) sellerDeliveryEstimate = parsed.sellerDeliveryEstimate;
          if (parsed.returnPolicySummary) returnPolicySummary = parsed.returnPolicySummary;
          if (parsed.additionalWarning && !warnings.includes(parsed.additionalWarning)) {
            warnings.push(parsed.additionalWarning);
          }
          isAiGenerated = true;
        }
      }
    } catch {
      // Deterministic fallback stays intact
    }
  }

  const hashContent = `${input.productName}|${input.quantity}|${input.totalCents}|${input.shippingOptionName}|${input.buyerRequirement || ''}|${sellerDeliveryEstimate}|${returnPolicySummary}`;
  const hash = computeCardHash(hashContent);

  // Record Astropods agent telemetry
  recordAstropodsRun({
    agentName: 'Proofloop PromiseCheck Agent',
    action: 'PROMISE_CHECK',
    inputSummary: `${input.productName} x${input.quantity} with ${input.shippingOptionName}`,
    outputSummary: `Generated Promise Card (Hash: ${hash}, Warnings: ${warnings.length})`,
    latencyMs: Date.now() - startTime,
    status: isAiGenerated ? 'SUCCESS' : 'FALLBACK',
    readOnlyEnforced: true,
  });

  return {
    sellerDeliveryEstimate,
    returnPolicySummary,
    warnings,
    hash,
    isAiGenerated,
  };
}

export async function detectPromiseDrift(input: DetectDriftInput): Promise<DriftDetectionResult> {
  const startTime = Date.now();
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.AI_MODEL || 'gpt-4o-mini';

  const { promiseCard, fulfillmentUpdate, previousStatus } = input;
  const reqLower = (promiseCard.buyerRequirement || '').toLowerCase();
  const noteLower = (fulfillmentUpdate.note || '').toLowerCase();
  const carrierLower = (fulfillmentUpdate.carrier || '').toLowerCase();

  let hasDrift = false;
  let title = 'No Promise Drift Detected';
  let severity: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO';
  let mismatchExplanation = 'Fulfillment strictly conforms to confirmed Promise Card.';
  let suggestedMessage = 'No intervention required. Order milestone matches the agreed commitment.';
  let citedPolicySnippet = promiseCard.returnPolicySummary;
  let isAiGenerated = false;

  // Check 1: Premature delivery without shipping
  if (fulfillmentUpdate.status === 'DELIVERED' && previousStatus === 'PENDING_PROCESSING') {
    hasDrift = true;
    title = 'Premature Status Transition: Delivered without Prior Dispatch';
    severity = 'CRITICAL';
    mismatchExplanation = 'The order was marked as DELIVERED directly from PENDING_PROCESSING without a recorded carrier pickup or tracking number.';
    suggestedMessage = 'Attention Buyer & Seller: Order PLF record shows a sudden Delivered status without carrier dispatch tracking. Please confirm physical receipt or update carrier tracking details.';
  }

  // Check 2: Fulfillment reported DELAYED
  else if (fulfillmentUpdate.status === 'DELAYED') {
    hasDrift = true;
    title = 'Promise Drift: Delivery Postponed Past Agreed Schedule';
    severity = reqLower.includes('urgent') || reqLower.includes('before') || reqLower.includes('friday') ? 'CRITICAL' : 'WARNING';
    mismatchExplanation = `The fulfillment update reported a delay: "${fulfillmentUpdate.note || 'Revised delivery date'}". The agreed Promise Card specified: "${promiseCard.sellerDeliveryEstimate}".${promiseCard.buyerRequirement ? ` Buyer required: "${promiseCard.buyerRequirement}".` : ''}`;
    suggestedMessage = `Hello, regarding your order for "${promiseCard.productName}": our fulfillment update indicates a delivery schedule revision (${fulfillmentUpdate.note || 'delay in transit'}). As agreed in our store policy ("${promiseCard.returnPolicySummary}"), we want to ensure you are informed promptly. Please reply if you would like to request priority courier upgrade or discuss alternative arrangements.`;
  }

  // Check 3: Carrier method mismatch (e.g. promised air, dispatched ground)
  else if (
    promiseCard.shippingOptionName.toLowerCase().includes('air') &&
    (carrierLower.includes('ground') || carrierLower.includes('economy'))
  ) {
    hasDrift = true;
    title = 'Shipping Method Drift: Carrier Service Tier Mismatch';
    severity = 'WARNING';
    mismatchExplanation = `The confirmed Promise Card stipulated expedited air transit ("${promiseCard.shippingOptionName}"), but carrier tracking indicates standard surface service ("${fulfillmentUpdate.carrier || 'Ground'}").`;
    suggestedMessage = `Hello, we noticed carrier tracking was assigned to ${fulfillmentUpdate.carrier || 'Ground service'} instead of your agreed ${promiseCard.shippingOptionName}. Under our on-time delivery commitment, we will review a partial postage refund for the service difference if delivery is affected.`;
  }

  // Check 4: Date comparison if estimated delivery provided
  else if (fulfillmentUpdate.estimatedDelivery) {
    const estimatedDate = new Date(fulfillmentUpdate.estimatedDelivery);
    // If buyer requirement contains Friday / specific date and estimated delivery is past it
    if ((reqLower.includes('friday') || reqLower.includes('urgent')) && !isNaN(estimatedDate.getTime())) {
      // Check day of week or delay note
      if (noteLower.includes('delay') || noteLower.includes('postpone') || noteLower.includes('revised')) {
        hasDrift = true;
        title = 'Delivery Milestone Date Conflict with Buyer Need';
        severity = 'CRITICAL';
        mismatchExplanation = `The updated delivery estimate of ${estimatedDate.toLocaleDateString()} conflicts with the buyer's requirement ("${promiseCard.buyerRequirement}").`;
        suggestedMessage = `Dear Customer, we apologize for the shift in your delivery timetable to ${estimatedDate.toLocaleDateString()}. Please let us know if this misses your event deadline so we can explore immediate courier rerouting.`;
      }
    }
  }

  // If AI credentials available, enrich the explanation and draft message safely
  if (hasDrift && apiKey && apiKey.length > 5) {
    try {
      const prompt = `You are a guarded e-commerce AI assistant for Proofloop.
A Promise Drift has been detected between an immutable buyer-approved Promise Card and a recent fulfillment update.
Analyze the mismatch and draft a calm, professional customer service message.

Strict Guardrails:
1. DO NOT decide disputes or declare who is at fault.
2. DO NOT claim legal authority or declare legal rights.
3. DO NOT promise automatic refunds or alter payment status.
4. Base all guidance strictly on the seller's published policy provided below.
5. Emphasize that this draft is for human review and action.

Agreed Promise Card:
- Product: ${promiseCard.productName}
- Agreed Shipping: ${promiseCard.shippingOptionName}
- Delivery Commitment: ${promiseCard.sellerDeliveryEstimate}
- Buyer Stated Need: "${promiseCard.buyerRequirement || 'None'}"
- Published Store Policy: "${promiseCard.returnPolicySummary}"

Latest Fulfillment Update:
- Status: ${fulfillmentUpdate.status}
- Carrier: ${fulfillmentUpdate.carrier || 'Unassigned'}
- Tracking: ${fulfillmentUpdate.trackingNumber || 'None'}
- Estimated Delivery: ${fulfillmentUpdate.estimatedDelivery || 'Unspecified'}
- Seller/Warehouse Note: "${fulfillmentUpdate.note || 'None'}"

Output strictly in JSON:
{
  "mismatchExplanation": "objective 1-2 sentence comparison of agreed vs current status",
  "suggestedMessage": "polite 2-3 sentence message for buyer/seller review citing published store policy",
  "citedPolicySnippet": "short exact phrase from the seller return/delivery policy relevant to this situation"
}`;

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          response_format: { type: 'json_object' },
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const content = json.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          if (parsed.mismatchExplanation) mismatchExplanation = parsed.mismatchExplanation;
          if (parsed.suggestedMessage) suggestedMessage = parsed.suggestedMessage;
          if (parsed.citedPolicySnippet) citedPolicySnippet = parsed.citedPolicySnippet;
          isAiGenerated = true;
        }
      }
    } catch {
      // Fallback message stays active
    }
  }

  // Record Astropods agent telemetry
  recordAstropodsRun({
    agentName: 'Proofloop Promise Drift Detector Agent',
    action: 'DRIFT_ANALYSIS',
    inputSummary: `Comparing order status ${fulfillmentUpdate.status} vs ${promiseCard.shippingOptionName}`,
    outputSummary: hasDrift ? `Drift Flagged: ${title} (${severity})` : 'No Drift Detected',
    latencyMs: Date.now() - startTime,
    status: isAiGenerated ? 'SUCCESS' : 'FALLBACK',
    readOnlyEnforced: true,
  });

  return {
    hasDrift,
    title,
    severity,
    mismatchExplanation,
    suggestedMessage,
    isAiGenerated,
    citedPolicySnippet,
  };
}
