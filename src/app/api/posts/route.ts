import { getPostsBySubBoardId } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const subBoardId = searchParams.get('subBoardId');
    
    if (!subBoardId) {
      return NextResponse.json({ error: 'subBoardId is required' }, { status: 400 });
    }
    
    const posts = await getPostsBySubBoardId(parseInt(subBoardId));
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}
