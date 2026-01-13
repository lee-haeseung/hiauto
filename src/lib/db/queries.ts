import crypto from 'crypto';
import { and, desc, eq, ilike, inArray, isNull, lt, gte, or, sql } from 'drizzle-orm';
import { db } from './index';
import { accessKeys, admins, boards, feedbacks, posts, subBoards } from './schema';

// Boards 조회
export async function getAllBoards() {
  return await db.select().from(boards).orderBy(boards.order);
}

// Board 조회 (ID로)
export async function getBoardById(boardId: number) {
  const result = await db.select().from(boards).where(eq(boards.id, boardId));
  return result[0] || null;
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

// SubBoard 조회 (ID로)
export async function getSubBoardById(subBoardId: number) {
  const result = await db.select().from(subBoards).where(eq(subBoards.id, subBoardId));
  return result[0] || null;
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

// Post 수정
export async function updatePost(
  postId: number,
  data: {
    subBoardId?: number;
    title?: string;
    content?: string;
  }
) {
  const result = await db
    .update(posts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(posts.id, postId))
    .returning();
  return result[0];
}

// 관리자 조회 (로그인용)
export async function getAdminByUsername(username: string) {
  const result = await db.select().from(admins).where(eq(admins.username, username));
  return result[0] || null;
}

// 액세스 키 검증 (문자열 키로 조회)
export async function verifyAccessKey(key: string) {
  const result = await db
    .select()
    .from(accessKeys)
    .where(eq(accessKeys.key, key));
  
  if (!result[0]) return null;
  
  const accessKey = result[0];
  
  return accessKey;
}

// 액세스 키 검증 (ID로 조회)
export async function getAccessKeyById(keyId: number, skipExpiryCheck: boolean = false) {
  const result = await db
    .select()
    .from(accessKeys)
    .where(eq(accessKeys.id, keyId));
  
  if (!result[0]) return null;
  
  const accessKey = result[0];
  
  // 만료 확인 (skipExpiryCheck가 true면 만료 체크 안 함)
  if (!skipExpiryCheck && accessKey.expiresAt && accessKey.expiresAt < new Date()) {
    return null;
  }
  
  return accessKey;
}

// keyIds 중 하나라도 특정 postId에 유효한 접근 권한이 있는지 확인
export async function validateAccessKeysForPost(keyIds: number[], postId: number) {
  if (!keyIds || keyIds.length === 0) {
    return null;
  }

  // keyIds 중에서 postId에 접근 가능하고 만료되지 않은 키 찾기
  const result = await db
    .select()
    .from(accessKeys)
    .where(
      and(
        inArray(accessKeys.id, keyIds),
        eq(accessKeys.postId, postId),
        or(
          isNull(accessKeys.expiresAt),
          gte(accessKeys.expiresAt, new Date())
        )
      )
    )
    .limit(1);

  return result[0] || null;
}

// 게시글 검색
export async function searchPosts(params: {
  query: string;
  target: 'title' | 'content' | 'all';
  boardId?: number;
  subBoardId?: number;
}) {
  const { query, target, boardId, subBoardId } = params;

  const whereConditions: any[] = [];

  // 검색 대상에 따른 조건 (ilike 함수 사용으로 파라미터 바인딩 적용)
  const searchPattern = `%${query}%`;
  
  if (target === 'title') {
    whereConditions.push(ilike(posts.title, searchPattern));
  } else if (target === 'content') {
    whereConditions.push(ilike(posts.content, searchPattern));
  } else {
    // 전체 검색
    whereConditions.push(
      or(
        ilike(posts.title, searchPattern),
        ilike(posts.content, searchPattern)
      )
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
      whereConditions.push(inArray(posts.subBoardId, subBoardIds));
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
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(posts.createdAt)
    .limit(100);

  return result;
}

// 액세스 키 관련 함수들

// 특정 게시물의 액세스 키 조회 (페이지네이션)
export async function getAccessKeysByPostId(
  postId: number,
  page: number = 1,
  pageSize: number = 10
) {
  const offset = (page - 1) * pageSize;
  
  const keys = await db
    .select()
    .from(accessKeys)
    .where(eq(accessKeys.postId, postId))
    .orderBy(accessKeys.createdAt)
    .limit(pageSize)
    .offset(offset);
  
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(accessKeys)
    .where(eq(accessKeys.postId, postId));
  
  const total = Number(totalResult[0]?.count ?? 0);
  
  return { keys, total };
}

// 액세스 키 생성
export async function createAccessKey(data: {
  postId: number;
  memo?: string;
  expiresAt?: Date | null;
}) {
  // 랜덤 키 생성 (32자 hex)
  const key = crypto.randomBytes(16).toString('hex');
  
  const values: any = {
    key,
    postId: data.postId,
    memo: data.memo || undefined,
  };
  
  if (data.expiresAt) {
    values.expiresAt = data.expiresAt;
  }
  
  const result = await db
    .insert(accessKeys)
    .values(values)
    .returning();
  
  return result[0];
}

// 액세스 키 삭제
export async function deleteAccessKey(keyId: number) {
  return await db.delete(accessKeys).where(eq(accessKeys.id, keyId));
}

// 액세스 키 수정 (메모, 만료일)
export async function updateAccessKey(keyId: number, data: {
  memo?: string;
  expiresAt?: Date | null;
}) {
  const updateData: any = {};
  
  if (data.memo !== undefined) {
    updateData.memo = data.memo;
  }
  
  if (data.expiresAt !== undefined) {
    updateData.expiresAt = data.expiresAt || undefined;
  }
  
  const result = await db
    .update(accessKeys)
    .set(updateData)
    .where(eq(accessKeys.id, keyId))
    .returning();
  return result[0];
}

// 모든 액세스 키 조회 (필터링)
export async function getAllAccessKeys(params?: {
  postId: number;
  search?: string;
  isExpired?: boolean;
  page?: number;
  pageSize?: number;
}) {
  const { postId, search, isExpired, page = 1, pageSize = 20 } = params || {};
  const offset = (page - 1) * pageSize;

  const whereConditions: any[] = [];

  if (postId) {
    whereConditions.push(eq(accessKeys.postId, postId));
  }

  if (search) {
    const searchPattern = `%${search}%`;
    whereConditions.push(
      or(
        ilike(accessKeys.key, searchPattern),
        ilike(accessKeys.memo, searchPattern)
      )
    );
  }

  // 만료 여부 필터링
  if (isExpired !== undefined) {
    const now = new Date();
    if (isExpired) {
      // 만료된 키만 (expiresAt이 현재 시간보다 이전)
      whereConditions.push(lt(accessKeys.expiresAt, now));
    } else {
      // 만료되지 않은 키만 (expiresAt이 현재 시간 이후 또는 null)
      whereConditions.push(
        or(
          gte(accessKeys.expiresAt, now),
          isNull(accessKeys.expiresAt)
        )
      );
    }
  }

  const keys = await db
    .select()
    .from(accessKeys)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(accessKeys.createdAt)
    .limit(pageSize)
    .offset(offset);

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(accessKeys)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

  const total = Number(totalResult[0]?.count ?? 0);

  return { keys, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

// ==================== 피드백 관련 함수 ====================

// 피드백 생성
export async function createFeedback(data: {
  postId: number;
  accessKeyId: number;
  accessKeyMemo: string | null;
  phone?: string;
  isSolved?: boolean;
  description?: string;
}) {
  const result = await db.insert(feedbacks).values(data).returning();
  return result[0];
}

// 피드백 조회 (ID로)
export async function getFeedbackById(feedbackId: number) {
  const result = await db.select().from(feedbacks).where(eq(feedbacks.id, feedbackId));
  return result[0] || null;
}

// 피드백 수정
export async function updateFeedback(feedbackId: number, data: {
  phone?: string;
  isSolved?: boolean;
  description?: string;
}) {
  const result = await db
    .update(feedbacks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(feedbacks.id, feedbackId))
    .returning();
  return result[0];
}

// 특정 게시물의 피드백 목록 조회
export async function getFeedbacksByPostId(postId: number) {
  return await db.select().from(feedbacks).where(eq(feedbacks.postId, postId)).orderBy(feedbacks.createdAt);
}

// 특정 accessKey의 피드백 조회
export async function getFeedbackByAccessKeyIdAndPostId(accessKeyId: number, postId: number) {
  const result = await db.select().from(feedbacks).where(and(eq(feedbacks.accessKeyId, accessKeyId), eq(feedbacks.postId, postId)));
  return result[0] || null;
}

// 모든 피드백 조회 (관리자용, 필터링)
export async function getAllFeedbacks(params?: {
  postId?: number;
  isSolved?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const { postId, isSolved, search, page = 1, pageSize = 20 } = params || {};
  const offset = (page - 1) * pageSize;

  const whereConditions: any[] = [];

  if (postId !== undefined) {
    whereConditions.push(eq(feedbacks.postId, postId));
  }

  if (isSolved !== undefined) {
    whereConditions.push(eq(feedbacks.isSolved, isSolved));
  }

  if (search) {
    const searchPattern = `%${search}%`;
    whereConditions.push(
      or(
        ilike(feedbacks.phone, searchPattern),
        ilike(feedbacks.description, searchPattern),
        ilike(feedbacks.accessKeyMemo, searchPattern)
      )
    );
  }

  const items = await db
    .select()
    .from(feedbacks)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(feedbacks.createdAt)
    .limit(pageSize)
    .offset(offset);

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(feedbacks)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

  const total = Number(totalResult[0]?.count ?? 0);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

// 피드백 해결 비율 조회 (전체 또는 특정 게시물)
export async function getFeedbackSummary(postId: number) {
  const whereCondition = eq(feedbacks.postId, postId);

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(feedbacks)
    .where(whereCondition);

  const solvedResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(feedbacks)
    .where(and(whereCondition, eq(feedbacks.isSolved, true)));

  const total = Number(totalResult[0]?.count ?? 0);
  const solved = Number(solvedResult[0]?.count ?? 0);
  const solveRate = total > 0 ? (solved / total) * 100 : 0;

  return { total, solved, unsolved: total - solved, solveRate: parseFloat(solveRate.toFixed(2)) };
}

// 모든 게시물 조회 (관리자용, 필터링)
export async function getAllPosts(params?: {
  boardId?: number;
  subBoardId?: number;
  query?: string;
  target?: 'title' | 'content' | 'all';
  page?: number;
  pageSize?: number;
}) {
  const { boardId, subBoardId, query, target = 'all', page = 1, pageSize = 20 } = params || {};
  const offset = (page - 1) * pageSize;

  const whereConditions: any[] = [];

  // 서브게시판 ID로 필터링
  if (subBoardId) {
    whereConditions.push(eq(posts.subBoardId, subBoardId));
  } else if (boardId) {
    // 게시판 ID만 있으면 해당 게시판의 모든 서브게시판 검색
    const boardSubBoards = await getSubBoardsByBoardId(boardId);
    const subBoardIds = boardSubBoards.map(sb => sb.id);
    if (subBoardIds.length > 0) {
      whereConditions.push(inArray(posts.subBoardId, subBoardIds));
    }
  }

  // 키워드로 검색 (전체|제목|내용)
  if (query && query.trim()) {
    const searchPattern = `%${query.trim()}%`;
    
    if (target === 'title') {
      whereConditions.push(ilike(posts.title, searchPattern));
    } else if (target === 'content') {
      whereConditions.push(ilike(posts.content, searchPattern));
    } else {
      // 전체 검색
      whereConditions.push(
        or(
          ilike(posts.title, searchPattern),
          ilike(posts.content, searchPattern)
        )
      );
    }
  }

  const items = await db
    .select({
      id: posts.id,
      title: posts.title,
      subBoardId: posts.subBoardId,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(desc(posts.createdAt))
    .limit(pageSize)
    .offset(offset);

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(posts)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

  const total = Number(totalResult[0]?.count ?? 0);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

// 모든 서브게시판 조회
export async function getAllSubBoards(boardId?: number) {
  const query = db.select().from(subBoards).orderBy(subBoards.boardId, subBoards.order);
  
  if (boardId) {
    query.where(eq(subBoards.boardId, boardId));
  }

  return await query;
}


