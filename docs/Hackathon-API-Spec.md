# Sports Hub: REST API Specification

*Based on the PRD, `Hackathon-Architecture.md`, and `Hackathon-Database-Schema.md`.*

---

## 0. How This API Works

### There is no custom backend, so the API is Supabase's

The architecture has no server of our own. Supabase automatically turns every database table into a REST API, and the database's security rules (RLS) decide who may do what. So the endpoints below are real, working URLs the moment you run the schema. You don't write any endpoint code.

| Part | URL prefix | What it is |
|---|---|---|
| Login and sign-up | `/auth/v1/...` | Supabase Auth |
| Tables | `/rest/v1/<table>` | Auto-generated from your tables |
| The join function | `/rest/v1/rpc/join_request` | Calls the database function |

In the frontend you will usually call these through the `supabase-js` library instead of raw URLs. Every endpoint below shows both, because the library is just a friendlier way of sending the same request.

### Base URL and placeholders

```
$SUPABASE_URL   = https://<your-project>.supabase.co
$ANON_KEY       = your project's public "anon" key (safe to put in the website)
$TOKEN          = the logged-in user's access_token (from the login response)
```

### Headers

| Header | When | Value |
|---|---|---|
| `apikey` | Always | `$ANON_KEY` |
| `Authorization` | Always | Visitors: `Bearer $ANON_KEY`. Logged-in users: `Bearer $TOKEN` |
| `Content-Type` | When sending a body | `application/json` |
| `Prefer` | On every write (POST/PATCH/DELETE on tables) | `return=representation`, so the response contains the saved row(s) |
| `Accept` | When you want exactly one row, not a list | `application/vnd.pgrst.object+json` |

`supabase-js` adds all of these for you.

### Who can call what

| Level | Meaning |
|---|---|
| **None** | Anyone, including visitors who are not logged in |
| **Logged-in** | Needs a valid `$TOKEN` |
| **Admin** | Logged-in, and the user has `is_admin = true` (enforced by the database) |

### Consistent conventions

- **Format:** JSON in, JSON out.
- **Lists:** reads return an array `[ ... ]`, which is `[]` when empty.
- **One item:** reads with the `Accept` header above return a single object.
- **Filtering:** `?column=eq.value` (equals), `gte.` (at least), `lte.` (at most).
- **Sorting:** `?order=column.asc` or `.desc`.
- **Paging:** `?limit=20&offset=0`.
- **IDs:** UUIDs. **Times:** ISO 8601 in UTC, for example `2026-10-18T12:30:00+00:00`.

### Success status codes used

| Code | Meaning | Used for |
|---|---|---|
| 200 | OK | Reads, updates, deletes (with `Prefer: return=representation`) |
| 201 | Created | Inserts |
| 204 | No Content | Logout, and join (success with nothing to return) |

### Error shapes

Database and table errors:
```json
{ "code": "23505", "details": "...", "hint": null, "message": "duplicate key value violates unique constraint ..." }
```
Login/sign-up errors:
```json
{ "code": 400, "error_code": "invalid_credentials", "msg": "Invalid login credentials" }
```
Have your frontend read `body.message ?? body.msg`. Exact code strings can differ slightly between Supabase versions, so when in doubt match on the **HTTP status plus the message text**.

### Error status codes used

| Code | Meaning in this API |
|---|---|
| 400 | Bad data: a required field missing, a value breaking a rule, an invalid ID format, or a join rule failing |
| 401 | Not logged in, token expired, or a visitor trying something that needs login |
| 403 | Logged in but not allowed (for example a non-admin writing the roster, or sending a protected field) |
| 406 | You asked for one item and there were zero (this is the "not found" case) |
| 409 | Conflict: a duplicate, or pointing at something that doesn't exist |
| 422 | Sign-up data refused (weak password, email already registered) |
| 429 | Too many requests (login/sign-up rate limit) |

### Two behaviours that surprise beginners

1. **A blocked update or delete can still return 200.** If the security rules hide a row from you, `PATCH` and `DELETE` don't error; they match zero rows and return `[]`. So after any update or delete, **check that the returned array is not empty**.
2. **Visitors get 401 on private tables**, not an empty list. Only `sports`, `roster_entries`, and `team_requests` are readable without login.

---

## Endpoint Index

