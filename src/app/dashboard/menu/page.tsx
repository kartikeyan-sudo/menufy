'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  FolderPlus,
  RefreshCw,
  Loader2,
  Code,
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

const DEFAULT_RESTAURANT_ID = '11111111-1111-1111-1111-111111111111';

export default function ManualMenuManagementPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Modal States
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemPrice, setItemPrice] = useState<number | ''>('');
  const [itemCategoryId, setItemCategoryId] = useState('');
  const [itemImageUrl, setItemImageUrl] = useState('');
  const [itemAvailable, setItemAvailable] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Category Form Field
  const [newCatName, setNewCatName] = useState('');

  // JSON Import States
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [importingJson, setImportingJson] = useState(false);

  // Load menu data from API
  const fetchMenu = useCallback(async () => {
    try {
      const res = await fetch(`/api/menu?restaurant_id=${DEFAULT_RESTAURANT_ID}`);
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
        setItems(
          (data.items || []).map((i: any) => ({
            id: i.id,
            category_id: i.category_id,
            name: i.name,
            description: i.description || '',
            price: Number(i.price),
            image_url: i.image_url || '',
            is_available: i.is_available !== false,
          }))
        );
      }
    } catch (err) {
      console.error('Failed to fetch menu:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const openAddItemModal = () => {
    setEditingItem(null);
    setItemName('');
    setItemDescription('');
    setItemPrice('');
    setItemCategoryId(categories[0]?.id || '');
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

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || itemPrice === '' || !itemCategoryId) return;
    setSaving(true);

    try {
      if (editingItem) {
        // PATCH existing item
        const res = await fetch('/api/menu', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'item',
            id: editingItem.id,
            name: itemName,
            description: itemDescription,
            price: Number(itemPrice),
            category_id: itemCategoryId,
            image_url: itemImageUrl || editingItem.image_url,
            is_available: itemAvailable,
          }),
        });
        const data = await res.json();
        if (data.success) {
          await fetchMenu();
        } else {
          alert(data.error || 'Failed to update item');
        }
      } else {
        // POST new item
        const res = await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'item',
            restaurant_id: DEFAULT_RESTAURANT_ID,
            category_id: itemCategoryId,
            name: itemName,
            description: itemDescription,
            price: Number(itemPrice),
            image_url:
              itemImageUrl ||
              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
            is_available: itemAvailable,
          }),
        });
        const data = await res.json();
        if (data.success) {
          await fetchMenu();
        } else {
          alert(data.error || 'Failed to add item');
        }
      }
    } catch (err) {
      console.error('Save item error:', err);
      alert('Failed to save item. Please try again.');
    } finally {
      setSaving(false);
      setIsItemModalOpen(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Delete this menu item?')) return;
    try {
      const res = await fetch(`/api/menu?type=item&id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await fetchMenu();
      } else {
        alert(data.error || 'Failed to delete item');
      }
    } catch (err) {
      console.error('Delete item error:', err);
    }
  };

  const toggleAvailability = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    // Optimistic UI update
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, is_available: !i.is_available } : i)));

    try {
      await fetch('/api/menu', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'item',
          id,
          is_available: !item.is_available,
        }),
      });
    } catch (err) {
      // Revert on error
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, is_available: item.is_available } : i)));
      console.error('Toggle availability error:', err);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setSaving(true);

    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'category',
          restaurant_id: DEFAULT_RESTAURANT_ID,
          name: newCatName.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchMenu();
      } else {
        alert(data.error || 'Failed to add category');
      }
    } catch (err) {
      console.error('Add category error:', err);
    } finally {
      setSaving(false);
      setNewCatName('');
      setIsCatModalOpen(false);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!confirm('Delete this category and all its items?')) return;
    try {
      const res = await fetch(`/api/menu?type=category&id=${catId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await fetchMenu();
      } else {
        alert(data.error || 'Failed to delete category');
      }
    } catch (err) {
      console.error('Delete category error:', err);
    }
  };

  const handleImportJson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jsonInput.trim()) return;
    setImportingJson(true);

    try {
      let parsedData;
      try {
        parsedData = JSON.parse(jsonInput);
      } catch (err) {
        alert('Invalid JSON format. Please check your query.');
        setImportingJson(false);
        return;
      }

      if (!parsedData.categories || !Array.isArray(parsedData.categories)) {
        alert('JSON must contain a "categories" array.');
        setImportingJson(false);
        return;
      }

      const res = await fetch('/api/menu/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: DEFAULT_RESTAURANT_ID,
          data: parsedData,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Menu imported successfully!');
        setJsonInput('');
        setIsJsonModalOpen(false);
        await fetchMenu();
      } else {
        alert(data.error || 'Failed to import menu');
      }
    } catch (err) {
      console.error('Import JSON error:', err);
      alert('Failed to import JSON. Please try again.');
    } finally {
      setImportingJson(false);
    }
  };

  return (
    <DashboardLayout>
      <main className="p-6 md:p-10 max-w-6xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Manual Menu Management</h1>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Add, edit, or remove menu items and categories. Changes sync to your live customer menu instantly.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => fetchMenu()}
              className={`h-10 px-3 rounded-xl border font-semibold text-xs flex items-center gap-1.5 ${
                isDark ? 'border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button
              onClick={() => setIsJsonModalOpen(true)}
              className={`h-10 px-3 rounded-xl border font-semibold text-xs flex items-center gap-1.5 ${
                isDark ? 'border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Code className="w-4 h-4" /> Import JSON
            </button>
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

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            <span className="ml-3 text-sm text-slate-500">Loading menu...</span>
          </div>
        ) : categories.length === 0 ? (
          <div className={`text-center py-16 border rounded-2xl ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
            <FolderPlus className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
            <p className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>No categories yet</p>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Create your first category to start adding menu items.</p>
            <button
              onClick={() => setIsCatModalOpen(true)}
              className="mt-4 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs"
            >
              + Add First Category
            </button>
          </div>
        ) : (
          /* Categories & Items List */
          <div className="space-y-8">
            {categories.map((cat) => {
              const catItems = items.filter((i) => i.category_id === cat.id);
              return (
                <section key={cat.id} className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className={`flex items-center justify-between border-b pb-4 mb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                    <h2 className="text-lg font-bold text-orange-500 uppercase tracking-wider">{cat.name} ({catItems.length})</h2>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-slate-500 hover:text-red-400 text-xs flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Category
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {catItems.length === 0 ? (
                      <div className="col-span-full py-4 text-center text-xs text-slate-500">No items in this category. Click "Add Item" to add one.</div>
                    ) : (
                      catItems.map((item) => (
                        <div
                          key={item.id}
                          className={`p-4 rounded-xl border flex items-start gap-4 ${
                            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          {item.image_url && (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-16 h-16 rounded-lg object-cover border border-slate-700/50"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.name}</h3>
                              <span className="font-extrabold text-orange-500 text-sm">₹{item.price}</span>
                            </div>
                            <p className={`text-xs line-clamp-1 mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.description}</p>

                            <div className={`flex items-center justify-between gap-2 mt-3 pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
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
                                  className={`p-1 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
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
                      ))
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* Add/Edit Item Modal */}
        {isItemModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl space-y-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
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
                  disabled={saving}
                  className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600 font-bold text-white shadow-md shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Menu Item'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Add Category Modal */}
        {isCatModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`w-full max-w-sm p-6 rounded-3xl border shadow-2xl space-y-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
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
                  disabled={saving}
                  className="w-full h-11 rounded-xl bg-orange-500 hover:bg-orange-600 font-bold text-white text-xs shadow-md shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Create Category'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* JSON Import Modal */}
        {isJsonModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`w-full max-w-2xl p-6 rounded-3xl border shadow-2xl space-y-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <h3 className="font-bold text-lg">Import Menu via JSON</h3>
                <button onClick={() => setIsJsonModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                <form onSubmit={handleImportJson} className="flex-1 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold mb-2">JSON Query</label>
                    <textarea
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      placeholder="Paste your JSON here..."
                      className={`w-full p-4 rounded-xl border h-64 font-mono text-xs focus:outline-none focus:border-orange-500 ${isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-300 text-slate-700'}`}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={importingJson}
                    className="w-full h-11 rounded-xl bg-orange-500 hover:bg-orange-600 font-bold text-white text-xs shadow-md shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {importingJson ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</> : 'Import Menu'}
                  </button>
                </form>

                <div className={`flex-1 p-4 rounded-xl border ${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <h4 className="text-xs font-bold text-orange-500 mb-2 uppercase tracking-wider">Example Format</h4>
                  <pre className={`text-[10px] sm:text-xs overflow-x-auto p-3 rounded-lg font-mono ${isDark ? 'bg-slate-900 text-slate-400' : 'bg-white text-slate-600 border'}`}>
{`{
  "categories": [
    {
      "name": "Pizzas",
      "items": [
        {
          "name": "Margherita Pizza",
          "price": 199,
          "description": "Fresh tomato sauce & mozzarella",
          "image_url": "https://example.com/pizza.jpg",
          "is_available": true
        }
      ]
    }
  ]
}`}
                  </pre>
                  <p className={`mt-4 text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    Provide an object with a <code className="font-bold">categories</code> array. Each category must have a <code className="font-bold">name</code> and an <code className="font-bold">items</code> array.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}
