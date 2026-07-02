'use client';
import { gradeColor } from '@/lib/utils/colors';
import { cn } from '@/lib/utils/cn';

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
      <div
        className={cn('rounded-full flex items-center justify-center font-black border-2', sizes[size])}
        style={{ borderColor: color, color }}
      >
        {grade}
      </div>
      {showScore && score !== undefined && (
        <span className="text-sm text-gray-500 dark:text-gray-400">{Math.round(score * 100)}%</span>
      )}
    </div>
  );
}
