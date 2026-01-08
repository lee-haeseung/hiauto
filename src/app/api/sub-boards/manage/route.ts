import { createSubBoard, deleteSubBoard, updateSubBoardName, updateSubBoardOrder } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { boardId, name } = await request.json();

    if (!boardId || !name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'boardId and name are required' },
        { status: 400 }
      );
    }

    const newSubBoard = await createSubBoard(boardId, name);
    return NextResponse.json(newSubBoard, { status: 201 });
  } catch (error) {
    console.error('Error creating sub-board:', error);
    return NextResponse.json({ error: 'Failed to create sub-board' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, order, name } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    if (order !== undefined) {
      await updateSubBoardOrder(id, order);
    }
    
    if (name !== undefined) {
      await updateSubBoardName(id, name);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating sub-board:', error);
    return NextResponse.json({ error: 'Failed to update sub-board' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await deleteSubBoard(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting sub-board:', error);
    return NextResponse.json({ error: 'Failed to delete sub-board' }, { status: 500 });
  }
}
