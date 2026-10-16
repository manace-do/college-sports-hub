# Product Requirements Document (PRD)

---

## 1. Product Name

**Sports Hub**

*Submission title: Sports Hub using Next.js and Supabase*

---

## 2. One-Line Product Description

A college sports website where students can browse each sport's official roster, captain, and coach, and use Team Request to find people for casual games and activities without having to ask anyone directly.

---

## 3. Problem Statement

Students who want to play sports in college, officially or casually, have no clear, low-pressure way to get in. The only real path is social: you need to know someone who already plays, or be confident enough to walk up to a team and ask. This shuts out first-year students, introverts, and anyone whose friends don't play sports.

At the same time, there is no single place to see which sports the college offers, who is on each team, who captains it, or who coaches it. That information lives in WhatsApp groups, with the PT teacher, or in word of mouth, and it is often incomplete or out of date.

The result is that interested students lose months or even years before they get involved, and teams recruit only from the circle of people they already know.

---

## 4. Target Users

| User type | Description | Primary need |
|---|---|---|
| New / introverted student | Wants to play but doesn't know where to start or who to ask | A way to join without a direct social ask |
| Student outside the sports circle | Friends don't play, so never hears about games or trials | Visibility into what exists and how to join |
| Student short on players | Has a group, needs 1–2 more people for a casual game | A fast way to fill the gap |
| Hackathon / event team builder | Needs specific people or skills by a date | Find teammates without asking one by one |
| Any student | Curious who is on which team | A reliable, central roster per sport |
| Admin (v1) | Maintains official roster data | A simple way to add and update players, captain, and coach |

---

## 5. User Pain Points

1. **No visible entry point.** Students don't know where to go or who to talk to to start playing.
2. **Unreliable official channel.** The sports room or PT teacher may be unresponsive, so there is no dependable first contact.
3. **Access depends on friends.** Having a friend who already plays is effectively the entry ticket.
4. **Social ask is a barrier.** Walking up to a group of strangers is hard for shy or new students.
5. **Scattered information.** Rosters, captains, and coaches aren't listed anywhere central.
6. **Spamming to fill a game.** Students short on players message multiple WhatsApp groups and hope someone is free.
7. **Hidden talent.** Teams never see students who would have joined if there had been an easy way to say so.

---

## 6. Proposed Solution

Sports Hub is one website with two connected parts:

1. **Sports Directory** — a browsable page for each sport the college offers (Football, Cricket, Volleyball, Throwball, Basketball, Athletics Men/Women, etc.), showing the coach, captain, and current roster. Maintained by an admin in v1.
2. **Team Request** — a feature inside the site that lets any student post or join a casual request ("need 2 for football at 6 PM", "need 2 more for a hackathon team") with one tap, with no direct messaging or walking up to strangers.

The directory answers "who plays for my college and who do I talk to." Team Request answers "how do I get in even if I don't know anyone."

---

## 7. Product Goals

- Give the college one credible source of truth for each sport
- Let any student find and join casual games and activities without a direct social ask
- Make Team Request feel like a natural part of browsing a sport, not a separate tool
- Reduce the time between "I want to play" and "I'm playing"
- Prove the concept with real student usage before expanding scope

---

## 8. User Stories

- As a new student, I want to browse official team rosters so that I know who to look for if I want to play a sport.
- As an introverted student, I want to join a game request with one tap so that I don't have to ask a stranger directly.
- As a student short on players, I want to post a request stating how many people I need so that others can find and join it without me messaging each person.
- As a hackathon team builder, I want to list the skills I need so that I only get matched with relevant people.
- As a student, I want to filter requests by sport and date so that I can quickly find something relevant.
- As a student, I want to see who else joined a request once I'm part of it so that I know who I'll be playing or working with.
- As a student, I want to create a profile with my department, year, and interests so that others know who is joining.
- As a request creator, I want to close or edit my request so that it doesn't stay open after plans change.
- As an admin, I want to add and update players, captains, and coaches for each sport so that the roster stays accurate.

---

## 9. Functional Requirements

**Accounts and profiles**
- FR-1: Users can sign up and log in with email (college email preferred).
- FR-2: Users can create and edit a profile: name, department, year, interests.
- FR-3: The system distinguishes two roles: student and admin.

**Sports Directory**
- FR-4: The system lists all sports offered, including Men's/Women's categories where applicable.
- FR-5: Each sport page shows the coach name, captain, and the list of official players with positions.
- FR-6: Only admins can create sports and add, edit, or remove roster entries, captain, and coach.

**Team Request**
- FR-7: A logged-in student can create a request with: type (sport / hackathon / event / fitness), linked sport (if applicable), title, description, people needed, optional skill tags, and scheduled time.
- FR-8: Students can browse open requests and filter by sport/type and date.
- FR-9: A logged-in student can join an open request in a single action.
- FR-10: A student cannot join the same request twice.
- FR-11: The joined count updates automatically, and the request becomes "filled" when the required number is reached.
- FR-12: Joined members are visible only to people who are part of the request (members and creator).
- FR-13: The creator can edit or close their own request.
- FR-14: Requests show a status: open, filled, or closed.

**Access control**
- FR-15: Anyone can browse sports and rosters; creating or joining requests requires login.
- FR-16: Write access to roster data is restricted to admins at the database level.

---