| # | Method | URL | Purpose | Auth |
|---|---|---|---|---|
| 1.1 | POST | `/auth/v1/signup` | Create an account | None |
| 1.2 | POST | `/auth/v1/token?grant_type=password` | Log in | None |
| 1.3 | POST | `/auth/v1/logout` | Log out | Logged-in |
| 2.1 | GET | `/rest/v1/users?id=eq.{id}` | Get a profile | Logged-in |
| 2.2 | PATCH | `/rest/v1/users?id=eq.{id}` | Edit own profile | Logged-in |
| 3.1 | GET | `/rest/v1/sports` | List sports | None |
| 3.2 | GET | `/rest/v1/sports?id=eq.{id}` | Get one sport with its roster | None |
| 3.3 | POST | `/rest/v1/sports` | Create a sport | Admin |
| 3.4 | PATCH | `/rest/v1/sports?id=eq.{id}` | Update a sport (coach) | Admin |
| 4.1 | POST | `/rest/v1/roster_entries` | Add a player to a roster | Admin |
| 4.2 | PATCH | `/rest/v1/roster_entries?id=eq.{id}` | Edit a player or set captain | Admin |
| 4.3 | DELETE | `/rest/v1/roster_entries?id=eq.{id}` | Remove a player | Admin |
| 5.1 | GET | `/rest/v1/team_requests` | List and filter requests | None |
| 5.2 | GET | `/rest/v1/team_requests?id=eq.{id}` | Get one request | None |
| 5.3 | POST | `/rest/v1/team_requests` | Create a request | Logged-in |
| 5.4 | PATCH | `/rest/v1/team_requests?id=eq.{id}` | Edit or close own request | Logged-in |
| 5.5 | POST | `/rest/v1/rpc/join_request` | Join a request | Logged-in |
| 5.6 | GET | `/rest/v1/request_joins?request_id=eq.{id}` | See who joined | Logged-in (members only) |

18 endpoints in total. Each one maps to a PRD requirement (see section 6).

---

## 1. Authentication

### 1.1 Sign up

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/auth/v1/signup` |
| **Purpose** | Create a student account. A database trigger then creates the matching row in `users` automatically. |
| **Authentication** | None |

**Request parameters:** none.

**Request body**

| Field | Type | Required | Notes |
|---|---|---|---|
| email | string | Yes | Check your college domain in the form before sending |
| password | string | Yes | At least 6 characters |
| data.name | string | Yes | Becomes the profile name (the trigger reads it) |

**Example request**
```bash
curl -X POST "$SUPABASE_URL/auth/v1/signup" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "email": "ananya@college.edu", "password": "s3cret-pass", "data": { "name": "Ananya" } }'
```
`supabase-js`: `supabase.auth.signUp({ email, password, options: { data: { name } } })`

**Example success response: `200 OK`**
```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "v1.MR5...",
  "user": { "id": "aaaaaaaa-0000-4000-8000-000000000002", "email": "ananya@college.edu" }
}
```
If **Confirm email** is switched on in Supabase, the response is just the `user` object with no tokens, and the student must click an email link first. For the hackathon, switch it off (Authentication → Providers → Email).

**Possible error responses**

| Status | When | Example message |
|---|---|---|
| 400 / 422 | Email format invalid | `Unable to validate email address: invalid format` |
| 422 | Password too short or weak | `Password should be at least 6 characters` |
| 422 | Email already registered | `User already registered` |
| 429 | Too many sign-ups | `email rate limit exceeded` |

**Status codes:** 200 · 400 · 422 · 429

---

### 1.2 Log in

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/auth/v1/token?grant_type=password` |
| **Purpose** | Log in and get the access token used for every logged-in request. |
| **Authentication** | None |

**Request parameters**

| Parameter | In | Required | Value |
|---|---|---|---|
| grant_type | query | Yes | `password` |

**Request body**

| Field | Type | Required |
|---|---|---|
| email | string | Yes |
| password | string | Yes |

**Example request**
```bash
curl -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "email": "ananya@college.edu", "password": "s3cret-pass" }'
```
`supabase-js`: `supabase.auth.signInWithPassword({ email, password })`

**Example success response: `200 OK`**
```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "v1.MR5...",
  "user": { "id": "aaaaaaaa-0000-4000-8000-000000000002", "email": "ananya@college.edu" }
}
```
Keep `access_token` for later calls. `supabase-js` stores it and refreshes it automatically.

**Possible error responses**

| Status | When | Example message |
|---|---|---|
| 400 | Wrong email or password | `Invalid login credentials` |
| 400 | Email not confirmed (only if confirmation is on) | `Email not confirmed` |
| 429 | Too many attempts | `Too many requests` |

**Status codes:** 200 · 400 · 429

---

### 1.3 Log out

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/auth/v1/logout` |
| **Purpose** | End the current login session. |
| **Authentication** | Logged-in |

**Request parameters:** none. **Request body:** none.

**Example request**
```bash
curl -X POST "$SUPABASE_URL/auth/v1/logout" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $TOKEN"
```
`supabase-js`: `supabase.auth.signOut()`

**Example success response: `204 No Content`** (empty body)

**Possible error responses**

| Status | When | Example message |
|---|---|---|
| 401 | Token missing, invalid, or already expired | `invalid JWT` |

**Status codes:** 204 · 401

---

## 2. Profile

### 2.1 Get a profile

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/rest/v1/users?id=eq.{user_id}` |
| **Purpose** | Read one student's profile. The profile page uses your own ID; any logged-in student can read others (member lists use this). |
| **Authentication** | Logged-in |

