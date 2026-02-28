
import { createClient } from '@supabase/supabase-js';
import { Bike, MaintenanceRecord, MaintenanceHistory, WishlistItem } from '../types.ts';

const supabaseUrl = (
  (import.meta as any).env?.VITE_SUPABASE_URL || 
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL || 
  ''
).trim();

const supabaseAnonKey = (
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY || 
  ''
).trim();

const SHARED_USER_ID = 'bikelogic_global_user';

export const supabase = (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const handleSupabaseError = (err: any, tableName: string) => {
  if (err.message?.includes("Could not find the table") || err.code === "PGRST116") {
    const msg = `ERRORE DATABASE: La tabella '${tableName}' non esiste su Supabase. \n\nEsegui il codice SQL fornito nel file 'supabase_schema.sql' per attivarla.`;
    console.error(msg);
    alert(msg);
  }
  throw err;
};

export const supabaseService = {
  isConfigured: () => !!supabase,

  getBikes: async (): Promise<Bike[]> => {
    if (!supabase) {
      const local = localStorage.getItem('bikelogic_bikes');
      return local ? JSON.parse(local) : [];
    }
    try {
      const { data, error } = await supabase
        .from('bikes')
        .select('*')
        .eq('user_id', SHARED_USER_ID)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) localStorage.setItem('bikelogic_bikes', JSON.stringify(data));
      return data || [];
    } catch (err: any) {
      console.error("Cloud Fetch Bikes Error:", err.message);
      const local = localStorage.getItem('bikelogic_bikes');
      return local ? JSON.parse(local) : [];
    }
  },
  
  saveBike: async (bike: Bike): Promise<void> => {
    const bikeToSave = { ...bike, user_id: SHARED_USER_ID };
    const currentLocal = await supabaseService.getBikes();
    const newLocal = [...currentLocal.filter(b => b.id !== bike.id), bikeToSave];
    localStorage.setItem('bikelogic_bikes', JSON.stringify(newLocal));
    if (!supabase) return;
    try {
      const { error } = await supabase.from('bikes').upsert(bikeToSave, { onConflict: 'id' });
      if (error) throw error;
    } catch (err: any) {
      handleSupabaseError(err, 'bikes');
    }
  },

  getMaintenance: async (bikeId: string): Promise<MaintenanceRecord[]> => {
    if (!supabase) {
      const data = localStorage.getItem('bikelogic_maintenance');
      const all: MaintenanceRecord[] = data ? JSON.parse(data) : [];
      return all.filter(m => m.bike_id === bikeId);
    }
    try {
      const { data, error } = await supabase.from('maintenance').select('*').eq('bike_id', bikeId);
      if (error) throw error;
      return data || [];
    } catch {
      return [];
    }
  },

  saveMaintenance: async (record: MaintenanceRecord): Promise<void> => {
    const data = localStorage.getItem('bikelogic_maintenance');
    const all: MaintenanceRecord[] = data ? JSON.parse(data) : [];
    const newAll = [...all.filter(r => r.id !== record.id), record];
    localStorage.setItem('bikelogic_maintenance', JSON.stringify(newAll));
    if (!supabase) return;
    try {
      const { error } = await supabase.from('maintenance').upsert(record, { onConflict: 'id' });
      if (error) throw error;
    } catch (err: any) {
      handleSupabaseError(err, 'maintenance');
    }
  },

  deleteMaintenance: async (id: string): Promise<void> => {
    const data = localStorage.getItem('bikelogic_maintenance');
    if (data) {
      const all: MaintenanceRecord[] = JSON.parse(data);
      localStorage.setItem('bikelogic_maintenance', JSON.stringify(all.filter(r => r.id !== id)));
    }
    if (!supabase) return;
    try {
      const { error } = await supabase.from('maintenance').delete().eq('id', id);
      if (error) throw error;
    } catch (err: any) {
      handleSupabaseError(err, 'maintenance');
    }
  },

  getHistory: async (bikeId: string): Promise<MaintenanceHistory[]> => {
    if (!supabase) {
      const data = localStorage.getItem('bikelogic_history');
      const all: MaintenanceHistory[] = data ? JSON.parse(data) : [];
      return all.filter(h => h.bike_id === bikeId).sort((a,b) => new Date(b.replacement_date).getTime() - new Date(a.replacement_date).getTime());
    }
    try {
      const { data, error } = await supabase
        .from('maintenance_history')
        .select('*')
        .eq('bike_id', bikeId)
        .order('replacement_date', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error("History Fetch Error:", err.message);
      const data = localStorage.getItem('bikelogic_history');
      const all: MaintenanceHistory[] = data ? JSON.parse(data) : [];
      return all.filter(h => h.bike_id === bikeId);
    }
  },

  saveHistoryRecord: async (record: MaintenanceHistory): Promise<void> => {
    const data = localStorage.getItem('bikelogic_history');
    const all: MaintenanceHistory[] = data ? JSON.parse(data) : [];
    const newAll = [...all.filter(h => h.id !== record.id), record];
    localStorage.setItem('bikelogic_history', JSON.stringify(newAll));
    if (!supabase) return;
    try {
      const { error } = await supabase.from('maintenance_history').upsert(record, { onConflict: 'id' });
      if (error) throw error;
    } catch (err: any) {
      handleSupabaseError(err, 'maintenance_history');
    }
  },

  deleteHistoryRecord: async (id: string): Promise<void> => {
    const data = localStorage.getItem('bikelogic_history');
    if (data) {
      const all: MaintenanceHistory[] = JSON.parse(data);
      localStorage.setItem('bikelogic_history', JSON.stringify(all.filter(h => h.id !== id)));
    }
    if (!supabase) return;
    try {
      const { error } = await supabase.from('maintenance_history').delete().eq('id', id);
      if (error) throw error;
    } catch (err: any) {
      handleSupabaseError(err, 'maintenance_history');
    }
  },

  // WISHLIST METHODS
  getWishlist: async (): Promise<WishlistItem[]> => {
    if (!supabase) {
      const data = localStorage.getItem('bikelogic_wishlist');
      return data ? JSON.parse(data) : [];
    }
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select('*')
        .eq('user_id', SHARED_USER_ID)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (err) {
      const data = localStorage.getItem('bikelogic_wishlist');
      return data ? JSON.parse(data) : [];
    }
  },

  saveWishlistItem: async (item: WishlistItem): Promise<void> => {
    const itemToSave = { ...item, user_id: SHARED_USER_ID };
    const current = await supabaseService.getWishlist();
    const newList = [...current.filter(i => i.id !== item.id), itemToSave];
    localStorage.setItem('bikelogic_wishlist', JSON.stringify(newList));
    if (!supabase) return;
    try {
      const { error } = await supabase.from('wishlist').upsert(itemToSave, { onConflict: 'id' });
      if (error) throw error;
    } catch (err) {
      handleSupabaseError(err, 'wishlist');
    }
  },

  deleteWishlistItem: async (id: string): Promise<void> => {
    const current = await supabaseService.getWishlist();
    localStorage.setItem('bikelogic_wishlist', JSON.stringify(current.filter(i => i.id !== id)));
    if (!supabase) return;
    try {
      await supabase.from('wishlist').delete().eq('id', id);
    } catch (err) {
      console.error("Delete wishlist error");
    }
  },

  deleteBike: async (id: string): Promise<void> => {
    const bikes = await supabaseService.getBikes();
    localStorage.setItem('bikelogic_bikes', JSON.stringify(bikes.filter(b => b.id !== id)));
    if (!supabase) return;
    await supabase.from('bikes').delete().eq('id', id);
  },

  getSetting: async (id: string): Promise<any> => {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('settings').select('value').eq('id', id).eq('user_id', SHARED_USER_ID).single();
      if (error) return null;
      return data?.value;
    } catch {
      return null;
    }
  },

  setSetting: async (id: string, value: any): Promise<void> => {
    if (!supabase) return;
    try {
      await supabase.from('settings').upsert({ id, value, user_id: SHARED_USER_ID, updated_at: new Date().toISOString() });
    } catch (err) {
      console.error("Set setting error:", err);
    }
  }
};
