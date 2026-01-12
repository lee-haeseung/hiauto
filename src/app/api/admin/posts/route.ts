import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/middleware';
import { successResponse, errorResponse, forbiddenResponse, serverErrorResponse } from '@/lib/api/response';
import { getAllPosts, createPost } from '@/lib/db/queries';

// GET /admin/posts - 게시글 목록 조회 (필터링)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.success) {
      return forbiddenResponse(auth.error);
    }

    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('boardId'); // 게시판 ID (optional)
    const subBoardId = searchParams.get('subBoardId'); // 서브 게시판 ID (optional)
    const query = searchParams.get('query'); // 검색 키워드
    const target = searchParams.get('target') || 'all'; // 검색 대상: 전체|제목|내용

    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const result = await getAllPosts({
      boardId: boardId ? parseInt(boardId) : undefined,
      subBoardId: subBoardId ? parseInt(subBoardId) : undefined,
      query: query || undefined,
      target: target as 'title' | 'content' | 'all',
      page,
      pageSize,
    });

    return successResponse(result);
  } catch (error) {
    console.error('Get posts error:', error);
    return serverErrorResponse('게시글 목록 조회에 실패했습니다');
  }
}

// POST /admin/posts - 게시글 생성
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.success) {
      return forbiddenResponse(auth.error);
    }

    const { subBoardId, title, content } = await request.json();

    if (!subBoardId || !title || !content) {
      return errorResponse('하위 게시판 ID, 제목, 내용을 모두 입력해주세요');
    }

    const post = await createPost({
      subBoardId,
      title: title.trim(),
      content,
    });

    return successResponse(post, 201);
  } catch (error) {
    console.error('Create post error:', error);
    return serverErrorResponse('게시글 생성에 실패했습니다');
  }
}
