import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Admin credentials - in production, use environment variables
const ADMIN_USERNAME = process.env.SD_ADMIN_USERNAME || 'shiftsdeal_admin';
const ADMIN_PASSWORD = process.env.SD_ADMIN_PASSWORD || 'SD@dm1n2025!Secure';
const ADMIN_SESSION_TOKEN = process.env.SD_ADMIN_TOKEN || 'sd_admin_session_x7k9m2p5q8';

// POST - Login
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Set secure HTTP-only cookie
      const cookieStore = await cookies();
      cookieStore.set('sd_admin_token', ADMIN_SESSION_TOKEN, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 8, // 8 hours
        path: '/',
      });

      return NextResponse.json({
        success: true,
        message: 'Admin authenticated',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET - Check auth status
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sd_admin_token');

    if (token?.value === ADMIN_SESSION_TOKEN) {
      return NextResponse.json({ success: true, authenticated: true });
    }

    return NextResponse.json({ success: false, authenticated: false }, { status: 401 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Logout
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('sd_admin_token');

    return NextResponse.json({ success: true, message: 'Logged out' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
