import { verifyAdminFromRequest, verifyAdminOrAccessKeyFromRequest } from '@/lib/auth/jwt';
import { getAccessKeyById, getPostById, updatePost } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // 관리자 또는 액세스 키 토큰 검증
    const authResult = await verifyAdminOrAccessKeyFromRequest(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { postId: postIdParam } = await params;
    const postId = parseInt(postIdParam);
    
    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    // 액세스 키로 접근한 경우 DB에서 추가 검증
    if (authResult.role === 'access-key') {
      const keyId = authResult.payload.keyId as number;
      
      // DB에서 액세스 키 조회 (존재 여부 및 만료 여부 확인)
      const accessKey = await getAccessKeyById(keyId);
      
      if (!accessKey) {
        return NextResponse.json(
          { error: '액세스 키가 존재하지 않거나 만료되었습니다.' },
          { status: 403 }
        );
      }

      // 액세스 키의 postId와 요청한 postId가 일치하는지 확인
      if (accessKey.postId !== postId) {
        return NextResponse.json(
          { error: '이 게시물에 접근할 권한이 없습니다.' },
          { status: 403 }
        );
      }
    }
    
    const post = await getPostById(postId);
    
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    return NextResponse.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // 관리자 권한 확인 (수정은 관리자만 가능)
    const authResult = await verifyAdminFromRequest(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { postId: postIdParam } = await params;
    const postId = parseInt(postIdParam);
    
    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    const body = await request.json();
    const { subBoardId, title, content } = body;

    if (!title || !content || !subBoardId) {
      return NextResponse.json(
        { error: 'title, content, subBoardId are required' },
        { status: 400 }
      );
    }

    const updatedPost = await updatePost(postId, {
      subBoardId,
      title,
      content,
    });

    if (!updatedPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}
