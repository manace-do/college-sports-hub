# Sports Hub — Hackathon Architecture

*Written for a beginner team (HTML, CSS, JavaScript) building with an AI coding agent.*

**The one-sentence version:** a Next.js website that talks directly to a Supabase database, hosted on Vercel. Three services, no servers to manage, no AI model needed.

---

## 0. How to Read This Document

Every decision follows the same format: **what we chose, why, and what we deliberately did not choose.** The guiding rule is: if a tool doesn't directly help build a feature in the PRD, it isn't here.

---

## 1. Recommended Tech Stack

| Part | Choice | Why (in plain language) |
|---|---|---|
| Website (frontend) | **Next.js** (React) | It's a toolkit for building websites out of reusable pieces. It also handles page URLs (like `/sports/football`) for you, so you don't wire that up by hand. |
| Styling | **Tailwind CSS** | Instead of writing a separate CSS file, you put short class names right on the element (`class="bg-blue-500 p-4"`). AI agents are very good at it, and it looks tidy on phones by default. |
| Database + login + API | **Supabase** | One service that gives you a real database, user sign-up/login, and a ready-made way for your website to read and write data. This replaces a whole backend. |
| Hosting | **Vercel** | You push code to GitHub and your site goes live automatically. Free for this size of project. |
| Code storage | **GitHub** | Stores your code, lets teammates work together, and triggers Vercel to deploy. |

**What we deliberately did not choose, and why**
- **A separate backend (Express, Django, etc.):** Supabase already does what a small backend would. A second server means more things to run, break, and explain.
- **TypeScript:** it's extra to learn. Plain JavaScript is fine for a hackathon.
- **Redux or other state libraries:** React's built-in tools are enough.
- **Docker, Kubernetes, microservices:** solving problems you don't have.
- **A different database for each feature:** one database is easier and enough.

**One honest note about Next.js:** you know HTML/CSS/JS, and Next.js adds React on top. The AI agent will write most of the React, but your team should read through each page so you can explain it. If your team finds React too much, the fallback in section 13 is plain HTML + JavaScript pages talking to Supabase; the database and security design stay identical.

---

## 2. Frontend Architecture

### The idea
The website is made of **pages** (what URL shows what) and **components** (small reusable pieces, like a "sport card" or a "request card"). Pages are built by putting components together, the same way you'd build a page from HTML blocks, except you can reuse the blocks.

### Pages (one per screen in the user journeys)

| URL | What it shows | Who can see it |
|---|---|---|
| `/` | List of sports | Everyone (visitors too) |
| `/sports/[id]` | One sport: coach, captain, roster, open requests for that sport | Everyone |
| `/requests` | All open Team Requests with filters | Everyone |
| `/requests/[id]` | One request: details, Join button, member list | Details: everyone. Member list: members only |
| `/requests/new` | Form to create a request | Logged-in only |
| `/profile` | Edit your own profile | Logged-in only |
| `/login` and `/signup` | Authentication screens | Visitors |
| `/admin` | Manage sports, roster, captain, coach | Admin only |

`[id]` means "this part of the URL changes", so `/sports/abc123` and `/sports/xyz789` use the same page file.

### How data gets to the screen
1. A page loads.
2. It asks Supabase for data using a small JavaScript library (`supabase-js`).
3. Supabase sends back the data.
4. The page draws it using components.

### The Instagram-style rule
Visitors can read anything public without logging in. When a visitor taps an action that changes something (Join, Create), the site sends them to `/login`. In code this is one small check: *"is there a logged-in user? If not, redirect."*

### State (keeping track of things on screen)
Use React's built-in `useState` for small things (form fields, filters) and one simple "who is logged in" helper shared across pages. Nothing more.

---

## 3. Backend Architecture

### The decision: there is no custom backend

This is the biggest simplification. Instead of writing your own server with API routes, the website talks straight to Supabase, and **the database itself enforces the rules** using Row-Level Security (RLS).

**Plain-language explanation of RLS:** imagine a school office where the filing clerk checks your ID before handing you any folder. RLS is that clerk, built into the database. Even if someone tampers with your website's code, the database still refuses requests they aren't allowed to make.

