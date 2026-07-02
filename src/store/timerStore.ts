import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TimerState {
  activeTaskId: string | null;
  startTimestamp: number | null;
  durationMs: number | null;
  setTimer: (taskId: string, startTimestamp: number, durationMs: number) => void;
  clearTimer: () => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set) => ({
      activeTaskId: null,
      startTimestamp: null,
      durationMs: null,
      setTimer: (activeTaskId, startTimestamp, durationMs) =>
        set({ activeTaskId, startTimestamp, durationMs }),
      clearTimer: () =>
        set({ activeTaskId: null, startTimestamp: null, durationMs: null }),
    }),
    { name: 'radarf-timer' }
  )
);
