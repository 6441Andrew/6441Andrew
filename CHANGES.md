# CHANGES — Wonderland Academy ERP / Parent Portal

> Last updated: **2026-09-09 (round 10)**

## Round 10 — Testing, security pass, build hardening, backups/DR, Terms page, collapsible What's New

- **Automated tests — actually run, not just written.** No test framework
  existed in the project and there's no network access in this environment
  to install one, so I built `scripts/run-pure-tests.mjs`: a zero-dependency
  Node harness for the three fully-pure (import-free) report-card logic
  modules (`knecGrading.js`, `reportCardTableLayout.js`,
  `reportCardCharts.js`) and ran it for real. It caught one bug — in my own
  test's regex, not the app code — which is fixed. **24/24 passing.** Wired
  up as `npm test`. Everything else (React components, Firebase-backed
  code) was reviewed manually/statically, not executed — there's no
  framework in place yet for that and no way to install one here.
- **Security review.** Found and fixed one real inconsistency:
  `printHtml.js` (used by every Print and Download-Word button) built its
  logo `src` with ad-hoc quote-stripping instead of the codebase's own
  established `safeImageSrc()` sanitizer (already used correctly in
  `WpsExamBuilder.jsx`'s letterhead). Fixed for consistency/defense-in-
  depth — actual exploitability was low since the logo value is
  admin-controlled or from the user's own `localStorage`, but it's the
  kind of inconsistency that becomes a real bug the next time someone
  reuses this function elsewhere. Also audited the SVG shape-label
  rendering and question-paper content paths in `WpsExamBuilder.jsx` /
  `ExamPageBuilder.jsx` for injection — both already properly escape/
  sanitize; no changes needed there.
- **Build hardening — code shrinking + minification.** `vite.config.js`
  now uses Terser (mangled identifiers, `drop_console`/`drop_debugger`,
  comments stripped) instead of the default minifier. Documented plainly
  in the config comments: this is minification/mangling, not real code
  hiding — anything that runs in a browser is fully downloadable and
  de-minifiable by design, for every web app, not just this one. It's not
  a substitute for keeping real secrets out of the client; that's what
  Firestore rules and Cloud Functions are for.
- **Database backup + disaster recovery.** Added
  `scripts/backup-firestore.sh` (native `gcloud firestore export` + a
  retention-cleanup pass) and `docs/DISASTER_RECOVERY.md` (RPO/RTO
  targets, backup mechanisms for Firestore/Storage/Auth, step-by-step
  restore procedure, a post-restore verification checklist, and an
  explicit action-item list). **Neither has been run against your actual
  infrastructure** — I have no access to your GCP/Firebase project or
  credentials from this environment. Both are ready for your team to run,
  and the DR doc's last action item is scheduling a real restore drill.
- **Terms & Conditions page.** New `src/pages/TermsAndConditions.jsx` at
  `/terms`, reachable whether signed in or not, linked from both footers
  (authenticated app + public landing page). Marked clearly as a
  **template** — sections on fees/refunds and data retention are left as
  placeholders since those need your school's actual policy, and the
  whole page needs a lawyer's review before being treated as binding.
- **Collapsible What's New.** The `/whats-new` page (and its underlying
  `src/lib/changelog.js` data, now including this session's entries) had
  grown to ~8 always-expanded cards. Each entry is now collapsible — the
  newest one starts open, the rest start collapsed, with Expand all /
  Collapse all controls.

## Round 9 — Print Cards: clean 2-page layout (charts page, then exam records page), Word table-width fix

Applies to both the in-app **Print** flow and **Download Word** — they share
the same table-building logic, so both got the same fixes.

- **Reordered pages.** Charts + insights now come first, right after the
  letterhead — that section's height doesn't grow with class size (bar
  chart height only grows with subject count, and is now capped more
  tightly past 14 subjects), so it reliably fills page 1 on its own. The
  **exam records table now always starts on a fresh page 2**
  (`page-break-before: always`), giving it a full page's height budget
  instead of whatever was left after the letterhead on page 1 — that
  leftover space was the main squeeze on **Grade 4–7**, which carries the
  most subjects of any grade band (CBC upper-primary through junior
  secondary) and therefore the widest/tallest tables.
- **Word-specific table width fix.** Word's HTML/MHTML import filter (what
  every "Download Word" button produces, via `wordExport.js`) does not
  reliably honor CSS3 `table-layout: fixed` or `<col>`-level CSS widths on
  their own — a long-documented Word quirk. Added the plain `width=`
  attribute (matching percentage) to both the `<table>` and every `<col>`,
  plus `mso-table-layout-alt: fixed` on the table style — Word's own hint
  for "treat this as fixed-width." Browsers already respected the CSS
  version, so this is additive: it specifically fixes wide subject-count
  tables (Grade 4–7 again) that could render at natural content width and
  spill columns past the page edge in Word even though the identical HTML
  printed cleanly from a browser.
