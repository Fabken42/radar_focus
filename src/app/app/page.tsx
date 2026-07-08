'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { TaskForm } from '@/components/tasks/TaskForm';
import { TaskList } from '@/components/tasks/TaskList';
import { RadarDisplay } from '@/components/radar/RadarChart';
import { GradeDisplay } from '@/components/GradeDisplay';
import { SpreadsheetImport } from '@/components/tasks/SpreadsheetImport';
import { MigrationModal } from '@/components/MigrationModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { TemplatePickerModal, type Template } from '@/components/TemplatePickerModal';
import { SaveTemplateModal } from '@/components/SaveTemplateModal';
import { useLocalDataStore } from '@/store/localDataStore';
import { calcBoardGrade } from '@/lib/utils/gradeCalculator';
import { gradeColor, getNextColor } from '@/lib/utils/colors';
import toast from 'react-hot-toast';
import { Save, Trash2, Upload, LayoutTemplate, AlertTriangle, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import Link from 'next/link';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function genId() {
  return typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

type Task = {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  category: string;
  timeMinutes: number | null;
  status: 'pending' | 'in_progress' | 'done';
  timeSpentMs: number;
  order: number;
  boardId?: string;
};
type Category = { _id?: string; id?: string; name: string; color: string };

export default function AppPage() {
  const { data: session, status: authStatus } = useSession();
  const isLoggedIn = !!session?.user?.id;
  const router = useRouter();

  const localStore = useLocalDataStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [boardLabel, setBoardLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [showMigration, setShowMigration] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [formCategoryOverride, setFormCategoryOverride] = useState('');
  const [templateSuggestion, setTemplateSuggestion] = useState<Template | null>(null);
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);

  // ── API helpers ──
  const api = useCallback(async (path: string, opts?: RequestInit) => {
    const r = await fetch(path, { ...opts, headers: { 'Content-Type': 'application/json', ...opts?.headers } });
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Erro na requisição'); }
    return r.json();
  }, []);

  // ── Initialize ──
  useEffect(() => {
    if (authStatus === 'loading') return;
    if (isLoggedIn) initLoggedIn();
    else initLocal();
  }, [authStatus, isLoggedIn]);

  // ── Restore board from history ──
  useEffect(() => {
    if (loading) return;
    const restoreId = sessionStorage.getItem('radarfocus-restore');
    if (!restoreId) return;
    sessionStorage.removeItem('radarfocus-restore');
    handleRestoreBoard(restoreId);
  }, [loading]);

  const initLoggedIn = async () => {
    setLoading(true);
    try {
      const hasLocalData = (localStore.boards.length > 0 || localStore.tasks.length > 0) && !localStore.migrated;
      if (hasLocalData) { setShowMigration(true); }

      const [cats, boards] = await Promise.all([
        api('/api/categories'),
        api('/api/boards?status=open'),
      ]);
      setCategories(cats);

      let board = boards[0];
      if (!board) board = await api('/api/boards', { method: 'POST', body: JSON.stringify({}) });

      setActiveBoardId(board._id);
      setBoardLabel(board.label || '');
      const t = await api(`/api/tasks?boardId=${board._id}`);
      setTasks(t);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  const initLocal = () => {
    setLoading(true);
    const cats = localStore.categories.map((c) => ({ id: c.id, name: c.name, color: c.color }));
    setCategories(cats);

    let board = localStore.boards.find((b) => b.status === 'open');
    if (!board) {
      const newBoard = {
        id: genId(),
        label: '',
        status: 'open' as const,
        gradeSnapshot: null,
        createdAt: new Date().toISOString(),
        closedAt: null,
      };
      localStore.addBoard(newBoard);
      board = newBoard;
    }
    setActiveBoardId(board.id);
    setBoardLabel(board.label || '');
    const t = localStore.tasks.filter((t) => t.boardId === board!.id).map((t) => ({ ...t }));
    setTasks(t);
    setLoading(false);
  };

  // ── Category ops ──
  const handleCreateCategory = async (name: string) => {
    if (categories.length >= 10) { toast.error('Limite de 10 categorias atingido.'); return; }
    const usedColors = categories.map((c) => c.color);
    const color = getNextColor(usedColors);
    if (isLoggedIn) {
      const cat = await api('/api/categories', { method: 'POST', body: JSON.stringify({ name, color }) });
      setCategories((prev) => [...prev, cat]);
    } else {
      const cat = { id: genId(), name, color, createdAt: new Date().toISOString() };
      localStore.addCategory(cat);
      setCategories((prev) => [...prev, { id: cat.id, name: cat.name, color: cat.color }]);
    }
    toast.success(`Categoria "${name}" criada!`);
  };

  // ── Task ops ──
  const handleAddTask = async (data: { title: string; description: string; category: string; timeMinutes: number | null }) => {
    if (tasks.length >= 30) { toast.error('Limite de 30 tarefas por board atingido.'); return; }
    if (isLoggedIn) {
      const task = await api('/api/tasks', { method: 'POST', body: JSON.stringify({ ...data, boardId: activeBoardId, order: tasks.length }) });
      setTasks((prev) => [...prev, task]);
    } else {
      const task = {
        id: genId(),
        boardId: activeBoardId!,
        ...data,
        status: 'pending' as const,
        timeSpentMs: 0,
        order: tasks.length,
        createdAt: new Date().toISOString(),
        description: data.description || '',
      };
      localStore.addTask(task);
      setTasks((prev) => [...prev, task]);
    }
    toast.success('Tarefa adicionada!');
  };

  const handleUpdateTask = async (id: string, updates: { title?: string; description?: string }) => {
    if (isLoggedIn) {
      await api(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
    } else {
      localStore.updateTask(id, updates);
    }
    setTasks((prev) => prev.map((t) => (t._id === id || t.id === id) ? { ...t, ...updates } : t));
  };

  const handleStatusChange = async (id: string, status: Task['status']) => {
    // Optimistic update — apply immediately, revert on error
    const previous = tasks.find((t) => t._id === id || t.id === id)?.status;
    setTasks((prev) => prev.map((t) => (t._id === id || t.id === id) ? { ...t, status } : t));
    try {
      if (isLoggedIn) {
        await api(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      } else {
        localStore.updateTask(id, { status });
      }
    } catch (e: any) {
      setTasks((prev) => prev.map((t) => (t._id === id || t.id === id) ? { ...t, status: previous ?? 'pending' } : t));
      toast.error('Erro ao atualizar tarefa.');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (isLoggedIn) {
      await api(`/api/tasks/${id}`, { method: 'DELETE' });
    } else {
      localStore.removeTask(id);
    }
    setTasks((prev) => prev.filter((t) => t._id !== id && t.id !== id));
    toast.success('Tarefa removida.');
  };

  const handleReorderTasks = (newOrder: { id: string; order: number }[]) => {
    const orderMap = new Map(newOrder.map((o) => [o.id, o.order]));
    setTasks((prev) => {
      const updated = prev.map((t) => {
        const tid = t._id || t.id || '';
        const o = orderMap.get(tid);
        return o !== undefined ? { ...t, order: o } : t;
      });
      return [...updated].sort((a, b) => a.order - b.order);
    });
    if (isLoggedIn) {
      api('/api/tasks/reorder', { method: 'POST', body: JSON.stringify({ items: newOrder }) }).catch(() => {});
    } else {
      for (const { id, order } of newOrder) {
        localStore.updateTask(id, { order });
      }
    }
  };

  const handleTimeSpent = async (id: string, ms: number) => {
    const task = tasks.find((t) => t._id === id || t.id === id);
    if (!task) return;
    const newMs = task.timeSpentMs + ms;
    if (isLoggedIn) {
      await api(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ timeSpentMs: newMs }) });
    } else {
      localStore.updateTask(id, { timeSpentMs: newMs });
    }
    setTasks((prev) => prev.map((t) => (t._id === id || t.id === id) ? { ...t, timeSpentMs: newMs } : t));
  };

  // ── Board ops ──
  const handleSaveBoard = async () => {
    if (!activeBoardId) return;
    if (tasks.length === 0) { toast.error('Adicione tarefas antes de salvar o board.'); return; }
    try {
      if (isLoggedIn) {
        const result = await api(`/api/boards/${activeBoardId}`, { method: 'PATCH', body: JSON.stringify({ action: 'save', label: boardLabel }) });
        setActiveBoardId(result.newBoard._id);
        setBoardLabel('');
        setTasks([]);
        setSuggestionDismissed(false);
        toast.success(`Board salvo! Nota: ${result.saved.gradeSnapshot?.overall}`);
      } else {
        const { byCategory, overallScore, overall } = calcBoardGrade(tasks);
        localStore.updateBoard(activeBoardId, {
          label: boardLabel,
          status: 'saved',
          closedAt: new Date().toISOString(),
          gradeSnapshot: {
            overall,
            overallScore,
            byCategory: byCategory.map((c) => ({ category: c.category, grade: c.grade, score: c.score })),
          },
        });
        const newBoard = {
          id: genId(),
          label: '',
          status: 'open' as const,
          gradeSnapshot: null,
          createdAt: new Date().toISOString(),
          closedAt: null,
        };
        localStore.addBoard(newBoard);
        setActiveBoardId(newBoard.id);
        setBoardLabel('');
        setTasks([]);
        setSuggestionDismissed(false);
        toast.success(`Board salvo! Nota: ${overall}`);
      }
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar board.');
    }
  };

  const handleDiscardBoard = async () => {
    if (!activeBoardId) return;
    try {
      if (isLoggedIn) {
        const result = await api(`/api/boards/${activeBoardId}`, { method: 'PATCH', body: JSON.stringify({ action: 'discard' }) });
        setActiveBoardId(result.newBoard._id);
        setBoardLabel('');
        setTasks([]);
        setSuggestionDismissed(false);
      } else {
        localStore.updateBoard(activeBoardId, { status: 'discarded', closedAt: new Date().toISOString() });
        const newBoard = {
          id: genId(),
          label: '',
          status: 'open' as const,
          gradeSnapshot: null,
          createdAt: new Date().toISOString(),
          closedAt: null,
        };
        localStore.addBoard(newBoard);
        setActiveBoardId(newBoard.id);
        setBoardLabel('');
        setTasks([]);
        setSuggestionDismissed(false);
      }
      toast('Board descartado.', { icon: <Trash2 size={16} className="text-gray-500" /> });
    } catch (e: any) {
      toast.error(e.message || 'Erro ao descartar board.');
    }
  };

  const handleImport = async (imported: { title: string; description: string; category: string; timeMinutes: number | null }[]) => {
    for (const t of imported) {
      await handleAddTask(t);
    }
  };

  const handleApplyTemplate = async (templateTasks: { title: string; description: string; category: string; timeMinutes: number | null; order: number }[]) => {
    const remaining = 30 - tasks.length;
    const toAdd = templateTasks.slice(0, remaining);
    if (toAdd.length === 0) { toast.error('Board já está no limite de 30 tarefas.'); return; }
    for (const t of toAdd) {
      await handleAddTask({ title: t.title, description: t.description || '', category: t.category, timeMinutes: t.timeMinutes });
    }
    if (toAdd.length < templateTasks.length) {
      toast(`${toAdd.length} de ${templateTasks.length} tarefas adicionadas (limite atingido).`, { icon: <AlertTriangle size={16} className="text-amber-500" /> });
    } else {
      toast.success(`${toAdd.length} tarefa(s) adicionada(s) do template!`);
    }
  };

  const handleSaveAsTemplate = async (name: string) => {
    if (tasks.length === 0) { toast.error('Adicione tarefas antes de salvar como template.'); return; }
    const templateTasks = tasks.map((t, i) => ({
      title: t.title,
      description: t.description,
      category: t.category,
      timeMinutes: t.timeMinutes,
      order: i,
    }));
    if (isLoggedIn) {
      await api('/api/templates', {
        method: 'POST',
        body: JSON.stringify({ name, weekday: null, tasks: templateTasks }),
      });
    } else {
      localStore.addTemplate({
        id: genId(),
        name,
        weekday: null,
        tasks: templateTasks,
        createdAt: new Date().toISOString(),
      });
    }
    toast.success(`Template "${name}" salvo!`);
  };

  const handleRestoreBoard = async (boardId: string) => {
    try {
      // 1. Fetch tasks from the board to restore
      let tasksToRestore: Task[] = [];
      if (isLoggedIn) {
        tasksToRestore = await api(`/api/tasks?boardId=${boardId}`);
      } else {
        tasksToRestore = localStore.tasks.filter((t) => t.boardId === boardId).map((t) => ({ ...t }));
      }

      if (tasksToRestore.length === 0) {
        toast.error('Este board não tem tarefas para restaurar.');
        return;
      }

      // 2. Save current board if it has tasks
      let targetBoardId: string = activeBoardId!;

      if (tasks.length > 0) {
        if (isLoggedIn) {
          const result = await api(`/api/boards/${activeBoardId}`, {
            method: 'PATCH',
            body: JSON.stringify({ action: 'save' }),
          });
          targetBoardId = result.newBoard._id;
          toast.success(`Board atual salvo! Nota: ${result.saved.gradeSnapshot?.overall}`);
        } else {
          const { byCategory, overallScore, overall } = calcBoardGrade(tasks);
          localStore.updateBoard(activeBoardId!, {
            status: 'saved',
            closedAt: new Date().toISOString(),
            gradeSnapshot: {
              overall,
              overallScore,
              byCategory: byCategory.map((c) => ({ category: c.category, grade: c.grade, score: c.score })),
            },
          });
          const newBoard = {
            id: genId(),
            label: '',
            status: 'open' as const,
            gradeSnapshot: null,
            createdAt: new Date().toISOString(),
            closedAt: null,
          };
          localStore.addBoard(newBoard);
          targetBoardId = newBoard.id;
          toast.success(`Board atual salvo! Nota: ${overall}`);
        }
      }

      // 3. Copy restored tasks into the target board
      setActiveBoardId(targetBoardId);
      setBoardLabel('');
      setTasks([]);

      const newTasks: Task[] = [];
      for (const t of tasksToRestore.slice(0, 30)) {
        if (isLoggedIn) {
          const created = await api('/api/tasks', {
            method: 'POST',
            body: JSON.stringify({
              title: t.title,
              description: t.description || '',
              category: t.category,
              timeMinutes: t.timeMinutes,
              boardId: targetBoardId,
              order: newTasks.length,
              status: t.status,
              timeSpentMs: t.timeSpentMs,
            }),
          });
          newTasks.push(created);
        } else {
          const task: Task = {
            id: genId(),
            boardId: targetBoardId,
            title: t.title,
            description: t.description || '',
            category: t.category,
            timeMinutes: t.timeMinutes,
            status: t.status,
            timeSpentMs: t.timeSpentMs,
            order: newTasks.length,
          };
          localStore.addTask(task as any);
          newTasks.push(task);
        }
      }
      setTasks(newTasks);
      toast.success(`Board restaurado com ${newTasks.length} tarefa(s)!`);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao restaurar board.');
    }
  };

  const handleBoardLabelBlur = async () => {
    if (!activeBoardId) return;
    if (isLoggedIn) {
      await api(`/api/boards/${activeBoardId}`, {
        method: 'PATCH',
        body: JSON.stringify({ label: boardLabel }),
      }).catch(() => {});
    } else {
      localStore.updateBoard(activeBoardId, { label: boardLabel });
    }
  };

  const handleMigrate = async () => {
    await api('/api/migrate', {
      method: 'POST',
      body: JSON.stringify({
        categories: localStore.categories,
        boards: localStore.boards,
        tasks: localStore.tasks,
        templates: localStore.templates,
      }),
    });
    localStore.setMigrated();
    setShowMigration(false);
    await initLoggedIn();
  };

  const handleSkipMigration = () => {
    localStore.setMigrated();
    setShowMigration(false);
  };

  // ── Template suggestion for today's weekday ──
  useEffect(() => {
    if (loading || suggestionDismissed || tasks.length > 0) {
      if (tasks.length > 0) setTemplateSuggestion(null);
      return;
    }
    const day = new Date().getDay();
    if (isLoggedIn) {
      fetch('/api/templates')
        .then((r) => r.json())
        .then((list: Template[]) => setTemplateSuggestion(list.find((t) => t.weekday === day) ?? null))
        .catch(() => {});
    } else {
      const match = (localStore.templates as unknown as Template[]).find((t) => t.weekday === day) ?? null;
      setTemplateSuggestion(match);
    }
  }, [loading, tasks.length, isLoggedIn, suggestionDismissed]);

  // ── Computed ──
  const categoryColors = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((c) => { map[c.name] = c.color; });
    return map;
  }, [categories]);

  const { byCategory, overallScore, overall, hasEnoughCategories } = useMemo(
    () => calcBoardGrade(tasks),
    [tasks]
  );
  const atCategoryLimit = categories.length >= 10;
  const atTaskLimit = tasks.length >= 30;

  const filteredTasks = selectedCategory ? tasks.filter((t) => t.category === selectedCategory) : tasks;

  if (authStatus === 'loading' || loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        <div className="h-40 bg-gray-200 dark:bg-gray-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showMigration && <MigrationModal onConfirm={handleMigrate} onSkip={handleSkipMigration} />}
      {showImport && <SpreadsheetImport onImport={handleImport} onClose={() => setShowImport(false)} />}
      {showSaveTemplate && (
        <SaveTemplateModal
          onSave={handleSaveAsTemplate}
          onClose={() => setShowSaveTemplate(false)}
        />
      )}
      {showTemplatePicker && (
        <TemplatePickerModal
          isLoggedIn={isLoggedIn}
          localTemplates={localStore.templates as any}
          onApply={handleApplyTemplate}
          onSaveAsTemplate={() => setShowSaveTemplate(true)}
          onClose={() => setShowTemplatePicker(false)}
        />
      )}
      {showDiscardConfirm && (
        <ConfirmModal
          title="Descartar board?"
          description="As tarefas deste board não serão contabilizadas nas estatísticas. Esta ação não pode ser desfeita."
          confirmLabel="Descartar"
          cancelLabel="Cancelar"
          danger
          onConfirm={() => { setShowDiscardConfirm(false); handleDiscardBoard(); }}
          onCancel={() => setShowDiscardConfirm(false)}
        />
      )}

      {/* Board header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Nome do board (opcional)"
            value={boardLabel}
            onChange={(e) => setBoardLabel(e.target.value.slice(0, 50))}
            onBlur={handleBoardLabelBlur}
            className="text-lg font-bold bg-transparent border-b border-transparent hover:border-gray-300 dark:hover:border-gray-700 focus:border-indigo-400 outline-none transition-colors placeholder:text-gray-300 dark:placeholder:text-gray-700 w-56 max-w-xs"
            aria-label="Nome do board"
          />
          {tasks.length > 0 && (
            <GradeDisplay grade={overall} score={overallScore} size="sm" showScore />
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Task/category counters */}
          <span className={cn('text-xs px-2 py-1 rounded-full border', atTaskLimit ? 'text-red-500 border-red-300 dark:border-red-800' : 'text-gray-400 border-gray-200 dark:border-gray-800')}>
            {tasks.length}/30 tarefas
          </span>
          <span className={cn('text-xs px-2 py-1 rounded-full border', atCategoryLimit ? 'text-red-500 border-red-300 dark:border-red-800' : 'text-gray-400 border-gray-200 dark:border-gray-800')}>
            {categories.length}/10 categorias
          </span>
          <button onClick={() => setShowTemplatePicker(true)} className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
            <LayoutTemplate size={14} /> Templates
          </button>
          <button onClick={() => setShowImport(true)} className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
            <Upload size={14} /> Importar
          </button>
          <button onClick={() => setShowDiscardConfirm(true)} className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">
            <Trash2 size={14} /> Descartar
          </button>
          <button onClick={handleSaveBoard} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            <Save size={14} /> Concluir
          </button>
        </div>
      </div>

      {/* Template suggestion banner */}
      {templateSuggestion && !suggestionDismissed && tasks.length === 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
              Template de {WEEKDAYS[new Date().getDay()]} disponível: "{templateSuggestion.name}"
            </p>
            <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-0.5">
              {templateSuggestion.tasks.length} tarefa(s) — clique para aplicar ao board atual
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setSuggestionDismissed(true)}
              className="text-xs text-indigo-500 dark:text-indigo-400 hover:underline px-2 py-1"
            >
              Dispensar
            </button>
            <button
              onClick={() => { handleApplyTemplate(templateSuggestion.tasks); setSuggestionDismissed(true); }}
              className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              Aplicar template
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: tasks */}
        <div className="space-y-4">
          <TaskForm
            categories={categories}
            onSubmit={handleAddTask}
            onCreateCategory={handleCreateCategory}
            atCategoryLimit={atCategoryLimit}
            taskCount={tasks.length}
            categoryOverride={formCategoryOverride}
          />

          {/* Category filter */}
          {byCategory.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  'px-3 py-1 text-xs rounded-full border transition-colors',
                  !selectedCategory
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-gray-300 dark:border-gray-700 hover:border-indigo-400'
                )}
              >
                Todas
              </button>
              {byCategory.map((c) => (
                <button
                  key={c.category}
                  onClick={() => {
                    const next = c.category === selectedCategory ? null : c.category;
                    setSelectedCategory(next);
                    if (next) setFormCategoryOverride(next);
                  }}
                  className={cn(
                    'px-3 py-1 text-xs rounded-full border transition-colors flex items-center gap-1',
                    selectedCategory === c.category
                      ? 'text-white border-transparent'
                      : 'border-gray-300 dark:border-gray-700'
                  )}
                  style={
                    selectedCategory === c.category
                      ? { backgroundColor: categoryColors[c.category] || '#6366f1', borderColor: categoryColors[c.category] || '#6366f1' }
                      : {}
                  }
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryColors[c.category] || '#6366f1' }} />
                  {c.category}
                  <span
                    className="font-bold"
                    style={{ color: selectedCategory === c.category ? 'white' : gradeColor(c.grade) }}
                  >
                    {c.grade}
                  </span>
                </button>
              ))}
            </div>
          )}

          <TaskList
            tasks={filteredTasks}
            categoryColors={categoryColors}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteTask}
            onTimeSpent={handleTimeSpent}
            onUpdate={handleUpdateTask}
            onReorder={selectedCategory === null ? handleReorderTasks : undefined}
            loading={loading}
          />
        </div>

        {/* Right: radar */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 sticky top-[4.5rem] self-start">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Radar do Board</h2>
          <RadarDisplay
            categories={byCategory}
            onCategoryClick={setSelectedCategory}
            height={350}
          />
          {hasEnoughCategories && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {byCategory.map((c) => (
                <div key={c.category} className="flex items-center gap-2 text-sm">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: categoryColors[c.category] || '#6366f1' }} />
                  <span className="truncate text-gray-700 dark:text-gray-300">{c.category}</span>
                  <span className="font-bold ml-auto flex-shrink-0" style={{ color: gradeColor(c.grade) }}>{c.grade}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">{c.done}/{c.total}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {!isLoggedIn && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 text-sm text-indigo-700 dark:text-indigo-300 flex items-center gap-3 justify-between flex-wrap">
          <span className="flex items-center gap-1.5"><HardDrive size={14} /> Dados salvos localmente. Faça login para sincronizar entre dispositivos.</span>
          <Link href="/signin" className="font-semibold underline whitespace-nowrap">Entrar com Google →</Link>
        </div>
      )}
    </div>
  );
}
