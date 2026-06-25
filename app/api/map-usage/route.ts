import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

// GET - Check if map can be loaded (without incrementing)
// POST - Increment usage and check if allowed
export async function GET() {
  try {
    const { data, error } = await supabase
      .rpc('check_api_usage', { p_api_name: 'mapbox' });

    if (error) {
      console.error('Error checking map usage:', error);
      // On error, allow the map (fail open)
      return NextResponse.json({ 
        allowed: true, 
        currentCount: 0, 
        limit: 25000,
        error: 'Failed to check usage' 
      });
    }

    const result = data?.[0] || { allowed: true, current_count: 0, limit_count: 25000 };
    
    return NextResponse.json({
      allowed: result.allowed,
      currentCount: result.current_count,
      limit: result.limit_count,
    });
  } catch (error) {
    console.error('Error in map-usage GET:', error);
    return NextResponse.json({ 
      allowed: true, 
      currentCount: 0, 
      limit: 25000 
    });
  }
}

export async function POST() {
  try {
    const { data, error } = await supabase
      .rpc('increment_api_usage', { p_api_name: 'mapbox' });

    if (error) {
      console.error('Error incrementing map usage:', error);
      // On error, allow the map (fail open)
      return NextResponse.json({ 
        allowed: true, 
        currentCount: 0, 
        limit: 25000,
        error: 'Failed to increment usage' 
      });
    }

    const result = data?.[0] || { allowed: true, current_count: 0, limit_count: 25000 };
    
    return NextResponse.json({
      allowed: result.allowed,
      currentCount: result.current_count,
      limit: result.limit_count,
    });
  } catch (error) {
    console.error('Error in map-usage POST:', error);
    return NextResponse.json({ 
      allowed: true, 
      currentCount: 0, 
      limit: 25000 
    });
  }
}