**Request parameters**

| Parameter | In | Required | Notes |
|---|---|---|---|
| id | query | Yes | `eq.<user uuid>` |
| select | query | No | Columns to return; default is all |

**Request body:** none. Add header `Accept: application/vnd.pgrst.object+json` to get one object.

**Example request**
```bash
curl "$SUPABASE_URL/rest/v1/users?id=eq.aaaaaaaa-0000-4000-8000-000000000002&select=id,name,department,year,interests" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.pgrst.object+json"
```
`supabase-js`: `supabase.from('users').select('id,name,department,year,interests').eq('id', userId).single()`

**Example success response: `200 OK`**
```json
{
  "id": "aaaaaaaa-0000-4000-8000-000000000002",
  "name": "Ananya",
  "department": "ECE",
  "year": 1,
  "interests": ["running", "badminton"]
}
```

**Possible error responses**

| Status | When | Example |
|---|---|---|
| 400 | `id` is not a valid UUID | code `22P02`, `invalid input syntax for type uuid` |
| 401 | Visitor (not logged in) or expired token | `permission denied for table users` |
| 406 | No user with that ID | code `PGRST116`, `The result contains 0 rows` |

**Status codes:** 200 · 400 · 401 · 406

---

### 2.2 Update own profile

| | |
|---|---|
| **Method** | `PATCH` |
| **URL** | `/rest/v1/users?id=eq.{user_id}` |
| **Purpose** | Edit your profile fields. Only your own row can change, and only these four columns. |
| **Authentication** | Logged-in |

**Request parameters**

| Parameter | In | Required |
|---|---|---|
| id | query | Yes, `eq.<your user id>` |

**Request body** (send only what changes)

| Field | Type | Notes |
|---|---|---|
| name | string | Cannot be empty |
| department | string | |
| year | integer | 1 to 5 |
| interests | string[] | For example `["football","running"]` |

**Example request**
```bash
curl -X PATCH "$SUPABASE_URL/rest/v1/users?id=eq.aaaaaaaa-0000-4000-8000-000000000002" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{ "department": "ECE", "year": 2, "interests": ["running","badminton"] }'
```
`supabase-js`: `supabase.from('users').update({ department, year, interests }).eq('id', userId).select()`

**Example success response: `200 OK`**
```json
[
  {
    "id": "aaaaaaaa-0000-4000-8000-000000000002",
    "name": "Ananya",
    "department": "ECE",
    "year": 2,
    "interests": ["running", "badminton"],
    "is_admin": false,
    "created_at": "2026-10-16T09:12:00+00:00"
  }
]
```

**Possible error responses**

| Status | When | Example |
|---|---|---|
| 200 with `[]` | The `id` isn't yours, so nothing was changed | Treat an empty array as "not allowed" |
| 400 | `year` outside 1 to 5 | code `23514`, check constraint violated |
| 400 | `name` set to null | code `23502`, `null value in column "name"` |
| 401 | Not logged in or token expired | `JWT expired` |
| 403 | Body includes `is_admin`, `id`, or `created_at` | `permission denied for table users` |

**Status codes:** 200 · 400 · 401 · 403

---

## 3. Sports

### 3.1 List sports

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/rest/v1/sports` |
| **Purpose** | Show the list of sports on the home page. |
| **Authentication** | None |

**Request parameters**

| Parameter | In | Required | Notes |
|---|---|---|---|
| select | query | No | Default is all columns |
| order | query | No | Suggested: `name.asc` |

**Request body:** none.

**Example request**
```bash
curl "$SUPABASE_URL/rest/v1/sports?select=id,name,category,coach_name&order=name.asc" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY"
```
`supabase-js`: `supabase.from('sports').select('id,name,category,coach_name').order('name')`

**Example success response: `200 OK`**
```json
[
  { "id": "11111111-aaaa-4aaa-8aaa-000000000001", "name": "Basketball", "category": "mixed", "coach_name": "Mr. Khan" },
  { "id": "11111111-aaaa-4aaa-8aaa-000000000002", "name": "Cricket", "category": "men", "coach_name": "Mr. Rao" },
  { "id": "11111111-aaaa-4aaa-8aaa-000000000003", "name": "Football", "category": "men", "coach_name": "Mr. Sharma" }
]
```

**Possible error responses**

| Status | When | Example |
|---|---|---|
| 400 | Invalid `order` or `select` column | `column sports.xyz does not exist` |

**Status codes:** 200 · 400

---

### 3.2 Get one sport with its roster

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/rest/v1/sports?id=eq.{sport_id}&select=*,roster_entries(...)` |
| **Purpose** | The sport page: coach, plus every roster player with the captain first, in one call. |
| **Authentication** | None |

**Request parameters**

