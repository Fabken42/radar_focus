'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useLocalDataStore } from '@/store/localDataStore';
import { GradeDisplay } from '@/components/GradeDisplay';
import { gradeColor } from '@/lib/utils/colors';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function HistoryPage() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user?.id;
  const localStore = useLocalDataStore();
  const [boards, setBoards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoggedIn) {
      fetch('/api/boards?status=saved')
        .then((r) => r.json())
        .then((data) => { setBoards(data); setLoading(false); })
        .catch(() => setLoading(false));
    } else {
      const saved = localStore.boards
        .filter((b) => b.status === 'saved')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setBoards(saved);
      setLoading(false);
    }
  }, [isLoggedIn]);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        ))}
      </div>
    );
  }

  if (boards.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <div className="text-5xl mb-3">📚</div>
        <p className="font-medium text-lg">Nenhum board salvo ainda</p>
        <p className="text-sm mt-1">Salve um board na tela principal para ver o histórico aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white">Histórico</h1>
      <div className="space-y-3">
        {boards.map((board) => {
          const snap = board.gradeSnapshot;
          const date = board.closedAt ? new Date(board.closedAt) : new Date(board.createdAt);
          return (
            <div key={board._id || board.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-start gap-4">
              {snap && <GradeDisplay grade={snap.overall} score={snap.overallScore} size="md" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-white">{board.label || 'Board'}</span>
                  <span className="text-xs text-gray-400">
                    {format(date, "dd 'de' MMM, HH:mm", { locale: ptBR })}
                  </span>
                </div>
                {snap?.byCategory && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {snap.byCategory.map((c: any) => (
                      <span
                        key={c.category}
                        className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center gap-1"
                      >
                        {c.category}
                        <span className="font-bold" style={{ color: gradeColor(c.grade) }}>{c.grade}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
