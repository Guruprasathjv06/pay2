import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId') || undefined;
    const source = (searchParams.get('source') as any) || undefined;
    const query = searchParams.get('query')?.toLowerCase();

    let events = await db.audit.findMany({ orderId, source });

    if (query) {
      events = events.filter(
        e =>
          e.description.toLowerCase().includes(query) ||
          e.eventType.toLowerCase().includes(query) ||
          (e.orderId && e.orderId.toLowerCase().includes(query))
      );
    }

    return NextResponse.json({ success: true, events });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Failed to retrieve audit trail' }, { status: 500 });
  }
}
