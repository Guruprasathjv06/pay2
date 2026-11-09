import { NextRequest, NextResponse } from 'next/server';
import { searchOrderKnowledge, isElasticConfigured } from '@/lib/integrations/elastic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    const searchResult = await searchOrderKnowledge(query);

    return NextResponse.json({
      success: true,
      query,
      isElasticConfigured: isElasticConfigured(),
      source: searchResult.source,
      results: searchResult.results,
      citedRecords: searchResult.citedRecords,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Knowledge search failed' }, { status: 500 });
  }
}
