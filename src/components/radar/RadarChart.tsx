'use client';
import {
  RadarChart as ReRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { gradeColor } from '@/lib/utils/colors';
import { CategoryScore } from '@/lib/utils/gradeCalculator';
import { Radar as RadarIcon } from 'lucide-react';

interface Props {
  categories: CategoryScore[];
  onCategoryClick?: (category: string) => void;
  height?: number;
}

const CustomDot = (props: any) => {
  const { cx, cy, payload, onCategoryClick } = props;
  if (!cx || !cy) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={gradeColor(payload.grade)}
      stroke="white"
      strokeWidth={2}
      className="cursor-pointer"
      onClick={() => onCategoryClick?.(payload.category)}
    />
  );
};

const CustomLabel = (props: any) => {
  const { x, y, payload } = props;
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" className="fill-gray-700 dark:fill-gray-300 text-xs font-medium" style={{ fontSize: 12 }}>
      <tspan x={x} dy={0}>{payload.value}</tspan>
      <tspan x={x} dy={14} style={{ fill: gradeColor(payload.grade), fontWeight: 'bold' }}>{payload.grade}</tspan>
    </text>
  );
};

export function RadarDisplay({ categories, onCategoryClick, height = 320 }: Props) {
  if (categories.length < 3) {
    const missing = 3 - categories.length;
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center text-gray-500 dark:text-gray-400 gap-2">
        <RadarIcon size={40} className="text-gray-300 dark:text-gray-700" />
        <p className="font-medium">Radar indisponível</p>
        <p className="text-sm">
          Adicione tarefas em mais{' '}
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">{missing} categoria{missing > 1 ? 's' : ''}</span>{' '}
          para visualizar o radar.
        </p>
      </div>
    );
  }

  const data = categories.map((c) => ({
    category: c.category,
    score: Math.round(c.score * 100),
    grade: c.grade,
    fullMark: 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReRadarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
        <PolarGrid stroke="#e5e7eb" className="dark:stroke-gray-700" />
        <PolarAngleAxis
          dataKey="category"
          tick={(props) => <CustomLabel {...props} />}
          tickLine={false}
        />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
        <Radar
          name="Score"
          dataKey="score"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.25}
          dot={(props) => <CustomDot {...props} onCategoryClick={onCategoryClick} />}
          activeDot={{ r: 7, fill: '#6366f1' }}
        />
        <Tooltip
          formatter={(value) => [`${value}%`, 'Conclusão']}
          contentStyle={{
            backgroundColor: 'var(--tooltip-bg, white)',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
          }}
        />
      </ReRadarChart>
    </ResponsiveContainer>
  );
}
