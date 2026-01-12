import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/middleware';
import { successResponse, forbiddenResponse, serverErrorResponse } from '@/lib/api/response';
import { getAllFeedbacks } from '@/lib/db/queries';

// GET /admin/feedbacks - 피드백 목록 조회
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.success) {
      return forbiddenResponse(auth.error);
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const isSolved = searchParams.get('isSolved');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const result = await getAllFeedbacks({
      postId: postId ? parseInt(postId) : undefined,
      isSolved: isSolved !== null ? isSolved === 'true' : undefined,
      search: search || undefined,
      page,
      pageSize,
    });

    return successResponse(result);
  } catch (error) {
    console.error('Get feedbacks error:', error);
    return serverErrorResponse('피드백 목록 조회에 실패했습니다');
  }
}
