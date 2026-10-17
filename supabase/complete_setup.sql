-- =====================================================================
-- SPORTS HUB — COMPLETE SUPABASE DATABASE & ADMIN SETUP SCRIPT
-- =====================================================================
-- Run this single script in your Supabase Project SQL Editor.
-- It automatically:
-- 1. Creates all tables (users, sports, roster_entries, team_requests, site_settings)
-- 2. Sets up security, RLS policies, indexes, and helper functions
-- 3. Provisions your administrator account (USN: 1AH24CS212, Password: tttuuuyyy010)
-- 4. Seeds the official college sports and ACSCE settings
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLES
CREATE TABLE IF NOT EXISTS public.users (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  department  text,
  year        smallint CHECK (year BETWEEN 1 AND 4),
  interests   text[] NOT NULL DEFAULT '{}',
  is_admin    boolean NOT NULL DEFAULT false,
  usn         text,
  email       text,
  bio         text,
  photo_url   text,
  college     text DEFAULT 'Dr. A.C.S. College of Engineering (ACSCE)',
  phone       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  category    text NOT NULL DEFAULT 'men' CHECK (category IN ('men', 'women')),
  description text,
  coach_name  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name, category)
);

CREATE TABLE IF NOT EXISTS public.roster_entries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_id      uuid NOT NULL REFERENCES public.sports(id) ON DELETE CASCADE,
  player_name   text NOT NULL,
  position      text,
  jersey_number text,
  photo_url     text,
  stats         text,
  is_captain    boolean NOT NULL DEFAULT false,
  user_id       uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS one_captain_per_sport
  ON public.roster_entries (sport_id) WHERE is_captain;

