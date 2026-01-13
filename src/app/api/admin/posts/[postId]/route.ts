import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/middleware';
import { successResponse, errorResponse, forbiddenResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/response';
import { getPostById, updatePost } from '@/lib/db/queries';

// PUT /admin/posts/[postId] - 게시글 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.success) {
      return forbiddenResponse(auth.error);
    }

    const { postId: postIdParam } = await params;
    const postId = parseInt(postIdParam);
    if (isNaN(postId)) {
      return errorResponse('잘못된 게시글 ID입니다');
    }

    // 게시글 존재 확인
    const existingPost = await getPostById(postId);
    if (!existingPost) {
      return notFoundResponse('게시글을 찾을 수 없습니다');
    }

    const { subBoardId, title, content } = await request.json();

    const updateData: any = {};
    if (subBoardId !== undefined) updateData.subBoardId = subBoardId;
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content;

    if (Object.keys(updateData).length === 0) {
      return errorResponse('수정할 내용이 없습니다');
    }

    const updatedPost = await updatePost(postId, updateData);
    return successResponse(updatedPost);
  } catch (error) {
    console.error('Update post error:', error);
    return serverErrorResponse('게시글 수정에 실패했습니다');
  }
}
