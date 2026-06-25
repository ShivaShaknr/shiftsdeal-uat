import { NextRequest, NextResponse } from 'next/server';
import { getConciergeResponse } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { message, context, history } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Add conversation history to context for better responses
    const enrichedContext = {
      ...context,
      conversationHistory: history || []
    };

    const response = await getConciergeResponse(message, enrichedContext);

    return NextResponse.json({
      success: true,
      ...response,
    });
  } catch (error: any) {
    console.error('Concierge API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get AI response' },
      { status: 500 }
    );
  }
}
