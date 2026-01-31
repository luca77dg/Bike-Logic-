
import { createClient } from '@supabase/supabase-js';
import { Bike, MaintenanceRecord } from '../types.ts';

// Recupero configurazione dalle variabili d'ambiente
const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || '').trim();

// Inizializzazione client solo se le chiavi sono presenti
const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Identificativo utente per la demo (in produzione usare Supabase Auth)
const USER_ID = 'default-rider';

export const supabaseService = {
  getBikes: async (): Promise<Bike[]> => {
    if (!supabase) {
      console.warn("Supabase non configurato. Ritorno dati locali (mock).");
      const local = localStorage.getItem('bikelogic_bikes');
      return local ? JSON.parse(local) : [];
    }

    const { data, error } = await supabase
      .from('bikes')
      .select('*')
      .eq('user_id', USER_ID)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Errore fetch bikes:", error);
      return [];
    }
    return data || [];
  },
  
  saveBike: async (bike: Bike): Promise<void> => {
    if (!supabase) {
      const bikes = await supabaseService.getBikes();
      const index = bikes.findIndex(b => b.id === bike.id);
      if (index > -1) bikes[index] = bike; else bikes.push(bike);
      localStorage.setItem('bikelogic_bikes', JSON.stringify(bikes));
      return;
    }

    const { error } = await supabase
      .from('bikes')
      .upsert({
        ...bike,
        user_id: USER_ID, // Garantisce la proprietà dei dati
      }, { onConflict: 'id' });

    if (error) {
      console.error("Errore salvataggio bike:", error);
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
      .eq('bike_id', bikeId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Errore fetch maintenance:", error);
      return [];
    }
    return data || [];
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

    const { error } = await supabase
      .from('maintenance')
      .upsert(record, { onConflict: 'id' });

    if (error) {
      console.error("Errore salvataggio maintenance:", error);
      throw error;
    }
  },

  deleteBike: async (id: string): Promise<void> => {
    if (!supabase) {
      const bikes = await supabaseService.getBikes();
      localStorage.setItem('bikelogic_bikes', JSON.stringify(bikes.filter(b => b.id !== id)));
      const data = localStorage.getItem('bikelogic_maintenance');
      if (data) {
        const all: MaintenanceRecord[] = JSON.parse(data);
        localStorage.setItem('bikelogic_maintenance', JSON.stringify(all.filter(m => m.bike_id !== id)));
      }
      return;
    }

    const { error } = await supabase
      .from('bikes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Errore eliminazione bike:", error);
      throw error;
    }
  }
};
