import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard');

  // 1. Jika akses dashboard tapi tidak ada token -> Lempar ke login
  if (isDashboardPage && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Jika sudah login tapi malah mau ke halaman login -> Lempar ke dashboard
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Hanya proteksi route dashboard dan login
export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
