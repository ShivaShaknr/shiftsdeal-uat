import { NextRequest, NextResponse } from 'next/server';
import { assessBookingRisk } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const bookingDetails = await request.json();

    if (!bookingDetails.booking || !bookingDetails.venue) {
      return NextResponse.json(
        { error: 'Booking and venue details are required' },
        { status: 400 }
      );
    }

    const assessment = await assessBookingRisk(bookingDetails);

    return NextResponse.json({
      success: true,
      assessment,
    });
  } catch (error: any) {
    console.error('Risk assessment API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to assess risk' },
      { status: 500 }
    );
  }
}
