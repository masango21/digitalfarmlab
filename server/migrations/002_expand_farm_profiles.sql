BEGIN;

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
END $$;

COMMIT;
