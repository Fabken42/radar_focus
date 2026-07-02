'use client';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useLocalDataStore } from '@/store/localDataStore';
import { useThemeStore } from '@/store/themeStore';
import { Trash2, Edit2, LogOut, Sun, Moon } from 'lucide-react';
import toast from 'react-hot-toast';

interface Category { _id?: string; id?: string; name: string; color: string; }

const PRESET_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#84cc16'];

export default function SettingsPage() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user?.id;
  const localStore = useLocalDataStore();
  const { theme, toggleTheme } = useThemeStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [isLoggedIn]);

  const load = async () => {
    if (isLoggedIn) {
      const data = await fetch('/api/categories').then((r) => r.json());
      setCategories(data);
    } else {
      setCategories(localStore.categories as any);
    }
    setLoading(false);
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat._id || cat.id || null);
    setEditName(cat.name);
    setEditColor(cat.color);
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) { toast.error('Nome obrigatório.'); return; }
    if (isLoggedIn) {
      const updated = await fetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), color: editColor }),
      }).then((r) => r.json());
      setCategories((prev) => prev.map((c) => (c._id === id ? updated : c)));
    } else {
      localStore.updateCategory(id, { name: editName.trim(), color: editColor });
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name: editName.trim(), color: editColor } : c)));
    }
    setEditingId(null);
    toast.success('Categoria atualizada!');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir esta categoria? As tarefas com ela não serão afetadas.')) return;
    if (isLoggedIn) await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    else localStore.removeCategory(id);
    setCategories((prev) => prev.filter((c) => c._id !== id && c.id !== id));
    toast.success('Categoria removida.');
  };

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white">Configurações</h1>

      {/* Theme */}
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <h2 className="font-bold text-lg mb-4">Aparência</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Tema {theme === 'dark' ? 'escuro' : 'claro'}</span>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          </button>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <h2 className="font-bold text-lg mb-4">Categorias ({categories.length}/10)</h2>
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhuma categoria criada ainda.</p>
        ) : (
          <div className="space-y-2">
            {categories.map((cat) => {
              const id = cat._id || cat.id || '';
              return (
                <div key={id} className="flex items-center gap-3">
                  {editingId === id ? (
                    <>
                      <div className="flex gap-1 flex-wrap">
                        {PRESET_COLORS.map((c) => (
                          <button
                            key={c}
                            onClick={() => setEditColor(c)}
                            className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                            style={{
                              backgroundColor: c,
                              borderColor: editColor === c ? 'white' : 'transparent',
                              outline: editColor === c ? `2px solid ${c}` : 'none',
                            }}
                          />
                        ))}
                      </div>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value.slice(0, 30))}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 outline-none focus:border-indigo-400"
                      />
                      <button
                        onClick={() => handleUpdate(id)}
                        className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{cat.name}</span>
                      <button onClick={() => startEdit(cat)} className="p-1.5 text-gray-400 hover:text-indigo-500 rounded-lg">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg">
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Account */}
      {session && (
        <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <h2 className="font-bold text-lg mb-4">Conta</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{session.user?.name}</p>
              <p className="text-xs text-gray-400">{session.user?.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-red-500"
            >
              <LogOut size={14} /> Sair
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
