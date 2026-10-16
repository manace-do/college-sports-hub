# Sports Hub — Database Schema (Hackathon Edition)

*PostgreSQL on Supabase. Designed so a beginner team can read it top to bottom and explain every table.*

**The shape in one line:** five tables. Sports have a roster, students create requests, and other students join them.

---

## 1. Overview

### The five tables and why each exists

| Table | Why it exists | PRD feature it serves |
|---|---|---|
| `users` | Stores each student's profile (name, department, year, interests) and whether they're an admin. Supabase keeps the login details separately; this table is the *profile* attached to a login. | Sign up, profile, admin role |
| `sports` | One row per sport the college offers, with its coach. | Sports directory |
| `roster_entries` | The official players of each sport, with position and captain flag. Kept separate from `sports` because one sport has many players. | Roster, captain |
| `team_requests` | A casual game or hackathon request: what, when, how many people needed. | Team Request |
| `request_joins` | Records who joined which request. Needed because one request has many people and one person joins many requests. | Join a request, member list |

### Relationships

```
                         ┌──────────────┐
                         │    sports    │
                         └──────┬───────┘
                 one sport has  │  one sport can have
                 many players   │  many requests
              ┌─────────────────┴────────────────┐
              ▼                                  ▼
     ┌─────────────────┐                ┌──────────────────┐
     │ roster_entries  │                │  team_requests   │◀── created by ──┐
     │ (official team) │                │ (casual games)   │                 │
     └────────┬────────┘                └────────┬─────────┘                 │
              │ optional link                    │ one request has           │
              │ to an account                    │ many joins                │
              ▼                                  ▼                           │
        ┌───────────┐                   ┌────────────────┐            ┌─────┴─────┐
        │   users   │◀── joined by ─────│ request_joins  │            │   users   │
        └───────────┘                   └────────────────┘            └───────────┘
                                        (same users table, shown twice for clarity)
```

| Relationship | Type | How it's stored |
|---|---|---|
| sport → roster players | one-to-many | `roster_entries.sport_id` points to `sports.id` |
| sport → requests | one-to-many (optional) | `team_requests.sport_id` points to `sports.id` |
| user → requests they created | one-to-many | `team_requests.creator_id` points to `users.id` |
| users ↔ requests they joined | **many-to-many** | the `request_joins` table sits in the middle |
| roster player → user account | optional one-to-one | `roster_entries.user_id` (can be empty) |

**What "many-to-many" means:** a student can join many requests, and a request can have many students. A table can't store a list in one cell cleanly, so a third table (`request_joins`) holds one row per "student X joined request Y".

---

## 2. Tables in Detail

Legend: **PK** = primary key (the unique ID of a row). **FK** = foreign key (an ID that points to a row in another table). **Required** = cannot be empty.

### 2.1 `users`

*Why:* a profile for every logged-in student. Its `id` is the same ID Supabase gives the login, so the two always match.

| Column | Type | Key | Required | Default | Notes |
|---|---|---|---|---|---|
| id | uuid | **PK**, **FK** → `auth.users(id)` | Yes | — | Same ID as the login account |
| name | text | | Yes | — | Filled automatically at sign-up |
| department | text | | No | — | e.g. "CSE" |
| year | smallint | | No | — | 1 to 5 |
| interests | text[] | | No | `{}` | A list like `{football,running}` |
| is_admin | boolean | | Yes | `false` | Set by hand in the dashboard |
| created_at | timestamptz | | Yes | `now()` | |

### 2.2 `sports`

*Why:* the home page list, and the parent of each roster.

| Column | Type | Key | Required | Default | Notes |
|---|---|---|---|---|---|
| id | uuid | **PK** | Yes | `gen_random_uuid()` | |
| name | text | | Yes | — | e.g. "Football" |
| category | text | | Yes | `'mixed'` | `men`, `women`, or `mixed` |
| coach_name | text | | No | — | Plain text, no account needed |
| created_at | timestamptz | | Yes | `now()` | |

Rule: the same `name` + `category` can't appear twice.

### 2.3 `roster_entries`

*Why:* lists the official players. Each row is one player on one sport's team.

