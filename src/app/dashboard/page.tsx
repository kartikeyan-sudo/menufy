'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  Send,
  Plus,
  CheckCircle2,
  ExternalLink,
  Unplug,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useLiveRefresh } from '@/hooks/useLiveRefresh';
import { createClient } from '@/lib/supabase/client';

export default function DashboardPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [deepLinkUrl, setDeepLinkUrl] = useState<string>('');
  const [testSending, setTestSending] = useState<boolean>(false);
  const [liveOrders, setLiveOrders] = useState<any[]>([]);
  const [ordersTodayCount, setOrdersTodayCount] = useState<number>(0);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();

      if (data.success && data.orders && data.orders.length > 0) {
        setOrdersTodayCount(data.orders.length);
        const formatted = data.orders.slice(0, 5).map((o: any) => {
          const itemsStr =
            o.order_items && o.order_items.length > 0
              ? o.order_items.map((i: any) => `${i.item_name} × ${i.quantity}`).join(', ')
              : 'Order items';
          return {
            id: o.id.substring(0, 8).toUpperCase(),
            fullId: o.id,
            table: String(o.table_number),
            items: itemsStr,
            total: Number(o.total_amount),
            status: o.status,
            time: new Date(o.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          };
        });
        setLiveOrders(formatted);
      } else {
        setLiveOrders([
          { id: '1048', table: '7', items: 'Margherita × 2, Cold Coffee × 1', total: 518, status: 'pending', time: '8:42 PM' },
          { id: '1047', table: '3', items: 'Farmhouse Pizza × 1, French Fries × 1', total: 398, status: 'accepted', time: '8:30 PM' },
          { id: '1046', table: '12', items: 'Peri Peri Fries × 2, Fresh Lime Soda × 2', total: 458, status: 'completed', time: '8:15 PM' },
        ]);
        setOrdersTodayCount(3);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // 5-second live refresh sync with /api/orders
  const { lastUpdated } = useLiveRefresh({
    intervalMs: 5000,
    onRefresh: async () => {
      await fetchDashboardData();
    },
  });

  const handleConnectTelegram = async () => {
    setConnecting(true);
    try {
      const res = await fetch('/api/telegram/connect', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.deepLink) {
        setDeepLinkUrl(data.deepLink);
        window.open(data.deepLink, '_blank');
      }
    } catch {
      alert('Failed to generate Telegram connection link.');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectTelegram = async () => {
    if (!confirm('Are you sure you want to disconnect Telegram notifications?')) return;
    try {
      await fetch('/api/telegram/disconnect', { method: 'POST' });
      setIsConnected(false);
      setDeepLinkUrl('');
    } catch {
      alert('Failed to disconnect Telegram.');
    }
  };

  const handleSendTestOrder = async () => {
    setTestSending(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: '11111111-1111-1111-1111-111111111111',
          table_number: '7',
          customer_name: 'Test Customer',
          items: [
            { item_name: 'Test Margherita Pizza', quantity: 2, price: 199 },
            { item_name: 'Test Cold Coffee', quantity: 1, price: 120 },
          ],
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('🎉 Test order dispatched to Telegram bot! Check your Telegram chat.');
        fetchDashboardData();
      } else {
        alert(data.error || 'Failed to send test order.');
      }
    } catch {
      alert('Failed to send test order.');
    } finally {
      setTestSending(false);
    }
  };

  return (
    <DashboardLayout>
      <main className="p-6 md:p-10 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Sharma Cafe Overview</h1>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Live status, QR analytics & incoming table orders.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/dashboard/menu"
              className={`h-10 px-4 rounded-xl border font-semibold text-xs flex items-center gap-1.5 ${
                isDark ? 'border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" /> Manage Menu
            </Link>
            <Link
              href="/onboarding"
              className="h-10 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 font-semibold text-xs text-white flex items-center gap-1.5 shadow-md shadow-orange-500/20"
            >
              <Plus className="w-4 h-4" /> AI Menu Import
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <p className={`text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Menu Items</p>
            <p className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>24</p>
          </div>
          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <p className={`text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Active Categories</p>
            <p className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>6</p>
          </div>
          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <p className={`text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Menu Status</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-base font-bold text-emerald-500">Live</span>
            </div>
          </div>
          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <p className={`text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Orders Today</p>
            <p className="text-2xl font-extrabold text-amber-500">{ordersTodayCount}</p>
          </div>
        </div>

        {/* Recent Orders Section */}
        <div className={`border rounded-2xl p-6 mb-8 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Recent Orders</h3>
            <Link href="/dashboard/orders" className="text-xs font-semibold text-orange-500 hover:underline">
              View All Orders →
            </Link>
          </div>

          <div className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
            {liveOrders.map((ord) => (
              <div key={ord.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-sm text-orange-600 dark:text-orange-500">#{ord.id}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${isDark ? 'text-slate-300 bg-slate-800' : 'text-slate-700 bg-slate-200'}`}>Table {ord.table}</span>
                    <span className="text-xs text-slate-500">{ord.time}</span>
                  </div>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{ord.items}</p>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between">
                  <span className="font-extrabold text-orange-600 dark:text-orange-500 text-sm">₹{ord.total}</span>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                      ord.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : ord.status === 'accepted'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : ord.status === 'rejected'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {ord.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Telegram Bot Card */}
        <div className={`border rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-base">Telegram Orders Bot Status</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Bot Username: <span className="text-blue-400 font-mono">@menufy_Orders_Bot</span>
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSendTestOrder}
              disabled={testSending}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 font-semibold text-white text-xs shadow-md shadow-orange-500/20"
            >
              {testSending ? 'Sending...' : 'Send Test Order'}
            </button>
            {isConnected ? (
              <button
                onClick={handleDisconnectTelegram}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-300 text-xs font-semibold"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={handleConnectTelegram}
                disabled={connecting}
                className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold"
              >
                Connect
              </button>
            )}
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
