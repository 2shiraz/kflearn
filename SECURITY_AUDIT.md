# Security audit — 2026-09-20

## Architecture and trust boundaries

The React/Vite frontend calls an Express API. Express authenticates a JWT from an httpOnly cookie or Bearer header, reads the current user and role from MongoDB, and applies CSRF checks to cookie-authenticated mutations. MongoDB stores users, authored history modules, attempts, AI settings, and audit records. Authenticated students can create and score their own attempts. Admin routes manage content, users (read only), and AI settings. Groq and OpenAI are the only outbound API destinations; the audio upload is buffered in memory and forwarded to Groq. The app has no payment, webhook, OAuth, password-reset, Docker, or server-side filesystem path endpoint.

| Untrusted input | Server-side path | Storage or external sink |
| --- | --- | --- |
| Registration/login fields | Auth controller → type/length checks → bcrypt | `User`, JWT cookie |
| Profile fields | `PATCH /auth/me` → explicit profile fields | Owned `User` record |
| Module slug and ID | Published-module lookup or admin-only creation | `HistoryModule`, `PatientScript`, `SmartChecklist` |
| Attempt ID, mode, checklist IDs | Authentication → owned-attempt query → state checks | Owned `HistoryAttempt` |
| Student message text | Type/token limits → intent matching → patient service | `UnansweredQuestion`, fixed Groq/OpenAI API, owned attempt |
| Audio bytes and claimed MIME | Authentication → Multer size/part/type limits → active owned attempt | Fixed Groq transcription API; no disk write |
| Admin AI settings | Admin role check → explicit fields → AES-256-GCM encryption | `AppSetting`; fixed provider API endpoints |

## Confirmed findings and fixes

### 1. Vulnerable multipart parser — High

