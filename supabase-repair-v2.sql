-- LankaPros — Profiles Table Repair
-- Run this in Supabase SQL Editor
-- Safe to run multiple times — all statements use IF NOT EXISTS / ADD COLUMN IF NOT EXISTS

-- ============================================================
-- Step 1: Add all missing columns to profiles
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS headline TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS industry_id INT REFERENCES industries(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme_accent TEXT NOT NULL DEFAULT '#D4A843';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme_bg TEXT NOT NULL DEFAULT '#0f0f0f';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme_text TEXT NOT NULL DEFAULT '#ededed';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme_pattern TEXT NOT NULL DEFAULT 'none';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS connection_count INT NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS post_count INT NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- ============================================================
-- Step 2: Ensure trigger function has row_security off
--         (fixes "Database error saving new user")
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET row_security = off;

-- ============================================================
-- Step 3: Ensure all RLS policies exist
-- ============================================================

-- Profiles: public read
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Profiles are public') THEN
    CREATE POLICY "Profiles are public" ON profiles FOR SELECT USING (true);
  END IF;
END $$;

-- Profiles: own insert (needed by signup flow)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile') THEN
    CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Profiles: own update (needed by profile/edit)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- ============================================================
-- Step 4: Add trigram indexes (for search) if pg_trgm exists
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'profiles' AND indexname = 'idx_profiles_username_trgm') THEN
      EXECUTE 'CREATE INDEX idx_profiles_username_trgm ON profiles USING gin (username gin_trgm_ops)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'profiles' AND indexname = 'idx_profiles_full_name_trgm') THEN
      EXECUTE 'CREATE INDEX idx_profiles_full_name_trgm ON profiles USING gin (full_name gin_trgm_ops)';
    END IF;
  ELSE
    RAISE NOTICE 'pg_trgm not installed — run: CREATE EXTENSION pg_trgm; then re-run this script';
  END IF;
END $$;

-- ============================================================
-- Step 5: Verify — should show all 18 columns
-- ============================================================

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;
