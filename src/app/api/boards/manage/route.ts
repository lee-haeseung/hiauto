import { verifyAdminFromRequest } from '@/lib/auth/jwt';
import { createBoard, deleteBoard, updateBoardName, updateBoardOrder } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authResult = await verifyAdminFromRequest(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { name } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Board name is required' }, { status: 400 });
    }

    const newBoard = await createBoard(name);
    return NextResponse.json(newBoard, { status: 201 });
  } catch (error) {
    console.error('Error creating board:', error);
    return NextResponse.json({ error: 'Failed to create board' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authResult = await verifyAdminFromRequest(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id, order, name } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    if (order !== undefined) {
      await updateBoardOrder(id, order);
    }
    
    if (name !== undefined) {
      await updateBoardName(id, name);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating board:', error);
    return NextResponse.json({ error: 'Failed to update board' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authResult = await verifyAdminFromRequest(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await deleteBoard(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting board:', error);
    return NextResponse.json({ error: 'Failed to delete board' }, { status: 500 });
  }
}
