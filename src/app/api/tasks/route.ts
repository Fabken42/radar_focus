import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Task from '@/models/Task';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const { searchParams } = new URL(req.url);
  const boardId = searchParams.get('boardId');
  if (!boardId) return NextResponse.json({ error: 'boardId required' }, { status: 400 });
  const tasks = await Task.find({ boardId, userId: session.user.id }).sort({ order: 1, createdAt: 1 });
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const body = await req.json();
  const { boardId, title, description, category, timeMinutes, order, status, timeSpentMs } = body;

  if (!boardId || !title || !category) return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
  if (title.length > 100) return NextResponse.json({ error: 'Título muito longo.' }, { status: 400 });
  if (category.length > 30) return NextResponse.json({ error: 'Categoria muito longa.' }, { status: 400 });

  const validStatuses = ['pending', 'in_progress', 'done'];

  const count = await Task.countDocuments({ boardId, userId: session.user.id });
  if (count >= 30) return NextResponse.json({ error: 'Limite de 30 tarefas por board atingido.' }, { status: 400 });

  const task = await Task.create({
    userId: session.user.id,
    boardId,
    title: title.trim(),
    description: description?.trim() || '',
    category: category.trim(),
    timeMinutes: timeMinutes || null,
    order: order ?? count,
    status: validStatuses.includes(status) ? status : 'pending',
    timeSpentMs: typeof timeSpentMs === 'number' && timeSpentMs >= 0 ? timeSpentMs : 0,
  });
  return NextResponse.json(task, { status: 201 });
}