| Column | Type | Key | Required | Default | Notes |
|---|---|---|---|---|---|
| id | uuid | **PK** | Yes | `gen_random_uuid()` | |
| sport_id | uuid | **FK** → `sports(id)` | Yes | — | Which sport |
| player_name | text | | Yes | — | Typed by the admin |
| position | text | | No | — | e.g. "Goalkeeper" |
| is_captain | boolean | | Yes | `false` | At most one per sport |
| user_id | uuid | **FK** → `users(id)` | No | — | Link to an account, if they have one |
| created_at | timestamptz | | Yes | `now()` | |

**Design decision:** `player_name` is plain text and `user_id` is optional. Most official players won't have signed up yet, and the admin shouldn't have to wait for them. Because the roster holds only a name, position, and captain flag, it is safe for visitors to read directly, with no private data to hide.

### 2.4 `team_requests`

*Why:* the heart of Team Request. One row per "I need N more people".

| Column | Type | Key | Required | Default | Notes |
|---|---|---|---|---|---|
| id | uuid | **PK** | Yes | `gen_random_uuid()` | |
| creator_id | uuid | **FK** → `users(id)` | Yes | — | Who posted it |
| sport_id | uuid | **FK** → `sports(id)` | No* | — | *Required when type is `sport` |
| type | text | | Yes | — | `sport`, `hackathon`, `event`, `fitness` |
| title | text | | Yes | — | e.g. "Need 2 for football" |
| description | text | | No | — | |
| skill_tags | text[] | | No | `{}` | e.g. `{frontend,design}` |
| people_needed | smallint | | Yes | — | More than 0 |
| people_joined | smallint | | Yes | `0` | Updated only by the join function |
| scheduled_time | timestamptz | | Yes | — | When it happens |
| status | text | | Yes | `'open'` | `open`, `filled`, `closed` |
| created_at | timestamptz | | Yes | `now()` | |

**What `people_needed` means:** how many *other* people you want. The creator is not counted, so "Need 2 for football" fills after 2 people join.

### 2.5 `request_joins`

*Why:* the link table that says who joined which request.

| Column | Type | Key | Required | Default | Notes |
|---|---|---|---|---|---|
| id | uuid | **PK** | Yes | `gen_random_uuid()` | |
| request_id | uuid | **FK** → `team_requests(id)` | Yes | — | |
| user_id | uuid | **FK** → `users(id)` | Yes | — | |
| joined_at | timestamptz | | Yes | `now()` | |

Rule: the pair (`request_id`, `user_id`) must be unique, so nobody can join the same request twice.

---

## 3. Indexes

An index is like the index at the back of a book: it makes common searches fast. You don't need many.

| Index | Speeds up |
|---|---|
| `roster_entries (sport_id)` | Loading a sport's roster |
| `team_requests (status, scheduled_time)` | The main "open requests, soonest first" list |
| `team_requests (sport_id)` | Open requests on a sport page |
| `request_joins (user_id)` | "Requests I've joined" |

The unique rule on `request_joins (request_id, user_id)` already creates an index for looking up who joined a request, and primary keys are indexed automatically.

---

## 4. Example Records

IDs are shortened here for readability; real ones are long UUIDs like `3f2b8c1e-...`.

### `sports`
| id | name | category | coach_name |
|---|---|---|---|
| sp-01 | Football | men | Mr. Sharma |
| sp-02 | Cricket | men | Mr. Rao |
| sp-03 | Throwball | women | Ms. Iyer |
| sp-04 | Athletics | women | Ms. Das |

### `roster_entries`
| id | sport_id | player_name | position | is_captain | user_id |
|---|---|---|---|---|---|
| r-01 | sp-01 | Arjun K | Goalkeeper | true | *(empty)* |
| r-02 | sp-01 | Ravi M | Defender | false | u-003 |
| r-03 | sp-01 | Imran S | Striker | false | *(empty)* |
| r-04 | sp-03 | Meera P | Setter | true | *(empty)* |

### `users`
| id | name | department | year | interests | is_admin |
|---|---|---|---|---|---|
| u-001 | Dhruv | CSE | 3 | {football,hackathons} | true |
| u-002 | Ananya | ECE | 1 | {running,badminton} | false |
| u-003 | Ravi M | CSE | 2 | {football} | false |

### `team_requests`
| id | creator_id | sport_id | type | title | people_needed | people_joined | scheduled_time | status |
|---|---|---|---|---|---|---|---|---|
| q-01 | u-001 | sp-01 | sport | Need 2 for football | 2 | 1 | 2026-10-18 18:00 | open |
| q-02 | u-002 | *(empty)* | fitness | 5K run Sunday morning | 3 | 0 | 2026-10-18 06:30 | open |
| q-03 | u-001 | *(empty)* | hackathon | Need 2 more for hackathon team (frontend, design) | 2 | 2 | 2026-10-25 09:00 | filled |

