
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
  sella?: string;
  peso?: string;
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
}

export interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete?: {
    id: number;
  };
}
