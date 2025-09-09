import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    
    // Check if password matches environment variable
    const correctPassword = process.env.DASHBOARD_PASSWORD || 'IconsSecure2025';
    
    if (password === correctPassword) {
      // Set authentication cookie
      const response = NextResponse.json({ success: true });
      
      // Set cookie that expires in 24 hours
      response.cookies.set('icons-auth', 'authenticated', {
        httpOnly: false, // Needs to be readable by middleware
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 // 24 hours
      });
      
      return response;
    } else {
      return NextResponse.json(
        { message: 'Invalid password' }, 
        { status: 401 }
      );
    }
  } catch {
    return NextResponse.json(
      { message: 'Authentication failed' }, 
      { status: 500 }
    );
  }
}

export async function DELETE() {
  // Logout endpoint
  const response = NextResponse.json({ success: true });
  response.cookies.delete('icons-auth');
  return response;
}