import { createAccessKeyToken } from '@/lib/auth/jwt';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/response';
import { verifyAccessKey } from '@/lib/db/queries';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { key } = await request.json();
    
    if (!key) {
      return errorResponse('접근 코드를 입력해주세요');
    }
    
    // 액세스 키 검증
    const accessKey = await verifyAccessKey(key);
    
    if (!accessKey) {
      return unauthorizedResponse('유효하지 않거나 만료된 접근 코드입니다');
    }
    
    // JWT 생성 (keyId, postId, expiresAt 포함)
    const token = await createAccessKeyToken(
      accessKey.id, 
      accessKey.postId, 
      accessKey.expiresAt || undefined
    );
    
    return successResponse({ 
      token, 
      role: 'access-key', 
      postId: accessKey.postId 
    });
  } catch (error) {
    console.error('Access key verification error:', error);
    return serverErrorResponse('인증에 실패했습니다');
  }
}
