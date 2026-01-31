
import { createClient } from '@supabase/supabase-js';
import { Bike, MaintenanceRecord } from '../types.ts';

// Vercel/Vite/Browser environment detection
// Cerchiamo le variabili in tutti i posti possibili dove Vercel o il bundler potrebbero metterle
const supabaseUrl = (
  process.env.SUPABASE_URL || 
  (window as any).process?.env?.SUPABASE_URL ||
  ''
).trim();

const supabaseAnonKey = (
  process.env.SUPABASE_ANON_KEY || 
  (window as any).process?.env?.SUPABASE_ANON_KEY ||
  ''
).trim();

// DEBUG LOG (Visibile nella console del browser F12)
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("BIKELOGIC DEBUG: Variabili Supabase mancanti!", { 
    urlFound: !!supabaseUrl, 
    keyFound: !!supabaseAnonKey 
  });
} else {
  console.log("BIKELOGIC DEBUG: Connessione Cloud inizializzata correttamente.");
}

const SHARED_USER_ID = 'bikelogic_global_user';

export const supabase = (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'undefined') 
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
      return data || [];
    } catch (err: any) {
      console.error("Errore fetch bikes cloud:", err.message);
      // Fallback su local se il cloud fallisce
      const local = localStorage.getItem('bikelogic_bikes');
      return local ? JSON.parse(local) : [];
    }
  },
  
  saveBike: async (bike: Bike): Promise<void> => {
    const bikeToSave = {
      ...bike,
      user_id: SHARED_USER_ID
    };

    if (!supabase) {
      const bikes = await supabaseService.getBikes();
      const index = bikes.findIndex(b => b.id === bike.id);
      if (index > -1) bikes[index] = bikeToSave; else bikes.push(bikeToSave);
      localStorage.setItem('bikelogic_bikes', JSON.stringify(bikes));
      return;
    }

    const { error } = await supabase
      .from('bikes')
      .upsert(bikeToSave, { onConflict: 'id' });

    if (error) {
      console.error("Errore salvataggio cloud:", error.message);
      throw error;
    }
  },

  getMaintenance: async (bikeId: string): Promise<MaintenanceRecord[]> => {
    if (!supabase) {
      const data = localStorage.getItem('bikelogic_maintenance');
      const all: MaintenanceRecord[] = data ? JSON.parse(data) : [];
      return all.filter(m => m.bike_id === bikeId);
    }

    const { data, error } = await supabase
      .from('maintenance')
      .select('*')
      .eq('bike_id', bikeId);

    return error ? [] : (data || []);
  },

  saveMaintenance: async (record: MaintenanceRecord): Promise<void> => {
    if (!supabase) {
      const data = localStorage.getItem('bikelogic_maintenance');
      const all: MaintenanceRecord[] = data ? JSON.parse(data) : [];
      const index = all.findIndex(r => r.id === record.id);
      if (index > -1) all[index] = record; else all.push(record);
      localStorage.setItem('bikelogic_maintenance', JSON.stringify(all));
      return;
    }

    await supabase.from('maintenance').upsert(record);
  },

  deleteBike: async (id: string): Promise<void> => {
    if (!supabase) {
      const bikes = await supabaseService.getBikes();
      localStorage.setItem('bikelogic_bikes', JSON.stringify(bikes.filter(b => b.id !== id)));
      return;
    }
    await supabase.from('bikes').delete().eq('id', id);
  }
};
