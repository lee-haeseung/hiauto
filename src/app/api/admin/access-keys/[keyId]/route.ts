import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/middleware';
import { successResponse, errorResponse, forbiddenResponse, notFoundResponse, serverErrorResponse } from '@/lib/api/response';
import { getAccessKeyById, updateAccessKey, deleteAccessKey } from '@/lib/db/queries';

// PATCH /admin/access-keys/[keyId] - 접근 코드 수정 (메모/만료일)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.success) {
      return forbiddenResponse(auth.error);
    }

    const { keyId: keyIdParam } = await params;
    const keyId = parseInt(keyIdParam);
    if (isNaN(keyId)) {
      return errorResponse('잘못된 접근 코드 ID입니다');
    }

    // 접근 코드 존재 확인 (만료 여부 상관없이 조회)
    const existingKey = await getAccessKeyById(keyId, true);
    if (!existingKey) {
      return notFoundResponse('접근 코드를 찾을 수 없습니다');
    }

    const { memo, expiresAt } = await request.json();

    const updateData: any = {};
    
    if (memo !== undefined) {
      updateData.memo = memo;
    }
    
    if (expiresAt !== undefined) {
      if (expiresAt === null) {
        return errorResponse('만료일은 필수입니다. null로 설정할 수 없습니다');
      }
      
      updateData.expiresAt = new Date(expiresAt);
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse('수정할 내용이 없습니다');
    }

    const updatedKey = await updateAccessKey(keyId, updateData);
    return successResponse(updatedKey);
  } catch (error) {
    console.error('Update access key error:', error);
    return serverErrorResponse('접근 코드 수정에 실패했습니다');
  }
}

// DELETE /admin/access-keys/[keyId] - 접근 코드 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.success) {
      return forbiddenResponse(auth.error);
    }

    const { keyId: keyIdParam } = await params;
    const keyId = parseInt(keyIdParam);
    if (isNaN(keyId)) {
      return errorResponse('잘못된 접근 코드 ID입니다');
    }

    // 접근 코드 존재 확인 (만료 여부 상관없이 조회)
    const existingKey = await getAccessKeyById(keyId, true);
    if (!existingKey) {
      return notFoundResponse('접근 코드를 찾을 수 없습니다');
    }

    await deleteAccessKey(keyId);
    return successResponse({ message: '접근 코드가 삭제되었습니다' });
  } catch (error) {
    console.error('Delete access key error:', error);
    return serverErrorResponse('접근 코드 삭제에 실패했습니다');
  }
}
