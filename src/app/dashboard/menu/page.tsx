'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
  Plus,
  Edit3,
  Trash2,
  Upload,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  Image as ImageIcon,
  FolderPlus,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean;
}

interface Category {
  id: string;
  name: string;
}

export default function ManualMenuManagementPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [categories, setCategories] = useState<Category[]>([
    { id: 'cat-1', name: 'Pizzas' },
    { id: 'cat-2', name: 'Beverages' },
    { id: 'cat-3', name: 'Sides & Desserts' },
  ]);

  const [items, setItems] = useState<MenuItem[]>([
    {
      id: 'item-1',
      category_id: 'cat-1',
      name: 'Margherita Pizza',
      description: 'Fresh mozzarella, San Marzano tomatoes, and organic basil.',
      price: 199,
      image_url: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=600&q=80',
      is_available: true,
    },
    {
      id: 'item-2',
      category_id: 'cat-1',
      name: 'Farmhouse Pizza',
      description: 'Crisp capsicum, red onion, button mushroom & sweet corn.',
      price: 249,
      image_url: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=600&q=80',
      is_available: true,
    },
    {
      id: 'item-3',
      category_id: 'cat-2',
      name: 'Classic Cold Coffee',
      description: 'Dark espresso whipped with cold milk and vanilla ice cream.',
      price: 120,
      image_url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80',
      is_available: true,
    },
  ]);

  // Form Modal States
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form Fields
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemPrice, setItemPrice] = useState<number | ''>('');
  const [itemCategoryId, setItemCategoryId] = useState('cat-1');
  const [itemImageUrl, setItemImageUrl] = useState('');
  const [itemAvailable, setItemAvailable] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Category Form Field
  const [newCatName, setNewCatName] = useState('');

  const openAddItemModal = () => {
    setEditingItem(null);
    setItemName('');
    setItemDescription('');
    setItemPrice('');
    setItemCategoryId(categories[0]?.id || 'cat-1');
    setItemImageUrl('');
    setItemAvailable(true);
    setIsItemModalOpen(true);
  };

  const openEditItemModal = (item: MenuItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemDescription(item.description);
    setItemPrice(item.price);
    setItemCategoryId(item.category_id);
    setItemImageUrl(item.image_url);
    setItemAvailable(item.is_available);
    setIsItemModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadingImage(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setItemImageUrl(reader.result as string);
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || itemPrice === '') return;

    if (editingItem) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === editingItem.id
            ? {
                ...i,
                name: itemName,
                description: itemDescription,
                price: Number(itemPrice),
                category_id: itemCategoryId,
                image_url: itemImageUrl || i.image_url,
                is_available: itemAvailable,
              }
            : i
        )
      );
    } else {
      const newItem: MenuItem = {
        id: `item-${Date.now()}`,
        category_id: itemCategoryId,
        name: itemName,
        description: itemDescription,
        price: Number(itemPrice),
        image_url:
          itemImageUrl ||
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
        is_available: itemAvailable,
      };
      setItems((prev) => [...prev, newItem]);
    }

    setIsItemModalOpen(false);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Delete this menu item?')) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const toggleAvailability = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, is_available: !i.is_available } : i))
    );
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const newCat: Category = { id: `cat-${Date.now()}`, name: newCatName.trim() };
    setCategories((prev) => [...prev, newCat]);
    setNewCatName('');
    setIsCatModalOpen(false);
  };

  const handleDeleteCategory = (catId: string) => {
    if (confirm('Delete this category and all its items?')) {
      setCategories((prev) => prev.filter((c) => c.id !== catId));
      setItems((prev) => prev.filter((i) => i.category_id !== catId));
    }
  };

  return (
    <DashboardLayout>
      <main className="p-6 md:p-10 max-w-6xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Manual Menu Management</h1>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Add, edit, or remove menu items and categories directly without AI.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setIsCatModalOpen(true)}
              className={`h-10 px-4 rounded-xl border font-semibold text-xs flex items-center gap-1.5 ${
                isDark ? 'border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              <FolderPlus className="w-4 h-4" /> Add Category
            </button>
            <button
              onClick={openAddItemModal}
              className="h-10 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 font-semibold text-xs text-white flex items-center gap-1.5 shadow-md shadow-orange-500/20"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
        </div>

        {/* Categories & Items List */}
        <div className="space-y-8">
          {categories.map((cat) => {
            const catItems = items.filter((i) => i.category_id === cat.id);
            return (
              <section key={cat.id} className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="flex items-center justify-between border-b pb-4 mb-4 border-slate-800">
                  <h2 className="text-lg font-bold text-orange-500 uppercase tracking-wider">{cat.name}</h2>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="text-slate-500 hover:text-red-400 text-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Category
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {catItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border flex items-start gap-4 ${
                        isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-16 h-16 rounded-lg object-cover border border-slate-700/50"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.name}</h3>
                          <span className="font-extrabold text-orange-600 dark:text-orange-500 text-sm">₹{item.price}</span>
                        </div>
                        <p className={`text-xs line-clamp-1 mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.description}</p>

                        <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-800">
                          <button
                            onClick={() => toggleAvailability(item.id)}
                            className={`text-xs font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                              item.is_available
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {item.is_available ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            {item.is_available ? 'Available' : 'Unavailable'}
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditItemModal(item)}
                              className="text-slate-400 hover:text-white p-1"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-slate-500 hover:text-red-400 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Add/Edit Item Modal */}
        {isItemModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl space-y-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between border-b pb-3 border-slate-800">
                <h3 className="font-bold text-lg">{editingItem ? 'Edit Menu Item' : 'Add New Item'}</h3>
                <button onClick={() => setIsItemModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveItem} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold mb-1">Item Name</label>
                  <input
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g. Margherita Pizza"
                    className={`w-full h-11 px-4 rounded-xl border focus:outline-none focus:border-orange-500 ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value ? Number(e.target.value) : '')}
                      placeholder="199"
                      className={`w-full h-11 px-4 rounded-xl border focus:outline-none focus:border-orange-500 ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">Category</label>
                    <select
                      value={itemCategoryId}
                      onChange={(e) => setItemCategoryId(e.target.value)}
                      className={`w-full h-11 px-3 rounded-xl border focus:outline-none focus:border-orange-500 ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Description</label>
                  <textarea
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    placeholder="Item ingredients and details..."
                    className={`w-full p-3 rounded-xl border h-20 focus:outline-none focus:border-orange-500 ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
                  />
                </div>

                {/* Cloudinary Image Upload */}
                <div>
                  <label className="block text-xs font-semibold mb-1">Food Image</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-orange-500 file:text-white hover:file:bg-orange-600"
                    />
                    {itemImageUrl && (
                      <img src={itemImageUrl} alt="Preview" className="w-10 h-10 rounded-lg object-cover border" />
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="available"
                    checked={itemAvailable}
                    onChange={(e) => setItemAvailable(e.target.checked)}
                    className="w-4 h-4 accent-orange-500"
                  />
                  <label htmlFor="available" className="text-xs font-medium cursor-pointer">Available for ordering</label>
                </div>

                <button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600 font-bold text-white shadow-md shadow-orange-500/20"
                >
                  Save Menu Item
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Add Category Modal */}
        {isCatModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`w-full max-w-sm p-6 rounded-3xl border shadow-2xl space-y-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between border-b pb-3 border-slate-800">
                <h3 className="font-bold text-base">Add New Category</h3>
                <button onClick={() => setIsCatModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddCategory} className="space-y-4">
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Desserts"
                  className={`w-full h-11 px-4 rounded-xl border focus:outline-none focus:border-orange-500 text-sm ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'}`}
                />
                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-orange-500 hover:bg-orange-600 font-bold text-white text-xs shadow-md shadow-orange-500/20"
                >
                  Create Category
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}
