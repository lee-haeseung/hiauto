import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/middleware';
import { successResponse, errorResponse, forbiddenResponse, serverErrorResponse } from '@/lib/api/response';
import { createAccessKey, getAllAccessKeys } from '@/lib/db/queries';

// GET /admin/access-keys - 접근 코드 목록 조회 (필터링)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.success) {
      return forbiddenResponse(auth.error);
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    if (!postId) {
      return errorResponse('게시글 ID를 입력해주세요');
    }

    const result = await getAllAccessKeys({
      postId: parseInt(postId),
      search: search || undefined,
      page,
      pageSize,
    });

    return successResponse(result);
  } catch (error) {
    console.error('Get access keys error:', error);
    return serverErrorResponse('접근 코드 목록 조회에 실패했습니다');
  }
}

// POST /admin/access-keys - 접근 코드 생성
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.success) {
      return forbiddenResponse(auth.error);
    }

    const { postId, memo, expiresAt } = await request.json();

    if (!postId) {
      return errorResponse('게시글 ID를 입력해주세요');
    }

    const accessKey = await createAccessKey({
      postId,
      memo: memo || '',
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    return successResponse(accessKey, 201);
  } catch (error) {
    console.error('Create access key error:', error);
    return serverErrorResponse('접근 코드 생성에 실패했습니다');
  }
}
