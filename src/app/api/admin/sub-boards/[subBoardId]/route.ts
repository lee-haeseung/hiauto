import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/middleware';
import { successResponse, errorResponse, forbiddenResponse, serverErrorResponse } from '@/lib/api/response';
import { updateSubBoardName } from '@/lib/db/queries';

// PATCH /admin/sub-boards/[subBoardId] - 하위 게시판 이름 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: { subBoardId: string } }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.success) {
      return forbiddenResponse(auth.error);
    }

    const subBoardId = parseInt(params.subBoardId);
    if (isNaN(subBoardId)) {
      return errorResponse('잘못된 하위 게시판 ID입니다');
    }

    const { name } = await request.json();

    if (!name || !name.trim()) {
      return errorResponse('하위 게시판 이름을 입력해주세요');
    }

    await updateSubBoardName(subBoardId, name.trim());
    return successResponse({ message: '하위 게시판 이름이 수정되었습니다' });
  } catch (error) {
    console.error('Update sub-board name error:', error);
    return serverErrorResponse('하위 게시판 이름 수정에 실패했습니다');
  }
}
