import { Store } from '../store';

export interface ElasticSearchResultItem {
  id: string;
  orderNumber: string;
  buyerName: string;
  productName: string;
  snippet: string;
  score: number;
  sourceType: 'promise_card' | 'fulfillment_event' | 'drift_alert' | 'policy';
  sourceRecordId: string;
}

export function isElasticConfigured(): boolean {
  const url = process.env.ELASTICSEARCH_URL;
  const key = process.env.ELASTICSEARCH_API_KEY;
  const user = process.env.ELASTICSEARCH_USERNAME;
  const pass = process.env.ELASTICSEARCH_PASSWORD;
  return Boolean(url && url.length > 5 && ((key && key.length > 5) || (user && pass)));
}

export function getElasticAuthHeader(): string | null {
  if (process.env.ELASTICSEARCH_API_KEY) {
    const key = process.env.ELASTICSEARCH_API_KEY.trim();
    if (key.startsWith('ApiKey ') || key.startsWith('Basic ')) {
      return key;
    }
    return `ApiKey ${key}`;
  }
  if (process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD) {
    const token = Buffer.from(
      `${process.env.ELASTICSEARCH_USERNAME}:${process.env.ELASTICSEARCH_PASSWORD}`
    ).toString('base64');
    return `Basic ${token}`;
  }
  return null;
}

export async function searchOrderKnowledge(query: string): Promise<{
  query: string;
  source: 'elasticsearch' | 'database_search';
  results: ElasticSearchResultItem[];
  citedRecords: { id: string; title: string; category: string }[];
}> {
  const q = query.toLowerCase().trim();

  // If remote Elastic is configured:
  if (isElasticConfigured()) {
    try {
      const url = `${process.env.ELASTICSEARCH_URL}/proofloop_orders/_search`;
      const authHeader = getElasticAuthHeader();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authHeader) {
        headers['Authorization'] = authHeader;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: {
            multi_match: {
              query: q,
              fields: ['productName^2', 'buyerRequirement', 'returnPolicy', 'notes', 'orderNumber'],
            },
          },
          size: 10,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const hits = data.hits?.hits || [];
        const results: ElasticSearchResultItem[] = hits.map((hit: any) => ({
          id: hit._id,
          orderNumber: hit._source.orderNumber || 'N/A',
          buyerName: hit._source.buyerName || 'Anonymous',
          productName: hit._source.productName || 'Product',
          snippet: hit._source.snippet || hit._source.returnPolicy || '',
          score: hit._score || 1.0,
          sourceType: hit._source.sourceType || 'promise_card',
          sourceRecordId: hit._id,
        }));

        return {
          query,
          source: 'elasticsearch',
          results,
          citedRecords: results.map(r => ({
            id: r.sourceRecordId,
            title: `${r.orderNumber}: ${r.productName}`,
            category: r.sourceType,
          })),
        };
      }
    } catch {
      // Fall through to database search
    }
  }

  // Authoritative Database search fallback
  const orders = await Store.getOrders();
  const results: ElasticSearchResultItem[] = [];

  for (const o of orders) {
    let match = false;
    let snippet = '';
    let sourceType: ElasticSearchResultItem['sourceType'] = 'promise_card';

    if (o.orderNumber.toLowerCase().includes(q)) {
      match = true;
      snippet = `Order ${o.orderNumber} placed by ${o.buyerName}`;
    } else if (o.buyerName.toLowerCase().includes(q)) {
      match = true;
      snippet = `Buyer ${o.buyerName} (${o.buyerEmail})`;
    } else if (o.promiseCard?.productName.toLowerCase().includes(q)) {
      match = true;
      snippet = `Agreed product: "${o.promiseCard.productName}" (Shipping: ${o.promiseCard.shippingOptionName})`;
      sourceType = 'promise_card';
    } else if (o.promiseCard?.buyerRequirement?.toLowerCase().includes(q)) {
      match = true;
      snippet = `Buyer stipulation: "${o.promiseCard.buyerRequirement}"`;
      sourceType = 'promise_card';
    } else if (o.promiseCard?.returnPolicySummary.toLowerCase().includes(q)) {
      match = true;
      snippet = `Store Policy: "${o.promiseCard.returnPolicySummary}"`;
      sourceType = 'policy';
    } else if (o.driftAlerts?.some(a => a.mismatchExplanation.toLowerCase().includes(q) || a.title.toLowerCase().includes(q))) {
      match = true;
      const alert = o.driftAlerts.find(a => a.mismatchExplanation.toLowerCase().includes(q) || a.title.toLowerCase().includes(q));
      snippet = `Promise Drift: ${alert?.title} - ${alert?.mismatchExplanation}`;
      sourceType = 'drift_alert';
    } else if (o.fulfillmentEvents?.some(f => f.note?.toLowerCase().includes(q) || f.trackingNumber?.toLowerCase().includes(q))) {
      match = true;
      const f = o.fulfillmentEvents.find(fe => fe.note?.toLowerCase().includes(q) || fe.trackingNumber?.toLowerCase().includes(q));
      snippet = `Fulfillment event (${f?.status}): ${f?.note || f?.trackingNumber}`;
      sourceType = 'fulfillment_event';
    }

    if (match || !q) {
      results.push({
        id: o.id,
        orderNumber: o.orderNumber,
        buyerName: o.buyerName,
        productName: o.promiseCard?.productName || o.product?.name || 'Demo Item',
        snippet: snippet || `Order ${o.orderNumber} status: ${o.fulfillmentState}`,
        score: match ? 1.0 : 0.5,
        sourceType,
        sourceRecordId: o.id,
      });
    }
  }

  return {
    query,
    source: 'database_search',
    results,
    citedRecords: results.map(r => ({
      id: r.id,
      title: `${r.orderNumber}: ${r.productName}`,
      category: r.sourceType,
    })),
  };
}

export async function indexOrderToElastic(order: {
  id: string;
  orderNumber: string;
  buyerName: string;
  productName?: string;
  buyerRequirement?: string;
  returnPolicy?: string;
  snippet?: string;
  sourceType?: string;
}): Promise<boolean> {
  if (!isElasticConfigured()) return false;
  try {
    const url = `${process.env.ELASTICSEARCH_URL}/proofloop_orders/_doc/${order.id}`;
    const authHeader = getElasticAuthHeader();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authHeader) headers['Authorization'] = authHeader;

    const res = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        orderNumber: order.orderNumber,
        buyerName: order.buyerName,
        productName: order.productName || 'Order Item',
        buyerRequirement: order.buyerRequirement || '',
        returnPolicy: order.returnPolicy || '',
        snippet: order.snippet || `Order ${order.orderNumber}`,
        sourceType: order.sourceType || 'promise_card',
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
