# Sports Hub

> A college sports website where students can browse each sport's roster, captain, and coach, and find people for casual games and activities without having to ask anyone directly.

*Submission title: Sports Hub using Next.js and Supabase*

---

## Table of Contents

1. [Problem](#problem)
2. [Solution](#solution)
3. [Key Features](#key-features)
4. [Demo](#demo)
5. [Screenshots](#screenshots)
6. [Tech Stack](#tech-stack)
7. [Architecture Overview](#architecture-overview)
8. [Project Structure](#project-structure)
9. [Prerequisites](#prerequisites)
10. [Installation](#installation)
11. [Environment Variables](#environment-variables)
12. [Database Setup](#database-setup)
13. [How to Run the Frontend](#how-to-run-the-frontend)
14. [How to Run the Backend](#how-to-run-the-backend)
15. [API Documentation](#api-documentation)
16. [Testing](#testing)
17. [Deployment](#deployment)
18. [Future Improvements](#future-improvements)
19. [Team Members](#team-members)

---

## Problem

Students who want to play sports in college, officially or casually, have no clear, low-pressure way to get in. The only real path is social: you need to know someone who already plays, or be confident enough to walk up to a team and ask. This shuts out first-year students, introverts, and anyone whose friends don't play sports.

There is also no single place to see which sports the college offers, who is on each team, who captains it, or who coaches it. That information lives in WhatsApp groups, with the PT teacher, or in word of mouth.

## Solution

Sports Hub is one website with two connected parts:

1. **Sports Directory:** a page for each sport the college offers, showing the coach, captain, and current roster. It is maintained by an admin.
2. **Team Request:** a feature that lets any student post or join a casual request (for example "need 2 for football tonight" or "need 2 more for a hackathon team") with one tap, with no direct messaging or walking up to strangers.

Visitors can browse without an account, like scrolling Instagram. Logging in is only needed to interact.

## Key Features

**Sports Directory**
- List of sports offered by the college (Men's / Women's categories where applicable)
- Sport page with coach, captain, and the full roster
- Admin tools to add and update sports, players, captain, and coach

**Team Request**
- Sign up and log in
- Student profile (name, department, year, interests)
- Create a request: type (sport / hackathon / event / fitness), title, description, people needed, optional skill tags, time
- Browse and filter open requests by sport, type, and date
- Join a request with a single tap
- Member list that only the creator and the joined students can see
- Automatic status: open, filled, or closed
- Creator can edit or close their own request

**Access rules**
- Visitors (not logged in) can browse sports, rosters, and open requests
- Logged-in students can also create and join requests
- Admins manage the roster

## Demo

- **Live site:** `[ADD LIVE URL HERE]`
- **Demo video:** `[ADD VIDEO LINK HERE]`
- **Test login (optional):** `[ADD DEMO ACCOUNT HERE, or delete this line]`

## Screenshots

*To be added once the pages are built.*

| Page | Screenshot |
|---|---|
| Home (list of sports) | `[ADD SCREENSHOT]` |
| Sport page (roster, captain, coach) | `[ADD SCREENSHOT]` |
| Browse requests | `[ADD SCREENSHOT]` |
| Request detail and Join | `[ADD SCREENSHOT]` |
| Create a request | `[ADD SCREENSHOT]` |

## Tech Stack

| Part | Technology | Why |
|---|---|---|
| Frontend | Next.js (React) | Builds pages from reusable components and handles page URLs |
| Styling | Tailwind CSS | Short class names directly on elements; mobile-friendly |
| Database | PostgreSQL (via Supabase) | Data is naturally connected (sports, players, requests, joins) |
| Authentication | Supabase Auth | Built-in sign-up and login |
| API | Supabase auto-generated REST API | Removes the need for a separate backend server |
| Hosting | Vercel | Deploys automatically from GitHub |
| Version control | Git and GitHub | Code storage and teamwork |

## Architecture Overview

There is **no custom backend server**. The website talks directly to Supabase, and the database itself enforces who is allowed to do what using Row-Level Security (RLS).

```
Browser (Next.js pages)
        |
        |  supabase-js  (HTTPS)
        v
Supabase
  - PostgreSQL database
  - Auth (sign-up / login)
  - Auto-generated REST API
  - Row-Level Security (the rules)
        ^
        |
Vercel hosts the website
```

- **Reading:** visitors and students read data straight from Supabase.
- **Security:** RLS rules in the database decide who can read or change each table, so hiding a button in the website is never the only protection.
- **Joining a request:** handled by one database function, `join_request`, which checks the request is open, you haven't already joined, and a spot is free. It handles two people joining at the same moment safely.

Full details: [`Hackathon-Architecture.md`](./docs/Hackathon-Architecture.md)

## Project Structure

```
sports-hub/
├── app/                      # Pages (folder name = URL)
│   ├── page.js               # "/"  list of sports
│   ├── layout.js             # shared header/footer
│   ├── sports/[id]/page.js   # sport detail: roster and open requests
│   ├── requests/
│   │   ├── page.js           # browse and filter requests
│   │   ├── new/page.js       # create a request
│   │   └── [id]/page.js      # request detail, join, member list
│   ├── profile/page.js
│   ├── login/page.js
│   ├── signup/page.js
│   └── admin/page.js         # manage sports and roster
├── components/               # Reusable pieces
│   ├── Navbar.js
│   ├── SportCard.js
│   ├── RosterList.js
│   ├── RequestCard.js
│   ├── RequestForm.js
│   ├── JoinButton.js
│   ├── FilterBar.js
│   └── ProtectedRoute.js
├── lib/
│   ├── supabaseClient.js     # connects the site to Supabase
│   └── auth.js               # "who is logged in" helper
├── supabase/
│   └── schema.sql            # all tables, rules, functions
├── docs/                     # project documents (see API Documentation)
├── .env.local                # your keys (never commit this)
├── .gitignore
├── package.json
└── README.md
```

> This is the planned structure. Update it if your folders end up different.

## Prerequisites

Install these before you start:

- **Node.js** (LTS version) and **npm**: `[ADD VERSION YOU USE]`
- **Git**
- A **GitHub** account
- A **Supabase** account (free tier is enough)
- A **Vercel** account (only needed for deployment)
- A code editor, for example VS Code

## Installation

**1. Clone the repository**
```bash
git clone [ADD REPOSITORY URL]
cd sports-hub
```

**2. Install dependencies**
```bash
npm install
```

**3. Create a Supabase project**
Go to [supabase.com](https://supabase.com), create a new project, then open **Project Settings → API** and copy:
- the **Project URL**
- the **anon (public) key**

**4. Add your environment variables** (next section), then set up the database.

## Environment Variables

Create a file named `.env.local` in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

| Variable | Where to find it | Safe to expose in the browser? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon public key | Yes |

> **Never** put the Supabase **service role key** in the website code or commit it to GitHub. This project does not need it.
> `.env.local` must be listed in `.gitignore`.

## Database Setup

1. Open your Supabase project and go to the **SQL Editor**.
2. Copy the full SQL from [`Hackathon-Database-Schema.md`](./docs/Hackathon-Database-Schema.md) (section 5) into `supabase/schema.sql`, then paste it into the SQL Editor and run it. This creates the tables, indexes, security rules, the `join_request` function, and the profile trigger.
3. *(Optional)* Run the starter data block from the same document to add sample sports and players.
4. In Supabase go to **Authentication → Providers → Email** and switch **Confirm email** off, so students can log in right after signing up.
5. **Make yourself admin:** sign up on your site first, find your user ID under **Authentication → Users**, then run:
   ```sql
   update users set is_admin = true where id = '<your-user-id>';
   ```

**Tables:** `users`, `sports`, `roster_entries`, `team_requests`, `request_joins`

## How to Run the Frontend

```bash
npm run dev
```

The site runs at **http://localhost:3000**. Changes you save appear automatically in the browser.

## How to Run the Backend

There is **no separate backend to run**. Supabase hosts the database, login, and API for you, so once your `.env.local` is filled in and the database is set up, the frontend is all you start.

If you ever add server-only code (for example, sending emails), Next.js can host it inside this same project. This version doesn't need it.

## API Documentation

The API is Supabase's auto-generated REST API plus a database function. There are 18 endpoints covering authentication, profiles, sports, roster, team requests, and the member list. Each one is documented with method, URL, parameters, example request and response, errors, and status codes.

Full specification: [`Hackathon-API-Spec.md`](./docs/Hackathon-API-Spec.md)

Quick overview:

| Area | Endpoints |
|---|---|
| Authentication | Sign up, log in, log out |
| Profile | Get profile, update own profile |
| Sports | List, get one with roster, create (admin), update (admin) |
| Roster | Add player, edit player or set captain, remove player (all admin) |
| Team requests | List and filter, get one, create, edit or close, join, see who joined |

## Testing

No automated tests are set up yet: `[ADD TEST COMMAND HERE if you add tests]`

Until then, test by hand using this checklist (based on the features above):

**As a visitor (not logged in)**
- [ ] Home page lists the sports
- [ ] A sport page shows coach, captain, and roster
- [ ] The requests page lists open requests and filters work
- [ ] Tapping Join or Create sends you to the login page

**As a student**
- [ ] Sign up and log in work
- [ ] Profile can be edited
- [ ] Creating a request works and it appears in the list
- [ ] Joining a request works and the count goes up
- [ ] Joining the same request twice shows a clear message
- [ ] Joining a full or closed request shows a clear message
- [ ] A request marks itself "filled" when the last spot is taken
- [ ] Only joined students and the creator can see the member list
- [ ] You can close your own request
- [ ] You cannot edit someone else's request

**As an admin**
- [ ] Add a sport, add a player, and set a captain
- [ ] A normal student cannot change the roster

You can also test the API directly with the examples in the API specification, using `curl` or any API client such as Postman.

## Deployment

The site is deployed with **Vercel**, and the database runs on **Supabase**.

```
git push  →  GitHub  →  Vercel builds and hosts the site  →  talks to Supabase
```

**Steps**
1. Push your code to a GitHub repository.
2. In Vercel, click **Add New → Project** and import the repository.
3. Under **Environment Variables**, add the same two values from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**.
5. From now on, every push to the `main` branch deploys automatically.

**Tip:** deploy a nearly empty page on day one, so a live link exists from the start.

Live URL: `[ADD LIVE URL HERE]`

## Future Improvements

These are planned for later versions and are not part of the current version:

- "I'm interested" button on each sport page, so a student can show interest in a team and the captain or coordinator sees who is interested
- Notifications when a request fills or changes
- Coach and captain logins to manage their own roster
- Leave a request
- Recurring requests ("same time next week")
- Attendance tracking and a simple reliability indicator
- Player bios, photos, and basic stats
- Skill-based matching suggestions for hackathon requests
- Share a request link to WhatsApp
- Usage analytics for the admin
- Tournament brackets, fixtures, and results

## Team Members

| Name | Role | GitHub |
|---|---|---|
| `[NAME]` | `[ROLE]` | `[GITHUB LINK]` |
| `[NAME]` | `[ROLE]` | `[GITHUB LINK]` |
| `[NAME]` | `[ROLE]` | `[GITHUB LINK]` |

*Built with the help of an AI coding agent.*
