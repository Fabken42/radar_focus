import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Board from '@/models/Board';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const query: any = { userId: session.user.id };
  if (status) query.status = status;
  const boards = await Board.find(query).sort({ createdAt: -1 });
  return NextResponse.json(boards);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const { label } = await req.json().catch(() => ({}));
  const board = await Board.create({ userId: session.user.id, label: label || '' });
  return NextResponse.json(board, { status: 201 });
}
