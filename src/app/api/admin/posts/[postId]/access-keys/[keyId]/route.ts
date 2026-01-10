import { verifyAdminFromRequest } from '@/lib/auth/jwt';
import { deleteAccessKey } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';

// 액세스 키 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string; keyId: string }> }
) {
  try {
    // 관리자 권한 확인
    const authResult = await verifyAdminFromRequest(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { keyId: keyIdParam } = await params;
    const keyId = parseInt(keyIdParam);

    if (isNaN(keyId)) {
      return NextResponse.json({ error: 'Invalid key ID' }, { status: 400 });
    }

    await deleteAccessKey(keyId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete access key' },
      { status: 500 }
    );
  }
}
