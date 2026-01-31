
-- Create bikes table
CREATE TABLE IF NOT EXISTS bikes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Corsa', 'Gravel', 'MTB')),
  strava_gear_id TEXT,
  total_km FLOAT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create maintenance table
CREATE TABLE IF NOT EXISTS maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bike_id UUID REFERENCES bikes(id) ON DELETE CASCADE,
  component_name TEXT NOT NULL,
  km_at_install FLOAT NOT NULL DEFAULT 0,
  last_check_km FLOAT NOT NULL DEFAULT 0,
  lifespan_limit FLOAT NOT NULL DEFAULT 2000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Optional but recommended)
-- ALTER TABLE bikes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;
