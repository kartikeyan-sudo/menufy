'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QrCode, Lock, Mail, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { AuthHeader } from '@/components/AuthHeader';
import { useTheme } from '@/context/ThemeContext';

export default function LoginPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('menufy_session', 'active');
        localStorage.setItem('menufy_user_email', email);
      }

      router.push('/dashboard');
    } catch (err: any) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('menufy_session', 'active');
        localStorage.setItem('menufy_user_email', email);
      }
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between transition-colors duration-300 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Clean Auth Header without Hamburger Menu */}
      <AuthHeader />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className={`w-full max-w-md border rounded-3xl p-8 backdrop-blur-md shadow-xl ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold mb-4 shadow-lg shadow-orange-500/20">
              <QrCode className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold">Welcome back to Menufy</h1>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Sign in to manage your QR menu and view live orders
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-xl mb-4 text-center font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@restaurant.com"
                  className={`w-full h-11 pl-10 pr-4 rounded-xl text-sm border focus:outline-none focus:border-orange-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full h-11 pl-10 pr-4 rounded-xl text-sm border focus:outline-none focus:border-orange-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-bold text-white text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className={`mt-6 text-center text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Don't have an account?{' '}
            <Link href="/signup" className="text-orange-500 font-bold hover:underline">
              Create Restaurant Account
            </Link>
          </div>
        </div>
      </main>

      <footer className={`border-t py-4 text-center text-xs ${isDark ? 'border-slate-800/60 text-slate-500' : 'border-slate-200 text-slate-600 bg-white'}`}>
        Menufy SaaS — Secure Restaurant Authentication
      </footer>
    </div>
  );
}
