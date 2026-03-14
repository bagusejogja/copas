import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function proxy(req: NextRequest) {
  const token = req.cookies.get('token')?.value;

  const url = req.nextUrl.clone();
  const isLoginPage = url.pathname === '/login';
  const isProtected = url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/api') && !url.pathname.includes('/auth');

  if (isProtected) {
    if (!token) {
      if (url.pathname.startsWith('/api')) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    const payload = await verifyToken(token);
    if (!payload) {
      if (url.pathname.startsWith('/api')) {
        return NextResponse.json({ message: 'Token Invalid' }, { status: 401 });
      }
      url.pathname = '/login';
      const response = NextResponse.redirect(url);
      response.cookies.delete('token');
      return response;
    }
  }

  if (isLoginPage && token) {
    const payload = await verifyToken(token);
    if (payload) {
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  if (url.pathname === '/') {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/dashboard/:path*', '/api/:path*'],
};