| Parameter | In | Required | Value |
|---|---|---|---|
| id | query | Yes | `eq.<sport uuid>` |
| select | query | Yes | `*,roster_entries(id,player_name,position,is_captain)` |
| roster_entries.order | query | No | `is_captain.desc,player_name.asc` |

**Request body:** none. Add header `Accept: application/vnd.pgrst.object+json`.

**Example request**
```bash
curl "$SUPABASE_URL/rest/v1/sports?id=eq.11111111-aaaa-4aaa-8aaa-000000000003&select=*,roster_entries(id,player_name,position,is_captain)&roster_entries.order=is_captain.desc,player_name.asc" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Accept: application/vnd.pgrst.object+json"
```
`supabase-js`:
```js
supabase.from('sports')
  .select('*, roster_entries(id,player_name,position,is_captain)')
  .eq('id', sportId)
  .order('is_captain', { referencedTable: 'roster_entries', ascending: false })
  .single()
```

**Example success response: `200 OK`**
```json
{
  "id": "11111111-aaaa-4aaa-8aaa-000000000003",
  "name": "Football",
  "category": "men",
  "coach_name": "Mr. Sharma",
  "created_at": "2026-10-16T08:00:00+00:00",
  "roster_entries": [
    { "id": "22222222-bbbb-4bbb-8bbb-000000000001", "player_name": "Arjun K", "position": "Goalkeeper", "is_captain": true },
    { "id": "22222222-bbbb-4bbb-8bbb-000000000003", "player_name": "Imran S", "position": "Striker", "is_captain": false }
  ]
}
```

**Possible error responses**

| Status | When | Example |
|---|---|---|
| 400 | `id` is not a valid UUID | code `22P02` |
| 406 | No sport with that ID | code `PGRST116` |

**Status codes:** 200 · 400 · 406

*The open requests for this sport come from endpoint 5.1 with `sport_id=eq.<id>`.*

---

### 3.3 Create a sport

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/rest/v1/sports` |
| **Purpose** | Add a sport to the directory. |
| **Authentication** | Admin |

**Request parameters:** none.

**Request body**

| Field | Type | Required | Notes |
|---|---|---|---|
| name | string | Yes | For example `Throwball` |
| category | string | No | `men`, `women`, or `mixed` (default `mixed`) |
| coach_name | string | No | |

**Example request**
```bash
curl -X POST "$SUPABASE_URL/rest/v1/sports" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{ "name": "Throwball", "category": "women", "coach_name": "Ms. Iyer" }'
```
`supabase-js`: `supabase.from('sports').insert({ name, category, coach_name }).select()`

**Example success response: `201 Created`**
```json
[
  {
    "id": "11111111-aaaa-4aaa-8aaa-000000000004",
    "name": "Throwball",
    "category": "women",
    "coach_name": "Ms. Iyer",
    "created_at": "2026-10-16T10:30:00+00:00"
  }
]
```

**Possible error responses**

| Status | When | Example |
|---|---|---|
| 400 | `name` missing | code `23502` |
| 400 | `category` not men/women/mixed | code `23514` |
| 401 | Not logged in | `permission denied for table sports` |
| 403 | Logged in but not admin | `new row violates row-level security policy for table "sports"` |
| 409 | Same name and category already exists | code `23505`, duplicate key |

**Status codes:** 201 · 400 · 401 · 403 · 409

---

### 3.4 Update a sport

| | |
|---|---|
| **Method** | `PATCH` |
| **URL** | `/rest/v1/sports?id=eq.{sport_id}` |
| **Purpose** | Change a sport's coach (or fix its name or category). |
| **Authentication** | Admin |

**Request parameters**

| Parameter | In | Required |
|---|---|---|
| id | query | Yes, `eq.<sport uuid>` |

**Request body** (send only what changes): `name`, `category`, `coach_name`.

**Example request**
```bash
curl -X PATCH "$SUPABASE_URL/rest/v1/sports?id=eq.11111111-aaaa-4aaa-8aaa-000000000003" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{ "coach_name": "Mr. Verma" }'
```
`supabase-js`: `supabase.from('sports').update({ coach_name }).eq('id', sportId).select()`

**Example success response: `200 OK`**
```json
[
  { "id": "11111111-aaaa-4aaa-8aaa-000000000003", "name": "Football", "category": "men", "coach_name": "Mr. Verma", "created_at": "2026-10-16T08:00:00+00:00" }
]
```

**Possible error responses**

| Status | When | Example |
|---|---|---|
| 200 with `[]` | Not an admin, or the sport doesn't exist | Treat an empty array as "not allowed or not found" |
| 400 | Invalid `category` or UUID | code `23514` or `22P02` |
| 401 | Not logged in | `permission denied for table sports` |
| 409 | New name and category clash with another sport | code `23505` |

**Status codes:** 200 · 400 · 401 · 409

---

## 4. Roster (admin-managed)

### 4.1 Add a player

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/rest/v1/roster_entries` |
| **Purpose** | Add an official player to a sport's team. The player doesn't need an account. |
| **Authentication** | Admin |