### What Supabase gives you automatically
- **Database** (PostgreSQL), where all data lives
- **Auto-generated API:** each table can be read and written from JavaScript with no endpoint code
- **Authentication:** sign-up, login, password reset, sessions
- **RLS:** the rules about who can read or change what

### The one piece of server-side logic: the Join function

Joining has a rule that must never break: *a request can't take more people than it needs, and two people tapping Join at the same instant must not both get the last spot.* The frontend can't be trusted with that, so we write **one small database function** called `join_request`:

1. Check the request is still open.
2. Check the user hasn't already joined.
3. Check there's still a free spot.
4. Add the user, update the count, and mark the request `filled` if it's now full.

The frontend calls it with one line (`supabase.rpc('join_request', { request_id })`). The AI agent can write the SQL; your job is to understand these four checks.

### Optional: Next.js API routes
If you ever need server-only code (for example, sending an email), Next.js can host it. For this PRD, you don't, so skip it.

---

## 4. Database Choice

**Chosen: PostgreSQL, through Supabase.**

**Why:** your data is naturally connected. A request has a creator, a sport, and many members. Relational databases are built for exactly that, using tables linked by IDs. It's also free, and SQL is a skill that interviewers recognise.

**Why not a "NoSQL" option like Firebase or MongoDB:** connected data (who joined what) is harder to keep consistent there, and counting spots safely is more awkward.

### Tables (all from the PRD)

| Table | What it stores |
|---|---|
| `users` | Profile info: name, department, year, interests, `is_admin` |
| `sports` | Football, Cricket, etc., plus coach name and captain |
| `roster_entries` | Which user plays which sport, and in what position |
| `team_requests` | Casual game/hackathon requests: type, title, people needed, time, status |
| `request_joins` | Who joined which request |

Plus one **view**, `public_roster`, which shows only name, position, and captain flag so visitors can see rosters without exposing private profile fields.

The full table definitions and SQL are in `Database-Schema.md`. Use that file as-is.

---

## 5. Authentication Approach

**Chosen: Supabase Auth with email and password.**

**How it works in plain language**
1. A student signs up with email and password.
2. Supabase stores the password safely (hashed, never readable) and creates a login session.
3. The website keeps the session so the student stays logged in.
4. Every request to the database automatically includes who the user is, which is what RLS uses to decide what's allowed.

**Roles**
- **Visitor:** not logged in. Read-only.
- **Student:** logged in. Can create and join requests, edit their own profile.
- **Admin:** a student with `is_admin = true`, set by hand in the Supabase dashboard for the one or two organisers.

**When a user signs up:** a small database trigger creates their row in `users` automatically, so the profile exists immediately.

**College email requirement (hackathon simplification):** check that the email ends with your college domain in the sign-up form. Be aware this is a convenience check only, because someone could bypass the form. It's fine for a hackathon demo; say so honestly if asked.

**What we skipped:** Google/social login, magic links, and email verification. They're nice but not needed to prove the idea. Supabase has them built in if you want to add one later.

---

## 6. External APIs / Services

| Service | Purpose | Cost |
|---|---|---|
| Supabase | Database, auth, API | Free tier |
| Vercel | Hosting | Free tier |
| GitHub | Code storage, triggers deploys | Free |

That's the whole list. No payment service, no map service, no email service, no SMS, no analytics. Supabase sends its own sign-up emails.

---

## 7. AI Model Integration

**Not required. We recommend none.**

The PRD's features are all data and access problems (browse, filter, join), not something a language model improves. Adding AI just to have it would add cost, failure points, and things to explain.

**The AI in this project is your coding agent**, which helps you write the code. Say that clearly in your demo; it's a good story.

**If judges ask "where's the AI?"** a sensible answer is: *"We used AI to build faster, and we kept the product simple because the problem is about access, not prediction. A natural v2 is suggesting requests a student might like, but we'd only add it after real usage data."*

---

## 8. Complete Request / Data Flow

### Flow 1 — A visitor browses a sport (no login)
```
Browser opens /sports/football
   → page asks Supabase: "get this sport" + "get public_roster for it" + "get open requests for it"
   → RLS says: sports, public_roster, and requests are readable by everyone → allowed
   → Supabase returns data
   → page draws coach, captain, roster, and request cards
```

