'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import {
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  ArrowRight,
  Plus,
  Trash2,
  Edit3,
  Check,
  Building2,
  ExternalLink,
  Download,
} from 'lucide-react';
import { AIMenuExtractionResult, ExtractedCategory, ExtractedMenuItem } from '@/types/database';
import { Navbar } from '@/components/Navbar';
import { useTheme } from '@/context/ThemeContext';

export default function OnboardingPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1 State
  const [restaurantName, setRestaurantName] = useState('Sharma Cafe');
  const [slug, setSlug] = useState('sharma-cafe');
  const [description, setDescription] = useState('Authentic Italian & Continental Delights');

  // Step 2 State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

  // Step 3 AI State
  const [aiProgress, setAiProgress] = useState(0);
  const [aiStatusMessage, setAiStatusMessage] = useState('Uploading menu images...');

  // Step 4 Verification State
  const [extractedData, setExtractedData] = useState<AIMenuExtractionResult>({
    categories: [
      {
        name: 'Pizzas',
        items: [
          { name: 'Margherita Pizza', description: 'Fresh tomato sauce, mozzarella & basil', price: 199, confidence: 'high' },
          { name: 'Farmhouse Pizza', description: 'Onion, capsicum, mushroom & fresh veggies', price: 249, confidence: 'high' },
          { name: 'Chef Special Pasta', description: 'Creamy Alfredo white sauce pasta with garlic bread', price: null, confidence: 'low' },
        ],
      },
      {
        name: 'Beverages',
        items: [
          { name: 'Classic Cold Coffee', description: 'Thick espresso blended with cream and chocolate sauce', price: 120, confidence: 'high' },
          { name: 'Fresh Lime Soda', description: 'Sparkling soda with fresh lime juice', price: 80, confidence: 'high' },
        ],
      },
    ],
  });

  const handleNameChange = (val: string) => {
    setRestaurantName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);

      const previews: string[] = [];
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          previews.push(reader.result as string);
          if (previews.length === files.length) {
            setFilePreviews(previews);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const startAIExtraction = async () => {
    setStep(3);
    setAiProgress(20);
    setAiStatusMessage('Reading menu images with Gemini AI...');

    try {
      if (filePreviews.length > 0) {
        const res = await fetch('/api/menu/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images: filePreviews }),
        });
        const data = await res.json();
        if (data.success && data.data) {
          setExtractedData(data.data);
        }
      }
    } catch (err) {
      console.warn('Using default demo menu extraction payload:', err);
    }

    // Simulate progress sequence
    setTimeout(() => { setAiProgress(50); setAiStatusMessage('Extracting items and pricing details...'); }, 1000);
    setTimeout(() => { setAiProgress(80); setAiStatusMessage('Organizing categories and preparing review...'); }, 2000);
    setTimeout(() => { setAiProgress(100); setStep(4); }, 2800);
  };

  const updateItemPrice = (catIndex: number, itemIndex: number, newPrice: number | null) => {
    const next = { ...extractedData };
    next.categories[catIndex].items[itemIndex].price = newPrice;
    next.categories[catIndex].items[itemIndex].confidence = 'high';
    setExtractedData(next);
  };

  const deleteItem = (catIndex: number, itemIndex: number) => {
    const next = { ...extractedData };
    next.categories[catIndex].items.splice(itemIndex, 1);
    setExtractedData(next);
  };

  const addItem = (catIndex: number) => {
    const next = { ...extractedData };
    next.categories[catIndex].items.push({
      name: 'New Item',
      description: 'Item description',
      price: 150,
      confidence: 'high',
    });
    setExtractedData(next);
  };

  const publicMenuUrl = typeof window !== 'undefined' ? `${window.location.origin}/menu/${slug}` : `http://localhost:3000/menu/${slug}`;

  return (
    <div className={`min-h-screen flex flex-col justify-between transition-colors duration-300 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Top Navbar with Hamburger */}
      <Navbar />

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12 w-full flex-1">
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-bold text-orange-600 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
            Step {step} of 5
          </span>
        </div>

        {/* Step 1: Restaurant Info */}
        {step === 1 && (
          <div className={`border rounded-2xl p-6 sm:p-8 ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 mb-6">
              <Building2 className="w-6 h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Welcome to Menufy</h2>
            <p className={`text-sm mb-8 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Let's create your digital menu. Start by giving us your restaurant details.
            </p>

            <div className="space-y-6">
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Restaurant Name</label>
                <input
                  type="text"
                  value={restaurantName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={`w-full h-12 px-4 rounded-xl text-base font-semibold border focus:outline-none focus:border-orange-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  placeholder="e.g. Sharma Cafe"
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Dynamic QR Menu URL Slug</label>
                <div className={`flex items-center border rounded-xl px-4 h-12 text-sm ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-300 text-slate-600'
                }`}>
                  <span className="font-mono text-slate-500">menufy.com/menu/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="bg-transparent font-mono font-semibold focus:outline-none flex-1 ml-1"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Short Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full p-4 rounded-xl text-sm h-24 border focus:outline-none focus:border-orange-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  placeholder="e.g. Delicious wood-fired pizzas and artisanal coffee"
                />
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!restaurantName.trim()}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-bold text-white flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all"
              >
                Continue to Menu Upload
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Upload Photos/PDF */}
        {step === 2 && (
          <div className={`border rounded-2xl p-6 sm:p-8 ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 mb-6">
              <Upload className="w-6 h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Upload Your Physical Menu</h2>
            <p className={`text-sm mb-8 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Upload photos or PDFs of your existing menu. Gemini AI will automatically extract all items and prices.
            </p>

            <div className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all relative mb-6 ${
              isDark
                ? 'border-slate-800 hover:border-orange-500/50 bg-slate-950/60'
                : 'border-slate-300 hover:border-orange-500/50 bg-slate-50'
            }`}>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-10 h-10 text-orange-500 mx-auto mb-4" />
              <p className="text-base font-bold mb-1">Click or drag photos/PDFs here</p>
              <p className="text-xs text-slate-500">Supports JPG, PNG, WEBP, or multi-page PDF</p>
            </div>

            {/* Previews */}
            {filePreviews.length > 0 && (
              <div className="mb-8">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Selected Menu Pages ({filePreviews.length})
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {filePreviews.map((src, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 relative">
                      <img src={src} alt={`Menu page ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className={`h-12 px-6 rounded-xl border font-semibold text-sm ${
                  isDark ? 'border-slate-800 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Back
              </button>
              <button
                onClick={startAIExtraction}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-bold text-white flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
              >
                <Sparkles className="w-5 h-5" />
                Process Menu with AI
              </button>
            </div>
          </div>
        )}

        {/* Step 3: AI Processing Screen */}
        {step === 3 && (
          <div className={`border rounded-2xl p-8 text-center max-w-lg mx-auto ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-lg'
          }`}>
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 mx-auto mb-6 animate-pulse">
              <Sparkles className="w-8 h-8 animate-spin" />
            </div>

            <h2 className="text-2xl font-bold mb-2">Reading Your Menu</h2>
            <p className={`text-sm mb-8 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{aiStatusMessage}</p>

            <div className="w-full bg-slate-200 dark:bg-slate-950 rounded-full h-3 mb-8 overflow-hidden border border-slate-300 dark:border-slate-800">
              <div
                className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${aiProgress}%` }}
              />
            </div>

            <div className="space-y-3 text-left max-w-xs mx-auto text-sm">
              <div className="flex items-center gap-2 text-emerald-600 font-medium">
                <CheckCircle2 className="w-4 h-4" /> Upload complete
              </div>
              <div className="flex items-center gap-2 text-emerald-600 font-medium">
                <CheckCircle2 className="w-4 h-4" /> Gemini AI processing active
              </div>
              <div className="flex items-center gap-2 text-amber-600 font-medium animate-pulse">
                <Sparkles className="w-4 h-4" /> Extracting categories & items
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Human Review Screen */}
        {step === 4 && (
          <div className="space-y-6">
            <div className={`border rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div>
                <div className="inline-flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">
                  <CheckCircle2 className="w-4 h-4" /> AI Extraction Complete
                </div>
                <h2 className="text-2xl font-bold">Review Your Menu</h2>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Please verify prices and item details detected by AI before publishing.
                </p>
              </div>
              <button
                onClick={() => setStep(5)}
                className="h-12 px-6 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-bold text-white flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
              >
                Publish Menu
                <Check className="w-5 h-5" />
              </button>
            </div>

            {/* Categories & Items Review Table */}
            {extractedData.categories.map((cat, catIdx) => (
              <div key={catIdx} className={`border rounded-2xl p-6 ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-lg font-extrabold text-orange-600 uppercase tracking-wider">
                    {cat.name}
                  </h3>
                  <button
                    onClick={() => addItem(catIdx)}
                    className="text-xs font-bold text-orange-600 bg-orange-500/10 hover:bg-orange-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Item
                  </button>
                </div>

                <div className="space-y-4">
                  {cat.items.map((item, itemIdx) => (
                    <div
                      key={itemIdx}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                        isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => {
                              const next = { ...extractedData };
                              next.categories[catIdx].items[itemIdx].name = e.target.value;
                              setExtractedData(next);
                            }}
                            className="bg-transparent font-bold text-sm focus:outline-none focus:border-b border-orange-500"
                          />
                          {item.price === null || item.confidence === 'low' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/20 text-amber-600 border border-amber-500/30 px-2 py-0.5 rounded-md">
                              <AlertTriangle className="w-3 h-3" /> Needs Review
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                              <CheckCircle2 className="w-3 h-3" /> Verified
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={item.description || ''}
                          onChange={(e) => {
                            const next = { ...extractedData };
                            next.categories[catIdx].items[itemIdx].description = e.target.value;
                            setExtractedData(next);
                          }}
                          className="w-full bg-transparent text-xs text-slate-500 focus:outline-none focus:border-b border-slate-400"
                          placeholder="Description..."
                        />
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between">
                        <div className={`flex items-center gap-1 border rounded-lg px-3 py-1.5 ${
                          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
                        }`}>
                          <span className="text-orange-500 font-bold text-sm">₹</span>
                          <input
                            type="number"
                            value={item.price ?? ''}
                            onChange={(e) =>
                              updateItemPrice(catIdx, itemIdx, e.target.value ? parseFloat(e.target.value) : null)
                            }
                            placeholder="Price"
                            className="w-20 bg-transparent font-bold text-sm focus:outline-none text-slate-900 dark:text-white"
                          />
                        </div>

                        <button
                          onClick={() => deleteItem(catIdx, itemIdx)}
                          className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 5: Publish & QR Code View */}
        {step === 5 && (
          <div className={`border rounded-2xl p-8 text-center max-w-xl mx-auto ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xl'
          }`}>
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-3xl font-bold mb-2">Your Menu is Live!</h2>
            <p className={`text-sm mb-8 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Customers can scan your QR code to instantly view and order from <span className="font-bold">{restaurantName}</span>.
            </p>

            {/* QR Code Container */}
            <div className="p-6 bg-white border border-slate-200 rounded-2xl inline-block shadow-2xl mb-6">
              <QRCodeSVG value={publicMenuUrl} size={200} level="H" includeMargin={true} />
            </div>

            <div className={`border rounded-xl p-3 flex items-center justify-between gap-2 mb-8 text-xs font-mono ${
              isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-300 text-slate-700'
            }`}>
              <span className="truncate">{publicMenuUrl}</span>
              <Link
                href={`/menu/${slug}`}
                target="_blank"
                className="text-orange-600 hover:underline font-sans font-bold flex items-center gap-1"
              >
                Test Menu <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href={`/menu/${slug}`}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-bold text-white flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
              >
                Open Digital Menu
              </Link>
              <Link
                href="/dashboard"
                className={`flex-1 h-12 rounded-xl border font-bold flex items-center justify-center gap-2 ${
                  isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-200' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                }`}
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={`border-t py-4 text-center text-xs ${isDark ? 'border-slate-800/60 text-slate-500' : 'border-slate-200 text-slate-600 bg-white'}`}>
        Menufy SaaS — AI Menu Extraction & Dynamic QR Ordering
      </footer>
    </div>
  );
}
