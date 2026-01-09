import { verifyAdminFromRequest } from '@/lib/auth/jwt';
import { getSubBoardsByBoardId } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authResult = await verifyAdminFromRequest(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const searchParams = request.nextUrl.searchParams;
    const boardId = searchParams.get('boardId');
    
    if (!boardId) {
      return NextResponse.json({ error: 'boardId is required' }, { status: 400 });
    }
    
    const subBoards = await getSubBoardsByBoardId(parseInt(boardId));
    return NextResponse.json(subBoards);
  } catch (error) {
    console.error('Error fetching sub-boards:', error);
    return NextResponse.json({ error: 'Failed to fetch sub-boards' }, { status: 500 });
  }
}
