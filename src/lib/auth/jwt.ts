import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
const accessKeySecret = new TextEncoder().encode(
  process.env.JWT_ACCESS_KEY_SECRET!
);

// 관리자 JWT 생성
export async function createAdminToken(userId: number, username: string) {
  return new SignJWT({ userId, username, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(process.env.JWT_ADMIN_EXPIRES_IN || '7d')
    .setIssuedAt()
    .sign(secret);
}

// 관리자 JWT 검증
export async function verifyAdminToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

// 액세스 키 JWT 생성 (게시물 접근용) - 여러 accessKey 지원
export async function createAccessKeyToken(keyIds: number[]) {
  if (!keyIds || keyIds.length === 0) {
    throw new Error('At least one access key is required');
  }
  
  const jwt = new SignJWT({ keyIds, role: 'access-key' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt();

  // JWT 토큰 자체의 만료 시간 (환경변수 기본값: 24h)
  const jwtExpiry = process.env.JWT_ACCESS_KEY_EXPIRES_IN || '24h';
  jwt.setExpirationTime(jwtExpiry);

  return jwt.sign(accessKeySecret);
}

// 만료 시간 문자열을 초로 변환 (7d -> 604800, 24h -> 86400)
function parseExpiryToSeconds(expiry: string): number {
  const match = expiry.match(/^(\d+)([dhms])$/);
  if (!match) return 86400; // 기본값 24시간
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 'd': return value * 86400;
    case 'h': return value * 3600;
    case 'm': return value * 60;
    case 's': return value;
    default: return 86400;
  }
}

// 액세스 키 JWT 검증
export async function verifyAccessKeyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, accessKeySecret);
    return payload;
  } catch {
    return null;
  }
}

// NextRequest에서 관리자 토큰 추출 및 검증
export async function verifyAdminFromRequest(request: Request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return { error: 'Unauthorized', status: 401 };
  }

  const payload = await verifyAdminToken(token);
  if (!payload || payload.role !== 'admin') {
    return { error: 'Forbidden', status: 403 };
  }

  return { payload };
}

// NextRequest에서 액세스 키 토큰 추출 및 검증
export async function verifyAccessKeyFromRequest(request: Request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return { error: 'Unauthorized', status: 401 };
  }

  const payload = await verifyAccessKeyToken(token);
  if (!payload || payload.role !== 'access-key') {
    return { error: 'Forbidden', status: 403 };
  }

  return { payload };
}

// NextRequest에서 관리자 또는 액세스 키 토큰 추출 및 검증
export async function verifyAdminOrAccessKeyFromRequest(request: Request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return { error: 'Unauthorized', status: 401 };
  }

  // 먼저 관리자 토큰 검증 시도
  const adminPayload = await verifyAdminToken(token);
  if (adminPayload && adminPayload.role === 'admin') {
    return { payload: adminPayload, role: 'admin' };
  }

  // 관리자 토큰이 아니면 액세스 키 토큰 검증 시도
  const accessKeyPayload = await verifyAccessKeyToken(token);
  if (accessKeyPayload && accessKeyPayload.role === 'access-key') {
    return { payload: accessKeyPayload, role: 'access-key' };
  }

  return { error: 'Forbidden', status: 403 };
}
