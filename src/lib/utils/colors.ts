const PALETTE = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
  '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#84cc16',
];

export function getNextColor(usedColors: string[]): string {
  const available = PALETTE.filter((c) => !usedColors.includes(c));
  if (available.length > 0) return available[0];
  return PALETTE[usedColors.length % PALETTE.length];
}

export function gradeColor(grade: string): string {
  switch (grade) {
    case 'S': return '#f59e0b';
    case 'A': return '#10b981';
    case 'B': return '#3b82f6';
    case 'C': return '#8b5cf6';
    case 'D': return '#f97316';
    case 'F': return '#ef4444';
    default: return '#6b7280';
  }
}
