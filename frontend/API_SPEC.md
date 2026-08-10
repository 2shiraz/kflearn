# KF LearnSmart — API Specification (living document)

> Update this file every time an endpoint is added or changed. One source of truth for frontend + backend.
> Base URL (dev): `http://localhost:5000/api`
> Auth scheme: JWT access token (24h expiry, per FR-1.4) returned in response body + set as httpOnly cookie. No localStorage token storage (XSS risk, SEC-05).

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
- Auth-protected routes require header: `Authorization: Bearer <token>` OR the `kf_session` httpOnly cookie set at login.
- Password rules: min 8 chars, 1 number, 1 letter (enforced server-side, SEC-02 bcrypt cost 12).

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

**Errors**: `409 EMAIL_TAKEN`, `422 VALIDATION_ERROR`

Status: **frontend built (SignupPage.jsx, 3-step flow), awaiting backend** — mock registration auto-logs the user in with no email verification step. Real backend must enforce FR-1.2 verification before login succeeds.

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
    "token": "jwt...",
    "expiresIn": 86400,
    "user": { "id": "...", "fullName": "...", "email": "...", "role": "student" }
  }
}
```
**Errors**: `401 INVALID_CREDENTIALS`, `403 EMAIL_NOT_VERIFIED`, `429 RATE_LIMITED` (SEC-04: max 10 req/IP/min)

Status: **frontend built (SigninPage.jsx), awaiting backend**

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
Invalidates current session token (SEC-11).
**Request**: none (uses auth header/cookie)
**Response `200`**: `{ "success": true }`

Status: **not yet built**

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
**Response `200`**: `{ "success": true, "data": { "user": {...} } }`
**Errors**: `401 UNAUTHENTICATED`

Status: **not yet built**

---

## Frontend mock mode

Until the backend is live, `src/lib/api.js` serves mock responses shaped exactly like the
contracts above, gated by `USE_MOCK = true` at the top of that file. Backend dev: when your
route is ready, flip that flag to `false` and the frontend switches to real `fetch` calls with
zero changes to any page component.

`getCurrentUser()` / `logout()` in the same file read/clear the mock session
(`sessionStorage['kf_mock_user']`). Replace their internals with a real `GET /api/auth/me` call
and a real `POST /api/auth/logout` call respectively when wiring the backend — nothing that
imports them (DashboardPage, SigninPage) needs to change.

**Demo login credentials (mock mode only):**
| Email | Password | Role |
|---|---|---|
| `student@kflearn.pk` | `Student123` | student |
| `contributor@kflearn.pk` | `Contrib123` | contributor |

## Changelog
- 2026-08-10: Initial auth spec drafted (register, verify-email, login, google, logout, forgot/reset password, me). Signin page built against `/api/auth/login`.
- 2026-08-10: Added mock API layer (`src/lib/api.js`) so frontend/signin work independently of backend. `USE_MOCK` flag is the single switch-over point.
- 2026-08-10: Added `/dashboard` route (mock data), `getCurrentUser()`/`logout()` session helpers, and brand palette changed to indigo/purple per updated design.

---

## User Profile Module

### `PATCH /api/users/me`
Update the authenticated user's academic profile.

**Request** (any subset of fields)
```json
{
  "fullName": "Ahmed Khan",
  "institution": "Allama Iqbal Medical College",
  "programme": "MBBS",
  "yearLevel": "Year 4",
  "targetExam": "FCPS Part 1",
  "expectedExamDate": "2027-03"
}
```
**Response `200`**: `{ "success": true, "data": { "user": {...} } }`

Status: **not yet built** — `SettingsPage.jsx` currently saves to local component state only; changes are lost on reload. Wire this up and swap the mock `handleSave` for a real call.

- 2026-08-10: Added `/signup` — 3-step flow (account details → role select → optional academic profile). `registerRequest()` and `saveProfileDetails()` added to `lib/api.js`, same USE_MOCK switch-over pattern as login. Role selection maps to a free-text `roleLabel` for display; internal `role` field stays `"student"` for all signups (contributor accounts are still seeded only, per FR-1.6 — public signup shouldn't grant elevated roles). No email verification gate in mock mode — flag this when wiring the real backend.
