'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useLocalDataStore } from '@/store/localDataStore';
import { RadarDisplay } from '@/components/radar/RadarChart';
import { GradeDisplay } from '@/components/GradeDisplay';
import { calcBoardGrade } from '@/lib/utils/gradeCalculator';
import { gradeColor } from '@/lib/utils/colors';

export default function WeeklyPage() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user?.id;
  const localStore = useLocalDataStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoggedIn) {
      fetch('/api/weekly')
        .then((r) => r.json())
        .then((d) => { setData(d); setLoading(false); })
        .catch(() => setLoading(false));
    } else {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const recentBoards = localStore.boards.filter(
        (b) => b.status === 'saved' && b.closedAt && new Date(b.closedAt).getTime() >= sevenDaysAgo
      );
      const boardIds = new Set(recentBoards.map((b) => b.id));
      const tasks = localStore.tasks.filter((t) => boardIds.has(t.boardId));
      const result = calcBoardGrade(tasks);
      setData({
        categories: result.byCategory,
        overallScore: result.overallScore,
        overall: result.overall,
        hasEnoughCategories: result.hasEnoughCategories,
      });
      setLoading(false);
    }
  }, [isLoggedIn]);

  if (loading) {
    return <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Radar Semanal</h1>
        {data?.hasEnoughCategories && (
          <GradeDisplay grade={data.overall} score={data.overallScore} size="md" showScore />
        )}
      </div>

      {(!data || !data.hasEnoughCategories) ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">📡</div>
          <p className="font-medium text-lg">Dados insuficientes</p>
          <p className="text-sm mt-1">Salve boards com pelo menos 3 categorias nos últimos 7 dias.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <RadarDisplay categories={data.categories} height={400} />
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {data.categories.map((c: any) => (
              <div key={c.category} className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                <span className="font-medium text-gray-700 dark:text-gray-300 truncate">{c.category}</span>
                <span className="ml-auto font-bold flex-shrink-0" style={{ color: gradeColor(c.grade) }}>{c.grade}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