- **Attack path:** A registered user could send crafted multipart field names or aborted uploads to `POST /api/history/attempts/:id/transcribe`. The previous Multer 1.4.5-lts.2 parsed the upload before the controller checked attempt ownership. Published Multer advisories describe process crashes and resource exhaustion on this version, including crafted field names.
- **Exploit and existing controls:** Authentication, the 12 MB file limit, and the general IP rate limit reduced exposure but did not prevent parser failures. A user can register an account. The attack does not require a valid attempt ID because parsing occurred first.
- **Affected files:** `backend/package.json`, `backend/package-lock.json`, `backend/src/middleware/upload.js`.
- **Fix:** Upgrade to Multer 2.4.0; permit one file and no text fields, with explicit file/part/nesting limits. Unsupported media and Multer limits now produce 400/413 instead of a 500.
- **Verification:** The upload regression test rejects unsupported input and crafted multipart field names, then confirms the API remains healthy; `npm audit` reports zero backend advisories. See the [Multer crafted-field advisory](https://github.com/expressjs/multer/security/advisories/GHSA-wc9g-mqfw-jrwm) and [2.4.0 release](https://github.com/expressjs/multer/releases/tag/v2.4.0).

### 2. Vulnerable `qs` dependency — Moderate advisory, low current application exposure

- **Attack path:** Express parses attacker-controlled query strings and includes `qs` transitively. The previous `qs` 6.15.3 has published resource-exhaustion and exception advisories.
- **Exploit and existing controls:** The reported array-limit bypass requires `comma: true`; the exception path requires a parse-to-stringify round trip with permissive prototype options. This application does not use those options or stringify `req.query`, so those specific paths were not confirmed reachable here. The global rate limit is a partial availability control.
- **Affected files:** `backend/package-lock.json`; query parsing reached through `backend/src/app.js`.
- **Fix:** Upgrade Express to 4.22.3 and `qs` to 6.16.0 through compatible `npm audit fix`.
- **Verification:** Backend `npm audit` reports zero advisories. See the [array-limit advisory](https://github.com/advisories/GHSA-x5fp-wj9c-mxmx) and [isBuffer advisory](https://github.com/advisories/GHSA-4mjr-xmp4-gh2g).

### 3. Logout left JWTs valid and allowed logout CSRF — Medium

- **Attack path:** `POST /api/auth/logout` previously cleared cookies without authenticating the request or invalidating a JWT. A cross-site form could log out a browser, and a copied Bearer token remained usable until expiry after a legitimate logout.
- **Exploit and existing controls:** SameSite cookies and the one-day default expiry limited impact but did not revoke a token. The app-wide CSRF middleware did not cover auth routes.
- **Affected files:** `backend/src/routes/auth.routes.js`, `backend/src/controllers/auth.controller.js`, `backend/src/services/auth.service.js`, `backend/src/models/User.js`, `backend/src/middleware/auth.js`, `frontend/src/lib/api.js`.
- **Fix:** Authenticate and CSRF-protect logout. Increment a user session version on logout and require the signed token version to match on every request. The frontend sends its CSRF header when logging out.
- **Verification:** The logout test checks missing-CSRF rejection, cookie clearing, old Bearer-token rejection, and fresh login.

### 4. Browser-readable JWT and cacheable authenticated responses — Medium

- **Attack path:** Browser login and registration responses carried the JWT in JSON as well as in an httpOnly cookie. A script executing on the frontend during login could read and exfiltrate the response token for later replay. Authenticated API responses lacked an explicit no-store policy.
- **Exploit and existing controls:** React escaping, Helmet on the API, and exact-origin CORS reduce the chance of an injected script and cross-origin reads, but the JSON token removed the persistence benefit of the httpOnly cookie.
- **Affected files:** `backend/src/controllers/auth.controller.js`, `backend/src/middleware/auth.js`.
- **Fix:** Omit the token for requests with browser Origin or Fetch Metadata headers; keep Bearer-token issuance for non-browser clients. Send `Cache-Control: no-store` on login and authenticated responses.
- **Verification:** The browser-login test checks the missing JSON token, httpOnly cookie, CSRF token, and no-store header; the existing Bearer-client tests still pass.

### 5. Session cookie could be planted by a sibling subdomain — Medium, deployment-dependent

- **Attack path:** On a domain with an untrusted sibling subdomain, that host could set a parent-domain cookie named `kf_session`. Duplicate cookies with the API's host cookie can create a session-confusion or login-CSRF path, placing a victim in an attacker-controlled account.
- **Exploit and existing controls:** The cookie was host-only when set by the API, and CORS limited who could read API responses. Neither prevents another subdomain from setting a separate parent-domain cookie with the same name.
- **Affected files:** `backend/src/utils/authCookies.js`, `backend/src/controllers/auth.controller.js`, `frontend/src/lib/api.js`.
- **Fix:** Secure deployments use `__Host-kf_session` and `__Host-XSRF-TOKEN`, which browsers reject with a Domain attribute. Auth responses and `/auth/me` return the CSRF token so a frontend on another origin can still send the header.
- **Verification:** Production configuration tests assert the prefixed names; the browser-login test checks the returned CSRF token matches the cookie.

### 6. Automatic proxy trust could bypass IP rate limits — Medium, deployment-dependent

- **Attack path:** The previous production default trusted one `X-Forwarded-For` hop. If the Node API was reachable directly, an attacker could vary that header between login guesses and evade the IP-based auth limiter.
- **Exploit and existing controls:** The 10/minute auth limiter existed, but its key could be attacker-controlled under that deployment. A correctly isolated reverse proxy would mitigate this.
- **Affected files:** `backend/src/app.js`, `backend/src/config/env.js`, `backend/.env.example`.
- **Fix:** Proxy trust defaults to zero. `TRUST_PROXY_HOPS` must be set to the exact trusted hop count and is validated at startup.
- **Verification:** Configuration tests assert the default and reject invalid hop counts; the rate-limit test checks login throttling.

### 7. Attempt state and AI-cost races — Medium

- **Attack path:** An attempt owner could request assessment before ending a session, append messages after assessment, rescore repeatedly, or send concurrent requests that overwrote one another. Repeated AI assessments and transcription consumed provider quota.
- **Exploit and existing controls:** Every attempt query included `userId`, preventing cross-user access, and the general API limit capped requests per IP. Neither enforced attempt state or one-time scoring.
- **Affected files:** `backend/src/controllers/historyAttempt.controller.js`, `backend/src/models/HistoryAttempt.js`, `backend/src/routes/historyAttempt.routes.js`, `backend/src/middleware/rateLimit.js`.
- **Fix:** MongoDB conditional updates enforce active → ended → one assessment. Message appends are atomic and require active status. AI assessment acquires a lease before the provider call, limiting concurrent charges; failed calls release it. Provider-backed actions are limited to 60/account/hour.
- **Verification:** State, concurrent-assessment, ownership, and per-account rate-limit tests. The second audit found that a crashed process could strand the new lease; it now expires after ten minutes and uses a unique lease ID so an old request cannot overwrite a retry. A stale-lease regression test covers recovery.

### 8. Unbounded or malformed user fields — Low to Medium

- **Attack path:** Registration and profile updates accepted up to the JSON body limit for display/profile fields. Patient messages accepted non-string values and oversized `originalTranscript`, which could reach model calls or MongoDB and generate avoidable 500s or storage growth.
- **Exploit and existing controls:** The 1 MB JSON limit, auth rate limit, Mongoose schema, and per-message token estimate constrained some values but did not bound each stored field or reject all invalid types.
- **Affected files:** `backend/src/services/auth.service.js`, `backend/src/validators/history.validators.js`, `backend/src/services/history.service.js`, `backend/src/controllers/historyAttempt.controller.js`.
- **Fix:** Apply explicit field/type/length limits, validate attempt IDs and uploaded media errors, bound notes and checklist ID arrays, and calculate elapsed time on the server instead of accepting a client-supplied value.
- **Verification:** Malformed credential, oversized profile, message/upload, forged elapsed-time, and invalid-state tests.

### 9. Bcrypt password truncation on registration — Low

- **Attack path:** A registrant could provide a password longer than bcrypt's 72-byte input limit. Suffixes beyond that limit did not affect the stored hash, so distinct submitted passwords could authenticate equivalently.
- **Exploit and existing controls:** The eight-character/letter/digit policy and bcrypt cost 12 did not address truncation. An attacker still needed the same first 72 bytes, which limits practical impact.
- **Affected file:** `backend/src/services/auth.service.js`.
- **Fix:** Reject new passwords over 72 UTF-8 bytes.
- **Verification:** Registration regression test rejects a 73-byte password and checks no account was created.

### 10. Weak optional encryption key and exposed development listener — Low, configuration-dependent

- **Attack path:** A short `ENCRYPTION_KEY` could be stretched into the AES key and make stored provider keys susceptible to offline guessing after a database leak. A development server using the known fallback JWT secret could listen on all interfaces.
- **Exploit and existing controls:** Production already required a non-default 32-character JWT secret; AES-256-GCM used random nonces. The optional encryption key length and nonproduction bind address were not checked.
- **Affected files:** `backend/src/config/env.js`, `backend/src/server.js`, `backend/.env.example`.
- **Fix:** Reject short production encryption keys and bind nonproduction servers to loopback by default.
- **Verification:** Production configuration tests reject a short key and assert host/proxy defaults.

## Second-pass observations and limits

- The second pass rechecked every route, DB filter, frontend rendering sink, provider call, and deployment setting. It found the lease recovery issue in finding 7, the field limits in finding 8, and the cookie/configuration issues in findings 5 and 10; those are covered by fixes and tests above.
- The direct virtual-patient attempt response no longer includes its checklist while active. The same published checklist is intentionally available through guided single-player practice, so practice scores must not be treated as tamper-resistant exam results. Removing that cross-mode availability would require a product rule change.
- Browser pages render user and AI text as React text; there is no `dangerouslySetInnerHTML`, dynamic server-side command execution, dynamic outbound URL, filesystem upload, or redirect target. No SQL store exists. Mongo query operators are sanitized and user identifiers are cast/validated before queries.
- The frontend and API can be on different origins only if browser cookie policy allows the configured credentialed session; `COOKIE_SAMESITE=none` requires HTTPS. Rate-limit counters are in process memory, so multiple API instances need a shared store for a global limit. Live reverse-proxy, TLS, production environment, and paid-provider behavior were not available for validation.
- OAuth, email verification, password reset, payments, webhooks, and Docker configuration are not implemented in this repository. The existing `.env` files are ignored by Git; no tracked secret file was found. Existing accounts created with passwords over 72 bytes cannot be identified from bcrypt hashes alone and may need a user-led password change when such a flow is added.

## Verification

- Backend integration and configuration suite: `npm test` — 30 passed.
- Frontend: `npm run build` and `npm run lint` — passed; lint reported four pre-existing warnings unrelated to the security changes.
- Dependency advisories: `npm audit` for both backend and frontend — zero reported after the dependency updates.