- **Grading legend (Grade 7–9 achievement-level table) can no longer split
  across a page break.** It previously only had per-row `page-break-inside:
  avoid`, which stops a single row splitting but not the heading/table/note
  as a whole straddling two pages. Wrapped the entire block in
  `page-break-inside: avoid`.

## Round 8 — Real logo installed, PWA icons generated, vite.config.js added

- **Real logo installed.** `public/wonderland-logo.jpg` now holds your actual
  uploaded crest (previously a placeholder path with no file behind it).
  Generated proper square PNG icons from it: `icon-192.png`, `icon-512.png`,
  plus `icon-192-maskable.png` / `icon-512-maskable.png` (padded ~14% so
  Android's circular/rounded icon masks don't crop the crest or banner text),
  and a small `favicon.png`. `manifest.json` and `index.html` now point at
  these instead of the raw jpg.
- **New `vite.config.js`** (not in any prior export). `@vitejs/plugin-react`
  wired up for JSX/Fast Refresh; dev on 5173, preview on 4173; no alias
  config needed (no `@/` imports anywhere in `src`). Added `manualChunks`
  splitting `firebase`, `pdfjs-dist`, `mammoth`, `xlsx`, and `jszip` into
  their own build chunks — those are only pulled in by specific pages
  (Admissions, CBC, ExamEntry, Finance, LearningHub, PrintCards, Students),
  so this keeps the main bundle from carrying all of them on every page load.

## Round 7 — Created index.html, manifest.json, sw.js (none existed in any export)

- **New `index.html`** at project root. Wired to what `main.jsx` already
  expected but had nothing to attach to: `#root`, `#wa-boot-splash` (branded
  boot splash with inline critical CSS, removed by `main.jsx`'s existing
  handoff code), and `/src/main.jsx` as the module entry. Added
  `<meta name="viewport" content="width=device-width, initial-scale=1,
  viewport-fit=cover">` — a missing/incorrect viewport meta is the single
  most common cause of a page first laying out at desktop width and then
  visibly snapping to the real mobile/portrait width, which is very likely
  what looked like "switches to landscape before switching to portrait."
- **New `public/manifest.json`** with `"orientation": "portrait"` — locks
  orientation for the installed/standalone PWA before any JS runs at all,
  closing the other likely source of that same flash. Icons currently point
  at the existing `/wonderland-logo.jpg`; swap in real 192×192/512×512 PNGs
  when you have them for a crisper home-screen icon.
- **New `public/sw.js`** — a minimal passthrough service worker. `main.jsx`
  has always called `navigator.serviceWorker.register('/sw.js')`; with no
  file there, that 404'd on every load, which is a plausible candidate for
  "the script error" — silent to users but visible in the console on every
  open. This one only exists to register successfully and satisfy install
  eligibility (`beforeinstallprompt` → `InstallPrompt.jsx`); it does no
  offline caching (`src/lib/cbcOffline.js` and the Firestore persistent
  cache in `src/lib/firebase.js` already cover app-data offline access
  independently).
