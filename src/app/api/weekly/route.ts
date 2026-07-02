import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Board from '@/models/Board';
import Task from '@/models/Task';
import { calcBoardGrade } from '@/lib/utils/gradeCalculator';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const boards = await Board.find({
    userId: session.user.id,
    status: 'saved',
    closedAt: { $gte: sevenDaysAgo },
  });

  if (boards.length === 0) return NextResponse.json({ categories: [], overallScore: 0, overall: 'F', hasEnoughCategories: false });

  const boardIds = boards.map((b) => b._id);
  const tasks = await Task.find({ userId: session.user.id, boardId: { $in: boardIds } });

  const { byCategory, overallScore, overall, hasEnoughCategories } = calcBoardGrade(tasks);

  return NextResponse.json({ categories: byCategory, overallScore, overall, hasEnoughCategories });
}