CREATE TABLE IF NOT EXISTS public.team_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  sport_id        uuid REFERENCES public.sports(id) ON DELETE SET NULL,
  type            text NOT NULL CHECK (type IN ('sport', 'hackathon', 'event', 'fitness')),
  title           text NOT NULL,
  description     text,
  skill_tags      text[] NOT NULL DEFAULT '{}',
  people_needed   smallint NOT NULL CHECK (people_needed > 0),
  people_joined   smallint NOT NULL DEFAULT 0,
  scheduled_time  timestamptz NOT NULL,
  status          text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'filled', 'closed')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (people_joined <= people_needed),
  CHECK (type <> 'sport' OR sport_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.request_joins (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  uuid NOT NULL REFERENCES public.team_requests(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.site_settings (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Ensure all enhancement columns exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS usn text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS college text DEFAULT 'Dr. A.C.S. College of Engineering (ACSCE)';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone text;

ALTER TABLE public.sports ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.roster_entries ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE public.roster_entries ADD COLUMN IF NOT EXISTS stats text;
ALTER TABLE public.roster_entries ADD COLUMN IF NOT EXISTS jersey_number text;

-- 2. HELPER FUNCTIONS & RLS
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT COALESCE((SELECT is_admin FROM public.users WHERE id = auth.uid()), false)
$$;

CREATE OR REPLACE FUNCTION public.is_request_member(p_request_id uuid) RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.request_joins
                 WHERE request_id = p_request_id AND user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.team_requests
                 WHERE id = p_request_id AND creator_id = auth.uid())
$$;

ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roster_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_joins  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings  ENABLE ROW LEVEL SECURITY;

-- Idempotent RLS Policies
DROP POLICY IF EXISTS "users_read" ON public.users;
CREATE POLICY "users_read" ON public.users FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "users_update" ON public.users;
CREATE POLICY "users_update" ON public.users FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "users_insert" ON public.users;
CREATE POLICY "users_insert" ON public.users FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "sports_read" ON public.sports;
CREATE POLICY "sports_read" ON public.sports FOR SELECT USING (true);

DROP POLICY IF EXISTS "sports_admin" ON public.sports;
CREATE POLICY "sports_admin" ON public.sports FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "roster_read" ON public.roster_entries;
CREATE POLICY "roster_read" ON public.roster_entries FOR SELECT USING (true);

DROP POLICY IF EXISTS "roster_admin" ON public.roster_entries;
CREATE POLICY "roster_admin" ON public.roster_entries FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "requests_read" ON public.team_requests;
CREATE POLICY "requests_read" ON public.team_requests FOR SELECT USING (true);

DROP POLICY IF EXISTS "requests_insert" ON public.team_requests;
CREATE POLICY "requests_insert" ON public.team_requests FOR INSERT TO authenticated
  WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "requests_update" ON public.team_requests;
CREATE POLICY "requests_update" ON public.team_requests FOR UPDATE TO authenticated
  USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "joins_read" ON public.request_joins;
CREATE POLICY "joins_read" ON public.request_joins FOR SELECT TO authenticated
  USING (public.is_request_member(request_id));

DROP POLICY IF EXISTS "settings_read" ON public.site_settings;
CREATE POLICY "settings_read" ON public.site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "settings_admin" ON public.site_settings;
CREATE POLICY "settings_admin" ON public.site_settings FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Permissions & Grants
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT ON public.sports, public.roster_entries TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.sports, public.roster_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.team_requests TO authenticated;
GRANT SELECT ON public.request_joins TO authenticated;
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;

-- Stored procedure: auto-heal profile
CREATE OR REPLACE FUNCTION public.ensure_user_profile(p_user_id uuid)
RETURNS public.users
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  u public.users%rowtype;
  auth_u auth.users%rowtype;
BEGIN
  SELECT * INTO u FROM public.users WHERE id = p_user_id;
  IF FOUND THEN
    RETURN u;
  END IF;

  SELECT * INTO auth_u FROM auth.users WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'AUTH_USER_NOT_FOUND';
  END IF;

  INSERT INTO public.users (id, name, department, year, usn, college, email)
  VALUES (
    p_user_id,
    COALESCE(auth_u.raw_user_meta_data->>'name', split_part(auth_u.email, '@', 1)),
    COALESCE(auth_u.raw_user_meta_data->>'department', 'CSE'),
    COALESCE(nullif(auth_u.raw_user_meta_data->>'year', '')::smallint, 1),
    COALESCE(auth_u.raw_user_meta_data->>'usn', split_part(auth_u.email, '@', 1)),
    COALESCE(auth_u.raw_user_meta_data->>'college', 'Dr. A.C.S. College of Engineering (ACSCE)'),
    auth_u.email
  )
  RETURNING * INTO u;

  RETURN u;
END;
$$;
GRANT EXECUTE ON FUNCTION public.ensure_user_profile(uuid) TO authenticated;

-- Email resolution function
CREATE OR REPLACE FUNCTION public.get_auth_email_by_usn(p_usn text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  clean_usn text;
  found_email text;
BEGIN
  clean_usn := upper(trim(p_usn));
  IF clean_usn = '' THEN
    RETURN null;
  END IF;

  SELECT email INTO found_email FROM public.users
  WHERE upper(trim(coALESCE(usn, ''))) = clean_usn AND email IS NOT NULL AND email <> ''
  LIMIT 1;

  IF found_email IS NOT NULL THEN
    RETURN found_email;
  END IF;

  SELECT u.email INTO found_email FROM auth.users u
  WHERE upper(trim(coalesce(u.raw_user_meta_data->>'usn', ''))) = clean_usn
     OR u.email = lower(clean_usn) || '@college.edu'
  LIMIT 1;

  RETURN found_email;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_auth_email_by_usn(text) TO anon, authenticated;

-- Registration Pre-check function (Prevents duplicate signups and saves email rate limits)
CREATE OR REPLACE FUNCTION public.check_registration_exists(p_usn text, p_email text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  clean_usn text := upper(trim(coalesce(p_usn, '')));
  clean_email text := lower(trim(coalesce(p_email, '')));
  usn_found boolean := false;
  email_found boolean := false;
BEGIN
  IF clean_usn <> '' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.users WHERE upper(trim(coalesce(usn, ''))) = clean_usn
      UNION
      SELECT 1 FROM auth.users WHERE upper(trim(coalesce(raw_user_meta_data->>'usn', ''))) = clean_usn
    ) INTO usn_found;
  END IF;

  IF clean_email <> '' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.users WHERE lower(trim(coalesce(email, ''))) = clean_email
      UNION
      SELECT 1 FROM auth.users WHERE lower(trim(coalesce(email, ''))) = clean_email
    ) INTO email_found;
  END IF;

  RETURN jsonb_build_object('usn_exists', usn_found, 'email_exists', email_found);
END;
$$;
GRANT EXECUTE ON FUNCTION public.check_registration_exists(text, text) TO anon, authenticated;

-- Auto-create profile trigger on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, name, department, year, usn, email, bio, photo_url, college)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'department',
    NULLIF(new.raw_user_meta_data->>'year', '')::smallint,
    COALESCE(new.raw_user_meta_data->>'usn', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'bio', ''),
    new.raw_user_meta_data->>'photo_url',
    COALESCE(new.raw_user_meta_data->>'college', 'Dr. A.C.S. College of Engineering (ACSCE)')
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = COALESCE(public.users.name, EXCLUDED.name),
    usn = COALESCE(public.users.usn, EXCLUDED.usn),
    department = COALESCE(public.users.department, EXCLUDED.department),
    year = COALESCE(public.users.year, EXCLUDED.year),
    college = 'Dr. A.C.S. College of Engineering (ACSCE)';
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. SEED SPORTS & SETTINGS
INSERT INTO public.sports (name, category) VALUES
  ('Football',   'men'),
  ('Volleyball', 'men'),
  ('Cricket',    'men'),
  ('Throwball',  'men'),
  ('Basketball', 'men'),
  ('Athletics',  'men'),
  ('Volleyball', 'women'),
  ('Throwball',  'women'),
  ('Basketball', 'women'),
  ('Athletics',  'women')
ON CONFLICT (name, category) DO NOTHING;

INSERT INTO public.site_settings (key, value) VALUES
  ('portal_config', '{"portal_title": "Sports Hub | ACSCE", "tagline": "Dr. A.C.S. College of Engineering (ACSCE) Sports Portal", "institution": "Dr. A.C.S. College of Engineering (ACSCE)"}'::jsonb),
  ('coach_profile', '{"name": "Coach R. Sharma", "title": "Head Coach & Director of Physical Education", "bio": "Overseeing athletic development and training programs across all collegiate sports.", "office": "Sports Room, Third Floor"}'::jsonb),
  ('contact_info', '{"department": "Department of Physical Education and Sports", "location": "Sports Room, Third Floor", "institution": "Dr. A.C.S. College of Engineering (ACSCE)"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 4. PROVISION ADMINISTRATOR ACCOUNT (1AH24CS212 / tttuuuyyy010)
DO $$
DECLARE
  v_user_id uuid;
  v_email text := '1ah24cs212@college.edu';
  v_usn text := '1AH24CS212';
  v_name text := 'Sports Administrator';
  v_password text := 'tttuuuyyy010';
BEGIN
  -- Check if user already exists in auth.users by email or USN in metadata
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(email) = lower(v_email)
     OR upper(coalesce(raw_user_meta_data->>'usn', '')) = v_usn
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    UPDATE auth.users
    SET
      encrypted_password = crypt(v_password, gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_user_meta_data = jsonb_build_object(
        'name', v_name,
        'usn', v_usn,
        'department', 'CSE',
        'year', 4
      ),
      updated_at = now()
    WHERE id = v_user_id;

    RAISE NOTICE 'Existing auth account for USN % updated with new password and verified.', v_usn;
  ELSE
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      lower(v_email),
      crypt(v_password, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'name', v_name,
        'usn', v_usn,
        'department', 'CSE',
        'year', 4
      ),
      now(),
      now()
    );

    RAISE NOTICE 'Created new auth account for % (ID: %).', v_email, v_user_id;
  END IF;

  -- Link / Update public profile
  INSERT INTO public.users (
    id,
    name,
    usn,
    email,
    department,
    year,
    interests,
    is_admin,
    college
  ) VALUES (
    v_user_id,
    v_name,
    v_usn,
    (SELECT email FROM auth.users WHERE id = v_user_id),
    'CSE',
    4,
    ARRAY['Football', 'Basketball', 'Athletics'],
    true,
    'Dr. A.C.S. College of Engineering (ACSCE)'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    is_admin = true,
    usn = v_usn,
    email = COALESCE(public.users.email, (SELECT email FROM auth.users WHERE id = v_user_id)),
    name = COALESCE(public.users.name, v_name),
    department = COALESCE(public.users.department, 'CSE'),
    year = COALESCE(public.users.year, 4),
    college = 'Dr. A.C.S. College of Engineering (ACSCE)';

  RAISE NOTICE 'Sports Hub complete setup finished! Administrator account % is ready.', v_usn;
END $$;
