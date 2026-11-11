import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function POST() {
  try {
    db.reset();
    return NextResponse.json({ success: true, message: 'Demo store reset to seeded data.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Failed to reset demo store' }, { status: 500 });
  }
}
