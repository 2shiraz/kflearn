# Task: turn KF LearnSmart into a paid, subscription-only site

You are working in the KF LearnSmart repo (`/Users/shiraz/Code/kflearn`). This file holds the agreed plan and every decision already made. Work **one phase at a time**, in order. At the end of each phase, stop and report back. Don't start the next phase until the user says so.

## The product change

There is no free content any more. Anyone can create an account, but every part of the app is locked until the account has an active **monthly access pass**. The default price is **PKR 1,499**, and admins can change it. AI credits stay exactly as they are today.

## Decisions already made (don't re-ask)

1. **What the pass unlocks:** the whole site (OSCE stations including checklist practice, MCQs, OSPE, History Taking Guide, Clinical Exam Guide, Handout Notes, Progress, Dashboard). AI patient sessions and AI marking still cost AI credits, as now. A user needs both an active pass and enough AI credits to run an AI station.
2. **Period:** a rolling 30 days. Each paid period adds 30 days. Renewing early adds to the current end date. Renewing after the pass has lapsed starts from now. The admin can change both the length and the price, and changes only apply to new periods.
3. **Payment:** the site is still in testing with no real users. While testing, the team grants access by hand: Admin > Accounts "Grant / extend access" with a reason, or by recording a subscription payment in Admin > Revenue. A real payment processor will be added before production, and it will take over this manual step. Build the data model so the processor can add access periods itself. For now the Subscribe page shows the plan, the price and the account's access status, with no payment form and no message about how payment will work.
4. **Existing accounts:** the app is still in development and has no real users. Delete every non-admin account **and everything linked to it** (see "Account cleanup" below for the full list). Admins (and contributors) always have access and never need a pass. **This step deletes data.** Follow the protocol under "Account cleanup" below.
5. **Devices:** at most 2 signed-in devices per account. Signing in on a third device signs out the oldest one. Students can see their devices and sign any of them out.
6. **Public preview:** the existing Sample stations page and the landing-page previews stay. Turn them into static, hand-written content. They must not import anything from the real banks (`frontend/src/data/*`).
7. **Grace period:** access continues for 3 days after the pass ends, with a "renew now" banner. After that, everything locks.
8. **Email:** not now. Password reset by email, receipts and email reminders come in the final version. For now, reminders are in-app only.
9. **Watermark** (the user's email shown faintly over content pages): **not decided yet.** Ask the user before Phase 3. Until then, don't build it.


## House rules (from earlier work, still in force)

- **Theme:** light theme only. No em-dashes (—) or en-dashes (–) anywhere in the UI.
- **Wording:** always say "AI credits". Don't show the cost per station or the price of one credit. Never say content comes "from a PDF" or "from a source".
- **Git:** never commit unless the user asks.
- **Playwright:** use it only when the user asks.
- **Tests:** run backend tests with `cd backend && npm test`, which sets `NODE_ENV=test` and turns off rate limits. Check the frontend with `cd frontend && npx vite build` and `npx oxlint src`.
- **Data safety:** local `backend/.env` may point at a MongoDB Atlas database. `kflearn` is production; `kflearn-backup` is a copy for testing. Never write to `kflearn` without the user's explicit OK for that specific action.

## How things stand today (verified)

- **Bundled content is public.** MCQ banks (MBBS 1 to 5, about 3.3 MB including answers `a` and explanations `e`), OSPE, `historyTakingGuide.js`, `clinicalExaminationGuide.js` and `handoutNotes.js` sit in `frontend/src/data/` and are compiled into public JS chunks. Anyone can download them from `/assets/*.js` without signing in.
- **Public pages import the banks.** `frontend/src/site/siteContent.js` imports the MCQ and OSPE catalogs for counts, and so do `FeaturesPage`, `DashboardPage` and `frontend/src/lib/progress.js`. New MCQ banks are added through `frontend/src/data/mcqs/extra/` (Vite glob) and `tools/parse_final_year.py`.
- **OSCE stations already live on the server**, in MongoDB, behind sign-in.
- **Sign-in:**
  - an httpOnly cookie holds a JWT carrying `sv` (`User.sessionVersion`);
  - `authenticate` middleware rejects a token when `sv` doesn't match, so bumping it signs out every device;
  - there are no per-device sessions;
  - CSRF uses a double-submit cookie;
  - `helmet` sets a CSP;
  - Express serves the built frontend from the same origin (`backend/src/serveFrontend.js`).
- **Admin switches and pricing:**
  - section switches live in `AppSetting` key `site` (`SECTION_KEYS` in `siteSettings.service.js`);
  - pricing lives in AppSetting key `pricing`;
  - the frontend caches the switches in localStorage (`kf_site`) so nothing flashes on load.
- **Payments ledger:** `models/Payment.js` and `services/payment.service.js`, shown in Admin > Revenue. Payments are only ever recorded by hand.
- **No email** is sent anywhere, and there is no password reset.
- **New accounts get welcome AI credits** (`pricing.welcomeCredits`). Set this to 0.
- **Admin console:** `/admin/:tab`, built from `AdminShell` and `components/admin/*`. Admin changes are recorded by `auditAdminChanges` middleware.

## Phase 1: public site

1. **Remove every "free" claim.** It appears in `PricingPage`, `LandingPage`, `FeaturesPage`, `SignupPage`, `AuthAside`, `SampleStationsPage`, `site/siteContent.js`, `WelcomeTour`, `OsceStationBrowser`, `lib/osceFilters.js`, and the admin toggle descriptions ("Checklist practice ... Free."). Grep for `\bfree\b` to find any others.
2. **Pricing page:**
   - one plan, with the price and length read from the server;
   - what's included: everything except AI patient and AI marking;
   - how AI credits work;
   - an FAQ: renewal, the 3-day grace period, "one account per person, at most 2 devices", refunds.
3. **Public facts endpoint.** Add `GET /api/public/stats`, returning counts only (MCQs, OSPE stations, OSCE stations, guides and so on).
   - **Server side:** compute it once and keep it in memory. Refresh it when content changes, or after a 10-minute TTL.
   - **Response header:** `Cache-Control: public, max-age=300, s-maxage=3600, stale-while-revalidate=86400`, so browsers and any CDN can cache it.
   - Make the public pages use this endpoint instead of importing `frontend/src/data`.
4. **Static previews.** Make the sample stations and landing previews static. Write the preview text into the page files and drop every import of the banks.
5. **Legal pages:** add Terms (including the no-sharing rule and the 2-device limit), Privacy, and Refund & cancellation. Link them from the footer and the sign-up page.
6. **Sign-up flow:** after sign-up, send the user to the Subscribe page (built in Phase 2) instead of the dashboard.

**Done when:** no public page imports `frontend/src/data`, the word "free" no longer appears in student-facing copy, the build passes, and lint is clean.

## Phase 2: main app (UI, plus the backend it needs)

**Backend:**
- **`AccessPeriod` model:** `userId`, `from`, `to`, `source` (`admin-grant | payment | processor`), `paymentId?`, `reason`, `createdBy`, `revokedAt?`. Work out access-until as the end of the latest non-revoked period. Grace runs until access-until plus 3 days.
- **Entitlement service:** `getAccess(user)` returns `{ active, inGrace, until, graceUntil }`. Admins and contributors are always active.
- **`access` in auth responses:** include it in the login, register and `/auth/me` responses, next to `site`.
- **Pricing settings:** add `subscription: { pricePkr: 1499, periodDays: 30, graceDays: 3 }` to the pricing settings. Set `welcomeCredits` to 0.
- **"Require subscription" switch:** add it to the site settings (`requireSubscription`, default **off**). While it's off, nobody is locked out, so everything can be built and deployed safely.
- **Admin endpoints (audited):**
  - grant or extend access (days plus a reason);
  - revoke a period;
  - record a subscription payment, which creates a Payment with `kind: "subscription"` and an `AccessPeriod`;
  - admin "set temporary password" for a user (this stands in for email reset). The user should then be told to change it.

**Frontend:**
- **Access cache:** an access status cache like `lib/site.js` (`kf_access`), so locked items never flash open.
- **Locking:** a `RequireAccess` gate inside `RequireUser`. Without access, show a paywall card and **don't fetch any content**. Sidebar items show a lock icon.
- **Dashboard without access:** a welcome screen with a "Get access" button leading to the Subscribe page.
- **Subscribe page:** plan, price, what's included, and current status (active until, in grace until, or expired). No payment form for now; access is granted by the team while testing (decision 3). Never write "online payment coming" or anything like it.
- **Global handling:** when `apiFetch` gets an HTTP **402** with `code: "SUBSCRIPTION_REQUIRED"`, it fires an event that switches the UI to the paywall without losing the page the user was on. Handle it the same way as `SECTION_CLOSED`.
- **Banners:** "Your access ends on {date}" from 5 days before the end; "Your access has ended. Renew within {n} days" during the grace period.
- **Settings:** a subscription card, plus a signed-in devices list (the backend for this is in Phase 3, so show the card only once it exists).
- **Admin screens:**
  - **Pricing:** plan price and length.
  - **Accounts:** an "Access until" column and filter; Grant/extend and revoke; set a temporary password.
  - **Revenue:** active subscribers, new vs renewed, expiring in 7 days, lapsed; subscription payments in the ledger.
  - **Site access:** the Require subscription switch, with a clear warning.
- **Welcome tour:** add a "Get access" step.

**Done when:** an admin can grant, extend and revoke access, the UI reflects it straight away, and with the switch on an account without access sees only the paywall, its settings and the Subscribe page. Add backend tests for stacking, lapse, grace, revoke and the admin bypass.

## Phase 3: backend enforcement, content move, anti-sharing

1. **Move all content to the server.**
   - Write an import script that loads the MCQ banks (including `extra/`), OSPE, the guides and the handouts into MongoDB. Use one collection per type, indexed by year, block and topic. Run it on `kflearn-backup` first.
   - Move the parsing pipeline (`tools/parse_final_year.py` output) to feed the backend import instead of the frontend folder.
   - Delete `frontend/src/data`.
   - Add a check that runs after `vite build` and fails if any known question text appears in `frontend/dist`.
   - Paged endpoints: one block or topic per request, never a whole bank.
2. **Enforce access on every protected route** with a `requireAccess` middleware, mounted after `authenticate`.
   - It checks the database on every request; never trust the JWT or the client for access.
   - Return **402** `SUBSCRIPTION_REQUIRED`.
   - It applies to: `/api/osce*`, `/api/osce/attempts*` (including AI messages, transcription, AI marking), `/api/dashboard`, the new content endpoints, and progress.
   - It must **not** apply to: `/api/auth/*`, `/api/site`, `/api/credits` (balance view only), the Subscribe and access-status endpoints, `/api/public/*`, or `/api/admin/*` (admins only already).
   - It only takes effect when `requireSubscription` is on.
3. **Expiry mid-session.** An AI station attempt started while the user had access can still be ended and assessed after access ends. Starting a new attempt is blocked.
4. **Device limit.**
   - Add a `Session` model: `userId`, `sid`, `createdAt`, `lastSeenAt`, `userAgent`, `ip`, `revokedAt`. Put `sid` in the JWT.
   - `authenticate` rejects any token whose session is revoked or missing.
   - Signing in creates a session. If more than 2 are active, revoke the oldest.
   - Signing out revokes only that session. Keep a "sign out everywhere" option that bumps `sessionVersion`.
   - Add endpoints for listing and revoking your own sessions, and admin endpoints to list and revoke a user's sessions.
   - Flag accounts that see many different IPs or devices in 24 hours on Admin > Accounts.
5. **Scraping limits.** Add per-user limits on content endpoints, both per hour and per day. Write an audit row when a user crosses an unusual threshold, and show it in Admin > Activity.
6. **Caching.**
   - Keep content in server memory and refresh it when content changes.
   - Add the `compression` middleware (gzip/brotli).
   - Content responses send `Cache-Control: private, no-cache` plus an ETag (content version). That means no CDN or shared cache, and every browser reuse is re-checked against access with a cheap 304.
   - On the frontend, keep an in-memory cache per visit, cleared on sign-out, and preload the next block.
   - Never store paid content in localStorage, IndexedDB or a service worker.
7. **Watermark,** only if the user said yes.
8. **Tests:**
   - one table-driven test that walks every protected route and asserts a 402 without access and a 200 with it;
   - device-limit tests;
   - grace tests;
   - "attempt started before expiry can still finish";
   - the build check from step 1.

**Done when:** all of the above passes, the full test suite is green, and `frontend/dist` contains no content.

## Account cleanup (decision 4): protocol

1. Write a script that runs as a **dry run by default** and lists what it would delete per collection. It must keep every user with role `admin` or `contributor`, and everything belonging to them. For every other user it deletes:
   - the `users` document;
   - `osceattempts` (`userId` is stored as a string here);
   - `credittransactions`;
   - `payments`;
   - `adminauditlogs` rows whose `target` is that user's id (admin actions about the deleted account);
   - `sessions` and `accessperiods`, if those collections exist by then.

   It also clears `unansweredquestions` entirely. That collection isn't linked to users, but everything in it came from test chats.
2. Run it against `kflearn-backup` first and show the user the counts.
3. Only after the user explicitly confirms, run it against production `kflearn`, naming the target database on the command line.
4. Admins need no access period; they bypass the check.

## Rollout

Build Phases 1 to 3 with `requireSubscription` **off**. Deploy, then test on the `kflearn-backup` copy. Only switch it on once Phase 3 is live, because before that the content is still in the public bundle. Payment processor integration (with webhook signature checks, amount checks and idempotency) and email come in a later phase.

## Why content is not served from a CDN

Public files can be cached at CDN edges and in browsers indefinitely. Paid content can't, because a shared cache would hand it to anyone who has the URL. What that costs, and how each cost is handled:

- **Speed:** the first request for each block goes to the server. This is handled with in-memory content, compression, ETag/304 revalidation, small pages, client-side preloading, and choosing a Railway region close to Pakistan.
- **Search engines:** content pages won't be indexed. That's intended; the public stats and preview pages remain indexable.
- **Offline use:** there is none, which is intended.

The app code (JS/CSS) is still cached for a long time, and it is most of the download.
