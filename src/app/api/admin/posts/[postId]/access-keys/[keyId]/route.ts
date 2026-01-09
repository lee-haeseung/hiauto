import { verifyAdminToken } from '@/lib/auth/jwt';
import { deleteAccessKey } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';

// 액세스 키 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string; keyId: string }> }
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

    const { keyId: keyIdParam } = await params;
    const keyId = parseInt(keyIdParam);

    if (isNaN(keyId)) {
      return NextResponse.json({ error: 'Invalid key ID' }, { status: 400 });
    }

    await deleteAccessKey(keyId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting access key:', error);
    return NextResponse.json(
      { error: 'Failed to delete access key' },
      { status: 500 }
    );
  }
}
