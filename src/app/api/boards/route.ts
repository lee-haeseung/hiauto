import { verifyAdminFromRequest } from '@/lib/auth/jwt';
import { getAllBoards } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authResult = await verifyAdminFromRequest(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const boards = await getAllBoards();
    return NextResponse.json(boards);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch boards' }, { status: 500 });
  }
}