**Request parameters:** none.

**Request body**

| Field | Type | Required | Notes |
|---|---|---|---|
| sport_id | uuid | Yes | Which sport |
| player_name | string | Yes | |
| position | string | No | For example `Goalkeeper` |
| is_captain | boolean | No | Default `false`. Only one captain per sport |
| user_id | uuid | No | Link to the player's account, if they have one |

**Example request**
```bash
curl -X POST "$SUPABASE_URL/rest/v1/roster_entries" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{ "sport_id": "11111111-aaaa-4aaa-8aaa-000000000003", "player_name": "Ravi M", "position": "Defender" }'
```
`supabase-js`: `supabase.from('roster_entries').insert({ sport_id, player_name, position }).select()`

**Example success response: `201 Created`**
```json
[
  {
    "id": "22222222-bbbb-4bbb-8bbb-000000000002",
    "sport_id": "11111111-aaaa-4aaa-8aaa-000000000003",
    "player_name": "Ravi M",
    "position": "Defender",
    "is_captain": false,
    "user_id": null,
    "created_at": "2026-10-16T10:40:00+00:00"
  }
]
```

**Possible error responses**

| Status | When | Example |
|---|---|---|
| 400 | `sport_id` or `player_name` missing | code `23502` |
| 401 | Not logged in | `permission denied` |
| 403 | Logged in but not admin | `new row violates row-level security policy` |
| 409 | `sport_id` doesn't exist | code `23503`, foreign key violation |
| 409 | `is_captain: true` but the sport already has a captain | code `23505`, `one_captain_per_sport` |

**Status codes:** 201 · 400 · 401 · 403 · 409

---

### 4.2 Edit a player or set the captain

| | |
|---|---|
| **Method** | `PATCH` |
| **URL** | `/rest/v1/roster_entries?id=eq.{entry_id}` |
| **Purpose** | Change a player's name or position, or make them captain. |
| **Authentication** | Admin |

**Request parameters**

| Parameter | In | Required |
|---|---|---|
| id | query | Yes, `eq.<roster entry uuid>` |

**Request body** (send only what changes): `player_name`, `position`, `is_captain`, `user_id`.

**Changing the captain takes two calls:** first set the old captain's `is_captain` to `false`, then set the new one to `true`. Doing it the other way round returns a 409.

**Example request**
```bash
curl -X PATCH "$SUPABASE_URL/rest/v1/roster_entries?id=eq.22222222-bbbb-4bbb-8bbb-000000000002" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{ "position": "Centre-back" }'
```
`supabase-js`: `supabase.from('roster_entries').update({ position }).eq('id', entryId).select()`

**Example success response: `200 OK`**
```json
[
  { "id": "22222222-bbbb-4bbb-8bbb-000000000002", "sport_id": "11111111-aaaa-4aaa-8aaa-000000000003", "player_name": "Ravi M", "position": "Centre-back", "is_captain": false, "user_id": null }
]
```

**Possible error responses**

| Status | When | Example |
|---|---|---|
| 200 with `[]` | Not an admin, or the entry doesn't exist | Treat an empty array as "not allowed or not found" |
| 400 | Invalid UUID, or `player_name` set to null | code `22P02` or `23502` |
| 401 | Not logged in | `permission denied` |
| 409 | Setting a second captain on the same sport | code `23505`, `one_captain_per_sport` |

**Status codes:** 200 · 400 · 401 · 409

---

### 4.3 Remove a player

| | |
|---|---|
| **Method** | `DELETE` |
| **URL** | `/rest/v1/roster_entries?id=eq.{entry_id}` |
| **Purpose** | Take a player off a roster. |
| **Authentication** | Admin |

**Request parameters**

| Parameter | In | Required |
|---|---|---|
| id | query | Yes, `eq.<roster entry uuid>` |

**Request body:** none.

**Example request**
```bash
curl -X DELETE "$SUPABASE_URL/rest/v1/roster_entries?id=eq.22222222-bbbb-4bbb-8bbb-000000000002" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Prefer: return=representation"
```
`supabase-js`: `supabase.from('roster_entries').delete().eq('id', entryId).select()`

**Example success response: `200 OK`** (the removed row)
```json
[
  { "id": "22222222-bbbb-4bbb-8bbb-000000000002", "sport_id": "11111111-aaaa-4aaa-8aaa-000000000003", "player_name": "Ravi M", "position": "Centre-back", "is_captain": false, "user_id": null }
]
```

**Possible error responses**

| Status | When | Example |
|---|---|---|
| 200 with `[]` | Not an admin, or the entry doesn't exist, so nothing was deleted | Treat an empty array as "not allowed or not found" |
| 400 | Invalid UUID | code `22P02` |
| 401 | Not logged in | `permission denied` |

**Status codes:** 200 · 400 · 401

---

## 5. Team Requests

