import { verifyAdminToken } from '@/lib/auth/jwt';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// 함수 이름을 middleware → proxy로 변경
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 관리자 페이지 보호
  if (path.startsWith('/admin')) {
    const token = request.cookies.get('admin_token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const payload = await verifyAdminToken(token);
    if (!payload) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
