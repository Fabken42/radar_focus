'use client';
import { useEffect, useState } from 'react';
import { X, Calendar, Check, BookmarkPlus, Clock } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface TemplateTask {
  title: string;
  category: string;
  timeMinutes: number | null;
  description: string;
  order: number;
}

export interface Template {
  _id?: string;
  id?: string;
  name: string;
  weekday: number | null;
  tasks: TemplateTask[];
}

interface Props {
  isLoggedIn: boolean;
  localTemplates: Template[];
  onApply: (tasks: TemplateTask[]) => void;
  onSaveAsTemplate: () => void;
  onClose: () => void;
}

export function TemplatePickerModal({ isLoggedIn, localTemplates, onApply, onSaveAsTemplate, onClose }: Props) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Template | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    if (isLoggedIn) {
      fetch('/api/templates')
        .then((r) => r.json())
        .then(setTemplates)
        .finally(() => setLoading(false));
    } else {
      setTemplates(localTemplates);
      setLoading(false);
    }
  }, [isLoggedIn]);

  const handleApply = () => {
    if (!selected) return;
    onApply(selected.tasks);
    onClose();
  };

  const selectedId = selected?._id || selected?.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl w-full max-w-lg shadow-xl flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <h2 className="font-bold text-gray-900 dark:text-white">Aplicar template</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={18} />
          </button>
        </div>

        {/* Template list */}
        <div className={cn('overflow-y-auto p-4 space-y-2 flex-shrink-0', selected ? 'max-h-52' : 'flex-1')}>
          {loading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />)}
            </div>
          )}

          {!loading && templates.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <p className="font-medium">Nenhum template criado</p>
              <p className="text-sm mt-1">Crie templates em <span className="font-semibold">/app/templates</span>.</p>
            </div>
          )}

          {templates.map((t) => {
            const isSelected = selectedId === (t._id || t.id);
            return (
              <button
                key={t._id || t.id}
                onClick={() => setSelected(isSelected ? null : t)}
                className={cn(
                  'w-full text-left border rounded-xl p-3 transition-colors flex items-center gap-3',
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-300 dark:hover:border-indigo-700'
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{t.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {t.weekday !== null && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar size={10} /> {WEEKDAYS[t.weekday]}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{t.tasks.length} tarefa(s)</span>
                  </div>
                </div>
                {isSelected
                  ? <Check size={16} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                  : <span className="text-xs text-gray-400 flex-shrink-0">ver →</span>
                }
              </button>
            );
          })}
        </div>

        {/* Preview panel */}
        {selected && (
          <div className="flex-1 overflow-y-auto border-t border-gray-200 dark:border-gray-800 p-4 min-h-0">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Preview — {selected.tasks.length} tarefa(s)
            </p>
            <div className="space-y-2">
              {selected.tasks.map((task, i) => (
                <div key={i} className="flex items-start gap-2.5 text-sm">
                  <span className="mt-0.5 w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 dark:text-gray-200 leading-snug">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                        {task.category}
                      </span>
                      {task.timeMinutes && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock size={10} /> {task.timeMinutes}min
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex gap-2 flex-shrink-0">
          {selected ? (
            <>
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleApply}
                className="flex-1 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
              >
                Aplicar "{selected.name}"
              </button>
            </>
          ) : (
            <button
              onClick={() => { onClose(); onSaveAsTemplate(); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
            >
              <BookmarkPlus size={15} /> Salvar board atual como template
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