### 5.1 List and filter requests

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/rest/v1/team_requests` |
| **Purpose** | Browse requests. Powers the requests page, the sport page's request section, and "my requests". |
| **Authentication** | None |

**Request parameters** (all optional)

| Parameter | In | Example | Meaning |
|---|---|---|---|
| select | query | `*,sports(name)` | Include the sport's name in each row |
| status | query | `status=eq.open` | Only open requests |
| sport_id | query | `sport_id=eq.<uuid>` | One sport |
| type | query | `type=eq.hackathon` | `sport`, `hackathon`, `event`, or `fitness` |
| creator_id | query | `creator_id=eq.<uuid>` | Requests posted by one student |
| scheduled_time | query | `scheduled_time=gte.2026-10-16T00:00:00Z` | From a date; add a second `lte.` filter for a range |
| order | query | `order=scheduled_time.asc` | Soonest first |
| limit, offset | query | `limit=20&offset=0` | Paging |

**Request body:** none.

**Example request**
```bash
curl "$SUPABASE_URL/rest/v1/team_requests?select=*,sports(name)&status=eq.open&sport_id=eq.11111111-aaaa-4aaa-8aaa-000000000003&scheduled_time=gte.2026-10-16T00:00:00Z&order=scheduled_time.asc&limit=20" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY"
```
`supabase-js`:
```js
supabase.from('team_requests')
  .select('*, sports(name)')
  .eq('status', 'open').eq('sport_id', sportId)
  .gte('scheduled_time', new Date().toISOString())
  .order('scheduled_time').limit(20)
```

**Example success response: `200 OK`**
```json
[
  {
    "id": "33333333-cccc-4ccc-8ccc-000000000001",
    "creator_id": "aaaaaaaa-0000-4000-8000-000000000001",
    "sport_id": "11111111-aaaa-4aaa-8aaa-000000000003",
    "type": "sport",
    "title": "Need 2 for football",
    "description": "Casual evening match on the main ground",
    "skill_tags": [],
    "people_needed": 2,
    "people_joined": 1,
    "scheduled_time": "2026-10-18T12:30:00+00:00",
    "status": "open",
    "created_at": "2026-10-16T09:45:00+00:00",
    "sports": { "name": "Football" }
  }
]
```
For requests that aren't tied to a sport, `sports` is `null`.

**Possible error responses**

| Status | When | Example |
|---|---|---|
| 400 | Invalid UUID in `sport_id` or `creator_id` | code `22P02` |
| 400 | Invalid date in `scheduled_time` | code `22007` |
| 400 | Unknown column in `order` or `select` | `column team_requests.xyz does not exist` |

**Status codes:** 200 · 400

---

### 5.2 Get one request

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/rest/v1/team_requests?id=eq.{request_id}` |
| **Purpose** | The request detail page: description, spots filled, status. |
| **Authentication** | None |

**Request parameters**

| Parameter | In | Required | Value |
|---|---|---|---|
| id | query | Yes | `eq.<request uuid>` |
| select | query | No | `*,sports(name)` |

**Request body:** none. Add header `Accept: application/vnd.pgrst.object+json`.

**Example request**
```bash
curl "$SUPABASE_URL/rest/v1/team_requests?id=eq.33333333-cccc-4ccc-8ccc-000000000001&select=*,sports(name)" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Accept: application/vnd.pgrst.object+json"
```
`supabase-js`: `supabase.from('team_requests').select('*, sports(name)').eq('id', requestId).single()`

**Example success response: `200 OK`**
```json
{
  "id": "33333333-cccc-4ccc-8ccc-000000000001",
  "creator_id": "aaaaaaaa-0000-4000-8000-000000000001",
  "sport_id": "11111111-aaaa-4aaa-8aaa-000000000003",
  "type": "sport",
  "title": "Need 2 for football",
  "description": "Casual evening match on the main ground",
  "skill_tags": [],
  "people_needed": 2,
  "people_joined": 1,
  "scheduled_time": "2026-10-18T12:30:00+00:00",
  "status": "open",
  "created_at": "2026-10-16T09:45:00+00:00",
  "sports": { "name": "Football" }
}
```

**Possible error responses**

| Status | When | Example |
|---|---|---|
| 400 | `id` is not a valid UUID | code `22P02` |
| 406 | No request with that ID | code `PGRST116` |

**Status codes:** 200 · 400 · 406

---

