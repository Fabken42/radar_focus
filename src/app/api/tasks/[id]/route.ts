import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Task from '@/models/Task';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const { id } = await params;
  const body = await req.json();
  const allowed = ['title', 'description', 'category', 'timeMinutes', 'status', 'timeSpentMs', 'order'];
  const updates: any = {};
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }
  if (updates.timeSpentMs !== undefined) {
    const ms = Number(updates.timeSpentMs);
    if (!Number.isFinite(ms) || ms < 0 || ms > 86_400_000 * 7) {
      return NextResponse.json({ error: 'timeSpentMs inválido' }, { status: 400 });
    }
    updates.timeSpentMs = ms;
  }
  if (updates.order !== undefined) {
    const ord = Number(updates.order);
    if (!Number.isInteger(ord) || ord < 0) {
      return NextResponse.json({ error: 'order inválido' }, { status: 400 });
    }
    updates.order = ord;
  }
  const task = await Task.findOneAndUpdate(
    { _id: id, userId: session.user.id },
    updates,
    { returnDocument: 'after', runValidators: true }
  );
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(task);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const { id } = await params;
  await Task.findOneAndDelete({ _id: id, userId: session.user.id });
  return NextResponse.json({ ok: true });
}
