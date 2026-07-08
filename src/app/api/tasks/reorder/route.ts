import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Task from '@/models/Task';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();

  const { items } = await req.json();
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'items obrigatório' }, { status: 400 });
  }

  const ops = items
    .filter(({ id, order }: { id: string; order: number }) => typeof id === 'string' && Number.isInteger(order) && order >= 0)
    .map(({ id, order }: { id: string; order: number }) => ({
      updateOne: {
        filter: { _id: id, userId: session.user!.id },
        update: { $set: { order } },
      },
    }));

  if (ops.length === 0) return NextResponse.json({ error: 'Nenhum item válido' }, { status: 400 });

  await Task.bulkWrite(ops);
  return NextResponse.json({ ok: true });
}
