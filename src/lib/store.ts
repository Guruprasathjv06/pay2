import { Product, Order, PromiseCard, Payment, FulfillmentEvent, DriftAlert, AuditEvent, EventSource, PaymentState, FulfillmentState, DriftStatus } from '../types';
import { SEEDED_PRODUCTS, INITIAL_ORDERS } from './seeded-data';

// Persistent in-memory state singleton for development / server runtime
declare global {
  // eslint-disable-next-line no-var
  var __proofloop_products: Product[] | undefined;
  // eslint-disable-next-line no-var
  var __proofloop_orders: Order[] | undefined;
  // eslint-disable-next-line no-var
  var __proofloop_audit_events: AuditEvent[] | undefined;
}

function initializeState() {
  if (!global.__proofloop_products) {
    global.__proofloop_products = JSON.parse(JSON.stringify(SEEDED_PRODUCTS));
  }
  if (!global.__proofloop_orders) {
    global.__proofloop_orders = JSON.parse(JSON.stringify(INITIAL_ORDERS));
  }
  if (!global.__proofloop_audit_events) {
    const allEvents: AuditEvent[] = [];
    for (const ord of global.__proofloop_orders || []) {
      if (ord.auditEvents) {
        allEvents.push(...ord.auditEvents);
      }
    }
    // Also add system initialization audit event
    allEvents.push({
      id: 'aud_sys_init',
      orderId: null,
      eventType: 'SYSTEM_BOOT',
      source: 'APP_ACTION',
      description: 'Proofloop environment initialized with verified demo catalog and sandbox rules.',
      createdAt: new Date().toISOString(),
    });
    global.__proofloop_audit_events = allEvents;
  }
}

initializeState();

