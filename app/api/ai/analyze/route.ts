import { NextRequest, NextResponse } from 'next/server';
import { analyzeVenueSuitability } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { venue, requirements } = await request.json();

    if (!venue || !requirements) {
      return NextResponse.json(
        { error: 'Venue and requirements are required' },
        { status: 400 }
      );
    }

    console.log('\n=== VENUE ANALYSIS REQUEST ===');
    console.log('Venue:', venue.name);
    console.log('Requirements:', JSON.stringify(requirements, null, 2));

    const analysis = await analyzeVenueSuitability(venue, requirements);

    console.log('\n=== VENUE ANALYSIS RESPONSE ===');
    console.log(JSON.stringify(analysis, null, 2));
    console.log('===========================\n');

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error('Venue analysis API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze venue' },
      { status: 500 }
    );
  }
}
