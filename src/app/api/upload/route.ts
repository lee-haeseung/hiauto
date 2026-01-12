import { requireAuth } from '@/lib/api/middleware';
import { successResponse, errorResponse, forbiddenResponse, serverErrorResponse } from '@/lib/api/response';
import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

// Service Role Key를 사용하여 Storage 업로드 권한 획득
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 허용되는 이미지 MIME 타입
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

// 사용자 이미지 최대 크기 (5MB)
const USER_MAX_FILE_SIZE = 5 * 1024 * 1024;

// 관리자 최대 파일 크기 (50MB)
const ADMIN_MAX_FILE_SIZE = 50 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    // 인증 확인 (관리자 또는 사용자)
    const auth = await requireAuth(request);
    if (!auth.success) {
      return forbiddenResponse(auth.error);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return errorResponse('파일을 선택해주세요');
    }

    // 사용자는 이미지만 업로드 가능
    if (auth.role === 'access-key') {
      if (!IMAGE_MIME_TYPES.includes(file.type)) {
        return errorResponse('이미지 파일만 업로드 가능합니다 (jpg, png, gif, webp)');
      }

      if (file.size > USER_MAX_FILE_SIZE) {
        return errorResponse('파일 크기는 5MB 이하여야 합니다');
      }
    } else if (auth.role === 'admin') {
      // 관리자는 검사하지 않음
    }

    // 파일명 생성 (타임스탬프 + 원본 파일명)
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${timestamp}-${sanitizedFileName}`;
    const uploadPath = process.env.SUPABASE_UPLOAD_PATH || 'uploads';
    const filePath = `${uploadPath}/${fileName}`;

    // Supabase Storage에 업로드
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET!;
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: process.env.SUPABASE_CACHE_CONTROL || '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return serverErrorResponse('파일 업로드에 실패했습니다');
    }

    // 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return successResponse({
      url: urlData.publicUrl,
      fileName: file.name,
      filePath: filePath,
      fileSize: file.size,
      mimeType: file.type,
    }, 201);
  } catch (error) {
    console.error('Upload error:', error);
    return serverErrorResponse('파일 업로드 중 오류가 발생했습니다');
  }
}
