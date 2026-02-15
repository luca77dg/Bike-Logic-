
import React, { useState, useEffect } from 'react';
import { WishlistItem, WishlistCategory } from '../types.ts';
import { supabaseService } from '../services/supabase.ts';

const CATEGORIES: { name: WishlistCategory; icon: string; color: string }[] = [
  { name: 'Abbigliamento', icon: 'fa-shirt', color: 'text-purple-400' },
  { name: 'Componente', icon: 'fa-gear', color: 'text-blue-400' },
  { name: 'Luci', icon: 'fa-lightbulb', color: 'text-yellow-400' },
  { name: 'Nutrizione', icon: 'fa-bolt', color: 'text-emerald-400' },
  { name: 'Gadget', icon: 'fa-watch', color: 'text-pink-400' },
  { name: 'Altro', icon: 'fa-box', color: 'text-slate-400' },
];

export const WishlistManager: React.FC = () => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filterPurchased, setFilterPurchased] = useState<'all' | 'pending' | 'bought'>('pending');

  // Form State
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState<WishlistCategory>('Altro');
  const [newPrice, setNewPrice] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    const data = await supabaseService.getWishlist();
    setItems(data);
    setLoading(false);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsSaving(true);
    const item: WishlistItem = {
      id: crypto.randomUUID(),
      user_id: '',
      name: newName,
      category: newCat,
      is_purchased: false,
      price_estimate: newPrice ? parseFloat(newPrice) : undefined,
      product_url: newUrl || undefined,
      notes: newNotes || undefined,
      created_at: new Date().toISOString()
    };
    await supabaseService.saveWishlistItem(item);
    setNewName('');
    setNewPrice('');
    setNewUrl('');
    setNewNotes('');
    setShowAdd(false);
    setIsSaving(false);
    loadItems();
  };

  const togglePurchased = async (item: WishlistItem) => {
    const updated = { ...item, is_purchased: !item.is_purchased };
    await supabaseService.saveWishlistItem(updated);
    loadItems();
  };

  const removeItem = async (id: string) => {
    if (confirm("Rimuovere questo elemento?")) {
      await supabaseService.deleteWishlistItem(id);
      loadItems();
    }
  };

  const filteredItems = items.filter(i => {
    if (filterPurchased === 'pending') return !i.is_purchased;
    if (filterPurchased === 'bought') return i.is_purchased;
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-white">Wishlist</h2>
          <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mt-1">Shopping & Accessories</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-blue-600 hover:bg-blue-500 text-white h-12 w-12 rounded-2xl shadow-lg flex items-center justify-center transition-all active:scale-95"
        >
          <i className={`fa-solid ${showAdd ? 'fa-xmark' : 'fa-plus'}`}></i>
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAddItem} className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] space-y-6 shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest">Aggiungi Desiderio</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1">Cosa vuoi comprare?</label>
                <input 
                  required value={newName} onChange={e => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-1 ring-blue-500"
                  placeholder="Es: Luci LED Garmin, Salopette..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1">Categoria</label>
                <select 
                  value={newCat} onChange={e => setNewCat(e.target.value as WishlistCategory)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm outline-none appearance-none"
                >
                  {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1">Prezzo (€)</label>
                <input 
                  type="number" step="0.01" value={newPrice} onChange={e => setNewPrice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm outline-none"
                  placeholder="99.00"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1">URL Prodotto</label>
                <input 
                  value={newUrl} onChange={e => setNewUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm outline-none"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
          <button 
            type="submit" disabled={isSaving}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-900/20 transition-all uppercase tracking-widest text-xs"
          >
            {isSaving ? 'Salvataggio...' : 'Aggiungi alla lista'}
          </button>
        </form>
      )}

      <div className="flex gap-2 p-1 bg-slate-900 rounded-2xl border border-slate-800 w-fit">
        {[
          { id: 'pending', label: 'Da Comprare' },
          { id: 'bought', label: 'Acquistati' },
          { id: 'all', label: 'Tutti' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setFilterPurchased(tab.id as any)}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${filterPurchased === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center"><i className="fa-solid fa-spinner fa-spin text-2xl text-blue-500"></i></div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredItems.map(item => {
            const cat = CATEGORIES.find(c => c.name === item.category) || CATEGORIES[5];
            return (
              <div 
                key={item.id} 
                className={`p-6 bg-slate-900/50 border border-slate-800 rounded-3xl group hover:border-blue-500/30 transition-all flex flex-col relative overflow-hidden ${item.is_purchased ? 'opacity-60' : ''}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center border border-slate-800 ${cat.color}`}>
                      <i className={`fa-solid ${cat.icon}`}></i>
                    </div>
                    <div>
                      <h4 className={`font-black text-white leading-tight ${item.is_purchased ? 'line-through decoration-blue-500' : ''}`}>{item.name}</h4>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.category}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => togglePurchased(item)}
                    className={`h-10 w-10 rounded-full flex items-center justify-center border transition-all ${item.is_purchased ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950 border-slate-700 text-slate-600 hover:text-blue-400'}`}
                  >
                    <i className="fa-solid fa-check"></i>
                  </button>
                </div>

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-800/50">
                  <div className="flex items-center gap-4">
                    {item.price_estimate && (
                      <span className="text-sm font-black text-emerald-400">€{item.price_estimate.toLocaleString()}</span>
                    )}
                    {item.product_url && (
                      <a href={item.product_url} target="_blank" rel="noopener" className="text-slate-500 hover:text-blue-400 transition-colors">
                        <i className="fa-solid fa-link text-xs"></i>
                      </a>
                    )}
                  </div>
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <i className="fa-solid fa-trash-can text-xs"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-900/30 rounded-[3rem] border-2 border-dashed border-slate-800">
          <i className="fa-solid fa-basket-shopping text-4xl text-slate-800 mb-4 block"></i>
          <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Lista vuota</p>
        </div>
      )}
    </div>
  );
};
