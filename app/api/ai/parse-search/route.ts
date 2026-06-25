import { NextRequest, NextResponse } from 'next/server';
import { parseSearchQuery } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const filters = await parseSearchQuery(query);

    return NextResponse.json({
      success: true,
      query,
      filters,
    });
  } catch (error: any) {
    console.error('Parse search API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to parse search query' },
      { status: 500 }
    );
  }
}
