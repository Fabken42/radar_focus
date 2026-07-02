'use client';
import { useState, useRef } from 'react';
import { Upload, Download, X, AlertCircle, CheckCircle } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

interface ImportedTask {
  title: string;
  category: string;
  timeMinutes: number | null;
  description: string;
}

interface RowError {
  row: number;
  errors: string[];
}

interface Props {
  onImport: (tasks: ImportedTask[]) => Promise<void>;
  onClose: () => void;
}

export function SpreadsheetImport({ onImport, onClose }: Props) {
  const [rows, setRows] = useState<ImportedTask[]>([]);
  const [errors, setErrors] = useState<RowError[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['titulo', 'categoria', 'tempo_minutos', 'descricao'],
      ['Ler livro', 'Estudo', '30', 'Capítulo 3 de Clean Code'],
      ['Reunião de equipe', 'Trabalho', '60', ''],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tarefas');
    XLSX.writeFile(wb, 'modelo_tarefas.xlsx');
  };

  const validateAndParse = (rawRows: any[]): { tasks: ImportedTask[]; errors: RowError[] } => {
    const tasks: ImportedTask[] = [];
    const errors: RowError[] = [];

    rawRows.forEach((row, idx) => {
      const rowNum = idx + 2;
      const rowErrors: string[] = [];
      const title = String(row.titulo || row.title || '').trim();
      const category = String(row.categoria || row.category || '').trim();
      const timeMinsRaw = row.tempo_minutos || row.timeMinutes || row.time_minutes || '';
      const description = String(row.descricao || row.description || '').trim();

      if (!title) rowErrors.push('Título obrigatório');
      else if (title.length > 100) rowErrors.push('Título excede 100 caracteres');
      if (!category) rowErrors.push('Categoria obrigatória');
      else if (category.length > 30) rowErrors.push('Categoria excede 30 caracteres');
      if (description.length > 500) rowErrors.push('Descrição excede 500 caracteres');

      let timeMinutes: number | null = null;
      if (timeMinsRaw !== '' && timeMinsRaw !== null && timeMinsRaw !== undefined) {
        const n = Number(timeMinsRaw);
        if (isNaN(n) || n < 1 || n > 480) rowErrors.push('Tempo deve ser entre 1 e 480 minutos');
        else timeMinutes = n;
      }

      if (rowErrors.length > 0) errors.push({ row: rowNum, errors: rowErrors });
      else tasks.push({ title, category, timeMinutes, description });
    });

    return { tasks, errors };
  };

  const handleFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const { tasks, errors } = validateAndParse(result.data as any[]);
          setRows(tasks);
          setErrors(errors);
        },
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const wb = XLSX.read(e.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        const { tasks, errors } = validateAndParse(data);
        setRows(tasks);
        setErrors(errors);
      };
      reader.readAsBinaryString(file);
    } else {
      toast.error('Formato não suportado. Use CSV ou XLSX.');
    }
  };

  const handleImport = async () => {
    if (errors.length > 0) { toast.error('Corrija os erros antes de importar.'); return; }
    if (rows.length === 0) { toast.error('Nenhuma tarefa válida para importar.'); return; }
    setLoading(true);
    try {
      await onImport(rows);
      toast.success(`${rows.length} tarefa(s) importada(s)!`);
      onClose();
    } catch {
      toast.error('Erro ao importar tarefas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Importar Tarefas</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X size={18} /></button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <Download size={14} /> Baixar Modelo
          </button>
          <button
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Upload size={14} /> Carregar Arquivo
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>

        {errors.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-1"><AlertCircle size={14} /> {errors.length} erro(s) encontrado(s):</p>
            {errors.map((e) => (
              <div key={e.row} className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded px-2 py-1">
                Linha {e.row}: {e.errors.join('; ')}
              </div>
            ))}
          </div>
        )}

        {rows.length > 0 && errors.length === 0 && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-1"><CheckCircle size={14} /> {rows.length} tarefa(s) válidas:</p>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {rows.map((r, i) => (
                <div key={i} className="text-xs bg-gray-50 dark:bg-gray-800 rounded px-2 py-1 flex gap-2">
                  <span className="font-medium truncate">{r.title}</span>
                  <span className="text-gray-400 flex-shrink-0">{r.category}</span>
                  {r.timeMinutes && <span className="text-gray-400 flex-shrink-0">{r.timeMinutes}min</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {rows.length > 0 && errors.length === 0 && (
          <button
            onClick={handleImport}
            disabled={loading}
            className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
          >
            {loading ? 'Importando...' : `Importar ${rows.length} tarefa(s)`}
          </button>
        )}
      </div>
    </div>
  );
}
