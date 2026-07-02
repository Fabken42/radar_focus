'use client';
import { Sun, Moon, LogIn, LogOut, Target } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';
import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

export function Header() {
  const { theme, toggleTheme } = useThemeStore();
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-indigo-600 dark:text-indigo-400">
          <Target size={22} />
          <span>RadarFocus</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {session && (
            <>
              <NavLink href="/app">Board</NavLink>
              <NavLink href="/app/history">Histórico</NavLink>
              <NavLink href="/app/templates">Templates</NavLink>
              <NavLink href="/app/settings">Configurações</NavLink>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {status === 'loading' ? null : session ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:block text-sm text-gray-600 dark:text-gray-400 max-w-[120px] truncate">
                {session.user?.name?.split(' ')[0]}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn('google')}
              className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              <LogIn size={14} />
              <span>Entrar</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      {session && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 px-4 py-2 flex gap-3 overflow-x-auto text-sm">
          <NavLink href="/app">Board</NavLink>
          <NavLink href="/app/history">Histórico</NavLink>
          <NavLink href="/app/templates">Templates</NavLink>
          <NavLink href="/app/settings">Config</NavLink>
        </div>
      )}
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors whitespace-nowrap"
    >
      {children}
    </Link>
  );
}
