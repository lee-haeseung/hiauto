import { createAccessKeyToken } from '@/lib/auth/jwt';
import { verifyAccessKey } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { key } = await request.json();
    
    if (!key) {
      return NextResponse.json({ error: '키를 입력해주세요' }, { status: 400 });
    }
    
    // 액세스 키 검증
    const accessKey = await verifyAccessKey(key);
    
    if (!accessKey) {
      return NextResponse.json({ error: '없거나 만료된 액세스 키입니다.' }, { status: 401 });
    }
    
    // JWT 생성 (keyId, postId, expiresAt 포함)
    const token = await createAccessKeyToken(accessKey.id, accessKey.postId, accessKey.expiresAt || undefined);
    
    return NextResponse.json({ token, role: 'access-key', postId: accessKey.postId });
  } catch (error) {
    return NextResponse.json({ error: '검증에 실패했습니다.' }, { status: 500 });
  }
}
