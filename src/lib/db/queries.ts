import { eq, sql } from 'drizzle-orm';
import { db } from './index';
import { accessKeys, admins, boards, posts, subBoards } from './schema';

// Boards 조회
export async function getAllBoards() {
  return await db.select().from(boards).orderBy(boards.order);
}

// Board 추가
export async function createBoard(name: string) {
  const maxOrder = await db.select({ max: sql<number>`MAX(${boards.order})` }).from(boards);
  const nextOrder = (maxOrder[0]?.max ?? -1) + 1;
  
  const result = await db.insert(boards).values({ name, order: nextOrder }).returning();
  return result[0];
}

// Board 순서 변경
export async function updateBoardOrder(id: number, newOrder: number) {
  return await db.update(boards).set({ order: newOrder }).where(eq(boards.id, id));
}

// Board 이름 변경
export async function updateBoardName(id: number, name: string) {
  return await db.update(boards).set({ name }).where(eq(boards.id, id));
}

// Board 삭제
export async function deleteBoard(id: number) {
  return await db.delete(boards).where(eq(boards.id, id));
}

// SubBoards 조회 (특정 board의 subBoards)
export async function getSubBoardsByBoardId(boardId: number) {
  return await db.select().from(subBoards).where(eq(subBoards.boardId, boardId)).orderBy(subBoards.order);
}

// SubBoard 추가
export async function createSubBoard(boardId: number, name: string) {
  const maxOrder = await db.select({ max: sql<number>`MAX(${subBoards.order})` })
    .from(subBoards)
    .where(eq(subBoards.boardId, boardId));
  const nextOrder = (maxOrder[0]?.max ?? -1) + 1;
  
  const result = await db.insert(subBoards).values({ boardId, name, order: nextOrder }).returning();
  return result[0];
}

// SubBoard 순서 변경
export async function updateSubBoardOrder(id: number, newOrder: number) {
  return await db.update(subBoards).set({ order: newOrder }).where(eq(subBoards.id, id));
}

// SubBoard 이름 변경
export async function updateSubBoardName(id: number, name: string) {
  return await db.update(subBoards).set({ name }).where(eq(subBoards.id, id));
}

// SubBoard 삭제
export async function deleteSubBoard(id: number) {
  return await db.delete(subBoards).where(eq(subBoards.id, id));
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

// Post 생성
export async function createPost(data: {
  subBoardId: number;
  title: string;
  content: string;
  accessKey?: string;
}) {
  const result = await db.insert(posts).values(data).returning();
  return result[0];
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

// 게시글 검색
export async function searchPosts(params: {
  query: string;
  target: 'title' | 'content' | 'all';
  boardId?: number;
  subBoardId?: number;
}) {
  const { query, target, boardId, subBoardId } = params;

  let whereConditions: any[] = [];

  // 검색 대상에 따른 조건
  if (target === 'title') {
    whereConditions.push(sql`${posts.title} ILIKE ${`%${query}%`}`);
  } else if (target === 'content') {
    whereConditions.push(sql`${posts.content} ILIKE ${`%${query}%`}`);
  } else {
    // 전체 검색
    whereConditions.push(
      sql`(${posts.title} ILIKE ${`%${query}%`} OR ${posts.content} ILIKE ${`%${query}%`})`
    );
  }

  // subBoardId 필터
  if (subBoardId) {
    whereConditions.push(eq(posts.subBoardId, subBoardId));
  } else if (boardId) {
    // boardId만 있으면 해당 board의 모든 subBoards 검색
    const boardSubBoards = await getSubBoardsByBoardId(boardId);
    const subBoardIds = boardSubBoards.map(sb => sb.id);
    if (subBoardIds.length > 0) {
      whereConditions.push(sql`${posts.subBoardId} IN ${subBoardIds}`);
    }
  }

  const result = await db
    .select({
      id: posts.id,
      title: posts.title,
      subBoardId: posts.subBoardId,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .where(whereConditions.length > 0 ? sql`${sql.join(whereConditions, sql` AND `)}` : undefined)
    .orderBy(posts.createdAt)
    .limit(100);

  return result;
}
