import { createAdminToken } from '@/lib/auth/jwt';
import { verifyPassword } from '@/lib/auth/password';
import { getAdminByUsername } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }
    
    // 관리자 조회
    const admin = await getAdminByUsername(username);
    
    if (!admin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    // 비밀번호 검증
    const isValid = await verifyPassword(password, admin.passwordHash);
    
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    // JWT 생성
    const token = await createAdminToken(admin.id, admin.username);
    
    return NextResponse.json({ token, role: 'admin' });
  } catch (error) {
    console.error('Error during admin login:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
