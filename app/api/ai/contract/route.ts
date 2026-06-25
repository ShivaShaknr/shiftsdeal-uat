import { NextRequest, NextResponse } from 'next/server';
import { generateContract } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const bookingDetails = await request.json();

    if (!bookingDetails.booking || !bookingDetails.venue || !bookingDetails.renter) {
      return NextResponse.json(
        { error: 'Booking, venue, and renter details are required' },
        { status: 400 }
      );
    }

    const contract = await generateContract(bookingDetails);

    return NextResponse.json({
      success: true,
      contract,
    });
  } catch (error: any) {
    console.error('Contract generation API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate contract' },
      { status: 500 }
    );
  }
}
