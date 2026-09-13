'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
  Building2,
  Send,
  Bell,
  User,
  Save,
  CheckCircle2,
  Unplug,
  ExternalLink,
  QrCode,
  ArrowLeft,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function SettingsPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'profile' | 'telegram' | 'notifications' | 'account'>('profile');
  const [restaurantName, setRestaurantName] = useState('Sharma Cafe');
  const [slug, setSlug] = useState('sharma-cafe');
  const [description, setDescription] = useState('Authentic Italian & Continental Delights');
  const [address, setAddress] = useState('123 Main Street, Sector 18, City');
  const [phone, setPhone] = useState('+91 9876543210');
  const [isSaved, setIsSaved] = useState(false);

  // Telegram state
  const [isConnected, setIsConnected] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [deepLinkUrl, setDeepLinkUrl] = useState('');
  const [testSending, setTestSending] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

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
          items: [{ item_name: 'Test Margherita Pizza', quantity: 1, price: 199 }],
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('🎉 Test notification dispatched to your Telegram chat!');
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
      <main className="p-6 md:p-10 max-w-4xl">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Settings & Configuration</h1>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Manage restaurant profile, Telegram integration, and notifications.
            </p>
          </div>
        </div>

        {/* Setting Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
          {[
            { id: 'profile', label: 'Restaurant Profile', icon: Building2 },
            { id: 'telegram', label: 'Telegram Orders', icon: Send },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'account', label: 'Account', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : isDark
                    ? 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'profile' && (
          <form
            onSubmit={handleSaveProfile}
            className={`border rounded-2xl p-6 sm:p-8 space-y-6 ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className={`flex items-center justify-between border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div>
                <h2 className="text-xl font-bold">Restaurant Profile</h2>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Manage your public restaurant info visible on customer menus.
                </p>
              </div>
              <button
                type="submit"
                className="h-10 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 font-semibold text-xs text-white flex items-center gap-1.5 shadow-md shadow-orange-500/20"
              >
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>

            {isSaved && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs p-3 rounded-xl flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Restaurant settings saved successfully!
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Restaurant Name</label>
                <input
                  type="text"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  className={`w-full h-11 px-4 rounded-xl text-sm font-semibold border focus:outline-none focus:border-orange-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Menu Slug URL</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className={`w-full h-11 px-4 rounded-xl font-mono text-sm border focus:outline-none focus:border-orange-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full p-4 rounded-xl text-sm h-24 border focus:outline-none focus:border-orange-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`w-full h-11 px-4 rounded-xl text-sm border focus:outline-none focus:border-orange-500 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={`w-full h-11 px-4 rounded-xl text-sm border focus:outline-none focus:border-orange-500 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>
            </div>
          </form>
        )}

        {activeTab === 'telegram' && (
          <div
            className={`border rounded-2xl p-6 sm:p-8 space-y-6 ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-6 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div>
                <h3 className="font-bold text-lg">Telegram Orders Connection</h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Bot: <span className="text-blue-500 font-mono">@menufy_Orders_Bot</span>
                </p>
              </div>

              {isConnected ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl">
                  Status: 🟢 Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300 px-3.5 py-1.5 rounded-xl">
                  Status: ⚪ Not Connected
                </span>
              )}
            </div>

            {isConnected ? (
              <div className={`border rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <p className={`font-semibold mb-0.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Connected Telegram Chat</p>
                  <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Incoming customer table orders are delivered directly to your chat.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSendTestOrder}
                    disabled={testSending}
                    className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 font-semibold text-white flex items-center gap-1.5 text-xs shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" /> {testSending ? 'Sending...' : 'Send Test Order'}
                  </button>
                  <button
                    onClick={handleDisconnectTelegram}
                    className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-red-500/20 hover:text-red-600 font-semibold text-slate-700 text-xs transition-colors"
                  >
                    <Unplug className="w-3.5 h-3.5" /> Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={handleConnectTelegram}
                  disabled={connecting}
                  className="h-12 px-6 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 font-bold text-white text-sm flex items-center justify-center gap-2 shadow-md"
                >
                  <Send className="w-4 h-4" /> {connecting ? 'Generating Link...' : 'Connect Telegram'}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div
            className={`border rounded-2xl p-6 sm:p-8 space-y-6 ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <h3 className={`font-bold text-lg border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>Notification Preferences</h3>
            <div className={`space-y-4 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-orange-500 rounded" />
                <span>Instant Telegram Alerts for New Customer Orders</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-orange-500 rounded" />
                <span>Sound Notification on New Incoming Table Order</span>
              </label>
            </div>
          </div>
        )}

        {activeTab === 'account' && (
          <div
            className={`border rounded-2xl p-6 sm:p-8 space-y-6 ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <h3 className={`font-bold text-lg border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>Account Settings</h3>
            <div className="space-y-4 text-sm">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Owner Email</label>
                <input
                  type="email"
                  disabled
                  value="owner@sharmacafe.com"
                  className={`w-full h-11 px-4 rounded-xl text-sm cursor-not-allowed border ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-500'
                  }`}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}
