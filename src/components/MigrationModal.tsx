'use client';
import { useState } from 'react';
import { Database } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  onConfirm: () => Promise<void>;
  onSkip: () => void;
}

export function MigrationModal({ onConfirm, onSkip }: Props) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      toast.success('Dados importados com sucesso!');
    } catch {
      toast.error('Erro ao importar dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center">
            <Database size={20} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-lg font-bold">Dados locais encontrados</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Encontramos boards, tarefas e categorias salvos localmente. Deseja importá-los para sua conta para acessá-los em qualquer dispositivo?
        </p>
        <div className="flex gap-2">
          <button
            onClick={onSkip}
            disabled={loading}
            className="flex-1 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Ignorar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Importando...' : 'Importar dados'}
          </button>
        </div>
      </div>
    </div>
  );
}
