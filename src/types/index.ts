export interface Category {
  _id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Task {
  _id: string;
  userId: string;
  boardId: string;
  title: string;
  description: string;
  category: string;
  timeMinutes: number | null;
  status: 'pending' | 'in_progress' | 'done';
  timeSpentMs: number;
  order: number;
  createdAt: string;
}

export interface Board {
  _id: string;
  userId: string;
  label: string;
  status: 'open' | 'saved' | 'discarded';
  gradeSnapshot: {
    overall: string;
    overallScore: number;
    byCategory: { category: string; grade: string; score: number }[];
  } | null;
  createdAt: string;
  closedAt: string | null;
}

export interface Template {
  _id: string;
  userId: string;
  name: string;
  weekday: number | null;
  tasks: {
    title: string;
    description: string;
    category: string;
    timeMinutes: number | null;
    order: number;
  }[];
  createdAt: string;
}
