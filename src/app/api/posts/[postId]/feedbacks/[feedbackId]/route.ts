import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/api/middleware';
import { successResponse, errorResponse, forbiddenResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/response';
import { getFeedbackById, updateFeedback } from '@/lib/db/queries';

// PUT /posts/[postId]/feedbacks/[feedbackId] - 피드백 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string; feedbackId: string }> }
) {
  try {
    const auth = await requireUser(request);
    if (!auth.success) {
      return forbiddenResponse(auth.error);
    }

    const { postId: postIdParam, feedbackId: feedbackIdParam } = await params;
    const postId = parseInt(postIdParam);
    const feedbackId = parseInt(feedbackIdParam);
    
    if (isNaN(postId) || isNaN(feedbackId)) {
      return errorResponse('잘못된 ID입니다');
    }

    // 피드백 조회
    const feedback = await getFeedbackById(feedbackId);
    if (!feedback) {
      return notFoundResponse('피드백을 찾을 수 없습니다');
    }

    // 본인의 피드백인지 확인
    if (!auth.keyIds.includes(feedback.accessKeyId)) {
      return forbiddenResponse('본인의 피드백만 수정할 수 있습니다');
    }

    // 게시글 일치 여부 확인
    if (feedback.postId !== postId) {
      return errorResponse('게시글 정보가 일치하지 않습니다');
    }

    const { phone, description, isSolved } = await request.json();

    const updateData: any = {};
    if (phone !== undefined) updateData.phone = phone;
    if (description !== undefined) updateData.description = description;
    if (isSolved !== undefined) updateData.isSolved = isSolved;

    if (Object.keys(updateData).length === 0) {
      return errorResponse('수정할 내용이 없습니다');
    }

    const updatedFeedback = await updateFeedback(feedbackId, updateData);
    return successResponse(updatedFeedback);
  } catch (error) {
    console.error('Update feedback error:', error);
    return serverErrorResponse('피드백 수정에 실패했습니다');
  }
}
