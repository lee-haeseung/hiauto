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

// 액세스 키 JWT 생성 (게시물 접근용)
export async function createAccessKeyToken(postId: number, expiresAt?: Date) {
  const jwt = new SignJWT({ postId, role: 'access-key' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt();

  // JWT 토큰 자체의 만료 시간 (환경변수 기본값: 24h)
  const jwtExpiry = process.env.JWT_ACCESS_KEY_EXPIRES_IN || '24h';
  
  // accessKey의 expiresAt과 JWT 기본 만료 중 더 빠른 시간 적용
  if (expiresAt) {
    const accessKeyExpiry = Math.floor(expiresAt.getTime() / 1000);
    const now = Math.floor(Date.now() / 1000);
    
    // JWT 기본 만료 시간을 초로 계산
    const jwtExpirySeconds = parseExpiryToSeconds(jwtExpiry);
    const jwtMaxExpiry = now + jwtExpirySeconds;
    
    // 둘 중 더 빠른 시간 사용
    jwt.setExpirationTime(Math.min(accessKeyExpiry, jwtMaxExpiry));
  } else {
    // accessKey 만료가 없어도 JWT는 환경변수 기본값으로 만료
    jwt.setExpirationTime(jwtExpiry);
  }

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
