'use client';
import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { CategoryCombobox } from './CategoryCombobox';
import toast from 'react-hot-toast';

interface TaskFormProps {
  categories: { name: string; color: string }[];
  onSubmit: (data: {
    title: string;
    description: string;
    category: string;
    timeMinutes: number | null;
  }) => Promise<void>;
  onCreateCategory: (name: string) => Promise<void>;
  atCategoryLimit?: boolean;
  taskCount?: number;
  maxTasks?: number;
}

export function TaskForm({ categories, onSubmit, onCreateCategory, atCategoryLimit, taskCount = 0, maxTasks = 30 }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [timeMinutes, setTimeMinutes] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Título obrigatório.'); return; }
    if (!category) { toast.error('Selecione uma categoria.'); return; }
    if (taskCount >= maxTasks) { toast.error(`Limite de ${maxTasks} tarefas por board atingido.`); return; }
    const mins = timeMinutes ? parseInt(timeMinutes) : null;
    if (mins !== null && (mins < 1 || mins > 480)) { toast.error('Tempo deve ser entre 1 e 480 minutos.'); return; }

    setLoading(true);
    try {
      await onSubmit({ title: title.trim(), description: description.trim(), category, timeMinutes: mins });
      setTitle('');
      setDescription('');
      setCategory('');
      setTimeMinutes('');
      setExpanded(false);
    } catch {
      toast.error('Erro ao adicionar tarefa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Adicionar tarefa..."
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 100))}
          onFocus={() => setExpanded(true)}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:border-indigo-400 dark:focus:border-indigo-500 outline-none transition-colors"
          maxLength={100}
          aria-label="Título da tarefa"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-1 text-sm font-medium"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Adicionar</span>
        </button>
      </div>

      {expanded && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Categoria *</label>
              <CategoryCombobox
                categories={categories}
                value={category}
                onChange={setCategory}
                onCreateNew={onCreateCategory}
                atLimit={atCategoryLimit}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Tempo (min)</label>
              <input
                type="number"
                min={1}
                max={480}
                placeholder="Ex: 30"
                value={timeMinutes}
                onChange={(e) => setTimeMinutes(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:border-indigo-400 outline-none transition-colors"
                aria-label="Tempo em minutos"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Descrição</label>
            <textarea
              placeholder="Descrição opcional..."
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:border-indigo-400 outline-none transition-colors resize-none"
              aria-label="Descrição da tarefa"
            />
            <p className="text-xs text-gray-400 mt-1">{description.length}/500</p>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1"
          >
            <X size={12} /> Fechar detalhes
          </button>
        </>
      )}
      {title.length > 0 && <p className="text-xs text-gray-400">{title.length}/100</p>}
    </form>
  );
}
