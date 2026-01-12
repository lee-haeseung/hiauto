import { createAdminToken } from '@/lib/auth/jwt';
import { verifyPassword } from '@/lib/auth/password';
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api/response';
import { getAdminByUsername } from '@/lib/db/queries';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return errorResponse('아이디와 비밀번호를 입력해주세요');
    }
    
    // 관리자 조회
    const admin = await getAdminByUsername(username);
    
    if (!admin) {
      return unauthorizedResponse('아이디 또는 비밀번호가 일치하지 않습니다');
    }
    
    // 비밀번호 검증
    const isValid = await verifyPassword(password, admin.passwordHash);
    
    if (!isValid) {
      return unauthorizedResponse('아이디 또는 비밀번호가 일치하지 않습니다');
    }
    
    // JWT 생성
    const token = await createAdminToken(admin.id, admin.username);
    
    return successResponse({ token, role: 'admin', username: admin.username });
  } catch (error) {
    console.error('Admin login error:', error);
    return serverErrorResponse('로그인에 실패했습니다');
  }
}
