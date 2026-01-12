import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/middleware';
import { successResponse, forbiddenResponse, serverErrorResponse, errorResponse } from '@/lib/api/response';
import { getFeedbackSummary } from '@/lib/db/queries';

// GET /admin/feedbacks/summary - 게시물 문제 해결 비율 조회
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.success) {
      return forbiddenResponse(auth.error);
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return errorResponse('게시글 ID를 입력해주세요');
    }

    const summary = await getFeedbackSummary(parseInt(postId));
    return successResponse(summary);
  } catch (error) {
    console.error('Get feedback summary error:', error);
    return serverErrorResponse('피드백 요약 조회에 실패했습니다');
  }
}