### `request_joins`
| id | request_id | user_id | joined_at |
|---|---|---|---|
| j-01 | q-01 | u-003 | 2026-10-16 10:15 |
| j-02 | q-03 | u-002 | 2026-10-16 11:02 |
| j-03 | q-03 | u-003 | 2026-10-16 11:40 |

Notice `q-01` shows `people_joined = 1` and has one row in `request_joins`; `q-03` is `filled` because 2 of 2 spots are taken. The counts always match the join rows.

---

## 5. SQL Schema

Run this whole block once in the **Supabase SQL Editor** on a new project. It is ordered so nothing refers to something that doesn't exist yet.

```sql
-- =====================================================
-- 1. TABLES
-- =====================================================

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
  creator_id      uuid not null references users(id) on delete cascade,
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
```

### Starter data (optional, run after the block above)

No student accounts are needed for this, which is the benefit of `player_name` being plain text.

```sql
insert into sports (name, category, coach_name) values
  ('Football',   'men',   'Mr. Sharma'),
  ('Cricket',    'men',   'Mr. Rao'),
  ('Volleyball', 'men',   'Mr. Nair'),
  ('Throwball',  'women', 'Ms. Iyer'),
  ('Basketball', 'mixed', 'Mr. Khan'),
  ('Athletics',  'men',   'Ms. Das'),
  ('Athletics',  'women', 'Ms. Das');

insert into roster_entries (sport_id, player_name, position, is_captain)
select id, 'Arjun K', 'Goalkeeper', true  from sports where name = 'Football' and category = 'men';
insert into roster_entries (sport_id, player_name, position, is_captain)
select id, 'Imran S', 'Striker',    false from sports where name = 'Football' and category = 'men';
```

### Make yourself the admin
Sign up on your site first, then run this in the SQL Editor (the editor ignores the column restrictions, which is why it works):

```sql
update users set is_admin = true where id = '<your-user-id>';
```
Find your ID in Supabase → Authentication → Users.

---

## 6. How the Frontend Uses This (quick reference)

| What the page needs | Call |
|---|---|
| List of sports | `supabase.from('sports').select('*')` |
| Sport roster | `supabase.from('roster_entries').select('*').eq('sport_id', id)` |
| Open requests, soonest first | `supabase.from('team_requests').select('*').eq('status','open').order('scheduled_time')` |
| Create a request | `supabase.from('team_requests').insert({...})` (only the form fields) |
| Join a request | `supabase.rpc('join_request', { p_request_id: id })` |
| Who joined (members only) | `supabase.from('request_joins').select('*, users(name, department, year)').eq('request_id', id)` |

`join_request` errors come back as readable codes (`ALREADY_JOINED`, `REQUEST_NOT_OPEN`, ...), so the page can show a friendly message for each.

---

## 7. What Changed From the Earlier Schema (and why)

| Change | Reason |
|---|---|
| Captain moved from `sports.captain_id` to `roster_entries.is_captain` | One less link to keep consistent, and a captain is automatically on the roster |
| `roster_entries` now stores `player_name`, with `user_id` optional | Admin can list players who haven't signed up |
| Removed the `public_roster` view | No longer needed; the roster holds no private data |
| Removed the `update_people_joined` trigger | `join_request()` now updates the count itself, in one place |
| No insert policy on `request_joins` | Prevents anyone from joining by skipping the capacity check |
| `request_joins` read rule now lets **all members** see each other | The earlier rule only let a member see their own row, which broke the member list |
| Column-level permissions added | Stops users setting `is_admin`, `people_joined`, or `status` themselves |

---

## 8. Known Limits (say these honestly in a demo)

- Past requests stay in the table. Filter with `scheduled_time > now()` on the list page, or close old ones by hand.
- The creator can edit `status`, so a creator could reopen a filled request. Fine for a hackathon; tighten later.
- There is no "leave a request" action yet; add a `leave_request()` function in v2.
- No email verification, so the college-email check is a form-level convenience only.
- I haven't run this SQL against a live Supabase project. Run it in the SQL Editor and send me any error message, and I'll fix it.
