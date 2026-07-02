import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LocalCategory {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface LocalTask {
  id: string;
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

export interface LocalBoard {
  id: string;
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

export interface LocalTemplate {
  id: string;
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

interface LocalDataStore {
  categories: LocalCategory[];
  boards: LocalBoard[];
  tasks: LocalTask[];
  templates: LocalTemplate[];
  activeBoardId: string | null;
  migrated: boolean;

  setActiveBoardId: (id: string | null) => void;
  setMigrated: () => void;

  // Categories
  addCategory: (cat: LocalCategory) => void;
  updateCategory: (id: string, updates: Partial<LocalCategory>) => void;
  removeCategory: (id: string) => void;

  // Boards
  addBoard: (board: LocalBoard) => void;
  updateBoard: (id: string, updates: Partial<LocalBoard>) => void;

  // Tasks
  addTask: (task: LocalTask) => void;
  updateTask: (id: string, updates: Partial<LocalTask>) => void;
  removeTask: (id: string) => void;

  // Templates
  addTemplate: (template: LocalTemplate) => void;
  updateTemplate: (id: string, updates: Partial<LocalTemplate>) => void;
  removeTemplate: (id: string) => void;

  clearAll: () => void;
}

const initialState = {
  categories: [],
  boards: [],
  tasks: [],
  templates: [],
  activeBoardId: null,
  migrated: false,
};

export const useLocalDataStore = create<LocalDataStore>()(
  persist(
    (set) => ({
      ...initialState,

      setActiveBoardId: (id) => set({ activeBoardId: id }),
      setMigrated: () => set({ migrated: true }),

      addCategory: (cat) => set((s) => ({ categories: [...s.categories, cat] })),
      updateCategory: (id, updates) =>
        set((s) => ({ categories: s.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)) })),
      removeCategory: (id) =>
        set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),

      addBoard: (board) => set((s) => ({ boards: [...s.boards, board] })),
      updateBoard: (id, updates) =>
        set((s) => ({ boards: s.boards.map((b) => (b.id === id ? { ...b, ...updates } : b)) })),

      addTask: (task) => set((s) => ({ tasks: [...s.tasks, task] })),
      updateTask: (id, updates) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),
      removeTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      addTemplate: (template) => set((s) => ({ templates: [...s.templates, template] })),
      updateTemplate: (id, updates) =>
        set((s) => ({ templates: s.templates.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),
      removeTemplate: (id) =>
        set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),

      clearAll: () => set(initialState),
    }),
    {
      name: 'radarf-local-data',
      version: 1,
      migrate: (persisted: any, version: number) => {
        // version 0 → 1: no structural changes yet, just initialise missing fields
        if (version < 1) {
          return { ...initialState, ...persisted, migrated: persisted.migrated ?? false };
        }
        return persisted;
      },
    }
  )
);
