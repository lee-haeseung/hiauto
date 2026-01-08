import { searchPosts } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const target = searchParams.get('target') as 'title' | 'content' | 'all';
    const boardId = searchParams.get('boardId');
    const subBoardId = searchParams.get('subBoardId');

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    if (!target || !['title', 'content', 'all'].includes(target)) {
      return NextResponse.json({ error: 'Invalid target' }, { status: 400 });
    }

    const results = await searchPosts({
      query,
      target,
      boardId: boardId ? parseInt(boardId) : undefined,
      subBoardId: subBoardId ? parseInt(subBoardId) : undefined,
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching posts:', error);
    return NextResponse.json({ error: 'Failed to search posts' }, { status: 500 });
  }
}
