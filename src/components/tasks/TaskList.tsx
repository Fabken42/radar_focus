'use client';
import { useState } from 'react';
import { TaskItem } from './TaskItem';
import { cn } from '@/lib/utils/cn';
import { ClipboardList } from 'lucide-react';

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
  tasks: Task[];
  categoryColors: Record<string, string>;
  onStatusChange: (id: string, status: Task['status']) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onTimeSpent: (id: string, ms: number) => Promise<void>;
  onUpdate: (id: string, updates: { title?: string; description?: string }) => Promise<void>;
  onReorder?: (newOrder: { id: string; order: number }[]) => void;
  loading?: boolean;
}

export function TaskList({ tasks, categoryColors, onStatusChange, onDelete, onTimeSpent, onUpdate, onReorder, loading }: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 dark:text-gray-600">
        <ClipboardList size={40} className="mb-2 text-gray-300 dark:text-gray-700" />
        <p className="font-medium">Nenhuma tarefa ainda</p>
        <p className="text-sm mt-1">Adicione uma tarefa acima para começar.</p>
      </div>
    );
  }

  const pending = tasks.filter((t) => t.status !== 'done');
  const done = tasks.filter((t) => t.status === 'done');
  const getId = (t: Task) => t._id || t.id || '';
  const draggable = !!onReorder;

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== dragId) setOverId(id);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }

    const fromIndex = pending.findIndex((t) => getId(t) === dragId);
    const toIndex = pending.findIndex((t) => getId(t) === targetId);
    if (fromIndex < 0 || toIndex < 0) { setDragId(null); setOverId(null); return; }

    const reordered = [...pending];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    onReorder?.([
      ...reordered.map((t, i) => ({ id: getId(t), order: i })),
      ...done.map((t, i) => ({ id: getId(t), order: reordered.length + i })),
    ]);
    setDragId(null);
    setOverId(null);
  };

  const handleDragEnd = () => {
    setDragId(null);
    setOverId(null);
  };

  return (
    <div className="space-y-2">
      {pending.map((task) => {
        const id = getId(task);
        return (
          <div
            key={id}
            draggable={draggable}
            onDragStart={draggable ? (e) => handleDragStart(e, id) : undefined}
            onDragOver={draggable ? (e) => handleDragOver(e, id) : undefined}
            onDrop={draggable ? (e) => handleDrop(e, id) : undefined}
            onDragEnd={draggable ? handleDragEnd : undefined}
            className={cn(
              'transition-opacity',
              dragId === id && 'opacity-40',
              overId === id && dragId !== id && 'ring-2 ring-indigo-400 rounded-xl'
            )}
          >
            <TaskItem
              task={task}
              categoryColor={categoryColors[task.category]}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
              onTimeSpent={onTimeSpent}
              onUpdate={onUpdate}
              showDragHandle={draggable}
            />
          </div>
        );
      })}
      {done.length > 0 && (
        <>
          <p className="text-xs font-medium text-gray-400 dark:text-gray-600 pt-2">Concluídas ({done.length})</p>
          {done.map((task) => (
            <TaskItem
              key={getId(task)}
              task={task}
              categoryColor={categoryColors[task.category]}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
              onTimeSpent={onTimeSpent}
              onUpdate={onUpdate}
            />
          ))}
        </>
      )}
    </div>
  );
}