- No `vite.config.js` was in any export either — Vite will still run on
  defaults, but if you have `@vitejs/plugin-react` config (Fast Refresh,
  aliases, etc.) in your real repo, it isn't reflected here. Let me know if
  you want that rebuilt too.

## Round 6 — Google sign-in now self-signs-up as parent (hardened); 2 items blocked on missing files

- **Google Sign-In now defaults unrecognized accounts to a `parent` self-signup**
  instead of blocking them with "no role assigned." Previously, a Google
  account not already provisioned in `emailIndex` or `staffInvites` was signed
  out with an error. Now it's auto-created as `role: 'parent'`.
  - **Hardened, not just added:** `role` is a hardcoded literal in the client
    (never derived from the token or displayName), and `email` is pinned to
    `cred.user.email` (Google's own verified claim) — never free-typed.
  - **Firestore rule vulnerability closed in the process:** the existing
    parent-self-signup rule branch (`users/{uid}` create, `role == 'parent'`)
    had **no check that the written `email` matched the caller's own auth
    token** at all. Since every user doc is readable by all staff and parents
    (Teacher Chat directory, etc.), any self-signed-up account — Google or
    email/password — could write an arbitrary `email` field and impersonate
    someone else's address across the app. Fixed by requiring
    `request.resource.data.email == request.auth.token.email` on that branch.
    Applied the same fix to the staff-invite self-signup branch for
    consistency (teacher/bursar/headteacher/admin invite claims).
  - **Requires `firebase deploy --only firestore:rules`.**
- **Script error in `index.html` / orientation flash on launch — blocked,
  need the file.** This export only contains `src/`, `api/`, `docs/`, and
  root config — there's no `index.html`, `manifest.json`/`site.webmanifest`,
  or `public/` folder (referenced by `main.jsx` as `/sw.js` and the
  `wa-boot-splash` element, and by `OrientationToggle.jsx`'s CSS fallback).
  The landscape-then-portrait flash on open is almost always caused by a PWA
  manifest's `"orientation"` field or an inline script running before React
  mounts — I can't find or fix either without those files. Please upload
  `index.html` and (if you have one) `manifest.json`/`site.webmanifest` and
  the `public/` folder.

## Round 5 — CSP blocking Cloud Function calls, console noise, Google-login privilege-escalation hole

- **Cloud Function callables (`adminSetUserPassword`, student first-time setup,
  etc.) silently blocked by CSP.** `connect-src` allowed Firebase Auth/Firestore
  domains but never `*.cloudfunctions.net` / `*.run.app`, so any
  `httpsCallable()` request was blocked by the browser with only a console CSP
  violation — no error the app could catch or show. Added both domains to
  `connect-src` in `vercel.json`. **Redeploy + hard-refresh required.**
- **Console noise in production.** Added `src/lib/consoleGuard.js`, imported
  first thing in `main.jsx`, which no-ops `console.log/info/debug/warn/error`
  in production builds only (`import.meta.env.PROD`). Dev builds are
  unaffected.
- **SECURITY — self-service admin privilege escalation via Google Sign-In.**
  `firestore.rules`' `emailIndex/{email}` self-serve create/update rule let
  any authenticated user write an arbitrary `role` (including `admin`) into
  their own row, keyed by their own real, Google-verified email. Because
  `users/{uid}`'s create rule trusts a pre-provisioned `emailIndex` row's role
  when `request.auth.token.email` matches, an attacker could sign in with
  Google, self-create `emailIndex/{their-own-email}` with `role: 'admin'`,
  then immediately claim admin on `users/{uid}` — no invite, no admin action.
  Fixed by disallowing `role` from ever being set or changed by the self-serve
  branch of `emailIndex` create/update; only admin/head can set it now (the
  only legitimate caller, `UserControl.jsx`, already goes through
  `isAdmin()`/`isHead()`). **Requires `firebase deploy --only firestore:rules`.**

## Round 4 — AI "busy, quits after ~4s" + report card page count + Google/reset login

- **Google Sign-In and password reset silently broken — root cause found.**
  `vercel.json`'s `Content-Security-Policy` header shipped with
  `script-src 'self'` and no exceptions. That blocks every third-party
  script — including `https://apis.google.com/js/api.js`, which the
  Firebase Auth SDK loads itself (via `gapi.iframes`) to run
  `signInWithPopup`'s Google sign-in flow, and the Google reCAPTCHA scripts
  Identity Platform loads for email/password operations (password reset,
  signup). With those blocked by CSP, the browser only ever shows a
  console CSP violation — nothing in the app's own error handling could
  catch or report it, so both features looked simply "broken" with no
  useful message. Fixed by adding the required domains to `script-src`
  (`apis.google.com`, `www.gstatic.com`, `www.google.com`,
  `www.recaptcha.net`), `connect-src` (`apis.google.com`, `www.google.com`,
  `recaptcha.google.com`), and `frame-src` (`accounts.google.com`,
  `www.google.com`, `recaptcha.google.com`). All other CSP restrictions are
  unchanged. **Redeploy is required** for the new header to take effect —
  and hard-refresh (or open in a private window) once live, since browsers
  cache CSP-carrying responses.

- **WPS AI Generate: gave up right after "Model busy — waiting 4s…".**
  `callGeminiForQuestions()` in `src/pages/WpsExamBuilder.jsx` only retried
  a busy/overloaded model **once** — wait 4s, try again, and if that single
  retry also came back busy, the whole generation failed immediately. On a
  genuinely busy free-tier model, one retry often isn't enough, so this
  looked like "says model busy then quits after 4s." Replaced with up to
  **4 retries** with growing backoff (4s → 8s → 15s → 25s), each asking for
  fewer questions per attempt; the error is only shown once every attempt
  is exhausted. The server side (`api/gemini.js`) already retries and
  falls back across models per call — this only fixes the client giving up
  too early on top of that.
- **Report cards spilling onto extra printed pages / wasted space.**
  Two bugs compounded: (1) `fontSizeForColumnCount()` only shrank the font
  as *subject columns* grew, never as *student rows* grew, so a long class
  list still used a large font and ran past one page. (2) In the Print/PDF
  path (`PrintCards.jsx`) that shrink was additionally being silently
  overridden: the font-size was set via a `.rc-table { font-size: … }`
  class rule, which loses a CSS specificity contest to the shared
  `table.rc-table { font-size: 11px }` default already in
  `printHtml.js` — so the printed table was stuck at 11px no matter what
  the code computed. Fixed by (a) adding row-count to
  `fontSizeForColumnCount()` and a matching `cellPaddingForRowCount()` in
  `reportCardTableLayout.js`, used by both the Print and Word paths, and
  (b) applying the computed font-size as an inline `style` attribute on
  the `<table>` (inline styles always win) instead of a competing class
  rule. Also added `page-break-before:always` before the charts/insights
  section so output lands on a predictable **2 pages** — marks table on
  page 1, performance overview on page 2 — rather than spilling onto a
  3rd page. No rows, columns, or students are dropped — this only affects
  font size, padding, and where the page break falls.
> Organized by area rather than by session. Where the same feature was touched
> more than once across merged sessions, entries below are consolidated into
> one canonical description instead of repeated.

---

## Auth & login

### Mobile session restore (SetupBanner / "no role" after backgrounding the app)
**Files:** `src/contexts/AuthContext.jsx`, `src/App.jsx`

On low-RAM phones, login → download a file → switch to Downloads → return to
the tab used to show the SetupBanner and drop the user's role, even though
they were still signed in. The browser kills the tab; Firebase Auth restores
the user on return, but Firestore profile resolution can lag briefly, and the
old code treated that lag as "no profile" and signed the user out.

- **Profile cache** (`localStorage: wonderland_auth_profile_v1`, 14-day max
  age): written after every successful login/profile refresh. On auth
  restore, the cached role hydrates the UI immediately for a matching `uid`,
  then Firestore is re-checked in the background.
- **`promoteSession`** no longer signs out on transient network/Firestore
  errors. Sign-out only happens when online, the profile is definitively
  empty, *and* there's no valid cache. Offline, the cached role is kept so
  SetupBanner doesn't show for an already-logged-in user.
- `pageshow` (incl. BFCache), `visibilitychange`, and `online` listeners
  trigger a soft profile refresh without ever forcing a sign-out.
- Route guards (`ProtectedRoute`, `AuthenticatedRouteGuard`,
  `AuthLandingRedirect`) show "Restoring your account…" instead of bouncing
  to login while `user` exists but `role` is still resolving.
- Explicit logout still clears the cache.

### Google sign-in + bulk pre-provisioning (scales to ~20k users)
**Files:** `src/contexts/AuthContext.jsx`, `src/pages/AdminLogin.jsx` /
`StaffLogin.jsx` (+ portal variants), `firestore.rules`

- `loginWithGoogle` uses `GoogleAuthProvider` + `signInWithPopup`, resolves
  role via the user's profile, then falls back to an **emailIndex claim**:
  admins pre-write `emailIndex/{email}` with a role (no Auth account needed
  per person); a user's first Google login looks up their email there,
  creates `users/{uid}`, and marks the index claimed — no manual Auth
  account creation required for large schools. No role found anywhere →
  sign out with a clear "ask an administrator" message.
- Runs on Vercel Hobby + Firebase Spark (no paid backend required).
- Admin/Staff login screens lead with **Continue with Google**;
  email/password remains as a secondary option. Student portal can still use
  synthetic emails where Google mapping isn't used.
- **Bug fixed 2026-09-08:** `upsertEmailIndex()` (`src/lib/authIndexes.js`)
  built its payload fresh on every call and then checked
  `if (!payload.created_at)` — which was always true, since that key was
  never set beforehand — so `created_at` silently got overwritten to "now"
  on every update to an existing row (bulk edits, role changes, re-claims),
  not just on first creation. Fixed to check the existing Firestore doc and
  only stamp `created_at` when the row doesn't already have one.

### Password reset
**Files:** `src/pages/ResetPassword.jsx` / `src/pages/portals/ResetPassword.jsx`

`resetPassword` uses `actionCodeSettings` (`continueUrl` / `handleCodeInApp`)
with safe fallbacks. The reset page parses `oobCode` from query or hash
params, verifies it, and shows a clear "link is invalid or has expired"
message rather than a raw Firebase error.

### Staff & student invites
- Bulk admission import writes `studentInvites/{admissionNumber}`; a child's
  real login identity (`auth_uid`/synthetic `auth_email`) lives there, not on
  the `students/{id}` record.
- `staffInvites/{staffId}` lets an admin pre-assign a role by Staff ID so
  first-time signup takes the invited role, mirrored into `staffIds/{id}`
  for login lookup.
- Role-based page access is unchanged (Firestore `users` / `emailIndex` /
  invites), and `firestore.rules` gates the claim/create paths accordingly.

---

## Report cards

**Files:** `src/lib/wordExport.js`, `src/lib/reportCardTableLayout.js`,
`src/lib/reportCardCharts.js`, `src/lib/reportCardDocx.js`,
`src/lib/printHtml.js`, `src/pages/PrintCards.jsx`

Three separate problems were fixed together since they shared root causes:

1. **Logo missing in Word downloads.** Every "Download Word" button embedded
   the logo as a base64 `data:image/...` URI inside plain HTML saved with a
   `.doc` extension. Word opens that via its HTML import filter (it sniffs
   content, ignores the extension) — but that filter doesn't reliably render
   base64-inlined images, only images that arrive as separate MIME parts.
   Fixed by `src/lib/wordExport.js`: wraps the HTML as real MHTML
   (`multipart/related`), moving each base64 image into its own MIME part
   with a `Content-ID` and rewriting `src="data:..."` to `src="cid:..."` —
   the same format Word itself produces for "Save As → Web Page, Single
   File." `ensureLogoDataUrl()` also converts remote `https://` logo URLs to
   `data:` URIs first (fetch → canvas → resized JPEG/PNG, max edge ~256–320px
   so the doc stays well under Firestore's ~1MB limit). Every Word export
   path (report cards, WPS exam papers, lesson plans, CBC, audit log) now
   goes through `downloadAsWordDoc()` / `downloadWordHtml()` instead of
   building its own `Blob(..., { type: 'application/msword' })`.
2. **Tables overflowing the page** once a class had many subjects — right-
   hand subject columns (and their borders) were silently cut off in print
   and Word, because `table-layout: auto` with per-column `min-width` hints
   lets the table grow past the printable width instead of shrinking to fit.
   Fixed with `reportCardTableLayout.js`: `table-layout: fixed` plus an
   explicit `<colgroup>` of percentage widths that always sum to 100%, and
   `fontSizeForColumnCount()` shrinking the font as columns grow so cells
   stay legible instead of squeezing unreadable slivers. Report cards now
   print/export in **landscape**; rows get `page-break-inside: avoid`, and
   `<thead>` repeats on every printed page.
3. **Blank letterhead-only first page.** Charts used to render before the
   marks table, wasting page 1 on just the header. Fixed: table renders
   first, compact SVG charts after (capped at 5 insight lines), tighter
   print margins, and `page-break-after: avoid` on the header so it never
   lands alone on its own page.

---

## WPS Exam Bank / AI Generate

**Files:** `src/pages/WpsExamBuilder.jsx`, `src/lib/examBank.js`,
`api/gemini.js`

- **Removed the "Generate paper" tab.** Tabs are now: **AI Generate ·
  Upload · Add question · Library** (default: AI Generate).
- **Tighter layout** for AI/bank questions in both Word and Print/PDF: 11pt
  body font, reduced spacing between questions, no spacer divs for blank
  answer lines, fewer answer lines on structured/essay items, and a more
  compact letterhead (smaller logo, tighter header).
- **"Model is busy" / generation failures — root cause and fix (updated
  2026-09-08):** the default and fallback Gemini model IDs configured in
  `api/gemini.js` were stale — one real model in the fallback chain
  (`gemini-2.0-flash`) was retired by Google on 2026-06-01, and the
  originally-configured default was never a valid model ID at all — so most
  generation attempts burned through dead names before ever reaching a
  working model, surfacing to teachers as a generic "model busy, try again."
  Fixed by resolving the current model list directly from Google's models
  endpoint and updating the configured chain to presently-serving Gemini
  models, tried in order until one succeeds, with the specific failing model
  named in the error if every fallback is exhausted (instead of one generic
  "busy" message). User-facing error copy updated to match.
- **Duplicate questions from AI generation.** Gemini sometimes repeats a
  question verbatim (or near-verbatim) within one response, and every item
  used to pass straight through. Added `normQuestionText()` /
  `dedupeQuestions()` (lowercase, strip punctuation, collapse whitespace,
  keep first occurrence); applied to every AI response before it reaches the
  canvas or the bank. New questions saved to the bank are also checked
  against what's already there for that class + subject. If duplicates drop
  the count below what was requested, the shortfall notice says so
  explicitly instead of blaming a vague "model limit." The server-side
  prompt also now explicitly asks for unique questions as a first line of
  defense.
- **Upload topics/notes for AI generation:** teachers can upload a `.docx`,
  `.doc`, `.txt`, or text-based `.pdf` (2MB max) instead of pasting notes.
  Extracted client-side (`pdfjs-dist` for PDFs, existing mammoth/JSZip/binary
  extractors for Word), then cleaned with `stripLetterheadNoise()` to strip
  school letterhead boilerplate (address/phone, candidate fields,
  instructions blocks, page numbers, signature lines) before it's appended
  to the source-notes field Gemini uses.
- **Truncated question text.** The Exam Bank list used to hard-cut questions
  at 140 characters; the review-before-publish list in Learning Hub cut at
  80 characters (with MCQ options cut to 40 characters *inside the answer
  dropdown*, making options indistinguishable). All three now show full,
  wrapped text.
- **Exam paper ownership:** `firestore.rules` restricts `question_papers` /
  `exam_bank` to owner-only read/update/delete; client save/delete checks
  ownership in both the Exam Page Builder and WPS.

---

## Exam Entry

**Files:** `src/pages/ExamEntry.jsx`, `api/gemini.js`

- **Case-sensitive subject names caused duplicate/blank marks.** Re-typed or
  re-imported subject names ("Maths" vs "MATHS") weren't recognized as the
  same subject by the exact-match "does this record exist?" check, so a
  re-fetch created a *new* score doc instead of updating the old one — and
  a mark saved under one casing was invisible to a grid cell rendered under
  another. Fixed with `normSubj()` / `sameSubject()` (trim + collapse
  whitespace + uppercase) used only for identity comparisons, applied to
  `markKey`, all three save paths, and report-card snapshot building. A
  one-click **"Fix all — keep newest, remove rest"** cleanup was added to
  the Check Issues panel for records created before this fix.
- **"Apply all classes" only saved the last class in the workbook.** The
  import handler pooled every class's marks into one shared in-memory set,
  so only the last class processed ever got shown or written to the
  database — others were computed correctly but silently dropped. Fixed:
  each class now gets its own independent subject/marks set and is saved to
  the database immediately via `upsertMarksForClass()` as it's processed
  (not deferred to the end), including its own report-card publish if "push
  to report cards" is checked. Applying a single class is unaffected.
- **New: "Merge with Gemini"** next to the deterministic duplicate-fix
  button — sends each duplicate group to a new `merge_duplicates` mode on
  `api/gemini.js`, which picks the most complete/plausible value per field
  (e.g. a non-blank teacher name over a blank one) rather than just keeping
  whichever record is newest, with a clear fallback to the deterministic fix
  on any AI/network failure.
- **New: fetch a single student's record** — a roster-wide search box that
  either merges just that student's scores into the current grid (if
  they're in the selected class) or switches the class filter to theirs.

---

## Learning Hub & Dashboard (parent-facing)

**Files:** `src/pages/LearningHub.jsx`, `src/pages/Dashboard.jsx`,
`src/pages/ParentHome.jsx`, `firestore.rules`, `src/lib/hubExtras.js`,
`src/pages/Fees.jsx`

- **Parent progress was checked against the wrong identity.** A linked
  child's `students/{id}` record has no login fields of its own — only the
  parent's email. Every progress helper (`progressEmail`, `sameHubUser`,
  `isEnrolledIn`, exam/progress lookups, etc.) defaulted to the *parent's*
  uid/email when no explicit args were passed, so a parent's "My progress"
  view was effectively checking their own nonexistent Learning Hub activity
  — 0%/blank regardless of the child's real progress. Fixed with a
  `childAuthMap` resolver that looks up each child's real `auth_uid`/
  `auth_email` from `studentInvites`, and `myHubUid`/`myHubEmail` now back
  every helper's default parameters. If the child hasn't completed Student
  Portal setup yet, the dashboard shows an explanatory note instead of a
  misleading "0% / not started."
- **Attendance/fees/CBC stats silently zero for parents.** `Dashboard.jsx`
  ran unscoped collection reads that Firestore's per-document parent rules
  can't verify against an unfiltered query, so the whole read was denied and
  swallowed into `[]` with no visible error. Fixed: students load first
  (owner-scoped), then attendance/fee_payments/cbc_assessments are queried
  via chunked `student_id in [...]` against the parent's own linked
  children — matching the pattern `ParentHome.jsx` already used correctly.
  Also removed an explicit `!isParentRole` exclusion that hid CBC data from
  parents despite `permissions.js` already granting them read access.
- **CBC tier gating:** neither `ParentHome.jsx` nor `Dashboard.jsx` checked
  subscription tier before showing CBC data, so Community-tier schools (CBC
  disabled) still showed a CBC stat card/tab leading nowhere. Both now gate
  behind `isModuleEnabled('cbc', tierState, role)`, falling back to an
  Announcements count when disabled. Added an `AttendanceTrend` component
  (a dependency-free ~21-day colored day-strip + rolling present-rate badge)
  above the attendance table.
- **Fee lock was client-side only.** `assertStudentFeesCleared()` /
  `checkEligibility()` computed the fee gate in the browser only — a student
  could bypass it via devtools, stale state, or a direct Firestore call, and
  the old rules let any signed-in student read `lessons`/`hub_exams` with no
  server-side check. Fixed in two parts: `syncStudentFeeBalance()`
  recomputes the true balance from the `fee_payments` ledger and writes
  `fee_balance`/`fees_cleared` onto `students/{id}` after every payment
  write; `firestore.rules` adds `studentFeesCleared()`, gating `lessons`
  reads, `hub_exams` reads (closing a loophole where "any signed-in user"
  could read a published exam anyway), `hub_submissions` writes, course
  self-enrollment, and `learning_progress` writes — with only
  bursar/head/admin able to write the balance fields, so nothing a student
  does client-side can move the number that gates access. Past
  results/marks stay visible while locked; only new content/submissions are
  blocked. **Deploy note:** requires `firebase deploy --only firestore:rules`
  *and* a one-time **Recalculate Balances** click in Fees to backfill
  existing students (students with no `fee_balance` field yet are treated as
  cleared until that backfill runs, so the rules don't lock out the whole
  school on deploy).

---

## App-wide UX

- **Errors inline, success stays as toast** (`src/contexts/DialogContext.jsx`):
  `errorDialog()` now renders as a dismissible, non-auto-dismissing
  `<Alert variant="danger">` stacked under the navbar instead of an
  easy-to-miss toast; `thankYou()`/`infoToast()`/`progressToast()` are
  unchanged. `progressToast(...).fail()` (bulk import/export) routes through
  the same inline error path. Same dedupe behavior as before (identical
  error within 0.8s skipped, max 4 stacked). No per-page changes needed —
  every existing call site inherits the new behavior.
- **Public-site quality checklist (20 items):** fixed horizontal scroll,
  broken links, missing mobile menu affordances, favicon, per-route page
  titles, meta description/Open Graph, footer links, custom 404, dynamic
  copyright year, offline-tolerant login buttons, friendly error/success
  messages, real (non-placeholder) empty-state copy, mobile overflow fixes,
  clickable logo/phone/email, and general mobile/PWA polish.
- **Firebase offline support:** `persistentLocalCache` +
  `persistentMultipleTabManager` (falls back to memory cache if IndexedDB is
  blocked); `SyncStatus` badge shows Online/Offline-cached state; login/
  signup no longer hard-blocked offline (SetupBanner shown instead).
- **In-app changelog:** the items on this page are now also visible inside
  the app itself — see **What's New** below.

---

## What's New (in-app changelog)

**Files:** `src/pages/WhatsNew.jsx`, `src/lib/changelog.js`,
`src/components/Navbar.jsx`, `src/App.jsx`

So this document isn't the only place these fixes are visible, a **What's
New** page now ships inside the app itself:

- A structured version of this changelog lives in `src/lib/changelog.js`
  (one entry per dated release, grouped the same way as this file: Auth,
  Report Cards, WPS Exam Bank, Exam Entry, Learning Hub & Dashboard,
  App-wide UX) and renders on a new `/whats-new` route, reachable from a
  "What's New" link in the Navbar/Sidebar user menu — visible to every
  signed-in role.
- A small unread-count badge on that Navbar link (backed by
  `localStorage: wonderland_whatsnew_last_seen`) shows how many entries have
  shipped since the user last opened the page; opening it clears the badge.
- Route is a normal `ProtectedRoute`-free authenticated route (no
  resource/tier gate — every role should be able to see what changed).

---

## Deploy order (recommended)

1. `firestore.rules`
2. `api/gemini.js` (Vercel)
3. Frontend build (all of `src/**`, `index.html`, `public/**`)
4. Run **Backfill parent emails** once in Admissions
5. Run **Recalculate Balances** once in Fees (fee-lock backfill)
6. Spot-check offline: DevTools → Network → Offline → confirm badge +
   SetupBanner behave correctly