### Flow 2 — Sign up
```
Student fills the sign-up form
   → website checks the email domain
   → website calls Supabase Auth: signUp(email, password)
   → Supabase creates the account + a login session
   → a database trigger creates a matching row in `users`
   → student is sent to /profile to fill in department, year, interests
```

### Flow 3 — Join a request
```
Student taps "Join" on /requests/[id]
   → website checks: logged in? (if not → redirect to /login)
   → website calls the database function join_request(request_id)
   → function checks: request open? not already joined? spot free?
        → if any check fails: returns an error, page shows a message
        → if all pass: inserts the join, updates the count, marks 'filled' if full
   → page refreshes and now shows the member list
```

### Flow 4 — Create a request
```
Student fills /requests/new and submits
   → website checks: logged in?
   → website inserts a row into team_requests with creator_id = their user id
   → RLS verifies creator_id matches the logged-in user → allowed
   → student is redirected to the new request page
```

### Flow 5 — Admin updates the roster
```
Admin opens /admin and adds a player to Football
   → website inserts into roster_entries
   → RLS checks: is this user an admin? yes → allowed (a normal student would be refused)
   → public sport page now shows the new player
```

### Flow 6 — Seeing the member list
```
Student opens a request they joined
   → website asks Supabase for request_joins for that request
   → RLS says: you can see joins only if you're a member or the creator → allowed
   → a non-member asking the same question gets back nothing
```

---

## 9. Folder Structure

```
sports-hub/
├── app/                          ← every page lives here (folder name = URL)
│   ├── page.js                    → "/"  list of sports
│   ├── layout.js                  → shared header/footer for all pages
│   ├── sports/
│   │   └── [id]/page.js           → "/sports/abc"  sport detail
│   ├── requests/
│   │   ├── page.js                → "/requests"  browse + filter
│   │   ├── new/page.js            → "/requests/new"  create form
│   │   └── [id]/page.js           → "/requests/abc"  request detail
│   ├── profile/page.js            → "/profile"
│   ├── login/page.js              → "/login"
│   ├── signup/page.js             → "/signup"
│   └── admin/page.js              → "/admin"
│
├── components/                    ← reusable building blocks
│   ├── Navbar.js
│   ├── SportCard.js
│   ├── RosterList.js
│   ├── RequestCard.js
│   ├── RequestForm.js
│   ├── JoinButton.js
│   ├── FilterBar.js
│   └── ProtectedRoute.js          → redirects visitors to /login
│
├── lib/
│   ├── supabaseClient.js          → connects the site to Supabase (one file)
│   └── auth.js                    → "who is logged in" helper
│
├── supabase/
│   └── schema.sql                 → all tables, RLS rules, view, trigger, join function
│
├── .env.local                     → your Supabase keys (never commit this file)
├── .gitignore
├── package.json                   → list of libraries the project uses
└── README.md
```

**Rule of thumb for beginners:** if it's a *screen*, it goes in `app/`. If it's a *piece used on several screens*, it goes in `components/`. If it's *talking to Supabase*, it goes in `lib/`.

---

## 10. Major Components

| Component | What it does |
|---|---|
| `Navbar` | Site header: links, and shows Login or Profile depending on whether someone is logged in |
| `SportCard` | One tile on the home page: sport name, category, link to the sport page |
| `RosterList` | Shows coach, captain highlighted, and the list of players for a sport |
| `RequestCard` | A summary of one request: title, sport, time, "1/2 joined" |
| `FilterBar` | Dropdowns for sport/type and a date picker; changes what the list shows |
| `RequestForm` | The create-request form, with simple validation |
| `JoinButton` | Checks login, calls `join_request`, shows success or error |
| `ProtectedRoute` | Wrapper that sends visitors to login for protected pages |
| `AdminPanel` | Simple forms to add sports, add players, set captain and coach |

If your team is short on time, the first six components cover most of the demo.

---

## 11. Security Considerations

Explained in beginner terms, with what to actually do.

1. **Turn on RLS for every table.** Without it, anyone with your public key can read or change anything. This is the most important setting in the whole project. The SQL in `Database-Schema.md` already does it.

2. **Two keys, only one is public.** Supabase gives you an *anon key* (safe to put in the website) and a *service role key* (bypasses all rules). **Never put the service role key in your website code or commit it to GitHub.** You don't need it for this project at all.

