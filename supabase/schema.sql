-- =====================================================
-- SPORTS HUB — SUPABASE DATABASE SCHEMA
-- =====================================================

-- 1. TABLES
create table users (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  department  text,
  year        smallint check (year between 1 and 5),
  interests   text[] not null default '{}',
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

create table sports (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    text not null default 'mixed' check (category in ('men','women','mixed')),
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

create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into users (id, name)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =====================================================
-- 8. STARTER / SEED DATA
-- =====================================================

insert into sports (name, category, coach_name) values
  ('Football',   'men',   'Mr. Sharma'),
  ('Cricket',    'men',   'Mr. Rao'),
  ('Volleyball', 'men',   'Mr. Nair'),
  ('Throwball',  'women', 'Ms. Iyer'),
  ('Basketball', 'mixed', 'Mr. Khan'),
  ('Athletics',  'men',   'Ms. Das'),
  ('Athletics',  'women', 'Ms. Das')
on conflict (name, category) do nothing;

insert into roster_entries (sport_id, player_name, position, is_captain)
select id, 'Arjun K', 'Goalkeeper', true  from sports where name = 'Football' and category = 'men'
on conflict do nothing;

insert into roster_entries (sport_id, player_name, position, is_captain)
select id, 'Imran S', 'Striker',    false from sports where name = 'Football' and category = 'men'
on conflict do nothing;
