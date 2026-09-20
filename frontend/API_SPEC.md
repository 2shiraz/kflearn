# KF LearnSmart — API Specification (living document)

> Update this file every time an endpoint is added or changed. One source of truth for frontend + backend.
> Base URL (dev): `http://localhost:5000/api`
> Auth scheme: JWT session cookie (24h default expiry). Browser auth responses do not include the JWT; non-browser API clients without Origin/Fetch Metadata headers can use the response token as a Bearer credential.

---

## Conventions

- All request/response bodies: `application/json`
- All error responses:
```json
{ "success": false, "message": "Human-readable message", "code": "ERR_CODE" }
```
- All success responses:
```json
{ "success": true, "data": { ... } }
```
- Auth-protected routes require header: `Authorization: Bearer <token>` OR the `kf_session` httpOnly cookie set at login. In Secure deployments the cookie is named `__Host-kf_session`. The frontend SPA uses the cookie exclusively (fetch calls send `credentials: "include"`).
- Password rules: min 8 chars, 1 number, 1 letter, at most 72 UTF-8 bytes (enforced server-side, SEC-02 bcrypt cost 12).
- CSRF: cookie-authenticated, state-changing requests (anything but GET/HEAD/OPTIONS) must echo the CSRF cookie value in an `X-XSRF-Token` header. Login/register and `/auth/me` return `csrfToken` so a frontend on a different origin can send this header. The cookie is `XSRF-TOKEN` locally and `__Host-XSRF-TOKEN` in Secure deployments. Bearer-only requests are exempt. Logout requires authentication and CSRF validation for cookie sessions.
- Rate limiting: `/api/auth/register` and `/api/auth/login` are limited to 10 requests/IP/minute; the rest of `/api` is limited to 300 requests/IP/minute, and AI-backed actions to 60 requests/account/hour.

---

## Auth Module (FR-1)

### `POST /api/auth/register`
Register a new user (Student, Content Contributor, or Admin-invited).

**Request**
```json
{
  "fullName": "Ayesha Khan",
  "email": "ayesha@example.com",
  "password": "SecurePass1",
  "role": "student"   // "student" | "contributor" — admin created only via seed/invite, not public signup
}
```