### 5.3 Create a request

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/rest/v1/team_requests` |
| **Purpose** | Post "I need N more people". Starts as `open` with 0 joined. |
| **Authentication** | Logged-in |

**Request parameters:** none.

**Request body**

| Field | Type | Required | Notes |
|---|---|---|---|
| creator_id | uuid | Yes | Must equal your own user ID |
| type | string | Yes | `sport`, `hackathon`, `event`, or `fitness` |
| sport_id | uuid | Required if `type` is `sport` | Optional otherwise |
| title | string | Yes | |
| description | string | No | |
| skill_tags | string[] | No | For example `["frontend","design"]` |
| people_needed | integer | Yes | More than 0. Doesn't count you |
| scheduled_time | string | Yes | ISO 8601 time |

Do **not** send `people_joined` or `status`. The database controls them.

**Example request**
```bash
curl -X POST "$SUPABASE_URL/rest/v1/team_requests" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "creator_id": "aaaaaaaa-0000-4000-8000-000000000001",
    "type": "sport",
    "sport_id": "11111111-aaaa-4aaa-8aaa-000000000003",
    "title": "Need 2 for football",
    "description": "Casual evening match on the main ground",
    "people_needed": 2,
    "scheduled_time": "2026-10-18T18:00:00+05:30"
  }'
```
`supabase-js`: `supabase.from('team_requests').insert({ creator_id, type, sport_id, title, description, people_needed, scheduled_time }).select()`

**Example success response: `201 Created`**
```json
[
  {
    "id": "33333333-cccc-4ccc-8ccc-000000000001",
    "creator_id": "aaaaaaaa-0000-4000-8000-000000000001",
    "sport_id": "11111111-aaaa-4aaa-8aaa-000000000003",
    "type": "sport",
    "title": "Need 2 for football",
    "description": "Casual evening match on the main ground",
    "skill_tags": [],
    "people_needed": 2,
    "people_joined": 0,
    "scheduled_time": "2026-10-18T12:30:00+00:00",
    "status": "open",
    "created_at": "2026-10-16T09:45:00+00:00"
  }
]
```

**Possible error responses**

| Status | When | Example |
|---|---|---|
| 400 | A required field is missing | code `23502`, `null value in column "title"` |
| 400 | `people_needed` is 0 or less, `type` is invalid, or `type` is `sport` with no `sport_id` | code `23514`, check constraint violated |
| 401 | Not logged in, or token expired | `permission denied for table team_requests` / `JWT expired` |
| 403 | `creator_id` is not your own ID | `new row violates row-level security policy` |
| 403 | Body includes `people_joined` or `status` | `permission denied for table team_requests` |
| 409 | `sport_id` doesn't exist | code `23503`, foreign key violation |

**Status codes:** 201 · 400 · 401 · 403 · 409

---

### 5.4 Edit or close your request

| | |
|---|---|
| **Method** | `PATCH` |
| **URL** | `/rest/v1/team_requests?id=eq.{request_id}` |
| **Purpose** | Edit the details of your own request, or close it by setting `status` to `closed`. |
| **Authentication** | Logged-in (creator only) |

**Request parameters**

| Parameter | In | Required |
|---|---|---|
| id | query | Yes, `eq.<request uuid>` |

**Request body** (send only what changes)

| Field | Type | Notes |
|---|---|---|
| title | string | |
| description | string | |
| skill_tags | string[] | |
| scheduled_time | string | ISO 8601 |
| status | string | Use `closed` to close it |

`people_needed` and `people_joined` can't be changed in v1.

**Example request** (close a request)
```bash
curl -X PATCH "$SUPABASE_URL/rest/v1/team_requests?id=eq.33333333-cccc-4ccc-8ccc-000000000001" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{ "status": "closed" }'
```
`supabase-js`: `supabase.from('team_requests').update({ status: 'closed' }).eq('id', requestId).select()`

**Example success response: `200 OK`**
```json
[
  {
    "id": "33333333-cccc-4ccc-8ccc-000000000001",
    "title": "Need 2 for football",
    "people_needed": 2,
    "people_joined": 1,
    "status": "closed",
    "scheduled_time": "2026-10-18T12:30:00+00:00"
  }
]
```
(Shortened here; the real response includes every column.)

**Possible error responses**

| Status | When | Example |
|---|---|---|
| 200 with `[]` | The request isn't yours, or doesn't exist | Treat an empty array as "not allowed or not found" |
| 400 | `status` not open/filled/closed | code `23514` |
| 400 | Invalid UUID | code `22P02` |
| 401 | Not logged in, or token expired | `JWT expired` |
| 403 | Body includes `people_needed`, `people_joined`, or `creator_id` | `permission denied for table team_requests` |

**Status codes:** 200 · 400 · 401 · 403

---

### 5.5 Join a request

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/rest/v1/rpc/join_request` |
| **Purpose** | Join with one tap. The database function checks the request is open, you haven't joined, and a spot is free; adds you; and marks the request `filled` when the last spot goes. Two people tapping at the same instant are handled one at a time. |
| **Authentication** | Logged-in |

**Request parameters:** none.

**Request body**

| Field | Type | Required |
|---|---|---|
| p_request_id | uuid | Yes |

**Example request**
```bash
curl -X POST "$SUPABASE_URL/rest/v1/rpc/join_request" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "p_request_id": "33333333-cccc-4ccc-8ccc-000000000001" }'
```
`supabase-js`: `supabase.rpc('join_request', { p_request_id: requestId })`

