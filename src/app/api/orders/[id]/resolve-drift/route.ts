import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

const Schema = z.object({
  alertId: z.string().min(1),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { alertId } = Schema.parse(body);

    const alert = await db.orders.resolveDriftAlert(params.id, alertId);
    if (!alert) {
      return NextResponse.json({ success: false, error: 'Alert not found' }, { status: 404 });
    }

    const updatedOrder = await db.orders.findUnique(params.id);
    return NextResponse.json({ success: true, alert, order: updatedOrder });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Failed to resolve drift alert' }, { status: 500 });
  }
}