**Response `201`**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "fullName": "Ayesha Khan", "email": "...", "role": "student", "emailVerified": false },
    "message": "Verification email sent"
  }
}
```

**Errors**: `409 EMAIL_TAKEN`, `422 VALIDATION_ERROR`, `429 RATE_LIMITED`

Status: **built** — request/response shape differs from the original mock-era draft above: no `role` field accepted (public signup always creates `role: "student"`; `roleLabel` is a display label), and the response returns `{ csrfToken, expiresIn, user }` for browsers, with `token` additionally returned to non-browser clients. **There is still no email-verification step (FR-1.2 not implemented)**; registration logs the user in immediately.

---

### `POST /api/auth/verify-email`
Confirms email via token from FR-1.2 confirmation link.

**Request**
```json
{ "token": "abc123..." }
```
**Response `200`**: `{ "success": true, "data": { "emailVerified": true } }`

Status: **not yet built**

---

### `POST /api/auth/login`
**Request**
```json
{ "email": "ayesha@example.com", "password": "SecurePass1" }
```
**Response `200`**
```json
{
  "success": true,
  "data": {
    "csrfToken": "random token...",
    "expiresIn": 86400,
    "user": { "id": "...", "fullName": "...", "email": "...", "role": "student" }
  }
}
```
**Errors**: `401 INVALID_CREDENTIALS`, `429 RATE_LIMITED` (SEC-04: max 10 req/IP/min)

Status: **built** — non-browser API clients also receive `token`; browsers receive it only as a httpOnly cookie. There is no `403 EMAIL_NOT_VERIFIED` (no verification step exists yet, see register above).

---

### `POST /api/auth/google`
OAuth login (FR-1.3). Frontend sends Google ID token from Google Identity Services.

**Request**
```json
{ "idToken": "google-id-token..." }
```
**Response**: same shape as `/auth/login`

Status: **not yet built**

---

### `POST /api/auth/logout`
Clears the session and CSRF cookies and revokes all outstanding JWTs for the user.
**Request**: authenticated; cookie clients must send `X-XSRF-Token`.
**Response `200`**: `{ "success": true }`

Status: **built**

---

### `POST /api/auth/forgot-password`
**Request**: `{ "email": "..." }`
**Response `200`**: always `{ "success": true, "data": { "message": "If that email exists, a reset link was sent" } }` (never reveal if email exists)

Status: **not yet built**

---

### `POST /api/auth/reset-password`
**Request**: `{ "token": "...", "newPassword": "..." }`
**Response `200`**: `{ "success": true }`

Status: **not yet built**

---

### `GET /api/auth/me`
Returns current authenticated user. Used by frontend on app load to check session.
**Response `200`**: `{ "success": true, "data": { "user": {...}, "csrfToken": "..." } }`
**Errors**: `401 UNAUTHENTICATED`

Status: **built**

---

## Frontend auth session (no more mock mode)

`src/lib/api.js` no longer has a `USE_MOCK` flag or mock responses — every call is a real
`fetch` against the backend, with `credentials: "include"` so the `kf_session` cookie travels
automatically. `getCurrentUser()` reads a cached copy of the profile from `localStorage['kf_user']`
for synchronous, flash-free page gating; that cache is a display convenience only, never the
auth mechanism — a viewer can't grant themselves access by editing it, since every request is
re-authorized server-side from the cookie. `logout()` clears that cache and fires
`POST /api/auth/logout` (fire-and-forget, `keepalive: true`) to clear the cookie too.

(Historically this cache lived in `sessionStorage`, which is per-tab — opening the app in a new
tab looked signed-out until the cookie-based session existed. It's `localStorage` now, shared
across tabs, matching the cookie's actual scope.)

**Demo/mock login credentials are gone** — there's no mock mode left; register or log in against
the real backend (seed data doesn't include user accounts).

## Changelog
- 2026-08-10: Initial auth spec drafted (register, verify-email, login, google, logout, forgot/reset password, me). Signin page built against `/api/auth/login`.
- 2026-08-10: Added mock API layer (`src/lib/api.js`) so frontend/signin work independently of backend. `USE_MOCK` flag is the single switch-over point.
- 2026-08-10: Added `/dashboard` route (mock data), `getCurrentUser()`/`logout()` session helpers, and brand palette changed to indigo/purple per updated design.
- 2026-09-13: Security hardening pass — register/login/me/logout all built against the real backend (mock mode removed). Auth now cookie-based end-to-end (`kf_session` httpOnly + `XSRF-TOKEN` double-submit CSRF cookie); bcrypt cost 12; password policy enforced server-side; rate limiting on auth endpoints; NoSQL-injection sanitization; masked 5xx error messages in production; fixed the bug where a new tab appeared signed out (session cache moved from `sessionStorage` to `localStorage`).

---

## User Profile Module

### `PATCH /api/auth/me`
Update the authenticated user's academic profile. (Superscedes the `PATCH /api/users/me` path
originally sketched below — it was actually built under the auth module, alongside `GET /me`, see above.)

**Request** (any subset of fields)
```json
{
  "fullName": "Ahmed Khan",
  "roleLabel": "FCPS Candidate",
  "profile": {
    "institution": "Allama Iqbal Medical College",
    "programme": "MBBS",
    "yearLevel": "Year 4",
    "targetExam": "FCPS Part 1",
    "expectedExamDate": "2027-03"
  }
}
```
**Response `200`**: `{ "success": true, "data": { "user": {...} } }`

Status: **built**, and wired up in `SettingsPage.jsx` — requires the `X-XSRF-Token` CSRF header (see Conventions).

- 2026-08-10: Added `/signup` — 3-step flow (account details → role select → optional academic profile). `registerRequest()` and `saveProfileDetails()` added to `lib/api.js`, same USE_MOCK switch-over pattern as login. Role selection maps to a free-text `roleLabel` for display; internal `role` field stays `"student"` for all signups (contributor accounts are still seeded only, per FR-1.6 — public signup shouldn't grant elevated roles). No email verification gate in mock mode — flag this when wiring the real backend.
