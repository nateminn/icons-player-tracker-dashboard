import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if user is accessing the login page
  if (request.nextUrl.pathname === '/login') {
    return NextResponse.next();
  }
  
  // Check for authentication cookie
  const authCookie = request.cookies.get('icons-auth');
  
  if (!authCookie || authCookie.value !== 'authenticated') {
    // Redirect to login if not authenticated
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login).*)']
};