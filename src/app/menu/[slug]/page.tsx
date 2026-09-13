'use client';

import React, { useState, use, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  Send,
  X,
  ChefHat,
  Sun,
  Moon,
  Camera,
  Ticket,
  Loader2,
} from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const DEFAULT_RESTAURANT_ID = '11111111-1111-1111-1111-111111111111';

const DEMO_MENU = {
  restaurantName: 'Sharma Cafe',
  slug: 'sharma-cafe',
  restaurantId: DEFAULT_RESTAURANT_ID,
  description: 'Fresh Wood-fired Pizzas, Gourmet Burgers & Artisanal Coffee',
  categories: [
    {
      id: 'cat-1',
      name: 'Pizzas',
      items: [
        {
          id: 'item-1',
          name: 'Margherita Pizza',
          description: 'Fresh mozzarella, San Marzano tomatoes, and organic basil.',
          price: 199,
          image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=600&q=80',
        },
        {
          id: 'item-2',
          name: 'Farmhouse Pizza',
          description: 'Crisp capsicum, red onion, button mushroom & sweet corn.',
          price: 249,
          image: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=600&q=80',
        },
      ],
    },
    {
      id: 'cat-2',
      name: 'Beverages',
      items: [
        {
          id: 'item-3',
          name: 'Classic Cold Coffee',
          description: 'Dark espresso whipped with cold milk and vanilla ice cream.',
          price: 120,
          image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80',
        },
        {
          id: 'item-4',
          name: 'Fresh Lime Soda',
          description: 'Refreshing sparkling soda with mint and squeezed lime.',
          price: 80,
          image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
        },
      ],
    },
    {
      id: 'cat-3',
      name: 'Sides & Desserts',
      items: [
        {
          id: 'item-5',
          name: 'Peri Peri French Fries',
          description: 'Crispy golden potato fries tossed in spicy peri peri seasoning.',
          price: 149,
          image: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=600&q=80',
        },
        {
          id: 'item-6',
          name: 'Chocolate Lava Cake',
          description: 'Warm chocolate cake with molten chocolate core.',
          price: 169,
          image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
        },
      ],
    },
  ],
};

