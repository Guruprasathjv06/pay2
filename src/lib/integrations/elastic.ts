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
  return Boolean(url && key && url.length > 5 && key.length > 5);
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
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `ApiKey ${process.env.ELASTICSEARCH_API_KEY}`,
          'Content-Type': 'application/json',
        },
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
