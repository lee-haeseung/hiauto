import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 로그인 페이지는 인증 체크 제외
  if (pathname === '/login') {
    return NextResponse.next();
  }

  // API 라우트는 제외
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // 정적 파일은 제외
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)
  ) {
    return NextResponse.next();
  }

  // 클라이언트 사이드에서 인증 체크하므로 서버 proxy에서는 통과
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
