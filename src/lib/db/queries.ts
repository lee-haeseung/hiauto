import { eq } from 'drizzle-orm';
import { db } from './index';
import { accessKeys, admins, boards, posts, subBoards } from './schema';

// Boards 조회
export async function getAllBoards() {
  return await db.select().from(boards);
}

// SubBoards 조회 (특정 board의 subBoards)
export async function getSubBoardsByBoardId(boardId: number) {
  return await db.select().from(subBoards).where(eq(subBoards.boardId, boardId));
}

// Posts 조회 (특정 subBoard의 posts)
export async function getPostsBySubBoardId(subBoardId: number) {
  return await db
    .select({
      id: posts.id,
      title: posts.title,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .where(eq(posts.subBoardId, subBoardId))
    .orderBy(posts.createdAt);
}

// Post 상세 조회
export async function getPostById(postId: number) {
  const result = await db.select().from(posts).where(eq(posts.id, postId));
  return result[0] || null;
}

// 관리자 조회 (로그인용)
export async function getAdminByUsername(username: string) {
  const result = await db.select().from(admins).where(eq(admins.username, username));
  return result[0] || null;
}

// 액세스 키 검증
export async function verifyAccessKey(key: string) {
  const result = await db
    .select()
    .from(accessKeys)
    .where(eq(accessKeys.key, key));
  
  if (!result[0]) return null;
  
  const accessKey = result[0];
  
  // 만료 확인
  if (accessKey.expiresAt && accessKey.expiresAt < new Date()) {
    return null;
  }
  
  return accessKey;
}
