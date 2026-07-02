import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Board from '@/models/Board';
import Task from '@/models/Task';
import { calcBoardGrade } from '@/lib/utils/gradeCalculator';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const { id } = await params;
  const board = await Board.findOne({ _id: id, userId: session.user.id });
  if (!board) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(board);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const { id } = await params;

  const body = await req.json();
  const board = await Board.findOne({ _id: id, userId: session.user.id });
  if (!board) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (body.action === 'save') {
    const tasks = await Task.find({ boardId: id, userId: session.user.id });
    const { byCategory, overallScore, overall } = calcBoardGrade(tasks);
    board.status = 'saved';
    board.closedAt = new Date();
    board.gradeSnapshot = {
      overall,
      overallScore,
      byCategory: byCategory.map((c) => ({ category: c.category, grade: c.grade, score: c.score })),
    };
    await board.save();
    const newBoard = await Board.create({ userId: session.user.id, label: '' });
    return NextResponse.json({ saved: board, newBoard });
  }

  if (body.action === 'discard') {
    board.status = 'discarded';
    board.closedAt = new Date();
    await board.save();
    const newBoard = await Board.create({ userId: session.user.id, label: '' });
    return NextResponse.json({ discarded: board, newBoard });
  }

  if (body.label !== undefined) board.label = body.label;
  await board.save();
  return NextResponse.json(board);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const { id } = await params;
  await Board.findOneAndDelete({ _id: id, userId: session.user.id });
  await Task.deleteMany({ boardId: id, userId: session.user.id });
  return NextResponse.json({ ok: true });
}
