'use client';
import { gradeColor } from '@/lib/utils/colors';
import { cn } from '@/lib/utils/cn';

const GRADE_LABELS: Record<string, string> = {
  S: 'Excepcional — 100% concluído',
  A: 'Ótimo — ≥ 90% concluído',
  B: 'Bom — ≥ 75% concluído',
  C: 'Regular — ≥ 60% concluído',
  D: 'Fraco — ≥ 40% concluído',
  F: 'Insuficiente — < 40% concluído',
};

interface Props {
  grade: string;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
}

export function GradeDisplay({ grade, score, size = 'md', showScore }: Props) {
  const color = gradeColor(grade);
  const sizes = { sm: 'text-sm w-7 h-7', md: 'text-xl w-12 h-12', lg: 'text-3xl w-16 h-16' };

  return (
    <div className="flex items-center gap-2">
      <div className="relative group">
        <div
          className={cn('rounded-full flex items-center justify-center font-black border-2 cursor-help', sizes[size])}
          style={{ borderColor: color, color }}
        >
          {grade}
        </div>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 text-xs bg-gray-900 dark:bg-gray-700 text-white rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20">
          {GRADE_LABELS[grade] ?? grade}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
        </div>
      </div>
      {showScore && score !== undefined && (
        <span className="text-sm text-gray-500 dark:text-gray-400">{Math.round(score * 100)}%</span>
      )}
    </div>
  );
}
