import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/middleware';
import { successResponse, forbiddenResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/response';
import { getFeedbackById } from '@/lib/db/queries';

// GET /feedbacks/[feedbackId] - 피드백 조회 (관리자 또는 본인)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ feedbackId: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (!auth.success) {
      return forbiddenResponse(auth.error);
    }

    const { feedbackId: feedbackIdParam } = await params;
    const feedbackId = parseInt(feedbackIdParam);
    
    if (isNaN(feedbackId)) {
      return forbiddenResponse('잘못된 피드백 ID입니다');
    }

    // 피드백 조회
    const feedback = await getFeedbackById(feedbackId);
    if (!feedback) {
      return notFoundResponse('피드백을 찾을 수 없습니다');
    }

    // 관리자는 모든 피드백 조회 가능
    if (auth.role === 'admin') {
      return successResponse(feedback);
    }

    // 사용자는 본인의 피드백만 조회 가능
    if (auth.role === 'access-key') {
      if (feedback.accessKeyId !== auth.keyId) {
        return forbiddenResponse('본인의 피드백만 조회할 수 있습니다');
      }
      return successResponse(feedback);
    }

    return forbiddenResponse('권한이 없습니다');
  } catch (error) {
    console.error('Get feedback error:', error);
    return serverErrorResponse('피드백 조회에 실패했습니다');
  }
}
