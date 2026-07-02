'use client';
import { useState, useEffect, useRef } from 'react';
import { Check, Clock, Play, Square, Trash2, ChevronDown, ChevronUp, Pencil, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useTimerStore } from '@/store/timerStore';
import toast from 'react-hot-toast';

interface Task {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  category: string;
  timeMinutes: number | null;
  status: 'pending' | 'in_progress' | 'done';
  timeSpentMs: number;
}

interface Props {
  task: Task;
  categoryColor?: string;
  onStatusChange: (id: string, status: Task['status']) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onTimeSpent: (id: string, ms: number) => Promise<void>;
  onUpdate: (id: string, updates: { title?: string; description?: string }) => Promise<void>;
}

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function TaskItem({ task, categoryColor, onStatusChange, onDelete, onTimeSpent, onUpdate }: Props) {
  const id = task._id || task.id || '';
  const { activeTaskId, startTimestamp, durationMs, setTimer, clearTimer } = useTimerStore();
  const isActive = activeTaskId === id;
  const [remaining, setRemaining] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description);
  const [saving, setSaving] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) titleInputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    if (!isActive || !startTimestamp || !durationMs) {
      setRemaining(null);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const tick = () => {
      const elapsed = Date.now() - startTimestamp;
      const rem = durationMs - elapsed;
      if (rem <= 0) {
        setRemaining(0);
        clearInterval(intervalRef.current!);
        const spent = durationMs;
        clearTimer();
        onTimeSpent(id, spent);
        toast('⏰ Tempo esgotado! ' + task.title, { icon: '⏰' });
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('RadarFocus — Tempo esgotado!', { body: task.title });
        }
      } else {
        setRemaining(rem);
      }
    };

    tick();
    intervalRef.current = setInterval(tick, 500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isActive, startTimestamp, durationMs]);

  const handleToggleDone = async () => {
    const newStatus = task.status === 'done' ? 'pending' : 'done';
    // Auto-stop timer when marking as done
    if (newStatus === 'done' && isActive && startTimestamp) {
      const elapsed = Date.now() - startTimestamp;
      clearTimer();
      await onTimeSpent(id, elapsed);
    }
    await onStatusChange(id, newStatus);
  };

  const startTimer = async () => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    if (activeTaskId && activeTaskId !== id) {
      const confirmed = window.confirm('Já existe um timer ativo. Deseja trocar?');
      if (!confirmed) return;
      const elapsed = startTimestamp ? Date.now() - startTimestamp : 0;
      await onTimeSpent(activeTaskId, elapsed);
      clearTimer();
    }

    const dur = (task.timeMinutes || 25) * 60 * 1000;
    setTimer(id, Date.now(), dur);
    toast.success('Timer iniciado!');
  };

  const stopTimer = async () => {
    if (!startTimestamp) return;
    const elapsed = Date.now() - startTimestamp;
    clearTimer();
    await onTimeSpent(id, elapsed);
    toast.success('Timer parado.');
  };

  const handleSaveEdit = async () => {
    const trimTitle = editTitle.trim();
    if (!trimTitle) { toast.error('Título não pode ser vazio.'); return; }
    setSaving(true);
    try {
      await onUpdate(id, { title: trimTitle, description: editDesc.trim() });
      setEditing(false);
    } catch {
      toast.error('Erro ao salvar alterações.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(task.title);
    setEditDesc(task.description);
    setEditing(false);
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900 border rounded-xl p-3 transition-all',
        task.status === 'done'
          ? 'border-green-200 dark:border-green-900/40 bg-green-50/50 dark:bg-green-900/10'
          : 'border-gray-200 dark:border-gray-800',
        isActive && 'ring-2 ring-indigo-400 dark:ring-indigo-500'
      )}
    >
      {editing ? (
        <div className="space-y-2">
          <input
            ref={titleInputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value.slice(0, 100))}
            maxLength={100}
            className="w-full px-2 py-1 text-sm border border-indigo-400 rounded-lg bg-white dark:bg-gray-800 outline-none"
            aria-label="Editar título"
            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') handleCancelEdit(); }}
          />
          <textarea
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value.slice(0, 500))}
            maxLength={500}
            rows={2}
            placeholder="Descrição (opcional)"
            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 outline-none resize-none"
            aria-label="Editar descrição"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={handleCancelEdit} className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
              Cancelar
            </button>
            <button onClick={handleSaveEdit} disabled={saving} className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          {/* Status toggle */}
          <button
            onClick={handleToggleDone}
            className={cn(
              'mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors',
              task.status === 'done'
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400'
            )}
            aria-label={task.status === 'done' ? 'Marcar como pendente' : 'Marcar como concluída'}
          >
            {task.status === 'done' && <Check size={11} strokeWidth={3} />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  'text-sm font-medium truncate',
                  task.status === 'done' && 'line-through text-gray-400 dark:text-gray-600'
                )}
              >
                {task.title}
              </span>
              {categoryColor ? (
                <span
                  className="text-xs px-2 py-0.5 rounded-full text-white flex-shrink-0"
                  style={{ backgroundColor: categoryColor }}
                >
                  {task.category}
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 flex-shrink-0">
                  {task.category}
                </span>
              )}
            </div>

            {task.timeMinutes && (
              <div className="flex items-center gap-2 mt-1">
                <Clock size={11} className="text-gray-400" />
                <span className="text-xs text-gray-500">{task.timeMinutes}min</span>
                {task.timeSpentMs > 0 && (
                  <span className="text-xs text-indigo-500">• {formatTime(task.timeSpentMs)} gasto</span>
                )}
                {isActive && remaining !== null && (
                  <span className={cn('text-xs font-mono font-bold', remaining < 60000 ? 'text-red-500' : 'text-indigo-600 dark:text-indigo-400')}>
                    • {formatTime(remaining)} restante
                  </span>
                )}
              </div>
            )}

            {task.description && expanded && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{task.description}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {task.timeMinutes && !isActive && (
              <button onClick={startTimer} className="p-1.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg" aria-label="Iniciar timer">
                <Play size={14} />
              </button>
            )}
            {isActive && (
              <button onClick={stopTimer} className="p-1.5 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg" aria-label="Parar timer">
                <Square size={14} />
              </button>
            )}
            <button
              onClick={() => { setEditing(true); setExpanded(false); }}
              className="p-1.5 text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400 rounded-lg transition-colors"
              aria-label="Editar tarefa"
            >
              <Pencil size={14} />
            </button>
            {task.description && (
              <button onClick={() => setExpanded(!expanded)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg" aria-label={expanded ? 'Recolher descrição' : 'Expandir descrição'}>
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
            <button onClick={() => onDelete(id)} className="p-1.5 text-gray-300 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors" aria-label="Excluir tarefa">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
