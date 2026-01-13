import { createAccessKeyToken, verifyAccessKeyToken } from '@/lib/auth/jwt';
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
      return unauthorizedResponse('유효하지 않은 코드입니다');
    }

    if (accessKey.expiresAt && accessKey.expiresAt < new Date()) {
      return unauthorizedResponse('만료된 코드입니다');
    }
    
    // 기존 토큰 확인 (Authorization 헤더에서)
    const existingToken = request.headers.get('authorization')?.replace('Bearer ', '');
    const existingKeyIds: number[] = [];
    
    if (existingToken) {
      try {
        const payload = await verifyAccessKeyToken(existingToken);
        if (payload && payload.keyIds) {
          const keyIds = payload.keyIds as number[];
          existingKeyIds.push(...keyIds);
        }
      } catch {
        // 기존 토큰이 유효하지 않으면 무시
      }
    }
    
    // 새로운 키가 이미 존재하는지 확인
    if (!existingKeyIds.includes(accessKey.id)) {
      existingKeyIds.push(accessKey.id);
    }
    
    // JWT 생성 (여러 키 정보 포함)
    const token = await createAccessKeyToken(existingKeyIds);
    
    return successResponse({ 
      token, 
      role: 'access-key',
      // 하위 호환성을 위해 현재 키 정보도 포함
      postId: accessKey.postId,
      keyId: accessKey.id
    });
  } catch (error) {
    console.error('Access key verification error:', error);
    return serverErrorResponse('인증에 실패했습니다');
  }
}
