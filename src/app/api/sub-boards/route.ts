import { verifyAdminFromRequest } from '@/lib/auth/jwt';
import { getSubBoardById, getSubBoardsByBoardId } from '@/lib/db/queries';
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
    const subBoardId = searchParams.get('subBoardId');
    
    // subBoardId로 단일 조회
    if (subBoardId) {
      const subBoard = await getSubBoardById(parseInt(subBoardId));
      if (!subBoard) {
        return NextResponse.json({ error: 'SubBoard not found' }, { status: 404 });
      }
      return NextResponse.json(subBoard);
    }
    
    // boardId로 목록 조회
    if (!boardId) {
      return NextResponse.json({ error: 'boardId or subBoardId is required' }, { status: 400 });
    }
    
    const subBoards = await getSubBoardsByBoardId(parseInt(boardId));
    return NextResponse.json(subBoards);
  } catch (error) {
    console.error('Error fetching sub-boards:', error);
    return NextResponse.json({ error: 'Failed to fetch sub-boards' }, { status: 500 });
  }
}
