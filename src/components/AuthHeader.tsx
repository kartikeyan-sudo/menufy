'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { QrCode, Sun, Moon, ArrowLeft } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export function AuthHeader() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const isLogin = pathname === '/login';

  return (
    <header
      className={`w-full border-b backdrop-blur-md sticky top-0 z-50 transition-colors duration-300 ${
        isDark ? 'bg-slate-950/80 border-slate-800/80 text-white' : 'bg-white/80 border-slate-200 text-slate-900 shadow-sm'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
            <QrCode className="w-5 h-5" />
          </div>
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            Menufy
          </span>
        </Link>

        {/* Right Actions: Theme Toggle + Auth Link (NO Hamburger Menu) */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition-all ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
            title="Toggle Light / Dark Mode"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <Link
            href={isLogin ? '/signup' : '/login'}
            className="text-xs font-bold text-orange-600 hover:text-orange-500 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 px-3.5 py-2 rounded-xl transition-all"
          >
            {isLogin ? 'Create Account' : 'Sign In'}
          </Link>
        </div>
      </div>
    </header>
  );
}
