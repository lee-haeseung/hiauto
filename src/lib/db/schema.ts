import { integer, json, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// 관리자 테이블
export const admins = pgTable('admins', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 게시판 테이블
export const boards = pgTable('boards', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 서브게시판
export const subBoards = pgTable('sub_boards', {
  id: serial('id').primaryKey(),
  boardId: integer('board_id').references(() => boards.id).notNull(),
  name: text('name').notNull(),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 게시물 테이블
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  subBoardId: integer('sub_board_id').references(() => subBoards.id).notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(), // HTML 형식으로 저장
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 액세스 키 테이블
export const accessKeys = pgTable('access_keys', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(), // 실제 액세스 키 문자열
  postId: integer('post_id').references(() => posts.id).notNull(),
  expiresAt: timestamp('expires_at'), // null이면 무제한
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 파일 메타데이터 테이블 (Supabase Storage 파일 추적용)
export const files = pgTable('files', {
  id: serial('id').primaryKey(),
  filename: text('filename').notNull(),
  storagePath: text('storage_path').notNull(), // Supabase Storage 경로
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(), // bytes
  postId: integer('post_id').references(() => posts.id),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
});

// 기타 정책 테이블
export const policies = pgTable('policies', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  policy: json('policy').notNull(), // JSON 형식의 정책 데이터
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
