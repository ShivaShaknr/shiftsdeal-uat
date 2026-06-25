import { NextRequest, NextResponse } from 'next/server';
import { parseSearchQuery } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const result = await parseSearchQuery(query);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to parse search query' },
      { status: 500 }
    );
  }
}
