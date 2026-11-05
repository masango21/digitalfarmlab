BEGIN;

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

CREATE UNIQUE INDEX IF NOT EXISTS crop_library_name_category_unique ON crop_library (lower(name), category);
CREATE INDEX IF NOT EXISTS crop_library_category_name_idx ON crop_library (category, lower(name));

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

INSERT INTO crop_library (name, category) VALUES
  ('Maize', 'cereals_grains'), ('Wheat', 'cereals_grains'), ('Rice', 'cereals_grains'),
  ('Barley', 'cereals_grains'), ('Oats', 'cereals_grains'), ('Sorghum', 'cereals_grains'),
  ('Millet', 'cereals_grains'), ('Rye', 'cereals_grains'), ('Triticale', 'cereals_grains'),
  ('Teff', 'cereals_grains'),
  ('Dry beans', 'legumes_pulses'), ('Soybeans', 'legumes_pulses'), ('Groundnuts', 'legumes_pulses'),
  ('Cowpeas', 'legumes_pulses'), ('Chickpeas', 'legumes_pulses'), ('Lentils', 'legumes_pulses'),
  ('Peas', 'legumes_pulses'), ('Pigeon peas', 'legumes_pulses'), ('Lupins', 'legumes_pulses'),
  ('Mung beans', 'legumes_pulses'),
  ('Potatoes', 'root_tubers'), ('Sweet potatoes', 'root_tubers'), ('Cassava', 'root_tubers'),
  ('Yams', 'root_tubers'), ('Taro', 'root_tubers'), ('Beetroot', 'root_tubers'),
  ('Carrots', 'root_tubers'), ('Radishes', 'root_tubers'), ('Turnips', 'root_tubers'),
  ('Onions', 'root_tubers'), ('Garlic', 'root_tubers'),
  ('Tomatoes', 'vegetables'), ('Cabbage', 'vegetables'), ('Spinach', 'vegetables'),
  ('Lettuce', 'vegetables'), ('Broccoli', 'vegetables'), ('Cauliflower', 'vegetables'),
  ('Green peppers', 'vegetables'), ('Chilli peppers', 'vegetables'), ('Cucumbers', 'vegetables'),
  ('Pumpkins', 'vegetables'), ('Butternut', 'vegetables'), ('Zucchini', 'vegetables'),
  ('Eggplant', 'vegetables'), ('Green beans', 'vegetables'), ('Peas', 'vegetables'),
  ('Celery', 'vegetables'), ('Sweetcorn', 'vegetables'), ('Okra', 'vegetables'),
  ('Green peas', 'vegetables'),
  ('Apples', 'fruit_crops'), ('Pears', 'fruit_crops'), ('Peaches', 'fruit_crops'),
  ('Plums', 'fruit_crops'), ('Apricots', 'fruit_crops'), ('Cherries', 'fruit_crops'),
  ('Grapes', 'fruit_crops'), ('Strawberries', 'fruit_crops'), ('Blueberries', 'fruit_crops'),
  ('Raspberries', 'fruit_crops'), ('Bananas', 'fruit_crops'), ('Mangoes', 'fruit_crops'),
  ('Avocados', 'fruit_crops'), ('Oranges', 'fruit_crops'), ('Lemons', 'fruit_crops'),
  ('Limes', 'fruit_crops'), ('Grapefruit', 'fruit_crops'), ('Pineapples', 'fruit_crops'),
  ('Papayas', 'fruit_crops'), ('Watermelons', 'fruit_crops'), ('Cantaloupes', 'fruit_crops'),
  ('Litchis', 'fruit_crops'), ('Pomegranates', 'fruit_crops'),
  ('Sunflowers', 'oilseed_industrial'), ('Canola', 'oilseed_industrial'), ('Cotton', 'oilseed_industrial'),
  ('Sesame', 'oilseed_industrial'), ('Flax', 'oilseed_industrial'), ('Castor', 'oilseed_industrial'),
  ('Sugarcane', 'oilseed_industrial'), ('Tobacco', 'oilseed_industrial'),
  ('Hemp (where legally permitted)', 'oilseed_industrial'),
  ('Lucerne', 'fodder_pasture'), ('Rhodes grass', 'fodder_pasture'), ('Kikuyu grass', 'fodder_pasture'),
  ('Ryegrass', 'fodder_pasture'), ('Napier grass', 'fodder_pasture'), ('Clover', 'fodder_pasture'),
  ('Fodder sorghum', 'fodder_pasture'), ('Forage maize', 'fodder_pasture'),
  ('Grazing oats', 'fodder_pasture'), ('Vetch', 'fodder_pasture'),
  ('Basil', 'herbs_spices'), ('Coriander', 'herbs_spices'), ('Parsley', 'herbs_spices'),
  ('Rosemary', 'herbs_spices'), ('Thyme', 'herbs_spices'), ('Mint', 'herbs_spices'),
  ('Oregano', 'herbs_spices'), ('Ginger', 'herbs_spices'), ('Turmeric', 'herbs_spices'),
  ('Chillies', 'herbs_spices'), ('Black pepper', 'herbs_spices'), ('Cumin', 'herbs_spices'),
  ('Fennel', 'herbs_spices'),
  ('Macadamia', 'nuts_tree'), ('Almonds', 'nuts_tree'), ('Walnuts', 'nuts_tree'),
  ('Pecans', 'nuts_tree'), ('Cashews', 'nuts_tree'), ('Hazelnuts', 'nuts_tree'),
  ('Pistachios', 'nuts_tree'), ('Olives', 'nuts_tree'), ('Coffee', 'nuts_tree'),
  ('Tea', 'nuts_tree'), ('Cocoa', 'nuts_tree'),
  ('Roses', 'ornamental_nursery'), ('Carnations', 'ornamental_nursery'),
  ('Chrysanthemums', 'ornamental_nursery'), ('Gerberas', 'ornamental_nursery'),
  ('Lavender', 'ornamental_nursery'), ('Indigenous nursery plants', 'ornamental_nursery'),
  ('Ornamental shrubs', 'ornamental_nursery'), ('Tree seedlings', 'ornamental_nursery')
ON CONFLICT DO NOTHING;

COMMIT;
