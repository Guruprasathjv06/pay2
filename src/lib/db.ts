import { PrismaClient } from '@prisma/client';
import { Store } from './store';

// Global Prisma instance for Next.js hot-reloading
const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

let isPostgresAvailable: boolean | null = null;

export async function checkPostgresConnection(): Promise<boolean> {
  if (isPostgresAvailable === true) return true;
  try {
    await prisma.$queryRaw`SELECT 1`;
    isPostgresAvailable = true;
    return true;
  } catch (err) {
    return false;
  }
}

// Unified repository that delegates to PostgreSQL Prisma when alive, or high-fidelity Store
export const db = {
  products: {
    async findMany() {
      const hasPg = await checkPostgresConnection();
      if (hasPg) {
        try {
          const prods = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
          return prods.map(p => ({
            ...p,
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
            shippingOptions: JSON.parse(p.shippingOptionsJson || '[]'),
          }));
        } catch {
          // fallback
        }
      }
      return Store.getProducts();
    },

    async findUnique(id: string) {
      const hasPg = await checkPostgresConnection();
      if (hasPg) {
        try {
          const p = await prisma.product.findFirst({
            where: { OR: [{ id }, { sku: id }] },
          });
          if (p) {
            return {
              ...p,
              createdAt: p.createdAt.toISOString(),
              updatedAt: p.updatedAt.toISOString(),
              shippingOptions: JSON.parse(p.shippingOptionsJson || '[]'),
            };
          }
        } catch {
          // fallback
        }
      }
      return Store.getProductById(id);
    },
  },

  orders: {
    async findMany() {
      const hasPg = await checkPostgresConnection();
      if (hasPg) {
        try {
          const orders = await prisma.order.findMany({
            include: {
              product: true,
              promiseCard: true,
              payment: true,
              fulfillmentEvents: { orderBy: { createdAt: 'asc' } },
              driftAlerts: { orderBy: { createdAt: 'desc' } },
              auditEvents: { orderBy: { createdAt: 'desc' } },
            },
            orderBy: { createdAt: 'desc' },
          });

          return orders.map(o => ({
            ...o,
            createdAt: o.createdAt.toISOString(),
            updatedAt: o.updatedAt.toISOString(),
            product: o.product
              ? {
                  ...o.product,
                  createdAt: o.product.createdAt.toISOString(),
                  updatedAt: o.product.updatedAt.toISOString(),
                  shippingOptions: JSON.parse(o.product.shippingOptionsJson || '[]'),
                }
              : undefined,
            promiseCard: o.promiseCard
              ? {
                  ...o.promiseCard,
                  createdAt: o.promiseCard.createdAt.toISOString(),
                  agreedAt: o.promiseCard.agreedAt.toISOString(),
                  warnings: JSON.parse(o.promiseCard.warningsJson || '[]'),
                }
              : null,
            payment: o.payment
              ? {
                  ...o.payment,
                  createdAt: o.payment.createdAt.toISOString(),
                  updatedAt: o.payment.updatedAt.toISOString(),
                }
              : null,
            fulfillmentEvents: o.fulfillmentEvents.map(fe => ({
              ...fe,
              createdAt: fe.createdAt.toISOString(),
              estimatedDelivery: fe.estimatedDelivery ? fe.estimatedDelivery.toISOString() : null,
            })),
            driftAlerts: o.driftAlerts.map(da => ({
              ...da,
              severity: da.severity as 'INFO' | 'WARNING' | 'CRITICAL',
              createdAt: da.createdAt.toISOString(),
              resolvedAt: da.resolvedAt ? da.resolvedAt.toISOString() : null,
              agreedSnapshot: JSON.parse(da.agreedSnapshotJson || '{}'),
              currentUpdateSnapshot: JSON.parse(da.currentUpdateSnapshot || '{}'),
            })),
            auditEvents: o.auditEvents.map(ae => ({
              ...ae,
              source: ae.source as any,
              createdAt: ae.createdAt.toISOString(),
              metadata: ae.metadataJson ? JSON.parse(ae.metadataJson) : null,
            })),
          }));
        } catch {
          // fallback
        }
      }
      return Store.getOrders();
    },

    async findUnique(id: string) {
      const hasPg = await checkPostgresConnection();
      if (hasPg) {
        try {
          const o = await prisma.order.findFirst({
            where: { OR: [{ id }, { orderNumber: id }] },
            include: {
              product: true,
              promiseCard: true,
              payment: true,
              fulfillmentEvents: { orderBy: { createdAt: 'asc' } },
              driftAlerts: { orderBy: { createdAt: 'desc' } },
              auditEvents: { orderBy: { createdAt: 'desc' } },
            },
          });
          if (o) {
            return {
              ...o,
              createdAt: o.createdAt.toISOString(),
              updatedAt: o.updatedAt.toISOString(),
              product: o.product
                ? {
                    ...o.product,
                    createdAt: o.product.createdAt.toISOString(),
                    updatedAt: o.product.updatedAt.toISOString(),
                    shippingOptions: JSON.parse(o.product.shippingOptionsJson || '[]'),
                  }
                : undefined,
              promiseCard: o.promiseCard
                ? {
                    ...o.promiseCard,
                    createdAt: o.promiseCard.createdAt.toISOString(),
                    agreedAt: o.promiseCard.agreedAt.toISOString(),
                    warnings: JSON.parse(o.promiseCard.warningsJson || '[]'),
                  }
                : null,
              payment: o.payment
                ? {
                    ...o.payment,
                    createdAt: o.payment.createdAt.toISOString(),
                    updatedAt: o.payment.updatedAt.toISOString(),
                  }
                : null,
              fulfillmentEvents: o.fulfillmentEvents.map(fe => ({
                ...fe,
                createdAt: fe.createdAt.toISOString(),
                estimatedDelivery: fe.estimatedDelivery ? fe.estimatedDelivery.toISOString() : null,
              })),
              driftAlerts: o.driftAlerts.map(da => ({
                ...da,
                severity: da.severity as 'INFO' | 'WARNING' | 'CRITICAL',
                createdAt: da.createdAt.toISOString(),
                resolvedAt: da.resolvedAt ? da.resolvedAt.toISOString() : null,
                agreedSnapshot: JSON.parse(da.agreedSnapshotJson || '{}'),
                currentUpdateSnapshot: JSON.parse(da.currentUpdateSnapshot || '{}'),
              })),
              auditEvents: o.auditEvents.map(ae => ({
                ...ae,
                source: ae.source as any,
                createdAt: ae.createdAt.toISOString(),
                metadata: ae.metadataJson ? JSON.parse(ae.metadataJson) : null,
              })),
            };
          }
        } catch {
          // fallback
        }
      }
      return Store.getOrderById(id);
    },

    async create(data: Parameters<typeof Store.createOrder>[0]) {
      return Store.createOrder(data);
    },

    async savePromiseCard(orderId: string, card: Parameters<typeof Store.savePromiseCard>[1]) {
      return Store.savePromiseCard(orderId, card);
    },

    async recordPayment(orderId: string, paymentData: Parameters<typeof Store.recordPayment>[1]) {
      return Store.recordPayment(orderId, paymentData);
    },

    async addFulfillmentEvent(orderId: string, eventData: Parameters<typeof Store.addFulfillmentEvent>[1]) {
      return Store.addFulfillmentEvent(orderId, eventData);
    },

    async addDriftAlert(orderId: string, alertData: Parameters<typeof Store.addDriftAlert>[1]) {
      return Store.addDriftAlert(orderId, alertData);
    },

    async resolveDriftAlert(orderId: string, alertId: string) {
      return Store.resolveDriftAlert(orderId, alertId);
    },
  },

  audit: {
    async findMany(filter?: { orderId?: string; source?: any }) {
      return Store.getAuditEvents(filter);
    },
    async create(data: Parameters<typeof Store.addAuditEvent>[0]) {
      return Store.addAuditEvent(data);
    },
  },

  reset() {
    Store.reset();
  },
};
