
-- ESEGUI QUESTO CODICE NEL "SQL EDITOR" DI SUPABASE --
-- Risolve gli errori "RLS Disabled in Public" e "Policy Exists RLS Disabled"

-- 1. Estensione per UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Creazione Tabelle (con IF NOT EXISTS per sicurezza)
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

-- 3. Indici per performance
CREATE INDEX IF NOT EXISTS idx_maintenance_bike_id ON maintenance(bike_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_history_bike_id ON maintenance_history(bike_id);
CREATE INDEX IF NOT EXISTS idx_bikes_user_id ON bikes(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);

-- 4. CONFIGURAZIONE SICUREZZA (Risoluzione Errori Advisor)

-- Abilita RLS su tutte le tabelle
ALTER TABLE bikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- Rimuovi eventuali policy esistenti per evitare duplicati
DROP POLICY IF EXISTS "Public Access" ON bikes;
DROP POLICY IF EXISTS "Public Access" ON maintenance;
DROP POLICY IF EXISTS "Public Access" ON maintenance_history;
DROP POLICY IF EXISTS "Public Access" ON wishlist;

-- Crea nuove policy "Open" che permettono l'accesso anonimo (richiesto dal tuo setup attuale)
CREATE POLICY "Public Access" ON bikes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON maintenance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON maintenance_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON wishlist FOR ALL USING (true) WITH CHECK (true);
