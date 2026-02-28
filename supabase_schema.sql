
-- 1. Estensione e Tabelle
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
  category TEXT NOT NULL DEFAULT 'Accessori',
  is_purchased BOOLEAN DEFAULT FALSE,
  priority INTEGER DEFAULT 2,
  price_estimate FLOAT,
  product_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'bikelogic_global_user',
  value JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Attivazione RLS
ALTER TABLE bikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- 3. Reset Policy Totale
DROP POLICY IF EXISTS "Public Access" ON bikes;
DROP POLICY IF EXISTS "Public Access" ON maintenance;
DROP POLICY IF EXISTS "Public Access" ON maintenance_history;
DROP POLICY IF EXISTS "Public Access" ON wishlist;

DROP POLICY IF EXISTS "bikes_select" ON bikes;
DROP POLICY IF EXISTS "bikes_insert" ON bikes;
DROP POLICY IF EXISTS "bikes_update" ON bikes;
DROP POLICY IF EXISTS "bikes_delete" ON bikes;

DROP POLICY IF EXISTS "maint_select" ON maintenance;
DROP POLICY IF EXISTS "maint_insert" ON maintenance;
DROP POLICY IF EXISTS "maint_update" ON maintenance;
DROP POLICY IF EXISTS "maint_delete" ON maintenance;

DROP POLICY IF EXISTS "hist_select" ON maintenance_history;
DROP POLICY IF EXISTS "hist_insert" ON maintenance_history;
DROP POLICY IF EXISTS "hist_update" ON maintenance_history;
DROP POLICY IF EXISTS "hist_delete" ON maintenance_history;

DROP POLICY IF EXISTS "wish_select" ON wishlist;
DROP POLICY IF EXISTS "wish_insert" ON wishlist;
DROP POLICY IF EXISTS "wish_update" ON wishlist;
DROP POLICY IF EXISTS "wish_delete" ON wishlist;

-- 4. Nuove Policy Scomposte e Specifiche (Advisor Safe)

-- BIKES
CREATE POLICY "bikes_select" ON bikes FOR SELECT USING (true);
CREATE POLICY "bikes_insert" ON bikes FOR INSERT WITH CHECK (user_id = 'bikelogic_global_user');
CREATE POLICY "bikes_update" ON bikes FOR UPDATE USING (user_id = 'bikelogic_global_user') WITH CHECK (user_id = 'bikelogic_global_user');
CREATE POLICY "bikes_delete" ON bikes FOR DELETE USING (user_id = 'bikelogic_global_user');

-- MAINTENANCE
CREATE POLICY "maint_select" ON maintenance FOR SELECT USING (true);
CREATE POLICY "maint_insert" ON maintenance FOR INSERT WITH CHECK (bike_id IN (SELECT id FROM bikes WHERE user_id = 'bikelogic_global_user'));
CREATE POLICY "maint_update" ON maintenance FOR UPDATE USING (bike_id IN (SELECT id FROM bikes WHERE user_id = 'bikelogic_global_user')) WITH CHECK (bike_id IN (SELECT id FROM bikes WHERE user_id = 'bikelogic_global_user'));
CREATE POLICY "maint_delete" ON maintenance FOR DELETE USING (bike_id IN (SELECT id FROM bikes WHERE user_id = 'bikelogic_global_user'));

-- HISTORY
CREATE POLICY "hist_select" ON maintenance_history FOR SELECT USING (true);
CREATE POLICY "hist_insert" ON maintenance_history FOR INSERT WITH CHECK (bike_id IN (SELECT id FROM bikes WHERE user_id = 'bikelogic_global_user'));
CREATE POLICY "hist_update" ON maintenance_history FOR UPDATE USING (bike_id IN (SELECT id FROM bikes WHERE user_id = 'bikelogic_global_user')) WITH CHECK (bike_id IN (SELECT id FROM bikes WHERE user_id = 'bikelogic_global_user'));
CREATE POLICY "hist_delete" ON maintenance_history FOR DELETE USING (bike_id IN (SELECT id FROM bikes WHERE user_id = 'bikelogic_global_user'));

-- WISHLIST
CREATE POLICY "wish_select" ON wishlist FOR SELECT USING (true);
CREATE POLICY "wish_insert" ON wishlist FOR INSERT WITH CHECK (user_id = 'bikelogic_global_user');
CREATE POLICY "wish_update" ON wishlist FOR UPDATE USING (user_id = 'bikelogic_global_user') WITH CHECK (user_id = 'bikelogic_global_user');
CREATE POLICY "wish_delete" ON wishlist FOR DELETE USING (user_id = 'bikelogic_global_user');
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_select" ON settings FOR SELECT USING (true);
CREATE POLICY "settings_insert" ON settings FOR INSERT WITH CHECK (user_id = 'bikelogic_global_user');
CREATE POLICY "settings_update" ON settings FOR UPDATE USING (user_id = 'bikelogic_global_user') WITH CHECK (user_id = 'bikelogic_global_user');
