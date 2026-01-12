import { NextRequest } from 'next/server';
import { verifyAdminToken, verifyAccessKeyToken } from '@/lib/auth/jwt';
import { getAccessKeyById } from '@/lib/db/queries';

export type AdminAuthResult = 
  | { success: true; userId: number; role: 'admin'; username: string }
  | { success: false; error: string; status: number };

export type UserAuthResult = 
  | { success: true; userId: number; role: 'access-key'; keyId: number; postId: number }
  | { success: false; error: string; status: number };

export type AuthResult = AdminAuthResult | UserAuthResult;

// 관리자 인증 미들웨어
export async function requireAdmin(request: NextRequest): Promise<AdminAuthResult> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return { success: false, error: '인증 토큰이 필요합니다', status: 401 };
  }

  const payload = await verifyAdminToken(token);
  
  if (!payload || payload.role !== 'admin') {
    return { success: false, error: '관리자 권한이 필요합니다', status: 403 };
  }

  return {
    success: true,
    userId: payload.userId as number,
    role: 'admin',
    username: payload.username as string,
  };
}

// 사용자(accessKey) 인증 미들웨어
export async function requireUser(request: NextRequest): Promise<UserAuthResult> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return { success: false, error: '인증 토큰이 필요합니다', status: 401 };
  }

  const payload = await verifyAccessKeyToken(token);
  
  if (!payload || payload.role !== 'access-key') {
    return { success: false, error: '유효하지 않은 토큰입니다', status: 403 };
  }

  // accessKey가 여전히 유효한지 확인
  const accessKey = await getAccessKeyById(payload.keyId as number);
  
  if (!accessKey) {
    return { success: false, error: '만료되었거나 유효하지 않은 접근 코드입니다', status: 403 };
  }

  return {
    success: true,
    userId: payload.keyId as number,
    role: 'access-key',
    keyId: payload.keyId as number,
    postId: payload.postId as number,
  };
}

// 관리자 또는 사용자 인증 (둘 중 하나)
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return { success: false, error: '인증 토큰이 필요합니다', status: 401 };
  }

  // 먼저 관리자 토큰 확인
  const adminPayload = await verifyAdminToken(token);
  if (adminPayload && adminPayload.role === 'admin') {
    return {
      success: true,
      userId: adminPayload.userId as number,
      role: 'admin',
      username: adminPayload.username as string,
    };
  }

  // 사용자 토큰 확인
  const userPayload = await verifyAccessKeyToken(token);
  if (userPayload && userPayload.role === 'access-key') {
    const accessKey = await getAccessKeyById(userPayload.keyId as number);
    
    if (!accessKey) {
      return { success: false, error: '만료되었거나 유효하지 않은 접근 코드입니다', status: 403 };
    }

    return {
      success: true,
      userId: userPayload.keyId as number,
      role: 'access-key',
      keyId: userPayload.keyId as number,
      postId: userPayload.postId as number,
    };
  }

  return { success: false, error: '유효하지 않은 토큰입니다', status: 403 };
}
