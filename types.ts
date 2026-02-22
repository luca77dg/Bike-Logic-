
export type BikeType = 'Corsa' | 'Gravel' | 'MTB';

export interface BikeSource {
  uri: string;
  title: string;
}

export interface BikeSpecs {
  telaio?: string;
  forcella?: string;
  gruppo?: string;
  cambio?: string;
  freni?: string;
  ruote?: string;
  pneumatici?: string;
  clearance_max?: string;
  sella?: string;
  peso?: string;
  imageUrl?: string;
  photos?: string[];
  sources?: BikeSource[];
}

export interface Bike {
  id: string;
  user_id: string;
  name: string;
  type: BikeType;
  strava_gear_id: string | null;
  total_km: number;
  specs?: BikeSpecs;
  product_url?: string;
}

export interface MaintenanceRecord {
  id: string;
  bike_id: string;
  component_name: string;
  km_at_install: number;
  last_check_km: number;
  lifespan_limit: number;
  notes?: string;
}

export interface MaintenanceHistory {
  id: string;
  bike_id: string;
  component_name: string;
  replaced_at_km: number;
  distance_covered: number;
  notes?: string;
  replacement_date: string;
}

export type WishlistCategory = 'Abbigliamento' | 'Caschi e occhiali' | 'Scarpe' | 'Accessori' | 'Componenti' | 'Manutenzione' | 'Salute';

export interface WishlistItem {
  id: string;
  user_id: string;
  name: string;
  category: WishlistCategory;
  is_purchased: boolean;
  priority: number; // 1: Bassa, 2: Media, 3: Alta, 4: Urgente
  price_estimate?: number;
  product_url?: string;
  notes?: string;
  created_at: string;
}

export interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete?: {
    id: number;
  };
}
