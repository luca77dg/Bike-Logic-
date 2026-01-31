
import { Bike, MaintenanceRecord } from '../types.ts';

const STORAGE_KEY_BIKES = 'bikelogic_bikes';
const STORAGE_KEY_MAINTENANCE = 'bikelogic_maintenance';

export const supabaseService = {
  getBikes: async (): Promise<Bike[]> => {
    const data = localStorage.getItem(STORAGE_KEY_BIKES);
    return data ? JSON.parse(data) : [];
  },
  
  saveBike: async (bike: Bike): Promise<void> => {
    const bikes = await supabaseService.getBikes();
    const index = bikes.findIndex(b => b.id === bike.id);
    if (index > -1) {
      bikes[index] = bike;
    } else {
      bikes.push(bike);
    }
    localStorage.setItem(STORAGE_KEY_BIKES, JSON.stringify(bikes));
  },

  getMaintenance: async (bikeId: string): Promise<MaintenanceRecord[]> => {
    const data = localStorage.getItem(STORAGE_KEY_MAINTENANCE);
    const allRecords: MaintenanceRecord[] = data ? JSON.parse(data) : [];
    return allRecords.filter(m => m.bike_id === bikeId);
  },

  saveMaintenance: async (record: MaintenanceRecord): Promise<void> => {
    const data = localStorage.getItem(STORAGE_KEY_MAINTENANCE);
    const allRecords: MaintenanceRecord[] = data ? JSON.parse(data) : [];
    const index = allRecords.findIndex(r => r.id === record.id);
    if (index > -1) {
      allRecords[index] = record;
    } else {
      allRecords.push(record);
    }
    localStorage.setItem(STORAGE_KEY_MAINTENANCE, JSON.stringify(allRecords));
  },

  deleteBike: async (id: string): Promise<void> => {
    const bikes = await supabaseService.getBikes();
    localStorage.setItem(STORAGE_KEY_BIKES, JSON.stringify(bikes.filter(b => b.id !== id)));
  }
};
