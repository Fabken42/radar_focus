import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Category from '@/models/Category';
import { getNextColor } from '@/lib/utils/colors';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const categories = await Category.find({ userId: session.user.id }).sort({ createdAt: 1 });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();

  const count = await Category.countDocuments({ userId: session.user.id });
  if (count >= 10) return NextResponse.json({ error: 'Limite de 10 categorias atingido.' }, { status: 400 });

  const { name, color } = await req.json();
  if (!name || name.length > 30) return NextResponse.json({ error: 'Nome inválido.' }, { status: 400 });

  const existing = await Category.find({ userId: session.user.id });
  const usedColors = existing.map((c) => c.color);
  const finalColor = color || getNextColor(usedColors);

  try {
    const category = await Category.create({ userId: session.user.id, name: name.trim(), color: finalColor });
    return NextResponse.json(category, { status: 201 });
  } catch (e: any) {
    if (e.code === 11000) return NextResponse.json({ error: 'Categoria já existe.' }, { status: 409 });
    return NextResponse.json({ error: 'Erro ao criar categoria.' }, { status: 500 });
  }
}