**Example success response: `204 No Content`** (empty body). Some Supabase versions return `200` with an empty body, so treat any 2xx as success. Then refetch the request (5.2) to show the new count.

**Possible error responses.** Join rule failures come back as `400` with the rule name in `message`:

| Status | `message` | Meaning | Suggested text |
|---|---|---|---|
| 400 | `REQUEST_NOT_FOUND` | No request with that ID | "This request no longer exists." |
| 400 | `REQUEST_NOT_OPEN` | It is already filled or closed | "Sorry, this request is full or closed." |
| 400 | `CREATOR_CANNOT_JOIN` | You posted this request | "You can't join your own request." |
| 400 | `ALREADY_JOINED` | You are already in | "You've already joined this one." |
| 400 | `invalid input syntax for type uuid` | Malformed ID (code `22P02`) | "Something went wrong. Try again." |
| 401 | `permission denied for function join_request` | Visitor, or token expired | Send them to the login page |
| 404 | `Could not find the function ... in the schema cache` | Body missing `p_request_id` (code `PGRST202`) | A bug in the page, fix the call |

**Status codes:** 204 · 400 · 401 · 404

---

### 5.6 See who joined

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/rest/v1/request_joins?request_id=eq.{request_id}` |
| **Purpose** | The member list on a request's detail page. Only the creator and the students who joined can see it. |
| **Authentication** | Logged-in (members only) |

**Request parameters**

| Parameter | In | Required | Value |
|---|---|---|---|
| request_id | query | Yes | `eq.<request uuid>` |
| select | query | Yes | `id,joined_at,users(id,name,department,year)` |
| order | query | No | `joined_at.asc` |

**Request body:** none.

**Example request**
```bash
curl "$SUPABASE_URL/rest/v1/request_joins?request_id=eq.33333333-cccc-4ccc-8ccc-000000000001&select=id,joined_at,users(id,name,department,year)&order=joined_at.asc" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $TOKEN"
```
`supabase-js`: `supabase.from('request_joins').select('id, joined_at, users(id,name,department,year)').eq('request_id', requestId).order('joined_at')`

**Example success response: `200 OK`**
```json
[
  {
    "id": "44444444-dddd-4ddd-8ddd-000000000001",
    "joined_at": "2026-10-16T10:15:00+00:00",
    "users": { "id": "aaaaaaaa-0000-4000-8000-000000000003", "name": "Ravi M", "department": "CSE", "year": 2 }
  }
]
```
The creator isn't in this list, because they didn't "join". Show the creator separately using `creator_id` from 5.2 and profile endpoint 2.1.

**Possible error responses**

| Status | When | Example |
|---|---|---|
| 200 with `[]` | You are not the creator or a member of this request, or nobody has joined yet | Show "Join to see who's in" |
| 400 | `request_id` is not a valid UUID | code `22P02` |
| 401 | Visitor (not logged in), or token expired | `permission denied for table request_joins` |

**Status codes:** 200 · 400 · 401

---

## 6. PRD Coverage Check

| PRD requirement | Endpoint(s) |
|---|---|
| FR-1 Sign up and log in | 1.1, 1.2, 1.3 |
| FR-2 Create and edit profile | 2.1, 2.2 |
| FR-3 Student and admin roles | No endpoint; the `is_admin` flag and database rules |
| FR-4 List sports | 3.1 |
| FR-5 Sport page with coach, captain, roster | 3.2 |
| FR-6 Admin manages sports, roster, captain, coach | 3.3, 3.4, 4.1, 4.2, 4.3 |
| FR-7 Create a request | 5.3 |
| FR-8 Browse and filter requests | 5.1 |
| FR-9 Join with one action | 5.5 |
| FR-10 No joining twice | 5.5 (`ALREADY_JOINED`) |
| FR-11 Count updates and request fills automatically | 5.5 (done inside the function) |
| FR-12 Member list visible to members only | 5.6 |
| FR-13 Creator edits or closes a request | 5.4 |
| FR-14 Status: open, filled, closed | Returned by 5.1 and 5.2 |
| FR-15 Visitors browse, login to act | "Authentication" column throughout |
| FR-16 Roster writes are admin-only | Enforced by the database; see 3.3 to 4.3 errors |

## 7. Left Out on Purpose

Not in the PRD, so not built: deleting a request (close it instead), leaving a request, deleting a sport, password reset, searching users, notifications, "requests I've joined", and the "I'm interested" button (a nice-to-have). Each can be added later with one more table query, or one more database function like `join_request`.

## 8. Handy Note: a Small Optional Simplification

Right now, creating a request needs the client to send `creator_id`. If you run this one line in the SQL Editor, the database fills it in automatically and the page can stop sending it (and the 403 "wrong creator_id" error disappears):

```sql
alter table team_requests alter column creator_id set default auth.uid();
```
