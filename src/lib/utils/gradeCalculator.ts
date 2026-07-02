export type Grade = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

export function scoreToGrade(score: number): Grade {
  if (score >= 1.0) return 'S';
  if (score >= 0.9) return 'A';
  if (score >= 0.75) return 'B';
  if (score >= 0.6) return 'C';
  if (score >= 0.4) return 'D';
  return 'F';
}

export interface CategoryScore {
  category: string;
  score: number;
  grade: Grade;
  done: number;
  total: number;
}

export interface TaskLike {
  category: string;
  status: string;
}

export function calcCategoryScores(tasks: TaskLike[]): CategoryScore[] {
  const map: Record<string, { done: number; total: number }> = {};
  for (const t of tasks) {
    if (!map[t.category]) map[t.category] = { done: 0, total: 0 };
    map[t.category].total++;
    if (t.status === 'done') map[t.category].done++;
  }
  return Object.entries(map).map(([category, { done, total }]) => {
    const score = total > 0 ? done / total : 0;
    return { category, score, grade: scoreToGrade(score), done, total };
  });
}

export function calcPolygonArea(scores: number[]): number {
  const n = scores.length;
  if (n < 3) return 0;
  const angle = (2 * Math.PI) / n;
  let area = 0;
  for (let i = 0; i < n; i++) {
    area += scores[i] * scores[(i + 1) % n] * Math.sin(angle);
  }
  return 0.5 * area;
}

export function calcMaxPolygonArea(n: number): number {
  if (n < 3) return 0;
  const angle = (2 * Math.PI) / n;
  return 0.5 * n * Math.sin(angle);
}

export function calcOverallScore(categoryScores: CategoryScore[]): number {
  if (categoryScores.length < 3) return 0;
  const scores = categoryScores.map((c) => c.score);
  const area = calcPolygonArea(scores);
  const maxArea = calcMaxPolygonArea(scores.length);
  if (maxArea === 0) return 0;
  return Math.min(area / maxArea, 1);
}

export function calcBoardGrade(tasks: TaskLike[]): {
  byCategory: CategoryScore[];
  overallScore: number;
  overall: Grade;
  hasEnoughCategories: boolean;
} {
  const byCategory = calcCategoryScores(tasks);
  const hasEnoughCategories = byCategory.length >= 3;
  const overallScore = hasEnoughCategories ? calcOverallScore(byCategory) : 0;
  return {
    byCategory,
    overallScore,
    overall: scoreToGrade(overallScore),
    hasEnoughCategories,
  };
}
