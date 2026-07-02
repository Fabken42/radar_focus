'use client';
import { useEffect, useState } from 'react';
import { X, Calendar, ChevronRight, BookmarkPlus } from 'lucide-react';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl w-full max-w-md shadow-xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-bold text-gray-900 dark:text-white">Aplicar template</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-2">
          {loading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />)}
            </div>
          )}

          {!loading && templates.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <p className="font-medium">Nenhum template criado</p>
              <p className="text-sm mt-1">Crie templates em <span className="font-semibold">/app/templates</span>.</p>
            </div>
          )}

          {templates.map((t) => (
            <button
              key={t._id || t.id}
              onClick={() => { onApply(t.tasks); onClose(); }}
              className="w-full text-left bg-gray-50 dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-xl p-3 transition-colors flex items-center gap-3"
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
                {t.tasks.length > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                    {t.tasks.slice(0, 3).map((tk) => tk.title).join(', ')}
                    {t.tasks.length > 3 ? '...' : ''}
                  </p>
                )}
              </div>
              <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={() => { onClose(); onSaveAsTemplate(); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
          >
            <BookmarkPlus size={15} /> Salvar board atual como template
          </button>
        </div>
      </div>
    </div>
  );
}
