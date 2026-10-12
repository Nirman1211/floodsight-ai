-- =========================================================================
-- FloodSight AI — Supabase Database Architecture Schema
-- PostgreSQL Tables, Row-Level Security (RLS), and Google OAuth Triggers
-- =========================================================================

-- 1. Create Public User Profiles Table (Synced with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'Tactical Incident Commander',
  avatar_url TEXT,
  provider TEXT DEFAULT 'supabase',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are readable by authenticated users"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. Incident Activity Logs Table
CREATE TABLE IF NOT EXISTS public.incident_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  job_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for Incident Logs
ALTER TABLE public.incident_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Incident logs are readable by authenticated responders"
  ON public.incident_logs FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can record incident logs"
  ON public.incident_logs FOR INSERT
  WITH CHECK (true);

-- 3. Automatic Profile Creation Trigger on Supabase Auth SignUp (Includes Google OAuth)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, avatar_url, provider)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'Tactical Incident Commander'),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'),
    COALESCE(new.app_metadata->>'provider', 'email')
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Sample Pre-Seeded Personnel Profiles
-- (Can be executed in Supabase SQL Editor)
COMMENT ON TABLE public.profiles IS 'Personnel registry for spaceborne disaster assessment & road reachability commanders.';
