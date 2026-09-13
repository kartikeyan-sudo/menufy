'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  ChefHat,
  Filter,
  RefreshCw,
  Send,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useLiveRefresh } from '@/hooks/useLiveRefresh';
import { createClient } from '@/lib/supabase/client';

interface OrderItem {
  id: string;
  fullId: string;
  table: string;
  customerName?: string;
  items: string;
  total: number;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'rejected';
  time: string;
}

export default function DashboardOrdersPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchOrders = async () => {
    try {
      // 1. Trigger polling acknowledgement for Telegram
      fetch('/api/telegram/poll').catch(() => {});

      // 2. Fetch live orders from API route
      const res = await fetch('/api/orders');
      const data = await res.json();

      if (data.success && data.orders && data.orders.length > 0) {
        const formatted: OrderItem[] = data.orders.map((o: any) => {
          const itemsStr =
            o.order_items && o.order_items.length > 0
              ? o.order_items.map((i: any) => `${i.item_name} × ${i.quantity}`).join(', ')
              : 'Order Items';
          const timeStr = new Date(o.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          return {
            id: o.id.substring(0, 8).toUpperCase(),
            fullId: o.id,
            table: String(o.table_number),
            customerName: o.customer_name || undefined,
            items: itemsStr,
            total: Number(o.total_amount),
            status: o.status as OrderItem['status'],
            time: timeStr,
          };
        });
        setOrders(formatted);
      } else {
        // Fallback default sample orders if database has no orders yet
        setOrders([
          { id: '1048', fullId: '1048', table: '7', customerName: 'Rahul', items: 'Margherita × 2, Cold Coffee × 1', total: 518, status: 'pending', time: '8:42 PM' },
          { id: '1047', fullId: '1047', table: '3', customerName: 'Priya', items: 'Farmhouse Pizza × 1, French Fries × 1', total: 398, status: 'accepted', time: '8:30 PM' },
          { id: '1046', fullId: '1046', table: '12', customerName: 'Amit', items: 'Peri Peri Fries × 2, Fresh Lime Soda × 2', total: 458, status: 'completed', time: '8:15 PM' },
        ]);
      }
    } catch (err) {
      console.error('Failed to load live orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Reusable 30-second live refresh hook
  const { lastUpdated } = useLiveRefresh({
    intervalMs: 30000,
    onRefresh: async () => {
      await fetchOrders();
    },
  });

  const updateStatus = async (fullId: string, newStatus: OrderItem['status']) => {
    try {
      setOrders((prev) =>
        prev.map((o) => (o.fullId === fullId ? { ...o, status: newStatus } : o))
      );

      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: fullId, status: newStatus }),
      });
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  const filteredOrders = orders.filter(
    (o) => statusFilter === 'all' || o.status === statusFilter
  );

  return (
    <DashboardLayout>
      <main className="p-6 md:p-10 max-w-6xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Restaurant Orders</h1>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Manage table orders, Telegram sync & live kitchen status.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
              <RefreshCw className="w-3 h-3 animate-spin text-orange-500" /> 30s Sync ({lastUpdated.toLocaleTimeString()})
            </span>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
          {['all', 'pending', 'accepted', 'preparing', 'ready', 'completed', 'rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : isDark
                  ? 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">No orders matching "{statusFilter}" filter.</div>
          ) : (
            filteredOrders.map((ord) => (
              <div
                key={ord.fullId}
                className={`p-6 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono font-bold text-base text-orange-500">#{ord.id}</span>
                    <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg">
                      Table {ord.table}
                    </span>
                    {ord.customerName && (
                      <span className="text-xs text-slate-400">Customer: {ord.customerName}</span>
                    )}
                    <span className="text-xs text-slate-500">{ord.time}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-200 mb-1">{ord.items}</p>
                  <p className="text-sm font-extrabold text-orange-500">Total: ₹{ord.total}</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-between">
                  <span
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider ${
                      ord.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : ord.status === 'accepted'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : ord.status === 'preparing'
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        : ord.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {ord.status}
                  </span>

                  <div className="flex items-center gap-2">
                    {ord.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateStatus(ord.fullId, 'accepted')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => updateStatus(ord.fullId, 'rejected')}
                          className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold text-xs"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {ord.status === 'accepted' && (
                      <button
                        onClick={() => updateStatus(ord.fullId, 'completed')}
                        className="px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs"
                      >
                        Mark Completed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </DashboardLayout>
  );
}
