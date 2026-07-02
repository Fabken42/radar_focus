'use client';
import { TaskItem } from './TaskItem';

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
  loading?: boolean;
}

export function TaskList({ tasks, categoryColors, onStatusChange, onDelete, onTimeSpent, onUpdate, loading }: Props) {
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
        <div className="text-4xl mb-2">📋</div>
        <p className="font-medium">Nenhuma tarefa ainda</p>
        <p className="text-sm mt-1">Adicione uma tarefa acima para começar.</p>
      </div>
    );
  }

  const pending = tasks.filter((t) => t.status !== 'done');
  const done = tasks.filter((t) => t.status === 'done');

  return (
    <div className="space-y-2">
      {pending.map((task) => (
        <TaskItem
          key={task._id || task.id}
          task={task}
          categoryColor={categoryColors[task.category]}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
          onTimeSpent={onTimeSpent}
          onUpdate={onUpdate}
        />
      ))}
      {done.length > 0 && (
        <>
          <p className="text-xs font-medium text-gray-400 dark:text-gray-600 pt-2">Concluídas ({done.length})</p>
          {done.map((task) => (
            <TaskItem
              key={task._id || task.id}
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
