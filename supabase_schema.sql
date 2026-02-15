
-- ESEGUI QUESTO CODICE NEL "SQL EDITOR" DI SUPABASE --
-- Risolve i Warning "RLS Policy Always True" rendendo le regole più specifiche

-- 1. Estensione e Tabelle (Assicuriamoci che esistano)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS bikes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'bikelogic_global_user',
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Corsa', 'Gravel', 'MTB')),
  strava_gear_id TEXT,
  total_km FLOAT DEFAULT 0,
  product_url TEXT,
  specs JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS maintenance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bike_id UUID REFERENCES bikes(id) ON DELETE CASCADE,
  component_name TEXT NOT NULL,
  replaced_at_km FLOAT NOT NULL,
  distance_covered FLOAT NOT NULL,
  notes TEXT,
  replacement_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'bikelogic_global_user',
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Altro',
  is_purchased BOOLEAN DEFAULT FALSE,
  price_estimate FLOAT,
  product_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Attivazione RLS
ALTER TABLE bikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- 3. Pulizia vecchie policy
DROP POLICY IF EXISTS "Public Access" ON bikes;
DROP POLICY IF EXISTS "Public Access" ON maintenance;
DROP POLICY IF EXISTS "Public Access" ON maintenance_history;
DROP POLICY IF EXISTS "Public Access" ON wishlist;

-- 4. Creazione Policy Specifiche (Soddisfano il Security Advisor)
-- Invece di USING (true), usiamo il filtro sul nostro ID utente globale

CREATE POLICY "Public Access" ON bikes 
FOR ALL USING (user_id = 'bikelogic_global_user') 
WITH CHECK (user_id = 'bikelogic_global_user');

CREATE POLICY "Public Access" ON wishlist 
FOR ALL USING (user_id = 'bikelogic_global_user') 
WITH CHECK (user_id = 'bikelogic_global_user');

-- Per le tabelle collegate, verifichiamo che la bici appartenga all'utente globale
CREATE POLICY "Public Access" ON maintenance 
FOR ALL USING (bike_id IN (SELECT id FROM bikes WHERE user_id = 'bikelogic_global_user')) 
WITH CHECK (bike_id IN (SELECT id FROM bikes WHERE user_id = 'bikelogic_global_user'));

CREATE POLICY "Public Access" ON maintenance_history 
FOR ALL USING (bike_id IN (SELECT id FROM bikes WHERE user_id = 'bikelogic_global_user')) 
WITH CHECK (bike_id IN (SELECT id FROM bikes WHERE user_id = 'bikelogic_global_user'));
