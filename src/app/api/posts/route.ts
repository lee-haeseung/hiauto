import { verifyAdminFromRequest } from '@/lib/auth/jwt';
import { createPost, getPostsBySubBoardId } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authResult = await verifyAdminFromRequest(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const searchParams = request.nextUrl.searchParams;
    const subBoardId = searchParams.get('subBoardId');
    
    if (!subBoardId) {
      return NextResponse.json({ error: 'subBoardId is required' }, { status: 400 });
    }
    
    const posts = await getPostsBySubBoardId(parseInt(subBoardId));
    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authResult = await verifyAdminFromRequest(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const { subBoardId, title, content, accessKey } = body;

    if (!subBoardId || !title || !content) {
      return NextResponse.json(
        { error: 'subBoardId, title, and content are required' },
        { status: 400 }
      );
    }

    const post = await createPost({
      subBoardId: parseInt(subBoardId),
      title,
      content,
      accessKey,
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
