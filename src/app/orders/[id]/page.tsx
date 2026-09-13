'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  ChefHat,
  ShoppingBag,
  ArrowLeft,
  RefreshCw,
  Sun,
  Moon,
  XCircle,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function OrderStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLiveStatus = async () => {
    try {
      const res = await fetch(`/api/orders?id=${orderId}`);
      const data = await res.json();

      if (data.success && data.order) {
        setOrder(data.order);
      }
    } catch (err) {
      console.error('Failed to fetch live order status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveStatus();
    const interval = setInterval(fetchLiveStatus, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  const currentStatus = order?.status || 'accepted';
  const tableNum = order?.table_number || '7';
  const totalAmount = order?.total_amount ? Number(order.total_amount) : 518;
  const items = order?.order_items && order.order_items.length > 0
    ? order.order_items
    : [
        { item_name: 'Margherita Pizza', quantity: 2, price_at_order: 199 },
        { item_name: 'Cold Coffee', quantity: 1, price_at_order: 120 },
      ];

  return (
    <div className={`min-h-screen transition-colors duration-300 p-4 max-w-md mx-auto relative border-x shadow-2xl ${
      isDark ? 'bg-slate-950 text-slate-100 border-slate-800/80' : 'bg-slate-50 text-slate-900 border-slate-200'
    }`}>
      <header className={`py-4 border-b flex items-center justify-between mb-6 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <Link href="/menu/sharma-cafe" className={`flex items-center gap-1.5 text-xs font-semibold ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>
          <ArrowLeft className="w-4 h-4" /> Back to Menu
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className={`p-1.5 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-800 text-amber-400' : 'bg-white border-slate-300 text-slate-700'}`}
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
          <span className="text-xs font-mono font-bold text-orange-500">#{orderId.substring(0, 8).toUpperCase()}</span>
        </div>
      </header>

      <main className="space-y-6">
        <div className={`border rounded-3xl p-6 text-center backdrop-blur-md ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          {currentStatus === 'rejected' ? (
            <>
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 mx-auto mb-4">
                <XCircle className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-extrabold mb-1 text-red-500">Order Rejected</h1>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>The restaurant was unable to accept this order for Table {tableNum}.</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-extrabold mb-1">
                {currentStatus === 'completed'
                  ? 'Order Completed 🎉'
                  : currentStatus === 'preparing'
                  ? 'Preparing Order...'
                  : 'Order Placed!'}
              </h1>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Sharma Cafe has received your order for Table {tableNum}.</p>
            </>
          )}
        </div>

        {/* Order Status Timeline */}
        <div className={`border rounded-3xl p-6 space-y-6 ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-bold uppercase tracking-wider">Live Order Status</h2>
            <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin text-orange-500" /> Live 5s
            </span>
          </div>

          <div className={`space-y-6 relative pl-6 border-l-2 ml-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <div className="relative">
              <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                <CheckCircle2 className="w-3 h-3" />
              </div>
              <p className="text-sm font-bold">Order Placed</p>
              <p className="text-xs text-slate-500">Sent to kitchen staff</p>
            </div>

            <div className="relative">
              <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white ${
                currentStatus !== 'pending' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}>
                <CheckCircle2 className="w-3 h-3" />
              </div>
              <p className={`text-sm font-bold ${currentStatus !== 'pending' ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                {currentStatus === 'rejected' ? 'Order Rejected' : 'Restaurant Accepted'}
              </p>
              <p className="text-xs text-slate-500">
                {currentStatus === 'rejected' ? 'Declined by staff' : 'Confirmed by Telegram bot'}
              </p>
            </div>

            <div className="relative">
              <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white ${
                currentStatus === 'preparing' || currentStatus === 'completed' ? 'bg-orange-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'
              }`}>
                <ChefHat className="w-3 h-3" />
              </div>
              <p className={`text-sm font-bold ${currentStatus === 'preparing' || currentStatus === 'completed' ? 'text-orange-500' : 'text-slate-400'}`}>
                Preparing in Kitchen
              </p>
              <p className="text-xs text-slate-500">Chefs preparing dishes</p>
            </div>

            <div className="relative">
              <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white ${
                currentStatus === 'completed' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}>
                <CheckCircle2 className="w-3 h-3" />
              </div>
              <p className={`text-sm font-bold ${currentStatus === 'completed' ? 'text-emerald-500' : 'text-slate-400'}`}>
                Ready & Served
              </p>
              <p className="text-xs text-slate-500">Served to Table {tableNum}</p>
            </div>
          </div>
        </div>

        {/* Item Summary */}
        <div className={`border rounded-3xl p-6 space-y-3 text-xs ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <h3 className={`font-bold text-sm border-b pb-2 ${isDark ? 'border-slate-800 text-slate-200' : 'border-slate-200 text-slate-800'}`}>Summary</h3>
          {items.map((i: any, idx: number) => (
            <div key={idx} className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>{i.item_name} × {i.quantity}</span>
              <span className="font-bold">₹{(Number(i.price_at_order || 0) * Number(i.quantity || 1)).toFixed(2)}</span>
            </div>
          ))}
          <div className={`flex justify-between font-extrabold text-sm border-t pt-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <span>Total Amount</span>
            <span className="text-orange-500">₹{totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