export default function CustomerMenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [restName, setRestName] = useState<string>(DEMO_MENU.restaurantName);
  const [restDesc, setRestDesc] = useState<string>(DEMO_MENU.description);
  const [actualRestaurantId, setActualRestaurantId] = useState<string>(DEFAULT_RESTAURANT_ID);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [tableNumber, setTableNumber] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);
  const [menuLoading, setMenuLoading] = useState<boolean>(true);

  const [categoriesList, setCategoriesList] = useState<any[]>(DEMO_MENU.categories);

  // Fetch menu from API (works for both owner and customer on any device/browser)
  useEffect(() => {
    const fetchMenuFromAPI = async () => {
      try {
        const res = await fetch(`/api/menu?slug=${resolvedParams.slug}`);
        const data = await res.json();

        if (data.success) {
          if (data.restaurant) {
            setRestName(data.restaurant.name);
            setRestDesc(data.restaurant.description || '');
            setActualRestaurantId(data.restaurant.id);
          }

          if (data.categories && data.categories.length > 0) {
            const formattedCategories = data.categories.map((cat: any) => {
              const catItems = (data.items || [])
                .filter((i: any) => i.category_id === cat.id && i.is_available !== false)
                .map((i: any) => ({
                  id: i.id,
                  name: i.name,
                  description: i.description || '',
                  price: Number(i.price),
                  image: i.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
                }));
              return {
                id: cat.id,
                name: cat.name,
                items: catItems,
              };
            });

            if (formattedCategories.some((c: any) => c.items.length > 0)) {
              setCategoriesList(formattedCategories);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch menu from API, using demo data:', err);
      } finally {
        setMenuLoading(false);
      }
    };

    fetchMenuFromAPI();
  }, [resolvedParams.slug]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const addToCart = (item: { id: string; name: string; price: number }) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.id === id) {
            const nextQty = i.quantity + delta;
            return nextQty > 0 ? { ...i, quantity: nextQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const totalItemsCount = cart.reduce((acc, i) => acc + i.quantity, 0);
  const totalAmount = cart.reduce((acc, i) => acc + i.price * i.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!tableNumber.trim()) {
      alert('Please enter your table number.');
      return;
    }
    setIsSubmitting(true);

    try {
      const orderPayload = {
        restaurant_id: actualRestaurantId,
        table_number: tableNumber,
        customer_name: customerName || undefined,
        customer_phone: customerPhone || undefined,
        items: cart.map((i) => ({
          menu_item_id: i.id,
          item_name: i.name,
          quantity: i.quantity,
          price: i.price,
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setOrderSuccess({
          ...data.order,
          table_number: tableNumber,
          customer_name: customerName,
          items: cart,
          total_amount: totalAmount,
        });
        setCart([]);
        setIsCartOpen(false);
      } else {
        alert(data.error || 'Failed to place order. Please try again.');
      }
    } catch (err: any) {
      alert('Network error while placing order. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categoriesList
    .map((cat) => {
      const items = cat.items.filter(
        (item: any) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      return { ...cat, items };
    })
    .filter((cat) => (activeCategory === 'All' || cat.name === activeCategory) && cat.items.length > 0);

  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-screen transition-colors duration-300 pb-28 max-w-5xl mx-auto relative md:border-x shadow-xl md:shadow-2xl ${
        isDark
          ? 'bg-slate-950 text-slate-100 md:border-slate-800/80'
          : 'bg-slate-50 text-slate-900 md:border-slate-200'
      }`}
    >
      {/* Restaurant Header */}
      <header
        className={`p-6 border-b ${
          isDark ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-orange-500/20">
              <ChefHat className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-lg font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {restName}
                </h1>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  <Clock className="w-3 h-3" /> Open
                </span>
              </div>
              <p className={`text-xs mt-0.5 line-clamp-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {restDesc}
              </p>
            </div>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`p-2.5 rounded-xl border transition-all ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
            title="Toggle Light / Dark Mode"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mt-4">
          <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pizza, coffee, fries..."
            className={`w-full h-11 pl-10 pr-4 rounded-xl text-sm focus:outline-none focus:border-orange-500 border ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                : 'bg-slate-100 border-slate-300 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>
      </header>

      {/* Category Navigation Pills */}
      <nav
        className={`flex items-center gap-2 overflow-x-auto p-4 border-b no-scrollbar sticky top-0 backdrop-blur-md z-40 ${
          isDark ? 'bg-slate-950/90 border-slate-800/80' : 'bg-slate-50/90 border-slate-200'
        }`}
      >
        <button
          onClick={() => setActiveCategory('All')}
          className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            activeCategory === 'All'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : isDark
              ? 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          All
        </button>
        {categoriesList.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.name)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === cat.name
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : isDark
                ? 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </nav>

      {/* Menu Categories & Items List */}
      <main className="p-4 space-y-8">
        {menuLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-orange-500" />
            <span className="ml-2 text-sm text-slate-500">Loading menu...</span>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">No items found matching "{searchQuery}"</div>
        ) : (
          filteredCategories.map((cat) => (
            <section key={cat.id} className="space-y-4">
              <h2
                className={`text-sm font-bold uppercase tracking-wider border-l-2 border-orange-500 pl-3 ${
                  isDark ? 'text-slate-200' : 'text-slate-800'
                }`}
              >
                {cat.name}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cat.items.map((item: any) => {
                  const cartItem = cart.find((i) => i.id === item.id);
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                        isDark
                          ? 'bg-slate-900/60 border-slate-800/80'
                          : 'bg-white border-slate-200/80 shadow-sm'
                      }`}
                    >
                      <div className="flex-1">
                        <h3 className={`font-bold text-base mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {item.name}
                        </h3>
                        <p className={`text-xs leading-relaxed mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {item.description}
                        </p>
                        <span className="text-base font-extrabold text-orange-500">₹{item.price}</span>
                      </div>

                      <div className="flex flex-col items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 rounded-xl object-cover border border-slate-700/50"
                        />
                        {cartItem ? (
                          <div
                            className={`flex items-center gap-2 border rounded-lg p-1 ${
                              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300'
                            }`}
                          >
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className={`w-7 h-7 rounded-md flex items-center justify-center ${
                                isDark ? 'bg-slate-900 text-slate-300' : 'bg-white text-slate-700 shadow-sm'
                              }`}
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className={`font-bold text-sm px-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {cartItem.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-7 h-7 rounded-md bg-orange-500 flex items-center justify-center text-white"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(item)}
                            className="w-full px-4 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-orange-500/20"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </main>

      {/* Floating Persistent Bottom Cart Bar */}
      {totalItemsCount > 0 && !isCartOpen && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md px-4 z-50">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-5 flex items-center justify-between shadow-xl shadow-orange-500/30 transition-all transform active:scale-95"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                {totalItemsCount}
              </div>
              <span className="font-bold text-sm">View Cart</span>
            </div>
            <span className="font-extrabold text-base">₹{totalAmount}</span>
          </button>
        </div>
      )}

      {/* Checkout Drawer / Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div
            className={`border-t md:border rounded-t-3xl md:rounded-3xl p-6 w-full max-w-lg space-y-6 max-h-[90vh] overflow-y-auto ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xl'
            }`}
          >
            <div className={`flex items-center justify-between border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-orange-500" />
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Your Order</h3>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between text-sm py-2 border-b ${
                    isDark ? 'border-slate-800/60' : 'border-slate-100'
                  }`}
                >
                  <div>
                    <p className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{item.name}</p>
                    <p className="text-xs text-slate-500">₹{item.price} each</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex items-center gap-2 rounded-lg p-1 border ${
                        isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300'
                      }`}
                    >
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-slate-400">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className={`font-bold text-xs px-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-orange-500">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-bold text-orange-500 w-14 text-right">₹{item.price * item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Summary */}
            <div
              className={`flex items-center justify-between text-base font-extrabold border-t pt-3 ${
                isDark ? 'text-white border-slate-800' : 'text-slate-900 border-slate-200'
              }`}
            >
              <span>Total Payment Amount</span>
              <span className="text-orange-500 text-lg">₹{totalAmount}</span>
            </div>

            {/* Table & Details Form */}
            <div className="space-y-4 pt-2">
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Table Number <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="e.g. 7"
                  className={`w-full h-11 px-4 rounded-xl text-sm font-bold border focus:outline-none focus:border-orange-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Rahul"
                  className={`w-full h-11 px-4 rounded-xl text-sm border focus:outline-none focus:border-orange-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting || !tableNumber.trim()}
              className="w-full h-13 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-bold text-white text-base flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all disabled:opacity-50 py-3"
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Sending Order...</>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Place Order (₹{totalAmount})
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Order Confirmation Modal with Token ID, Payment Summary & Screenshot Prompt */}
      {orderSuccess && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div
            className={`border rounded-3xl p-6 text-center max-w-sm w-full shadow-2xl space-y-5 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-500 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full mb-2">
                <Ticket className="w-3.5 h-3.5" /> TOKEN / ORDER ID
              </span>
              <h3 className={`text-3xl font-extrabold font-mono tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                #{orderSuccess.orderNumber}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Table {orderSuccess.table_number}</p>
            </div>

            {/* SCREENSHOT REMINDER BANNER */}
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-2xl p-3.5 text-xs font-semibold flex items-center gap-3 text-left">
              <Camera className="w-6 h-6 flex-shrink-0" />
              <span>
                📸 <strong>IMPORTANT:</strong> Please take a screenshot of this Token Number & Receipt for your reference!
              </span>
            </div>

            {/* Order Items & Payment Summary */}
            <div className={`p-4 rounded-2xl text-xs space-y-2 border text-left ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <p className={`font-bold uppercase tracking-wider text-[10px] mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Order Summary</p>
              {orderSuccess.items &&
                orderSuccess.items.map((i: any, idx: number) => (
                  <div key={idx} className={`flex justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <span>{i.name} × {i.quantity}</span>
                    <span className="font-semibold">₹{i.price * i.quantity}</span>
                  </div>
                ))}
              <div className={`border-t pt-2 flex justify-between font-extrabold text-sm text-orange-600 dark:text-orange-500 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <span>Total Payment Amount</span>
                <span>₹{orderSuccess.total_amount}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Link
                href={`/orders/${orderSuccess.id}`}
                className="w-full h-11 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                Track Live Order Status
              </Link>
              <button
                onClick={() => setOrderSuccess(null)}
                className={`w-full h-11 rounded-xl border font-semibold text-xs ${
                  isDark ? 'border-slate-800 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
