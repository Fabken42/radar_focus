import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Category from '@/models/Category';
import Board from '@/models/Board';
import Task from '@/models/Task';
import Template from '@/models/Template';
import { getNextColor } from '@/lib/utils/colors';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();

  const { categories, boards, tasks, templates } = await req.json();

  // Categories
  const catIdMap: Record<string, string> = {};
  if (categories?.length) {
    const existingCats = await Category.find({ userId: session.user.id });
    const usedColors = existingCats.map((c: any) => c.color);
    for (const cat of categories) {
      const exists = await Category.findOne({ userId: session.user.id, name: { $regex: new RegExp(`^${cat.name}$`, 'i') } });
      if (!exists) {
        const color = cat.color || getNextColor(usedColors);
        usedColors.push(color);
        const created = await Category.create({ userId: session.user.id, name: cat.name, color });
        catIdMap[cat.id] = created._id.toString();
      } else {
        catIdMap[cat.id] = exists._id.toString();
      }
    }
  }

  // Boards + Tasks
  const boardIdMap: Record<string, string> = {};
  if (boards?.length) {
    for (const board of boards) {
      const created = await Board.create({
        userId: session.user.id,
        label: board.label || '',
        status: board.status || 'open',
        gradeSnapshot: board.gradeSnapshot || null,
        createdAt: board.createdAt ? new Date(board.createdAt) : new Date(),
        closedAt: board.closedAt ? new Date(board.closedAt) : null,
      });
      boardIdMap[board.id] = created._id.toString();
    }
  }

  if (tasks?.length) {
    for (const task of tasks) {
      const newBoardId = boardIdMap[task.boardId];
      if (!newBoardId) continue;
      await Task.create({
        userId: session.user.id,
        boardId: newBoardId,
        title: task.title,
        description: task.description || '',
        category: task.category,
        timeMinutes: task.timeMinutes || null,
        status: task.status || 'pending',
        timeSpentMs: task.timeSpentMs || 0,
        order: task.order || 0,
        createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
      });
    }
  }

  // Templates
  if (templates?.length) {
    for (const tmpl of templates) {
      await Template.create({
        userId: session.user.id,
        name: tmpl.name,
        weekday: tmpl.weekday ?? null,
        tasks: tmpl.tasks || [],
        createdAt: tmpl.createdAt ? new Date(tmpl.createdAt) : new Date(),
      });
    }
  }

  return NextResponse.json({ ok: true, boardIdMap, catIdMap });
}
