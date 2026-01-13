import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/middleware';
import { successResponse, errorResponse, forbiddenResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/response';
import { getFeedbackById, updateFeedback } from '@/lib/db/queries';

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
      if (!auth.keyIds.includes(feedback.accessKeyId)) {
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

// PUT /feedbacks/[feedbackId] - 피드백 수정
export async function PUT(
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
      return errorResponse('잘못된 피드백 ID입니다');
    }

    // 피드백 조회
    const feedback = await getFeedbackById(feedbackId);
    if (!feedback) {
      return notFoundResponse('피드백을 찾을 수 없습니다');
    }

    // 본인의 피드백만 수정 가능 (관리자는 수정 불가)
    if (auth.role === 'access-key' && !auth.keyIds.includes(feedback.accessKeyId)) {
      return forbiddenResponse('본인의 피드백만 수정할 수 있습니다');
    }

    if (auth.role === 'admin') {
      return forbiddenResponse('관리자는 피드백을 수정할 수 없습니다');
    }

    const body = await request.json();
    const { isSolved, phone, description } = body;

    // 필수 입력값 확인
    if (isSolved === undefined || isSolved === null) {
      return errorResponse('피드백의 해결 여부를 선택해주세요');
    }

    const updateData: { isSolved: boolean; phone?: string; description?: string } = {
      isSolved,
    };

    if (isSolved) {
      updateData.phone = '';
      updateData.description = '';
    } else {
      if (!phone || !description) {
        return errorResponse('연락처와 피드백 내용을 모두 입력해주세요');
      }
      updateData.phone = phone;
      updateData.description = description;
    }

    const updatedFeedback = await updateFeedback(feedbackId, updateData);
    return successResponse(updatedFeedback);
  } catch (error) {
    console.error('Update feedback error:', error);
    return serverErrorResponse('피드백 수정에 실패했습니다');
  }
}
