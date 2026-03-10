-- LankaPros — Fix handle_new_user trigger
-- Run this in Supabase SQL Editor
-- Adds EXCEPTION handling so trigger NEVER fails user creation
-- Adds ON CONFLICT DO NOTHING for duplicate safety
-- Adds SET row_security = off to bypass RLS during trigger

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block user creation even if profile insert fails
  -- The auth callback will create the profile on next request
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET row_security = off;
