'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useLocalDataStore } from '@/store/localDataStore';
import { Plus, Trash2, Edit2, Calendar, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface TemplateTask {
  title: string;
  category: string;
  timeMinutes: number | null;
  description: string;
  order: number;
}

interface Template {
  _id?: string;
  id?: string;
  name: string;
  weekday: number | null;
  tasks: TemplateTask[];
  createdAt: string;
}

function genId() {
  return crypto.randomUUID();
}

export default function TemplatesPage() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user?.id;
  const localStore = useLocalDataStore();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [weekday, setWeekday] = useState<number | null>(null);
  const [taskRows, setTaskRows] = useState<TemplateTask[]>([
    { title: '', category: '', timeMinutes: null, description: '', order: 0 },
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [isLoggedIn]);

  const load = async () => {
    if (isLoggedIn) {
      const data = await fetch('/api/templates').then((r) => r.json());
      setTemplates(data);
    } else {
      setTemplates(localStore.templates as any);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Nome obrigatório.'); return; }
    setSaving(true);
    const tasks = taskRows
      .filter((t) => t.title.trim() && t.category.trim())
      .map((t, i) => ({ ...t, order: i }));
    const payload = { name: name.trim(), weekday, tasks };
    try {
      if (isLoggedIn) {
        if (editingId) {
          const t = await fetch(`/api/templates/${editingId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }).then((r) => r.json());
          setTemplates((prev) => prev.map((x) => (x._id === editingId ? t : x)));
        } else {
          const t = await fetch('/api/templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }).then((r) => r.json());
          setTemplates((prev) => [...prev, t]);
        }
      } else {
        if (editingId) {
          localStore.updateTemplate(editingId, { ...payload, id: editingId, createdAt: new Date().toISOString() });
          setTemplates((prev) => prev.map((x) => (x.id === editingId ? { ...x, ...payload } : x)));
        } else {
          const tmpl = { id: genId(), ...payload, createdAt: new Date().toISOString() };
          localStore.addTemplate(tmpl);
          setTemplates((prev) => [...prev, tmpl as any]);
        }
      }
      toast.success(editingId ? 'Template atualizado!' : 'Template criado!');
      resetForm();
    } catch {
      toast.error('Erro ao salvar template.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este template?')) return;
    if (isLoggedIn) await fetch(`/api/templates/${id}`, { method: 'DELETE' });
    else localStore.removeTemplate(id);
    setTemplates((prev) => prev.filter((t) => t._id !== id && t.id !== id));
    toast.success('Template excluído.');
  };

  const startEdit = (t: Template) => {
    setEditingId(t._id || t.id || null);
    setName(t.name);
    setWeekday(t.weekday);
    setTaskRows(
      t.tasks.length > 0
        ? t.tasks
        : [{ title: '', category: '', timeMinutes: null, description: '', order: 0 }]
    );
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setName('');
    setWeekday(null);
    setTaskRows([{ title: '', category: '', timeMinutes: null, description: '', order: 0 }]);
  };

  if (loading) {
    return <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Templates</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-medium"
        >
          <Plus size={16} /> Novo template
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="font-bold text-lg">{editingId ? 'Editar' : 'Novo'} Template</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 40))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm outline-none focus:border-indigo-400"
                placeholder="Ex: Dia de trabalho"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Dia da semana (opcional)</label>
              <select
                value={weekday ?? ''}
                onChange={(e) => setWeekday(e.target.value === '' ? null : Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm outline-none"
              >
                <option value="">Genérico</option>
                {WEEKDAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tarefas</label>
            <div className="space-y-2">
              {taskRows.map((row, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <input
                    value={row.title}
                    onChange={(e) => setTaskRows((prev) => prev.map((r, j) => j === i ? { ...r, title: e.target.value.slice(0, 100) } : r))}
                    placeholder="Título *"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm outline-none focus:border-indigo-400"
                  />
                  <input
                    value={row.category}
                    onChange={(e) => setTaskRows((prev) => prev.map((r, j) => j === i ? { ...r, category: e.target.value.slice(0, 30) } : r))}
                    placeholder="Categoria *"
                    className="w-28 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm outline-none focus:border-indigo-400"
                  />
                  <input
                    type="number"
                    value={row.timeMinutes ?? ''}
                    onChange={(e) => setTaskRows((prev) => prev.map((r, j) => j === i ? { ...r, timeMinutes: e.target.value ? Number(e.target.value) : null } : r))}
                    placeholder="Min"
                    className="w-16 px-2 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm outline-none focus:border-indigo-400"
                  />
                  <button
                    type="button"
                    onClick={() => setTaskRows((prev) => prev.filter((_, j) => j !== i))}
                    className="p-2 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setTaskRows((prev) => [...prev, { title: '', category: '', timeMinutes: null, description: '', order: prev.length }])}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <Plus size={14} /> Adicionar linha
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
            >
              {saving ? 'Salvando...' : 'Salvar template'}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {templates.length === 0 && !showForm && (
        <div className="text-center py-20 text-gray-400">
          <ClipboardList size={48} className="mb-3 text-gray-300 dark:text-gray-700" />
          <p className="font-medium">Nenhum template ainda</p>
          <p className="text-sm mt-1">Crie templates para reutilizar conjuntos de tarefas.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {templates.map((t) => (
          <div key={t._id || t.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{t.name}</h3>
                {t.weekday !== null && (
                  <span className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <Calendar size={11} />{WEEKDAYS[t.weekday]}
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                <button onClick={() => startEdit(t)} className="p-1.5 text-gray-400 hover:text-indigo-500 rounded-lg">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(t._id || t.id || '')} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t.tasks.length} tarefa(s)</p>
            <div className="mt-2 space-y-1">
              {t.tasks.slice(0, 3).map((task, i) => (
                <div key={i} className="text-xs text-gray-600 dark:text-gray-400 flex gap-2">
                  <span className="truncate">{task.title}</span>
                  <span className="flex-shrink-0 text-gray-400">{task.category}</span>
                </div>
              ))}
              {t.tasks.length > 3 && <p className="text-xs text-gray-400">+{t.tasks.length - 3} mais</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
