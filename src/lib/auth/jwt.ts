import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
const accessKeySecret = new TextEncoder().encode(
  process.env.JWT_ACCESS_KEY_SECRET!
);

// 관리자 JWT 생성
export async function createAdminToken(userId: number, username: string) {
  return new SignJWT({ userId, username, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
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

  if (expiresAt) {
    jwt.setExpirationTime(Math.floor(expiresAt.getTime() / 1000));
  }

  return jwt.sign(accessKeySecret);
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
