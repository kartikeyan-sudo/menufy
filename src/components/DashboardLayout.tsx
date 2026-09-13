'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  QrCode,
  Settings,
  Send,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Sun,
  Moon,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from '@/context/ThemeContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [restaurantName, setRestaurantName] = useState('Sharma Cafe');
  const [restaurantSlug, setRestaurantSlug] = useState('sharma-cafe');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('menufy_restaurant_info');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.name) setRestaurantName(parsed.name);
          if (parsed.slug) setRestaurantSlug(parsed.slug);
        } catch {}
      }
    }
  }, []);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const hasLocalSession = typeof window !== 'undefined' && localStorage.getItem('menufy_session') === 'active';
        if (!session && !hasLocalSession) {
          router.push('/login');
        }
      } catch {
        // Fallback
      }
    };
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('menufy_session');
        localStorage.removeItem('menufy_user_email');
      }
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Fallback
    } finally {
      router.push('/login');
    }
  };

  const navItems = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/orders', label: 'Orders', icon: ShoppingBag, badge: '3' },
    { href: '/dashboard/menu', label: 'Menu Management', icon: UtensilsCrossed },
    { href: '/onboarding', label: 'AI Menu Scanner', icon: QrCode },
    { href: '/settings', label: 'Settings & Telegram', icon: Settings },
  ];

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex flex-col md:flex-row ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Mobile Header Bar with Hamburger (Fix #1) */}
      <div className={`md:hidden flex items-center justify-between px-4 h-16 border-b sticky top-0 z-40 backdrop-blur-md ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className={`p-2 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-700'}`}
            aria-label="Toggle Navigation Menu"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-bold text-base tracking-tight">Menufy</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800 text-amber-400' : 'bg-slate-100 border-slate-300 text-slate-700'}`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Slide-Over Backdrop (Fix #1) */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 transition-opacity"
        />
      )}

      {/* Sidebar Navigation (Desktop Fixed / Mobile Slide-Over Drawer) */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 p-6 flex flex-col justify-between border-r transition-transform duration-300 transform ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-xl md:shadow-none'}`}
      >
        <div>
          <div className="flex items-center justify-between mb-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold shadow-lg shadow-orange-500/20">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-base tracking-tight">Menufy</h1>
                <p className="text-[10px] text-orange-500 font-mono truncate max-w-[120px]">{restaurantName} Dashboard</p>
              </div>
            </Link>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                      : isDark
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" /> {item.label}
                  {item.badge && (
                    <span className="ml-auto bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800/80 space-y-3">
          <Link
            href={`/menu/${restaurantSlug}`}
            target="_blank"
            className="flex items-center justify-between text-xs font-semibold text-orange-500 hover:text-orange-400 p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20"
          >
            Preview Live Menu <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {/* Visible Logout Button (Fix #2) */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold text-xs transition-colors"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Page Body */}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
