'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useLocalDataStore } from '@/store/localDataStore';
import { GradeDisplay } from '@/components/GradeDisplay';
import { ConfirmModal } from '@/components/ConfirmModal';
import { RadarDisplay } from '@/components/radar/RadarChart';
import { calcBoardGrade } from '@/lib/utils/gradeCalculator';
import { gradeColor } from '@/lib/utils/colors';
import { cn } from '@/lib/utils/cn';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

type Period = { label: string; days: number | 'all'; title: string };

const PERIODS: Period[] = [
  { label: '3d',   days: 3,     title: 'Últimos 3 dias' },
  { label: '7d',   days: 7,     title: 'Últimos 7 dias' },
  { label: '14d',  days: 14,    title: 'Últimas 2 semanas' },
  { label: '30d',  days: 30,    title: 'Último mês' },
  { label: '90d',  days: 90,    title: 'Últimos 3 meses' },
  { label: 'Tudo', days: 'all', title: 'Todo o histórico' },
];

export default function HistoryPage() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user?.id;
  const localStore = useLocalDataStore();
  const router = useRouter();

  const [boards, setBoards] = useState<any[]>([]);
  const [boardsLoading, setBoardsLoading] = useState(true);

  const [period, setPeriod] = useState<Period>(PERIODS[1]); // default 7d
  const [radarData, setRadarData] = useState<any>(null);
  const [radarLoading, setRadarLoading] = useState(true);

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);

  // ── Boards list ──
  useEffect(() => {
    if (isLoggedIn) {
      fetch('/api/boards?status=saved')
        .then((r) => r.json())
        .then((data) => { setBoards(data); setBoardsLoading(false); })
        .catch(() => setBoardsLoading(false));
    } else {
      const saved = localStore.boards
        .filter((b) => b.status === 'saved')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setBoards(saved);
      setBoardsLoading(false);
    }
  }, [isLoggedIn]);

  // ── Radar by period ──
  const loadRadar = useCallback((p: Period) => {
    setRadarLoading(true);
    if (isLoggedIn) {
      const param = p.days === 'all' ? 'all' : String(p.days);
      fetch(`/api/weekly?days=${param}`)
        .then((r) => r.json())
        .then(setRadarData)
        .finally(() => setRadarLoading(false));
    } else {
      const cutoff = p.days === 'all' ? 0 : Date.now() - (p.days as number) * 24 * 60 * 60 * 1000;
      const recentBoards = localStore.boards.filter(
        (b) => b.status === 'saved' && b.closedAt && new Date(b.closedAt).getTime() >= cutoff
      );
      const boardIds = new Set(recentBoards.map((b) => b.id));
      const tasks = localStore.tasks.filter((t) => boardIds.has(t.boardId));
      const result = calcBoardGrade(tasks);
      setRadarData({ categories: result.byCategory, overallScore: result.overallScore, overall: result.overall, hasEnoughCategories: result.hasEnoughCategories });
      setRadarLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => { loadRadar(period); }, [period, loadRadar]);

  // ── Actions ──
  const handleDelete = async (id: string) => {
    try {
      if (isLoggedIn) {
        const r = await fetch(`/api/boards/${id}`, { method: 'DELETE' });
        if (!r.ok) throw new Error();
      } else {
        localStore.removeBoard(id);
      }
      setBoards((prev) => prev.filter((b) => (b._id || b.id) !== id));
      toast.success('Registro excluído.');
    } catch {
      toast.error('Erro ao excluir registro.');
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleRestore = (id: string) => {
    sessionStorage.setItem('radarfocus-restore', id);
    router.push('/app');
  };

  return (
    <div className="space-y-8">
      {confirmDelete && (
        <ConfirmModal
          title="Excluir este registro?"
          description="O board e suas tarefas serão removidos permanentemente do histórico."
          confirmLabel="Excluir"
          cancelLabel="Cancelar"
          danger
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {confirmRestore && (
        <ConfirmModal
          title="Restaurar este board?"
          description="O board atual será salvo automaticamente antes de restaurar. As tarefas deste board serão copiadas para um novo board aberto."
          confirmLabel="Restaurar"
          cancelLabel="Cancelar"
          onConfirm={() => { handleRestore(confirmRestore); setConfirmRestore(null); }}
          onCancel={() => setConfirmRestore(null)}
        />
      )}

      {/* ── Radar agregado ── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">Radar do período</h2>
            {!radarLoading && radarData?.hasEnoughCategories && (
              <GradeDisplay grade={radarData.overall} score={radarData.overallScore} size="sm" showScore />
            )}
          </div>
          {/* Period selector */}
          <div className="flex gap-1 flex-wrap">
            {PERIODS.map((p) => (
              <button
                key={p.label}
                onClick={() => setPeriod(p)}
                title={p.title}
                className={cn(
                  'px-3 py-1 text-xs rounded-full border transition-colors',
                  period.label === p.label
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {radarLoading ? (
          <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ) : !radarData?.hasEnoughCategories ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">📡</div>
            <p className="font-medium">Dados insuficientes</p>
            <p className="text-sm mt-1">Salve boards com pelo menos 3 categorias no período selecionado.</p>
          </div>
        ) : (
          <>
            <RadarDisplay categories={radarData.categories} height={340} />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
              {radarData.categories.map((c: any) => (
                <div key={c.category} className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                  <span className="truncate text-gray-700 dark:text-gray-300">{c.category}</span>
                  <span className="ml-auto font-bold flex-shrink-0" style={{ color: gradeColor(c.grade) }}>{c.grade}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">{c.done}/{c.total}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Board list ── */}
      <div className="space-y-3">
        <h2 className="text-xl font-black text-gray-900 dark:text-white">Histórico</h2>

        {boardsLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl" />)}
          </div>
        ) : boards.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">📚</div>
            <p className="font-medium text-lg">Nenhum board salvo ainda</p>
            <p className="text-sm mt-1">Conclua um board na tela principal para ver o histórico aqui.</p>
          </div>
        ) : (
          boards.map((board) => {
            const snap = board.gradeSnapshot;
            const id = board._id || board.id;
            const date = board.closedAt ? new Date(board.closedAt) : new Date(board.createdAt);
            return (
              <div key={id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-start gap-4">
                {snap && <GradeDisplay grade={snap.overall} score={snap.overallScore} size="md" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 dark:text-white">{board.label || 'Board'}</span>
                    <span className="text-xs text-gray-400">
                      {format(date, "dd 'de' MMM, HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  {snap?.byCategory && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {snap.byCategory.map((c: any) => (
                        <span key={c.category} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center gap-1">
                          {c.category}
                          <span className="font-bold" style={{ color: gradeColor(c.grade) }}>{c.grade}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setConfirmRestore(id)}
                    className="p-1.5 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 rounded-lg transition-colors"
                    aria-label="Restaurar board"
                    title="Restaurar board"
                  >
                    <RotateCcw size={15} />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors"
                    aria-label="Excluir registro"
                    title="Excluir registro"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