3. **Stop users making themselves admin.** Our RLS rule lets a user update their own profile row, and that row contains `is_admin`. A user could try to set it to `true`. Fix it by only allowing the safe columns to be updated:
   ```sql
   revoke update on users from authenticated;
   grant update (name, department, year, interests) on users to authenticated;
   ```
   Add this to your schema file. It's a small but real hole, and fixing it is a good talking point.

4. **Keep secrets out of GitHub.** Keys go in `.env.local`, which is listed in `.gitignore`. On Vercel, set the same values in the project's environment variable settings.

5. **Never trust the website for rules that matter.** Hiding the Admin button in the UI is not security. The database refuses admin actions from non-admins, and that's what protects you.

6. **The join rule lives in the database.** The `join_request` function prevents overfilling and double-joining even if two people tap at once.

7. **Protect private data.** Visitors only see names, positions, and captain flags (through `public_roster`). Department, year, interests, and email stay visible only to logged-in users, and the member list of a request only to its members.

8. **Validate inputs.** Check that required form fields are filled, `people_needed` is a positive number, and text lengths are reasonable. The database also has `check` rules as a second safety net.

9. **React escapes text for you.** Displaying user-written titles and descriptions is safe by default; don't use `dangerouslySetInnerHTML`.

10. **Honest limits for a hackathon:** no rate limiting, no email verification, no abuse reporting. State these as "known limits, planned for later" instead of hiding them.

---

## 12. Deployment Architecture

```
Developer laptop
     │  git push
     ▼
GitHub repository
     │  (automatic)
     ▼
Vercel  ──── builds and hosts the Next.js site ──── https://sports-hub.vercel.app
     │
     │  reads/writes data over HTTPS
     ▼
Supabase (hosted PostgreSQL + Auth) ──── always on, managed for you
```

### Steps, in order
1. **Create the Supabase project.** Copy the project URL and the anon key.
2. **Run `schema.sql`** in the Supabase SQL Editor (tables, RLS, view, trigger, join function, the `is_admin` fix).
3. **Seed data:** add the sports, coaches, and a few players by hand. Mark your own account `is_admin = true`.
4. **Create the Next.js project** locally and add the two environment variables to `.env.local`.
5. **Push to GitHub.**
6. **Connect the repo to Vercel**, and add the same two environment variables in Vercel's settings.
7. **Every push to `main` now deploys automatically.**

### Deploy early
Do steps 1–7 with a nearly empty page in the first hour. A live link from the start means deployment is never a last-minute surprise.

---

## 13. Hackathon Simplifications

What to cut or fake so you can finish and demo well. Everything here keeps the architecture the same and can be added properly later.

**Cut completely**
- Notifications, recurring requests, attendance tracking, player bios and photos
- Coach/captain logins (the admin manages everything)
- Chat (people coordinate on WhatsApp, which is fine for the demo)
- Analytics dashboards

**Simplify**
- **Roster entry:** seed it directly in the Supabase table editor and skip building the admin screen unless you have time. Admin page is the lowest priority in the demo.
- **College email check:** do the form-level check only.
- **Filters:** start with one filter (sport), add date if time remains.
- **Profile:** just name, department, year; interests can be a simple text field.
- **Design:** use Tailwind defaults and one colour. A clean, consistent page beats a fancy broken one.

**Build in this order (so you always have something demoable)**
1. Deploy a blank page
2. Sports list + sport detail (seeded data, public)
3. Sign up and login
4. Create request
5. Browse requests
6. Join request (with the `join_request` function)
7. Request detail with member list
8. Profile page
9. Admin page, if time remains

**If React is too much:** build the same thing as plain HTML pages with a `<script>` tag loading `supabase-js`. You'd lose automatic routing and reusable components, but the database, RLS, and `join_request` function are identical, so nothing else changes.

**What to say in your demo about the architecture, in 30 seconds:**
*"The site is built with Next.js and hosted on Vercel. It talks directly to Supabase, which gives us a PostgreSQL database and login. Instead of writing a backend, we put the rules in the database itself using Row-Level Security, so even if the website code were tampered with, the data stays protected. Visitors can browse freely like on Instagram, and logging in is only needed to interact."*
