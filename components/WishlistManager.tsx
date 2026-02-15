
import React, { useState, useEffect } from 'react';
import { WishlistItem, WishlistCategory } from '../types.ts';
import { supabaseService } from '../services/supabase.ts';
import { searchProductDeals } from '../services/gemini.ts';

const CATEGORIES: { name: WishlistCategory; icon: string; color: string }[] = [
  { name: 'Abbigliamento', icon: 'fa-shirt', color: 'text-purple-400' },
  { name: 'Caschi e occhiali', icon: 'fa-helmet-safety', color: 'text-blue-400' },
  { name: 'Scarpe', icon: 'fa-shoe-prints', color: 'text-orange-400' },
  { name: 'Accessori', icon: 'fa-watch', color: 'text-pink-400' },
  { name: 'Componenti', icon: 'fa-gear', color: 'text-slate-400' },
  { name: 'Manutenzione', icon: 'fa-screwdriver-wrench', color: 'text-yellow-400' },
  { name: 'Salute', icon: 'fa-heart-pulse', color: 'text-red-400' },
];

export const WishlistManager: React.FC = () => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [filterPurchased, setFilterPurchased] = useState<'all' | 'pending' | 'bought'>('pending');

  // AI Shopping State
  const [searchingId, setSearchingId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Record<string, { text: string, sources: {uri: string, title: string}[] }>>({});

  // Form State
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState<WishlistCategory>('Accessori');
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

  const handleSearchDeals = async (item: WishlistItem) => {
    setSearchingId(item.id);
    try {
      const result = await searchProductDeals(item.name);
      setSearchResults(prev => ({ ...prev, [item.id]: result }));
    } catch (err) {
      alert("Errore durante la ricerca dei prezzi. Verifica la tua chiave API.");
    } finally {
      setSearchingId(null);
    }
  };

  const resetForm = () => {
    setNewName('');
    setNewPrice('');
    setNewUrl('');
    setNewNotes('');
    setNewCat('Accessori');
    setEditingItem(null);
    setShowForm(false);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsSaving(true);
    
    const item: WishlistItem = {
      id: editingItem ? editingItem.id : crypto.randomUUID(),
      user_id: '',
      name: newName,
      category: newCat,
      is_purchased: editingItem ? editingItem.is_purchased : false,
      price_estimate: newPrice ? parseFloat(newPrice) : undefined,
      product_url: newUrl || undefined,
      notes: newNotes || undefined,
      created_at: editingItem ? editingItem.created_at : new Date().toISOString()
    };
    
    await supabaseService.saveWishlistItem(item);
    resetForm();
    setIsSaving(false);
    loadItems();
  };

  const startEdit = (item: WishlistItem) => {
    setEditingItem(item);
    setNewName(item.name);
    setNewCat(item.category);
    setNewPrice(item.price_estimate?.toString() || '');
    setNewUrl(item.product_url || '');
    setNewNotes(item.notes || '');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
          onClick={() => { if(showForm) resetForm(); else setShowForm(true); }}
          className="bg-blue-600 hover:bg-blue-500 text-white h-12 w-12 rounded-2xl shadow-lg flex items-center justify-center transition-all active:scale-95"
        >
          <i className={`fa-solid ${showForm ? 'fa-xmark' : 'fa-plus'}`}></i>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSaveItem} className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] space-y-6 shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest">
            {editingItem ? 'Modifica Elemento' : 'Aggiungi Desiderio'}
          </h3>
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
          <div className="flex gap-3">
             <button 
              type="button" onClick={resetForm}
              className="flex-1 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
            >
              Annulla
            </button>
            <button 
              type="submit" disabled={isSaving}
              className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-900/20 transition-all uppercase tracking-widest text-xs"
            >
              {isSaving ? 'Salvataggio...' : (editingItem ? 'Salva Modifiche' : 'Aggiungi alla lista')}
            </button>
          </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {filteredItems.map(item => {
            const cat = CATEGORIES.find(c => c.name === item.category) || CATEGORIES[3];
            const aiResult = searchResults[item.id];
            const isSearching = searchingId === item.id;

            return (
              <div 
                key={item.id} 
                className={`p-6 bg-slate-900/50 border border-slate-800 rounded-[2.5rem] group hover:border-blue-500/30 transition-all flex flex-col relative overflow-hidden ${item.is_purchased ? 'opacity-60' : ''}`}
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

                {/* AI SHOPPING SECTION */}
                {!item.is_purchased && (
                  <div className="mt-2 mb-4">
                    {aiResult ? (
                      <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-2 mb-2">
                          <i className="fa-solid fa-wand-magic-sparkles text-[10px] text-blue-400"></i>
                          <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Consigli Shopping AI</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed mb-3">{aiResult.text}</p>
                        {aiResult.sources.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {aiResult.sources.slice(0, 3).map((source, sidx) => (
                              <a 
                                key={sidx} 
                                href={source.uri} 
                                target="_blank" 
                                rel="noopener"
                                className="text-[9px] font-black bg-blue-600/20 text-blue-300 px-3 py-1.5 rounded-lg border border-blue-500/30 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2"
                              >
                                <i className="fa-solid fa-cart-shopping"></i>
                                {source.title.length > 15 ? 'Vedi Offerta' : source.title}
                              </a>
                            ))}
                          </div>
                        )}
                        <button 
                          onClick={() => handleSearchDeals(item)}
                          className="mt-3 text-[8px] font-black text-slate-500 hover:text-blue-400 uppercase tracking-widest flex items-center gap-1"
                        >
                          <i className="fa-solid fa-arrows-rotate"></i> Aggiorna prezzi
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleSearchDeals(item)}
                        disabled={isSearching}
                        className="w-full bg-slate-950 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 py-3 rounded-2xl flex items-center justify-center gap-3 transition-all group/ai"
                      >
                        {isSearching ? (
                          <i className="fa-solid fa-spinner fa-spin text-blue-500"></i>
                        ) : (
                          <i className="fa-solid fa-magnifying-glass-dollar text-slate-600 group-hover/ai:text-blue-400 transition-colors"></i>
                        )}
                        <span className="text-[10px] font-black text-slate-500 group-hover/ai:text-white uppercase tracking-widest transition-colors">
                          {isSearching ? 'Ricerca prezzi...' : 'Trova Offerte AI'}
                        </span>
                      </button>
                    )}
                  </div>
                )}

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
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => startEdit(item)}
                      className="text-slate-600 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all h-8 w-8 flex items-center justify-center rounded-lg bg-slate-800/50"
                      title="Modifica"
                    >
                      <i className="fa-solid fa-pen text-[10px]"></i>
                    </button>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all h-8 w-8 flex items-center justify-center rounded-lg bg-slate-800/50"
                      title="Elimina"
                    >
                      <i className="fa-solid fa-trash-can text-[10px]"></i>
                    </button>
                  </div>
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
