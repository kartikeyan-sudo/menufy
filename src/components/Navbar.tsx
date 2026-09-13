'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  QrCode,
  Sparkles,
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Settings,
  Sun,
  Moon,
  Menu,
  X,
  ChevronRight,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { createClient } from '@/lib/supabase/client';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const isDark = theme === 'dark';

  useEffect(() => {
    const checkUser = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const hasLocalSession = typeof window !== 'undefined' && localStorage.getItem('menufy_session') === 'active';
        setIsLoggedIn(!!session || hasLocalSession);
      } catch {
        const hasLocalSession = typeof window !== 'undefined' && localStorage.getItem('menufy_session') === 'active';
        setIsLoggedIn(hasLocalSession);
      }
    };
    checkUser();
  }, []);

  const handleProtectedAction = (e: React.MouseEvent, targetHref: string) => {
    if (!isLoggedIn && targetHref !== '/' && !targetHref.startsWith('/menu/')) {
      e.preventDefault();
      router.push('/login');
    }
  };

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/orders', label: 'Live Orders', icon: ShoppingBag },
    { href: '/dashboard/menu', label: 'Menu Items', icon: UtensilsCrossed },
    { href: '/onboarding', label: 'AI Scanner', icon: Sparkles },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/menu/sharma-cafe', label: 'Demo QR Menu', icon: QrCode },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${
          isDark
            ? 'bg-slate-950/80 border-slate-800/80 text-white'
            : 'bg-white/80 border-slate-200 text-slate-900 shadow-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              Menufy
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={isLoggedIn || link.href.startsWith('/menu/') ? link.href : '/login'}
                  onClick={(e) => handleProtectedAction(e, link.href)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-orange-500/10 text-orange-600 border border-orange-500/20'
                      : isDark
                      ? 'text-slate-400 hover:text-white hover:bg-slate-900'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions (Theme Toggle + Sign In / Register / Mobile Hamburger) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
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

            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="hidden sm:flex items-center gap-1 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all"
              >
                Dashboard <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/login"
                  className={`px-3.5 py-2 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all ${
                    isDark
                      ? 'border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5 text-orange-500" /> Log In
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Register
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className={`md:hidden p-2 rounded-xl border transition-all ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
                  : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
              }`}
              aria-label="Toggle Mobile Navigation"
            >
              {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 transition-opacity"
        />
      )}

      {/* Mobile Slide-Over Drawer */}
      <div
        className={`md:hidden fixed inset-y-0 right-0 z-50 w-72 p-6 border-l shadow-2xl transition-transform duration-300 transform flex flex-col justify-between ${
          isMobileOpen ? 'translate-x-0' : 'translate-x-full'
        } ${isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold">
                <QrCode className="w-4 h-4" />
              </div>
              <span className="font-bold text-base">Menufy Menu</span>
            </div>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={isLoggedIn || link.href.startsWith('/menu/') ? link.href : '/login'}
                  onClick={(e) => {
                    setIsMobileOpen(false);
                    handleProtectedAction(e, link.href);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-orange-500/10 text-orange-600 border border-orange-500/20'
                      : isDark
                      ? 'text-slate-300 hover:text-white hover:bg-slate-900'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4 text-orange-500" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3 pt-6 border-t border-slate-200 dark:border-slate-800">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              onClick={() => setIsMobileOpen(false)}
              className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-orange-500/20"
            >
              Go to Dashboard <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="space-y-2">
              <Link
                href="/login"
                onClick={() => setIsMobileOpen(false)}
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-orange-500/20"
              >
                <LogIn className="w-4 h-4" /> Log In
              </Link>
              <Link
                href="/signup"
                onClick={() => setIsMobileOpen(false)}
                className={`w-full py-3 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 ${
                  isDark ? 'border-slate-800 bg-slate-900 text-slate-200' : 'border-slate-300 bg-white text-slate-800'
                }`}
              >
                <UserPlus className="w-4 h-4 text-orange-500" /> Register Account
              </Link>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
            <span>Theme Mode</span>
            <button
              onClick={toggleTheme}
              className="font-bold text-orange-600 flex items-center gap-1 uppercase tracking-wider text-[11px]"
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />} {theme}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
