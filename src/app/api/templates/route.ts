import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Template from '@/models/Template';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const templates = await Template.find({ userId: session.user.id }).sort({ createdAt: -1 });
  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const { name, weekday, tasks } = await req.json();
  if (!name || name.length > 40) return NextResponse.json({ error: 'Nome inválido.' }, { status: 400 });
  const template = await Template.create({ userId: session.user.id, name: name.trim(), weekday: weekday ?? null, tasks: tasks || [] });
  return NextResponse.json(template, { status: 201 });
}
