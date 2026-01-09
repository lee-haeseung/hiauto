import { verifyAdminToken } from '@/lib/auth/jwt';
import {
    createAccessKey,
    getAccessKeysByPostId,
} from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';

// 액세스 키 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // 관리자 권한 확인
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAdminToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { postId: postIdParam } = await params;
    const postId = parseInt(postIdParam);

    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    // 쿼리 파라미터에서 페이지 정보 가져오기
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    const result = await getAccessKeysByPostId(postId, page, pageSize);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching access keys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch access keys' },
      { status: 500 }
    );
  }
}

// 액세스 키 생성
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // 관리자 권한 확인
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAdminToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { postId: postIdParam } = await params;
    const postId = parseInt(postIdParam);

    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    const body = await request.json();
    const { memo, expiresAt } = body;

    // 만료일 파싱
    let expiresAtDate: Date | null = null;
    if (expiresAt) {
      expiresAtDate = new Date(expiresAt);
      if (isNaN(expiresAtDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid expiration date' },
          { status: 400 }
        );
      }
    }

    const accessKey = await createAccessKey({
      postId,
      memo,
      expiresAt: expiresAtDate,
    });

    return NextResponse.json(accessKey, { status: 201 });
  } catch (error) {
    console.error('Error creating access key:', error);
    return NextResponse.json(
      { error: 'Failed to create access key' },
      { status: 500 }
    );
  }
}
