
-- Estensione per UUID se non presente
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabella Bikes aggiornata con supporto a dati complessi (JSONB)
CREATE TABLE IF NOT EXISTS bikes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default-rider',
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Corsa', 'Gravel', 'MTB')),
  strava_gear_id TEXT,
  total_km FLOAT DEFAULT 0,
  product_url TEXT,
  specs JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella Maintenance per il tracciamento dei componenti attuali
CREATE TABLE IF NOT EXISTS maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bike_id UUID REFERENCES bikes(id) ON DELETE CASCADE,
  component_name TEXT NOT NULL,
  km_at_install FLOAT NOT NULL DEFAULT 0,
  last_check_km FLOAT NOT NULL DEFAULT 0,
  lifespan_limit FLOAT NOT NULL DEFAULT 2000,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NUOVA: Tabella Storico Sostituzioni
CREATE TABLE IF NOT EXISTS maintenance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bike_id UUID REFERENCES bikes(id) ON DELETE CASCADE,
  component_name TEXT NOT NULL,
  replaced_at_km FLOAT NOT NULL,
  distance_covered FLOAT NOT NULL,
  notes TEXT,
  replacement_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_maintenance_bike_id ON maintenance(bike_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_history_bike_id ON maintenance_history(bike_id);
CREATE INDEX IF NOT EXISTS idx_bikes_user_id ON bikes(user_id);
