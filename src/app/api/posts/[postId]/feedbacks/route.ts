import { NextRequest } from 'next/server';
import { requireUser, requireAuth } from '@/lib/api/middleware';
import { successResponse, errorResponse, forbiddenResponse, serverErrorResponse } from '@/lib/api/response';
import { createFeedback, getFeedbackByAccessKeyId, getAccessKeyById, getFeedbacksByPostId } from '@/lib/db/queries';

// GET /posts/[postId]/feedbacks - 피드백 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const auth = await requireAuth(request);
    if (!auth.success) {
      return forbiddenResponse(auth.error);
    }

    const { postId: postIdParam } = await params;
    const postId = parseInt(postIdParam);
    
    if (isNaN(postId)) {
      return errorResponse('잘못된 게시글 ID입니다');
    }

    // accessKey 사용자는 본인의 피드백만 조회 가능
    if (auth.role === 'access-key') {
      const feedback = await getFeedbackByAccessKeyId(auth.keyId);
      return successResponse(feedback ? [feedback] : []);
    }

    // 관리자는 해당 게시물의 모든 피드백 조회 가능
    const feedbacks = await getFeedbacksByPostId(postId);
    return successResponse(feedbacks);
  } catch (error) {
    console.error('Get feedbacks error:', error);
    return serverErrorResponse('피드백 조회에 실패했습니다');
  }
}

// POST /posts/[postId]/feedbacks - 피드백 생성
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const auth = await requireUser(request);
    if (!auth.success) {
      return forbiddenResponse(auth.error);
    }

    const { postId: postIdParam } = await params;
    const postId = parseInt(postIdParam);
    
    if (isNaN(postId)) {
      return errorResponse('잘못된 게시글 ID입니다');
    }

    // 사용자의 accessKey가 이 게시글에 접근 가능한지 확인
    if (auth.postId !== postId) {
      return forbiddenResponse('이 게시글에 피드백을 작성할 권한이 없습니다');
    }

    // 이미 피드백을 작성했는지 확인 (accessKey당 1개만 가능)
    const existingFeedback = await getFeedbackByAccessKeyId(auth.keyId);
    if (existingFeedback) {
      return errorResponse('이미 피드백을 작성하셨습니다. 수정을 이용해주세요');
    }

    const body = await request.json();
    const { isSolved, phone, description } = body;

    // 필수 입력값 확인
    if (isSolved === undefined || isSolved === null) {
      return errorResponse('피드백의 해결 여부를 선택해주세요');
    }

    const feedbackData = {
      phone: phone || '',
      description: description || ''
    };

    if (isSolved) {
      feedbackData.phone = '';
      feedbackData.description = '';
    } else {
      if (!phone || !description) {
        return errorResponse('연락처와 피드백 내용을 모두 입력해주세요');
      }
    }

    // accessKey 정보 가져오기 (memo 저장용)
    const accessKey = await getAccessKeyById(auth.keyId);
    if (!accessKey) {
      return forbiddenResponse('유효하지 않은 접근 코드입니다');
    }

    const feedback = await createFeedback({
      postId,
      accessKeyId: auth.keyId,
      accessKeyMemo: accessKey.memo || null,
      phone: feedbackData.phone,
      description: feedbackData.description,
      isSolved: isSolved,
    });

    return successResponse(feedback, 201);
  } catch (error) {
    console.error('Create feedback error:', error);
    return serverErrorResponse('피드백 생성에 실패했습니다');
  }
}
