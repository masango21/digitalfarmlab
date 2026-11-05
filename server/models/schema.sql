CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('learner', 'trainer', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS refresh_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  area_hectares NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (area_hectares >= 0),
  production_system TEXT NOT NULL DEFAULT 'mixed'
    CHECK (production_system IN ('rainfed', 'irrigated', 'mixed')),
  region TEXT CONSTRAINT farms_region_length
    CHECK (region IS NULL OR length(btrim(region)) BETWEEN 1 AND 100),
  farm_type TEXT NOT NULL DEFAULT 'mixed'
    CONSTRAINT farms_farm_type_allowed
    CHECK (farm_type IN ('smallholder', 'commercial', 'subsistence', 'research', 'educational', 'mixed')),
  main_crops TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]
    CONSTRAINT farms_main_crops_limit
    CHECK (cardinality(main_crops) <= 20 AND array_position(main_crops, '') IS NULL),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE farms ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE farms ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE farms ADD COLUMN IF NOT EXISTS production_system TEXT NOT NULL DEFAULT 'mixed'
  CHECK (production_system IN ('rainfed', 'irrigated', 'mixed'));
ALTER TABLE farms ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE farms ADD COLUMN IF NOT EXISTS farm_type TEXT NOT NULL DEFAULT 'mixed';
ALTER TABLE farms ADD COLUMN IF NOT EXISTS main_crops TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'farms_region_length'
      AND conrelid = 'farms'::regclass
  ) THEN
    ALTER TABLE farms ADD CONSTRAINT farms_region_length
      CHECK (region IS NULL OR length(btrim(region)) BETWEEN 1 AND 100);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'farms_farm_type_allowed'
      AND conrelid = 'farms'::regclass
  ) THEN
    ALTER TABLE farms ADD CONSTRAINT farms_farm_type_allowed
      CHECK (farm_type IN ('smallholder', 'commercial', 'subsistence', 'research', 'educational', 'mixed'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'farms_main_crops_limit'
      AND conrelid = 'farms'::regclass
  ) THEN
    ALTER TABLE farms ADD CONSTRAINT farms_main_crops_limit
      CHECK (cardinality(main_crops) <= 20 AND array_position(main_crops, '') IS NULL);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'farms_coordinates_pair'
      AND conrelid = 'farms'::regclass
  ) THEN
    ALTER TABLE farms ADD CONSTRAINT farms_coordinates_pair
      CHECK ((latitude IS NULL) = (longitude IS NULL));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  area_hectares NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (area_hectares >= 0),
  soil_type TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE fields ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fields_coordinates_pair'
      AND conrelid = 'fields'::regclass
  ) THEN
    ALTER TABLE fields ADD CONSTRAINT fields_coordinates_pair
      CHECK ((latitude IS NULL) = (longitude IS NULL));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS crops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  variety TEXT,
  growth_stage TEXT,
  water_requirement_notes TEXT,
  nutrient_requirement_notes TEXT,
  planted_at DATE,
  expected_harvest_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crop_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'cereals_grains', 'legumes_pulses', 'root_tubers', 'vegetables', 'fruit_crops',
    'oilseed_industrial', 'fodder_pasture', 'herbs_spices', 'nuts_tree', 'ornamental_nursery'
  )),
  scientific_name TEXT,
  description TEXT,
  profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  information_status TEXT NOT NULL DEFAULT 'unknown'
    CHECK (information_status IN ('unknown', 'estimated', 'verified')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS crop_library_name_category_unique
  ON crop_library (lower(name), category);
CREATE INDEX IF NOT EXISTS crop_library_category_name_idx
  ON crop_library (category, lower(name));

CREATE TABLE IF NOT EXISTS crop_library_varieties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id UUID NOT NULL REFERENCES crop_library(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  region TEXT,
  notes TEXT,
  information_status TEXT NOT NULL DEFAULT 'unknown'
    CHECK (information_status IN ('unknown', 'estimated', 'verified')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS crop_library_variety_name_region_unique
  ON crop_library_varieties (crop_id, lower(name), lower(COALESCE(region, '')));
CREATE INDEX IF NOT EXISTS crop_library_varieties_crop_region_idx
  ON crop_library_varieties (crop_id, lower(region), lower(name));

ALTER TABLE crops ADD COLUMN IF NOT EXISTS variety TEXT;
ALTER TABLE crops ADD COLUMN IF NOT EXISTS growth_stage TEXT;
ALTER TABLE crops ADD COLUMN IF NOT EXISTS water_requirement_notes TEXT;
ALTER TABLE crops ADD COLUMN IF NOT EXISTS nutrient_requirement_notes TEXT;

CREATE TABLE IF NOT EXISTS livestock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  species TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sensor_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  sensor_type TEXT NOT NULL,
  value NUMERIC(12, 3) NOT NULL,
  unit TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'unknown' CHECK (source IN ('manual', 'sensor', 'simulated', 'unknown')),
  notes TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'unknown'
  CHECK (source IN ('manual', 'sensor', 'simulated', 'unknown'));
ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE TABLE IF NOT EXISTS field_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  inspector_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  crop_health TEXT NOT NULL CHECK (crop_health IN ('good', 'fair', 'poor', 'unknown')),
  observations TEXT NOT NULL,
  pest_observations TEXT,
  disease_observations TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scenarios (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  baseline_yield_kg NUMERIC(12, 2) NOT NULL,
  baseline_water_liters NUMERIC(12, 2) NOT NULL,
  baseline_cost NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO scenarios (id, name, description, baseline_yield_kg, baseline_water_liters, baseline_cost)
VALUES
  ('crop-growth', 'Crop growth', 'Explore how irrigation and fertilizer choices affect a crop season.', 5000, 12000, 1800),
  ('water-saving', 'Water saving', 'Balance crop yield with reduced irrigation use.', 5000, 12000, 1800),
  ('soil-health', 'Soil health', 'Compare input choices for yield, water, and farm cost.', 5000, 12000, 1800)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  farm_id UUID REFERENCES farms(id) ON DELETE SET NULL,
  scenario_id TEXT NOT NULL REFERENCES scenarios(id),
  parameters JSONB NOT NULL,
  outcome JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL UNIQUE REFERENCES runs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  value INTEGER NOT NULL CHECK (value BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS post_likes (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cohort_members (
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (cohort_id, user_id)
);

CREATE INDEX IF NOT EXISTS farms_user_id_idx ON farms(user_id);
CREATE INDEX IF NOT EXISTS fields_farm_id_idx ON fields(farm_id);
CREATE INDEX IF NOT EXISTS crops_field_created_idx ON crops(field_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sensor_readings_field_recorded_idx ON sensor_readings(field_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS field_inspections_field_observed_idx ON field_inspections(field_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS runs_user_created_idx ON runs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS scores_user_created_idx ON scores(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS products_category_available_idx ON products(category, available);
CREATE INDEX IF NOT EXISTS posts_created_idx ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS cohort_members_user_id_idx ON cohort_members(user_id);
