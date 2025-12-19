import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/get-started')) {
    const hasAccessCookie = request.cookies.get('demo_access');
    if (hasAccessCookie?.value !== 'true') {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.searchParams.set('demo', 'required');
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/get-started/:path*'],
};
