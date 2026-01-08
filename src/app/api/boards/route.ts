import { getAllBoards } from '@/lib/db/queries';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const boards = await getAllBoards();
    return NextResponse.json(boards);
  } catch (error) {
    console.error('Error fetching boards:', error);
    return NextResponse.json({ error: 'Failed to fetch boards' }, { status: 500 });
  }
}
