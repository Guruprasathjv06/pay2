import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { searchChannel3, isChannel3Configured } from '../../../../lib/integrations/channel3';

const Schema = z.object({
  query: z.string().min(1, 'Search query is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = Schema.parse(body);

    const result = await searchChannel3(query);

    return NextResponse.json({
      success: true,
      query,
      isConfigured: isChannel3Configured(),
      source: result.source,
      results: result.results,
      error: result.error,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: err.errors[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Channel3 search failed' }, { status: 500 });
  }
}
