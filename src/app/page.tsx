'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QrCode, Sparkles, Send, Smartphone, ChevronRight, CheckCircle2, ShieldCheck, LogIn } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { useTheme } from '@/context/ThemeContext';
import { createClient } from '@/lib/supabase/client';

export default function Home() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);
      } catch {
        setIsLoggedIn(false);
      }
    };
    checkUser();
  }, []);

  const handleAction = (targetUrl: string) => {
    if (!isLoggedIn) {
      router.push('/login');
    } else {
      router.push(targetUrl);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between relative overflow-hidden transition-colors duration-300 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900'
    }`}>
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-orange-500/15 via-amber-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Global Navbar with Light Theme & Mobile Hamburger Drawer */}
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 flex flex-col items-center text-center justify-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-600 text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" /> Powered by Gemini AI Vision
        </div>

        <h1 className={`text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight mb-6 ${
          isDark ? 'text-slate-100' : 'text-slate-900'
        }`}>
          Turn your physical menu into a{' '}
          <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
            Digital QR Ordering System
          </span>{' '}
          in minutes.
        </h1>

        <p className={`text-lg sm:text-xl max-w-2xl mb-10 leading-relaxed ${
          isDark ? 'text-slate-400' : 'text-slate-600'
        }`}>
          Upload your existing paper menu photos or PDFs. Our AI automatically extracts categories, items, prices, and descriptions so you can publish your digital QR menu instantly.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-16">
          <button
            onClick={() => handleAction('/onboarding')}
            className="h-12 px-8 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all"
          >
            {isLoggedIn ? 'Create Your Menu' : 'Log In to Create Menu'}
            {isLoggedIn ? <ChevronRight className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
          </button>
          <Link
            href="/menu/sharma-cafe"
            className={`h-12 px-8 rounded-xl border font-bold text-base flex items-center justify-center gap-2 transition-all ${
              isDark
                ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-200'
                : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-800 shadow-sm'
            }`}
          >
            View Live Customer Demo
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left mt-8">
          <div
            onClick={() => handleAction('/onboarding')}
            className={`p-6 rounded-2xl border transition-all cursor-pointer ${
              isDark ? 'border-slate-800/80 bg-slate-900/40 hover:border-orange-500/40' : 'border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-orange-500/40'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>1. AI Menu Scanner</h3>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Upload menu photos or PDFs. Gemini AI automatically parses your categories, dish names, descriptions, and prices. Log in required.
            </p>
          </div>

          <div
            onClick={() => handleAction('/dashboard')}
            className={`p-6 rounded-2xl border transition-all cursor-pointer ${
              isDark ? 'border-slate-800/80 bg-slate-900/40 hover:border-amber-500/40' : 'border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-amber-500/40'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-4">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>2. Dynamic Mobile QR</h3>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Manage live table QR codes and digital menus from your dashboard. Log in required to manage.
            </p>
          </div>

          <div
            onClick={() => handleAction('/settings')}
            className={`p-6 rounded-2xl border transition-all cursor-pointer ${
              isDark ? 'border-slate-800/80 bg-slate-900/40 hover:border-yellow-500/40' : 'border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-yellow-500/40'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-600 mb-4">
              <Send className="w-6 h-6" />
            </div>
            <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>3. Telegram Notifications</h3>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Connect Telegram bots and receive real-time order alerts. Log in required to configure.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`border-t py-6 text-center text-xs ${isDark ? 'border-slate-800/60 text-slate-500' : 'border-slate-200 text-slate-600 bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Menufy SaaS. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Protected Authentication & Multi-tenant Access Control Enabled
          </div>
        </div>
      </footer>
    </div>
  );
}
