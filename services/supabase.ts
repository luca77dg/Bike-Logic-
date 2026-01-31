
import { createClient } from '@supabase/supabase-js';
import { Bike, MaintenanceRecord } from '../types.ts';

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
      console.error("Cloud Fetch Error:", err.message);
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
      console.error("Cloud Save Error:", err.message);
      throw err;
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
      console.error("Maint Cloud Error:", err.message);
      throw err;
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
      console.error("Delete Maint Error:", err.message);
      throw err;
    }
  },

  deleteBike: async (id: string): Promise<void> => {
    const bikes = await supabaseService.getBikes();
    localStorage.setItem('bikelogic_bikes', JSON.stringify(bikes.filter(b => b.id !== id)));
    if (!supabase) return;
    await supabase.from('bikes').delete().eq('id', id);
  }
};