export const Store = {
  reset(): void {
    global.__proofloop_products = JSON.parse(JSON.stringify(SEEDED_PRODUCTS));
    global.__proofloop_orders = JSON.parse(JSON.stringify(INITIAL_ORDERS));
    global.__proofloop_audit_events = undefined;
    initializeState();
  },

  async getProducts(): Promise<Product[]> {
    initializeState();
    return global.__proofloop_products || [];
  },

  async getProductById(id: string): Promise<Product | null> {
    initializeState();
    const prod = (global.__proofloop_products || []).find(p => p.id === id || p.sku === id);
    return prod || null;
  },

  async addProduct(product: Product): Promise<Product> {
    initializeState();
    global.__proofloop_products?.push(product);
    return product;
  },

  async getOrders(): Promise<Order[]> {
    initializeState();
    // Return sorted newest first
    return [...(global.__proofloop_orders || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async getOrderById(id: string): Promise<Order | null> {
    initializeState();
    const order = (global.__proofloop_orders || []).find(o => o.id === id || o.orderNumber === id);
    if (!order) return null;

    // Attach product if missing
    if (!order.product && order.productId) {
      order.product = (await this.getProductById(order.productId)) || undefined;
    }
    return order;
  },

  async createOrder(data: {
    buyerName: string;
    buyerEmail: string;
    buyerRequirement?: string | null;
    productId: string;
    quantity: number;
    subtotalCents: number;
    shippingFeeCents: number;
    totalCents: number;
    currency: string;
    shippingOptionId: string;
    shippingOptionName: string;
  }): Promise<Order> {
    initializeState();
    const product = await this.getProductById(data.productId);
    const orderCount = (global.__proofloop_orders || []).length;
    const orderNumber = `PLF-${1120 + orderCount}`;
    const id = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newOrder: Order = {
      id,
      orderNumber,
      buyerName: data.buyerName,
      buyerEmail: data.buyerEmail,
      buyerRequirement: data.buyerRequirement || null,
      productId: data.productId,
      product: product || undefined,
      quantity: data.quantity,
      subtotalCents: data.subtotalCents,
      shippingFeeCents: data.shippingFeeCents,
      totalCents: data.totalCents,
      currency: data.currency,
      shippingOptionId: data.shippingOptionId,
      shippingOptionName: data.shippingOptionName,
      paymentState: 'PENDING',
      fulfillmentState: 'PENDING_PROCESSING',
      driftStatus: 'NONE',
      createdAt: now,
      updatedAt: now,
      promiseCard: null,
      payment: null,
      fulfillmentEvents: [],
      driftAlerts: [],
      auditEvents: [],
    };

    global.__proofloop_orders?.unshift(newOrder);

    await this.addAuditEvent({
      orderId: newOrder.id,
      eventType: 'ORDER_CREATED',
      source: 'APP_ACTION',
      description: `Draft order ${orderNumber} created for buyer ${data.buyerName}.`,
    });

    return newOrder;
  },

  async savePromiseCard(orderId: string, card: Omit<PromiseCard, 'id' | 'orderId' | 'createdAt'>): Promise<PromiseCard> {
    initializeState();
    const order = await this.getOrderById(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    const promiseCard: PromiseCard = {
      ...card,
      id: `pc_${Date.now()}`,
      orderId,
      createdAt: new Date().toISOString(),
      isImmutable: true,
    };

    order.promiseCard = promiseCard;
    order.updatedAt = new Date().toISOString();

    await this.addAuditEvent({
      orderId,
      eventType: 'PROMISE_CARD_AGREED',
      source: 'APP_ACTION',
      description: `Buyer confirmed Promise Card v${promiseCard.version} (Hash: ${promiseCard.hash}). Agreement is now immutable.`,
    });

    return promiseCard;
  },

  async recordPayment(orderId: string, paymentData: {
    paypalOrderId?: string | null;
    paypalCaptureId?: string | null;
    status: PaymentState;
    amountCents: number;
    currency: string;
    paymentMethod: string;
    isSimulation: boolean;
    rawResponse?: any;
    idempotencyKey?: string | null;
  }): Promise<Payment> {
    initializeState();
    const order = await this.getOrderById(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    const payment: Payment = {
      id: `pay_${Date.now()}`,
      orderId,
      paypalOrderId: paymentData.paypalOrderId || null,
      paypalCaptureId: paymentData.paypalCaptureId || null,
      status: paymentData.status,
      amountCents: paymentData.amountCents,
      currency: paymentData.currency,
      paymentMethod: paymentData.paymentMethod,
      isSimulation: paymentData.isSimulation,
      rawResponseJson: paymentData.rawResponse ? JSON.stringify(paymentData.rawResponse) : null,
      idempotencyKey: paymentData.idempotencyKey || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    order.payment = payment;
    order.paymentState = paymentData.status;
    order.updatedAt = new Date().toISOString();

    const source: EventSource = paymentData.isSimulation ? 'DEMO_SIMULATION' : 'PAYPAL_SANDBOX';
    const desc = paymentData.isSimulation
      ? `Simulated Sandbox Payment recorded for $${(paymentData.amountCents / 100).toFixed(2)} ${paymentData.currency}.`
      : `PayPal Sandbox captured $${(paymentData.amountCents / 100).toFixed(2)} ${paymentData.currency} (Capture ID: ${paymentData.paypalCaptureId}).`;

    await this.addAuditEvent({
      orderId,
      eventType: 'PAYMENT_CAPTURED',
      source,
      description: desc,
      metadata: {
        paypalCaptureId: paymentData.paypalCaptureId,
        amountCents: paymentData.amountCents,
        isSimulation: paymentData.isSimulation,
      },
    });

    return payment;
  },

  async addFulfillmentEvent(orderId: string, eventData: {
    status: FulfillmentState;
    carrier?: string | null;
    trackingNumber?: string | null;
    note?: string | null;
    estimatedDelivery?: string | null;
    createdBy?: string;
  }): Promise<FulfillmentEvent> {
    initializeState();
    const order = await this.getOrderById(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    const event: FulfillmentEvent = {
      id: `fe_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      orderId,
      status: eventData.status,
      carrier: eventData.carrier || null,
      trackingNumber: eventData.trackingNumber || null,
      note: eventData.note || null,
      estimatedDelivery: eventData.estimatedDelivery || null,
      isSimulation: true,
      createdBy: eventData.createdBy || 'Seller Demo Console',
      createdAt: new Date().toISOString(),
    };

    if (!order.fulfillmentEvents) order.fulfillmentEvents = [];
    order.fulfillmentEvents.push(event);
    order.fulfillmentState = eventData.status;
    order.updatedAt = new Date().toISOString();

    await this.addAuditEvent({
      orderId,
      eventType: `FULFILLMENT_${eventData.status}`,
      source: 'DEMO_SIMULATION',
      description: `Fulfillment status updated to ${eventData.status}${eventData.carrier ? ` via ${eventData.carrier}` : ''}${eventData.trackingNumber ? ` (${eventData.trackingNumber})` : ''}.`,
      metadata: eventData,
    });

    return event;
  },

  async addDriftAlert(orderId: string, alertData: Omit<DriftAlert, 'id' | 'orderId' | 'createdAt' | 'isResolved'>): Promise<DriftAlert> {
    initializeState();
    const order = await this.getOrderById(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    const alert: DriftAlert = {
      ...alertData,
      id: `da_${Date.now()}`,
      orderId,
      isResolved: false,
      resolvedAt: null,
      createdAt: new Date().toISOString(),
    };

    if (!order.driftAlerts) order.driftAlerts = [];
    order.driftAlerts.push(alert);
    order.driftStatus = 'DRIFT_DETECTED';
    order.updatedAt = new Date().toISOString();

    await this.addAuditEvent({
      orderId,
      eventType: 'PROMISE_DRIFT_DETECTED',
      source: 'AI_GUARDED_AGENT',
      description: `Promise Drift Detector flagged: ${alert.title}`,
      metadata: {
        alertId: alert.id,
        severity: alert.severity,
        mismatchExplanation: alert.mismatchExplanation,
      },
    });

    return alert;
  },

  async resolveDriftAlert(orderId: string, alertId: string): Promise<DriftAlert | null> {
    initializeState();
    const order = await this.getOrderById(orderId);
    if (!order || !order.driftAlerts) return null;

    const alert = order.driftAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.isResolved = true;
      alert.resolvedAt = new Date().toISOString();
      // If no unresolved alerts remain, mark driftStatus RESOLVED
      const hasUnresolved = order.driftAlerts.some(a => !a.isResolved);
      if (!hasUnresolved) {
        order.driftStatus = 'RESOLVED';
      }
      order.updatedAt = new Date().toISOString();

      await this.addAuditEvent({
        orderId,
        eventType: 'DRIFT_RESOLVED',
        source: 'APP_ACTION',
        description: `Seller resolved drift alert "${alert.title}".`,
      });
    }
    return alert || null;
  },

  async addAuditEvent(eventData: {
    orderId?: string | null;
    eventType: string;
    source: EventSource;
    description: string;
    metadata?: Record<string, any> | null;
  }): Promise<AuditEvent> {
    initializeState();
    const event: AuditEvent = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      orderId: eventData.orderId || null,
      eventType: eventData.eventType,
      source: eventData.source,
      description: eventData.description,
      metadata: eventData.metadata || null,
      createdAt: new Date().toISOString(),
    };

    if (!global.__proofloop_audit_events) {
      global.__proofloop_audit_events = [];
    }
    global.__proofloop_audit_events.unshift(event);

    // Also attach to order if matching
    if (eventData.orderId && global.__proofloop_orders) {
      const order = global.__proofloop_orders.find(o => o.id === eventData.orderId);
      if (order) {
        if (!order.auditEvents) order.auditEvents = [];
        order.auditEvents.push(event);
      }
    }

    return event;
  },

  async getAuditEvents(filter?: { orderId?: string; source?: EventSource }): Promise<AuditEvent[]> {
    initializeState();
    let events = global.__proofloop_audit_events || [];
    if (filter?.orderId) {
      events = events.filter(e => e.orderId === filter.orderId);
    }
    if (filter?.source) {
      events = events.filter(e => e.source === filter.source);
    }
    return [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
};
