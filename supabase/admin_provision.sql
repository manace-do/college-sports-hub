-- =====================================================================
-- SPORTS HUB — SECURE ADMINISTRATOR PROVISIONING SCRIPT
-- =====================================================================
-- Run this script in your Supabase Project SQL Editor to safely configure
-- or update your administrator account with USN: 1AH24CS212.
--
-- Features:
-- 1. Idempotent: Can be run multiple times safely.
-- 2. Secure: Encrypts the password with bcrypt (gen_salt('bf')).
-- 3. Auto-links auth.users with public.users profile.
-- 4. Confirms the administrator email without needing an email verification link.
-- 5. Promotes the account to primary administrator (is_admin = true).
-- =====================================================================

DO $$
DECLARE
  v_user_id uuid;
  v_email text := '1ah24cs212@college.edu';
  v_usn text := '1AH24CS212';
  v_name text := 'Sports Administrator';
  -- The designated administrator password
  v_password text := 'tttuuuyyy010';
BEGIN
  -- 1. Check if the user already exists in auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = lower(v_email);

  IF v_user_id IS NOT NULL THEN
    -- Update existing auth account with new password and confirm email
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

    RAISE NOTICE 'Existing auth account % updated with new password and verified.', v_email;
  ELSE
    -- Generate fresh UUID and insert into auth.users
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

  -- 2. Link or update the public profile in public.users
  INSERT INTO public.users (
    id,
    name,
    usn,
    department,
    year,
    interests,
    is_admin,
    college
  ) VALUES (
    v_user_id,
    v_name,
    v_usn,
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
    name = COALESCE(public.users.name, v_name),
    department = COALESCE(public.users.department, 'CSE'),
    year = COALESCE(public.users.year, 4),
    college = 'Dr. A.C.S. College of Engineering (ACSCE)';

  RAISE NOTICE 'Administrator privileges successfully assigned to USN % (User ID: %).', v_usn, v_user_id;
END $$;