## 10. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Pages load in under 3 seconds on a typical college Wi-Fi or mobile connection; list and filter queries return within 1 second at expected scale |
| Scalability | Supports at least 1,000 registered students and 200 concurrent users on free-tier infrastructure |
| Usability | Mobile-first responsive design (most students will use phones); joining a request takes one tap after login |
| Security | Authentication via Supabase Auth; row-level security on all tables; admin actions enforced server-side and in the database; secrets kept in environment variables |
| Privacy | Joined-member lists are visible only to members; only the profile fields needed (name, department, year, interests) are shown to other students |
| Reliability | Target 99% availability during the evaluation and launch period; the join counter stays consistent when two people join at once |
| Maintainability | Documented schema, API, and README; code kept in GitHub with automatic deployment |
| Cost | Runs entirely on free tiers (Vercel + Supabase) for v1 |
| Accessibility | Readable contrast, keyboard-navigable forms, and clear labels |

---

## 11. Core Features

1. **Sports list:** all sports offered, grouped by category
2. **Sport detail page:** coach, captain, and roster per sport
3. **Admin roster management:** add, edit, remove players; set captain and coach
4. **Authentication:** sign up and login
5. **Student profile:** name, department, year, interests
6. **Create Team Request:** type, sport, title, description, people needed, time
7. **Browse and filter requests:** by sport/type and date
8. **Join a request:** one tap, no messaging
9. **Request detail:** member list visible after joining
10. **Status tracking:** open, filled, closed, updated automatically

---

## 12. Nice-to-Have Features

- **"I'm interested" button on each sport page:** a student taps once to signal interest in a team, and the captain or coordinator sees a list of interested students. This targets the original problem of wanting to join the official team without a direct ask.
- In-app notification when a request fills or changes
- Player bios, photos, and basic stats on roster pages
- Skill tags with matching suggestions for hackathon requests
- Recurring requests ("same time next week")
- Attendance tracking and a simple reliability indicator
- Share a request link to WhatsApp
- Basic usage analytics for the admin (signups, requests created and filled)

---

## 13. User Journeys

### Journey A: Browsing the roster
1. Student opens Sports Hub and sees the list of sports.
2. Selects a sport, for example Football.
3. Views the coach, captain, and current roster.
4. Scrolls down to see open Team Requests for that sport.

### Journey B: Finding a casual game (new or shy student)
1. Student signs up with college email and fills in a short profile.
2. Browses open requests, filtering by sport and date.
3. Finds "Need 2 for football, 6 PM" and taps Join. No message or explanation is needed.
4. Sees the other members of the request for the first time.
5. Group coordinates the game in-app or through their own chat for that one event.
6. Student returns later to browse new requests or post their own.

### Journey C: Posting a request (student short on players)
1. Student taps Create Request.
2. Picks the type and sport, then fills in title, description, people needed, and time.
3. The request appears in the feed.
4. As others join, the joined count updates; the request marks itself filled when full.
5. Creator can close or edit it if plans change.

### Journey D: Admin updating the roster
1. Admin logs in and opens the sport's management view.
2. Adds or removes players, updates the captain or coach.
3. Changes appear on the public sport page immediately.

---

## 14. MVP Scope

**Included in the MVP**
- Sports list and sport detail pages (coach, captain, roster)
- Admin-managed roster (admin flag; entries can be seeded directly in the database)
- Sign up and login
- Basic student profile
- Create, browse, filter, and join Team Requests
- Request detail with member list for members only
- Automatic status updates (open, filled, closed)
- Mobile-friendly layout
- Deployment on Vercel with Supabase backend

**MVP is done when:** a real student can sign up, view a sport's roster, post a request, and another student can join it, all on the live site.

---

## 15. Out-of-Scope Features

- Coach or captain self-service login (admin manages the roster in v1)
- Tournament brackets, fixtures, scheduling, and results
- Leaderboards and participation scores
- Certificates
- Reputation or rating system
- GPS, route tracking, or Strava-style fitness logging
- Strava or other third-party integrations
- Built-in chat or messaging
- Payments
- Native mobile apps
- Inter-college management

---

## 16. Success Metrics

| Metric | Target (first month after launch) |
|---|---|
| Roster coverage | Every sport listed with at least coach and captain filled in |
| Registered students | 30+ real students |
| Requests created | 20+ |
| Requests filled | 15+ (a fill rate of at least 50%) |
| Return usage | At least 30% of signed-up students visit again in the following week |
| Join friction | A student can join a request in under 30 seconds from opening the site |
| Qualitative feedback | At least 5 new or shy students say it felt easier than asking in person |
| Roster freshness | Roster data updated at least once every 2 weeks |

---

## 17. Risks and Assumptions

### Assumptions
- Enough students share the problem described here; so far it is based on one person's experience and needs checking with 15–20 real students
- Students will use a website to find teammates rather than relying only on friends and WhatsApp
- A single admin can keep the roster accurate for v1
- Students have college email addresses and smartphones
- Free tiers of Vercel and Supabase are enough for the expected load

### Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Cold start: too few open requests at launch, so the site feels empty | Low usage and drop-off | Soft launch to one active group first; seed a few real requests; ask sports clubs to post |
| Disintermediation: groups move to WhatsApp after the first match and never return | One-time use only | Keep Team Request useful for recurring discovery; consider recurring requests and a share-to-WhatsApp link |
| Trust: shy students may not join strangers from a website | Core users don't convert | Validate with real introverted students before investing further; consider smaller groups and the "I'm interested" feature |
| Stale roster: depends on one admin | Directory loses credibility | Start with few sports, update on a schedule, add captain/coach logins in v2 |
| Organizers ignore the site | Interested students get no response | Involve the PT teacher and captains early; show them the value before launch |
| Scope creep: two modules in one v1 | Unfinished product | Keep the roster simple; build the Team Request loop first; hold everything in section 15 for later |
| Misuse: spam or fake requests | Poor experience | Require login with college email; let creators close requests; add reporting if needed |
| Free-tier limits | Downtime or throttling | Monitor usage; keep queries indexed; upgrade only if needed |
