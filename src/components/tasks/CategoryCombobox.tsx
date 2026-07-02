'use client';
import { useState } from 'react';
import { Command } from 'cmdk';
import { ChevronDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Props {
  categories: { name: string; color: string }[];
  value: string;
  onChange: (value: string) => void;
  onCreateNew: (name: string) => Promise<void>;
  disabled?: boolean;
  atLimit?: boolean;
}

export function CategoryCombobox({ categories, value, onChange, onCreateNew, disabled, atLimit }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const exactMatch = categories.some((c) => c.name.toLowerCase() === search.toLowerCase());
  const canCreate = search.trim().length > 0 && !exactMatch && !atLimit;

  const handleCreate = async () => {
    if (!canCreate) return;
    setCreating(true);
    try {
      await onCreateNew(search.trim());
      onChange(search.trim());
      setOpen(false);
      setSearch('');
    } finally {
      setCreating(false);
    }
  };

  const selectedCat = categories.find((c) => c.name === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700',
          'hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors',
          disabled && 'opacity-50 cursor-not-allowed',
          !value && 'text-gray-400'
        )}
      >
        <span className="flex items-center gap-2">
          {selectedCat && (
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: selectedCat.color }}
            />
          )}
          {value || 'Selecionar categoria...'}
        </span>
        <ChevronDown size={14} className="text-gray-400" />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          <Command>
            <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
              <Command.Input
                value={search}
                onValueChange={setSearch}
                placeholder="Buscar ou criar..."
                className="w-full text-sm bg-transparent outline-none placeholder:text-gray-400"
                autoFocus
              />
            </div>
            <Command.List className="max-h-48 overflow-y-auto p-1">
              {filtered.length === 0 && !canCreate && (
                <Command.Empty className="px-3 py-4 text-sm text-gray-500 text-center">
                  {atLimit ? 'Limite de 10 categorias atingido.' : 'Nenhuma categoria encontrada.'}
                </Command.Empty>
              )}
              {filtered.map((cat) => (
                <Command.Item
                  key={cat.name}
                  value={cat.name}
                  onSelect={() => {
                    onChange(cat.name);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer',
                    'hover:bg-gray-100 dark:hover:bg-gray-800',
                    value === cat.name && 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                  )}
                >
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  {cat.name}
                </Command.Item>
              ))}
              {canCreate && (
                <Command.Item
                  value={`criar:${search}`}
                  onSelect={handleCreate}
                  disabled={creating}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                >
                  <Plus size={14} />
                  {creating ? 'Criando...' : `Criar categoria "${search.trim()}"`}
                </Command.Item>
              )}
            </Command.List>
          </Command>
        </div>
      )}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  );
}
