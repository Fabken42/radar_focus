// Theme is now handled by:
// 1. The inline script in layout.tsx (prevents flash on initial load)
// 2. onRehydrateStorage in themeStore.ts (re-applies after Zustand hydrates)
// 3. setTheme/toggleTheme in the store (user-triggered changes)
export function ThemeInitializer() {
  return null;
}
