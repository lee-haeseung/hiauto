import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/middleware';
import { successResponse, errorResponse, forbiddenResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/response';
import { getPostById } from '@/lib/db/queries';

// GET /posts/[postId] - 게시글 조회 (관리자 또는 액세스키 사용자만)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId: postIdParam } = await params;
    const postId = parseInt(postIdParam);
    
    if (isNaN(postId)) {
      return errorResponse('잘못된 게시글 ID입니다');
    }

    // 인증 필수 (관리자 또는 사용자)
    const auth = await requireAuth(request);

    // 인증 실패한 경우 - 접근 불가
    if (!auth.success) {
      return forbiddenResponse('로그인이 필요합니다');
    }

    // 게시글 조회
    const post = await getPostById(postId);
    if (!post) {
      return notFoundResponse('게시글을 찾을 수 없습니다');
    }

    // 사용자(accessKey)인 경우, 본인의 access_keys에 등록된 post만 조회 가능
    if (auth.role === 'access-key') {
      if (auth.postId !== postId) {
        return forbiddenResponse('이 게시글에 접근할 권한이 없습니다');
      }
    }

    // 관리자 또는 권한 있는 사용자는 전체 내용 제공
    return successResponse(post);
  } catch (error) {
    console.error('Get post error:', error);
    return serverErrorResponse('게시글 조회에 실패했습니다');
  }
}
