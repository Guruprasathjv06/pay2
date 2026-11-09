export type PaymentState = 'PENDING' | 'AUTHORIZED' | 'COMPLETED' | 'CANCELLED' | 'DECLINED' | 'FAILED';

export type FulfillmentState = 'PENDING_PROCESSING' | 'PROCESSING' | 'SHIPPED' | 'DELAYED' | 'DELIVERED' | 'CANCELLED';

export type DriftStatus = 'NONE' | 'DRIFT_DETECTED' | 'RESOLVED';

export type EventSource = 'PAYPAL_SANDBOX' | 'APP_ACTION' | 'AI_GUARDED_AGENT' | 'DEMO_SIMULATION' | 'ZAPIER_WEBHOOK';

export interface ShippingOption {
  id: string;
  name: string;
  priceCents: number;
  daysEstimate: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  priceCents: number;
  currency: string;
  imageUrl: string;
  stockCount: number;
  category: string;
  returnPolicy: string;
  deliveryEstimateDays: string;
  shippingOptions: ShippingOption[];
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PromiseCard {
  id: string;
  orderId: string;
  version: number;
  hash: string;
  productName: string;
  quantity: number;
  totalCents: number;
  currency: string;
  shippingOptionName: string;
  buyerRequirement?: string | null;
  sellerDeliveryEstimate: string;
  returnPolicySummary: string;
  warnings: string[];
  agreedAt: string;
  isImmutable: boolean;
  demoNotice: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  paypalOrderId?: string | null;
  paypalCaptureId?: string | null;
  status: PaymentState;
  amountCents: number;
  currency: string;
  paymentMethod: string;
  isSimulation: boolean;
  rawResponseJson?: string | null;
  idempotencyKey?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FulfillmentEvent {
  id: string;
  orderId: string;
  status: FulfillmentState;
  carrier?: string | null;
  trackingNumber?: string | null;
  note?: string | null;
  estimatedDelivery?: string | null;
  isSimulation: boolean;
  createdBy: string;
  createdAt: string;
}

export interface DriftAlert {
  id: string;
  orderId: string;
  fulfillmentEventId?: string | null;
  title: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  agreedSnapshot: {
    productName: string;
    shippingOption: string;
    buyerRequirement?: string | null;
    sellerDeliveryEstimate: string;
    returnPolicySummary: string;
  };
  currentUpdateSnapshot: {
    status: string;
    carrier?: string | null;
    trackingNumber?: string | null;
    estimatedDelivery?: string | null;
    note?: string | null;
  };
  mismatchExplanation: string;
  suggestedMessage: string;
  isResolved: boolean;
  resolvedAt?: string | null;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  orderId?: string | null;
  eventType: string;
  source: EventSource;
  description: string;
  metadata?: Record<string, any> | null;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  buyerName: string;
  buyerEmail: string;
  buyerRequirement?: string | null;
  productId: string;
  product?: Product;
  quantity: number;
  subtotalCents: number;
  shippingFeeCents: number;
  totalCents: number;
  currency: string;
  shippingOptionId: string;
  shippingOptionName: string;
  paymentState: PaymentState;
  fulfillmentState: FulfillmentState;
  driftStatus: DriftStatus;
  createdAt: string;
  updatedAt: string;

  promiseCard?: PromiseCard | null;
  payment?: Payment | null;
  fulfillmentEvents?: FulfillmentEvent[];
  driftAlerts?: DriftAlert[];
  auditEvents?: AuditEvent[];
}

export interface Channel3ProductResult {
  title: string;
  merchant: string;
  priceCents: number;
  currency: string;
  url: string;
  category: string;
  description: string;
  returnPolicy: string;
  deliveryEstimateDays: string;
  shippingOptions: ShippingOption[];
}
