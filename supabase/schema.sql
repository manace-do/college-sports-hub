-- =====================================================
-- SPORTS HUB — SUPABASE DATABASE SCHEMA
-- =====================================================

-- 1. TABLES
create table users (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  department  text,
  year        smallint check (year between 1 and 4),
  interests   text[] not null default '{}',
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

create table sports (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    text not null default 'men' check (category in ('men','women')),
  coach_name  text,
  created_at  timestamptz not null default now(),
  unique (name, category)
);

create table roster_entries (
  id           uuid primary key default gen_random_uuid(),
  sport_id     uuid not null references sports(id) on delete cascade,
  player_name  text not null,
  position     text,
  is_captain   boolean not null default false,
  user_id      uuid references users(id) on delete set null,
  created_at   timestamptz not null default now()
);

-- at most one captain per sport
create unique index one_captain_per_sport
  on roster_entries (sport_id) where is_captain;

create table team_requests (
  id              uuid primary key default gen_random_uuid(),
  creator_id      uuid not null references users(id) on delete cascade default auth.uid(),
  sport_id        uuid references sports(id) on delete set null,
  type            text not null check (type in ('sport','hackathon','event','fitness')),
  title           text not null,
  description     text,
  skill_tags      text[] not null default '{}',
  people_needed   smallint not null check (people_needed > 0),
  people_joined   smallint not null default 0,
  scheduled_time  timestamptz not null,
  status          text not null default 'open' check (status in ('open','filled','closed')),
  created_at      timestamptz not null default now(),
  check (people_joined <= people_needed),
  check (type <> 'sport' or sport_id is not null)
);

create table request_joins (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references team_requests(id) on delete cascade,
  user_id     uuid not null references users(id) on delete cascade,
  joined_at   timestamptz not null default now(),
  unique (request_id, user_id)
);

-- =====================================================
-- 2. INDEXES
-- =====================================================

create index idx_roster_sport        on roster_entries (sport_id);
create index idx_requests_status_time on team_requests (status, scheduled_time);
create index idx_requests_sport      on team_requests (sport_id);
create index idx_joins_user          on request_joins (user_id);

-- =====================================================
-- 3. HELPER FUNCTIONS (used by the security rules)
-- =====================================================

-- "Is the person making this request an admin?"
create function is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select coalesce((select is_admin from users where id = auth.uid()), false)
$$;

-- "Is the person making this request the creator, or someone who joined?"
create function is_request_member(p_request_id uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from request_joins
                 where request_id = p_request_id and user_id = auth.uid())
      or exists (select 1 from team_requests
                 where id = p_request_id and creator_id = auth.uid())
$$;

-- =====================================================
-- 4. ROW-LEVEL SECURITY (who may do what)
-- =====================================================

alter table users          enable row level security;
alter table sports         enable row level security;
alter table roster_entries enable row level security;
alter table team_requests  enable row level security;
alter table request_joins  enable row level security;

-- users: logged-in students can read profiles; you can edit only your own
create policy "users_read"   on users for select to authenticated using (true);
create policy "users_update" on users for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- sports + roster: everyone can read (visitors too); only admin can change
create policy "sports_read"  on sports for select using (true);
create policy "sports_admin" on sports for all to authenticated
  using (is_admin()) with check (is_admin());

create policy "roster_read"  on roster_entries for select using (true);
create policy "roster_admin" on roster_entries for all to authenticated
  using (is_admin()) with check (is_admin());

-- requests: everyone can read; logged-in users create; creator edits their own
create policy "requests_read"   on team_requests for select using (true);
create policy "requests_insert" on team_requests for insert to authenticated
  with check (creator_id = auth.uid());
create policy "requests_update" on team_requests for update to authenticated
  using (creator_id = auth.uid()) with check (creator_id = auth.uid());

-- joins: only the creator and the members can see who joined.
-- There is NO insert policy on purpose: joining happens only through join_request().
create policy "joins_read" on request_joins for select to authenticated
  using (is_request_member(request_id));

-- =====================================================
-- 5. COLUMN PERMISSIONS (stops people editing fields they shouldn't)
-- =====================================================

-- Students may edit only their profile fields -> nobody can make themselves admin
revoke all on users from anon, authenticated;
grant select on users to authenticated;
grant update (name, department, year, interests) on users to authenticated;

-- Requests: users set only the "form" fields. people_joined and status
-- are managed by the join function, so nobody can fake a full or empty request.
revoke all on team_requests from anon, authenticated;
grant select on team_requests to anon, authenticated;
grant insert (creator_id, sport_id, type, title, description,
              skill_tags, people_needed, scheduled_time)
  on team_requests to authenticated;
grant update (title, description, skill_tags, scheduled_time, status)
  on team_requests to authenticated;

-- Joins: read only (writes happen inside join_request())
revoke all on request_joins from anon, authenticated;
grant select on request_joins to authenticated;

-- Visitors can read but never write sports and roster
revoke insert, update, delete on sports, roster_entries from anon;

-- =====================================================
-- 6. JOIN FUNCTION (the one piece of real logic)
-- =====================================================

create function join_request(p_request_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  r team_requests%rowtype;
begin
  if auth.uid() is null then
    raise exception 'NOT_LOGGED_IN';
  end if;

  -- lock this request row so two simultaneous joins are handled one at a time
  select * into r from team_requests where id = p_request_id for update;

  if not found then
    raise exception 'REQUEST_NOT_FOUND';
  end if;
  if r.status <> 'open' then
    raise exception 'REQUEST_NOT_OPEN';
  end if;
  if r.creator_id = auth.uid() then
    raise exception 'CREATOR_CANNOT_JOIN';
  end if;
  if exists (select 1 from request_joins
             where request_id = p_request_id and user_id = auth.uid()) then
    raise exception 'ALREADY_JOINED';
  end if;

  insert into request_joins (request_id, user_id) values (p_request_id, auth.uid());

  update team_requests
     set people_joined = people_joined + 1,
         status = case when people_joined + 1 >= people_needed then 'filled' else 'open' end
   where id = p_request_id;
end;
$$;

revoke execute on function join_request(uuid) from public, anon;
grant  execute on function join_request(uuid) to authenticated;

-- =====================================================
-- 7. AUTO-CREATE A PROFILE WHEN SOMEONE SIGNS UP
-- =====================================================

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into users (id, name, department, year, usn, bio, photo_url, college)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'department',
    nullif(new.raw_user_meta_data->>'year', '')::smallint,
    coalesce(new.raw_user_meta_data->>'usn', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'bio', ''),
    new.raw_user_meta_data->>'photo_url',
    coalesce(new.raw_user_meta_data->>'college', 'Dr. A.C.S. College of Engineering (ACSCE)')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =====================================================
-- 8. STARTER / SEED DATA
-- =====================================================

insert into sports (name, category) values
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
on conflict (name, category) do nothing;

insert into roster_entries (sport_id, player_name, position, is_captain)
select id, 'Arjun K', 'Goalkeeper', true  from sports where name = 'Football' and category = 'men'
on conflict do nothing;

insert into roster_entries (sport_id, player_name, position, is_captain)
select id, 'Imran S', 'Striker',    false from sports where name = 'Football' and category = 'men'
on conflict do nothing;

-- =====================================================
-- 9. SCHEMA ENHANCEMENTS (Non-destructive migrations)
-- =====================================================
alter table users add column if not exists usn text;
alter table users add column if not exists email text;
alter table users add column if not exists bio text;
alter table users add column if not exists photo_url text;
alter table users add column if not exists college text default 'Dr. A.C.S. College of Engineering (ACSCE)';
alter table users add column if not exists phone text;

alter table sports add column if not exists description text;
alter table roster_entries add column if not exists photo_url text;
alter table roster_entries add column if not exists stats text;
alter table roster_entries add column if not exists jersey_number text;

-- Allow authenticated students to insert their own profile record if missing
create policy "users_insert" on users for insert to authenticated
  with check (id = auth.uid());

-- Grant update on profile fields to authenticated students (is_admin excluded for non-admins)
grant update (name, department, year, interests, bio, photo_url, college, phone, email) on users to authenticated;
grant insert (id, name, department, year, interests, usn, bio, photo_url, college, phone, email) on users to authenticated;

-- Stored procedure to safely guarantee / auto-heal a user profile row
create or replace function ensure_user_profile(p_user_id uuid)
returns users
language plpgsql security definer set search_path = public as $$
declare
  u users%rowtype;
  auth_u auth.users%rowtype;
begin
  select * into u from users where id = p_user_id;
  if found then
    return u;
  end if;

  select * into auth_u from auth.users where id = p_user_id;
  if not found then
    raise exception 'AUTH_USER_NOT_FOUND';
  end if;

  insert into users (id, name, department, year, usn, college, email)
  values (
    p_user_id,
    coalesce(auth_u.raw_user_meta_data->>'name', split_part(auth_u.email, '@', 1)),
    coalesce(auth_u.raw_user_meta_data->>'department', 'CSE'),
    coalesce(nullif(auth_u.raw_user_meta_data->>'year', '')::smallint, 1),
    coalesce(auth_u.raw_user_meta_data->>'usn', split_part(auth_u.email, '@', 1)),
    coalesce(auth_u.raw_user_meta_data->>'college', 'Dr. A.C.S. College of Engineering (ACSCE)'),
    auth_u.email
  )
  returning * into u;

  return u;
end;
$$;
grant execute on function ensure_user_profile(uuid) to authenticated;

-- Site Settings Table (managed by admin)
create table if not exists site_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

alter table site_settings enable row level security;
create policy "settings_read" on site_settings for select using (true);
create policy "settings_admin" on site_settings for all to authenticated
  using (is_admin()) with check (is_admin());

-- Allow admins to update user accounts (e.g. manage roles and profile info)
create policy "users_admin_all" on users for all to authenticated
  using (is_admin()) with check (is_admin());

-- =====================================================
-- 10. SECURE ONE-TIME PRIMARY ADMIN INITIALIZATION
-- =====================================================
create or replace function promote_primary_admin(p_admin_usn text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  target_user users%rowtype;
  existing_admin_count int;
  clean_usn text;
begin
  clean_usn := upper(trim(p_admin_usn));

  -- 1. Enforce that only the designated primary USN can be initialized
  if clean_usn <> '1AH24CS212' then
    raise exception 'INVALID_ADMIN_USN';
  end if;

  -- 2. Locate the registered user account
  select * into target_user from users where upper(trim(coalesce(usn, ''))) = clean_usn;
  if not found then
    select * into target_user from users
    where id in (select id from auth.users where email like lower(clean_usn) || '@%');
  end if;

  if not found then
    raise exception 'USER_NOT_REGISTERED';
  end if;

  -- If this account is already verified as admin, return success idempotently
  if target_user.is_admin = true then
    return jsonb_build_object(
      'success', true,
      'already_admin', true,
      'user_id', target_user.id,
      'name', target_user.name,
      'usn', clean_usn
    );
  end if;

  -- Verify no other admin has been initialized
  select count(*) into existing_admin_count from users where is_admin = true;
  if existing_admin_count > 0 then
    raise exception 'ADMIN_ALREADY_INITIALIZED';
  end if;

  -- 3. Promote verified account to administrator
  update users
     set is_admin = true,
         usn = clean_usn
   where id = target_user.id;

  return jsonb_build_object(
    'success', true,
    'user_id', target_user.id,
    'name', target_user.name,
    'usn', clean_usn
  );
end;
$$;

grant execute on function promote_primary_admin(text) to anon, authenticated;

-- Function: Check whether an administrator has been initialized
create or replace function get_admin_status()
returns jsonb
language sql security definer stable set search_path = public as $$
  select jsonb_build_object(
    'has_admin', exists(select 1 from users where is_admin = true),
    'admin_count', (select count(*) from users where is_admin = true)
  );
$$;
grant execute on function get_admin_status() to anon, authenticated;

-- Function: Admin updates a user's details and role
create or replace function admin_update_user(
  p_user_id uuid,
  p_name text default null,
  p_department text default null,
  p_year smallint default null,
  p_is_admin boolean default null,
  p_usn text default null
)
returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then
    raise exception 'NOT_AUTHORIZED: Administrator privileges required';
  end if;

  update users
     set name = coalesce(p_name, name),
         department = coalesce(p_department, department),
         year = coalesce(p_year, year),
         is_admin = coalesce(p_is_admin, is_admin),
         usn = coalesce(p_usn, usn)
   where id = p_user_id;

  return jsonb_build_object('success', true, 'user_id', p_user_id);
end;
$$;
grant execute on function admin_update_user to authenticated;

-- Function: Admin removes a user account
create or replace function admin_delete_user(p_user_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  target_user users%rowtype;
begin
  if not is_admin() then
    raise exception 'NOT_AUTHORIZED: Administrator privileges required';
  end if;

  select * into target_user from users where id = p_user_id;
  if not found then
    raise exception 'USER_NOT_FOUND';
  end if;

  -- Prevent primary admin from deleting themselves
  if target_user.usn = '1AH24CS212' then
    raise exception 'CANNOT_DELETE_PRIMARY_ADMIN';
  end if;

  delete from users where id = p_user_id;
  return jsonb_build_object('success', true, 'deleted_user_id', p_user_id);
end;
$$;
grant execute on function admin_delete_user to authenticated;

-- Grants for site settings table
grant select on site_settings to anon, authenticated;
grant insert, update, delete on site_settings to authenticated;

-- Seed Default Site Settings
insert into site_settings (key, value) values
  ('portal_config', '{"portal_title": "Sports Hub | ACSCE", "tagline": "Dr. A.C.S. College of Engineering (ACSCE) Sports Portal", "institution": "Dr. A.C.S. College of Engineering (ACSCE)"}'::jsonb),
  ('coach_profile', '{"name": "Coach R. Sharma", "title": "Head Coach & Director of Physical Education", "bio": "Overseeing athletic development and training programs across all collegiate sports.", "office": "Sports Room, Third Floor"}'::jsonb),
  ('contact_info', '{"department": "Department of Physical Education and Sports", "location": "Sports Room, Third Floor", "institution": "Dr. A.C.S. College of Engineering (ACSCE)"}'::jsonb)
on conflict (key) do nothing;

-- =====================================================
-- 11. MIGRATION FOR COLLEGE SPORTS & ACADEMIC YEARS
-- =====================================================
-- Remove any legacy mixed sports and update check constraints safely
alter table users drop constraint if exists users_year_check;
alter table users add constraint users_year_check check (year between 1 and 4);

alter table sports drop constraint if exists sports_category_check;
alter table sports add constraint sports_category_check check (category in ('men', 'women'));

-- =====================================================
-- 12. USN & PERSONAL EMAIL RESOLUTION FUNCTION
-- =====================================================
create or replace function get_auth_email_by_usn(p_usn text)
returns text
language plpgsql security definer set search_path = public, auth as $$
declare
  clean_usn text;
  found_email text;
begin
  clean_usn := upper(trim(p_usn));
  if clean_usn = '' then
    return null;
  end if;

  -- 1. Check users table email column
  select email into found_email from users where upper(trim(coalesce(usn, ''))) = clean_usn and email is not null and email <> '' limit 1;
  if found_email is not null then
    return found_email;
  end if;

  -- 2. Check auth.users by metadata or matching legacy pattern
  select u.email into found_email from auth.users u
  where upper(trim(coalesce(u.raw_user_meta_data->>'usn', ''))) = clean_usn
     or u.email = lower(clean_usn) || '@college.edu'
  limit 1;

  return found_email;
end;
$$;
grant execute on function get_auth_email_by_usn(text) to anon, authenticated;

-- =====================================================
-- 13. ACSCE COLLEGE IDENTITY STANDARDIZATION
-- =====================================================
-- Non-destructively standardize institution identity across all user records
update users
set college = 'Dr. A.C.S. College of Engineering (ACSCE)'
where college is null or college in ('College of Engineering', 'College of Engineering & Technology');

alter table users alter column college set default 'Dr. A.C.S. College of Engineering (ACSCE)';

-- Update site settings to ACSCE identity if default values were present
update site_settings
set value = jsonb_set(value, '{portal_title}', '"Sports Hub | ACSCE"')
where key = 'portal_config' and value->>'portal_title' in ('Sports Hub', 'Sports Hub | College of Engineering');

update site_settings
set value = jsonb_set(value, '{tagline}', '"Dr. A.C.S. College of Engineering (ACSCE) Sports Portal"')
where key = 'portal_config' and value->>'tagline' in ('Discover College Teams & Casual Games');



