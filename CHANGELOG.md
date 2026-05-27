# Changelog

All notable changes to Adherix are documented here.

---

## [0.2.0] — 2026-05-26

### Phase 1 Completion — Auth, PostgreSQL, Reporting, Hardening

---

### Authentication (`lib/auth.ts`, `middleware.ts`, `app/login/`)

- Added **NextAuth v5** (beta) with Credentials provider — email + password login backed by Prisma `User` table
- Passwords hashed with `bcryptjs` (cost factor 10); seed accounts use `password123` (dev only)
- JWT session strategy; `role` and `id` threaded through JWT callbacks into session
- `middleware.ts` at project root protects all routes except `/login` and `/api/auth/**`
- `/login` page: Adherix brand mark, email/password form, error display, HIPAA notice
- `app/api/auth/[...nextauth]/route.ts` exports GET/POST handlers
- `app/layout.tsx` fetches session server-side and passes it to `<Sidebar>`
- `components/Sidebar.tsx` shows logged-in user name + role in footer; Sign out button calls `signOut()`

---

### PostgreSQL Migration + Deployment (`prisma/schema.prisma`, `railway.json`)

- Changed Prisma datasource provider from `sqlite` → `postgresql`
- Added `passwordHash String?` field to `User` model; regenerated Prisma client
- Updated `.env.example` with `DATABASE_URL` examples for both SQLite and PostgreSQL, plus `NEXTAUTH_SECRET` and `NEXTAUTH_URL`
- Added `railway.json` with Nixpacks builder, `prisma migrate deploy` start command, and health check path
- Added `app/api/health/route.ts` — returns `{ status: "ok", timestamp }` for Railway health checks
- Added `package.json` scripts: `postinstall` (prisma generate), `migrate:prod`, `db:seed:prod`

---

### Outcomes Reporting (`app/reports/`, `app/api/reports/`)

- New **`GET /api/reports`** route: accepts `period` (7d / 30d / 90d / custom) query params; queries `TreatmentEvent`, `OutreachTask`, `TreatmentEnrollment`, and `AuditLog`; returns summary stats, per-protocol breakdown, weekly trend, outreach metrics, and staff activity
- New **`/reports` page** with:
  - Period selector (4 buttons + custom date pickers)
  - 6 summary cards: Completed, Missed, Adherence Rate (color-coded), Outreach Resolved, Reschedule Rate, Active Patients
  - Recharts `ComposedChart` — bars for completed/missed per week + line for adherence % on dual Y-axes
  - Protocol adherence table sorted worst-first with color-coded adherence badges
  - Outreach metrics card (avg attempts, avg days to reschedule, top method breakdown)
  - Staff activity table from audit log
  - "Download Report CSV" button — client-side `Blob` + `URL.createObjectURL`, no server route
- Added "Reports" nav item to sidebar (between Audit Log and Settings)

---

### Outreach Improvements

- **`GET /api/outreach/count`** — fast count endpoint returning `{ urgent, total }` for open tasks; no joins
- Sidebar Outreach Queue badge shows live URGENT task count (fetched on mount, red pill badge)
- Outreach page: confirmation toast auto-dismisses after 3 s when "Mark Contacted" or "Voicemail Left" is clicked — no external library

---

### Patient Page Hardening

- Added **Pause Treatment** button with optional free-text reason modal (common use case: insurance hold) — calls `UPDATE_STATUS` → `PAUSED`
- Added **Resume Treatment** button (shown when status is PAUSED)
- Added **Discontinue Treatment** button with browser confirm guard → `DISCONTINUED`
- Enrollment status chip (ACTIVE / PAUSED / DISCONTINUED) shown next to protocol name in the Active Treatment card

---

## [0.1.0] — 2026-05-25

### Phase 1 MVP — Initial Build

---

### Project Scaffold

- Initialized Next.js 15 project with App Router and TypeScript
- Configured `tailwind.config.ts` with custom brand color palette and component utilities (`btn`, `card`, `table-row-hover`)
- Configured `postcss.config.js` with Tailwind + Autoprefixer
- Configured `next.config.ts` with `serverExternalPackages` for Prisma client compatibility
- Added `tsconfig.json` with strict TypeScript, path alias `@/*`, and bundler module resolution
- Added `.env.example` documenting all environment variables with HIPAA safety notes
- Added `.gitignore` excluding `node_modules`, `.next`, `.env`, and SQLite database files

---

### Data Model (`prisma/schema.prisma`)

Defined 9 Prisma models targeting SQLite:

| Model | Purpose |
|---|---|
| `User` | Staff accounts with roles: ADMIN, PROVIDER, STAFF |
| `Patient` | Display name, internal ID, provider, contact info, active flag |
| `TreatmentProtocol` | Interval rules, due-soon/overdue/escalation thresholds, built-in flag |
| `TreatmentEnrollment` | Links patient to protocol; tracks last treatment and next due date |
| `TreatmentEvent` | Immutable history: COMPLETED, MISSED, RESCHEDULED, SCHEDULED, CANCELLED |
| `OutreachTask` | Staff follow-up tasks with priority and status workflow |
| `AiDraft` | Saved AI-generated content (call scripts, chart notes, SMS, summaries) |
| `AuditLog` | Append-only compliance log for all staff actions |
| `ImportBatch` | Tracks CSV import history with row counts and status |

---

### Library Utilities (`lib/`)

#### `lib/db.ts`
- Singleton Prisma client with global caching for Next.js hot reload compatibility

#### `lib/status.ts`
- Defined `TreatmentStatus` enum: `HIGH_PRIORITY`, `OVERDUE`, `NEEDS_OUTREACH`, `DUE_TODAY`, `DUE_SOON`, `ON_TRACK`, `COMPLETED`, `PAUSED`, `DISCONTINUED`, `NO_DATE`
- `STATUS_CONFIG` map with label, Tailwind color classes, and sort priority for each status
- `computeEnrollmentStatus()` — core business logic: compares today vs. `nextDueDate` against each protocol's `overdueAfterDays` and `escalationAfterDays` thresholds; checks for open outreach tasks
- `formatDate()` — locale-formatted date string
- `daysFromNow()` — integer day delta from today
- `daysLabel()` — human-readable label ("Today", "In 3 days", "5 days ago")

#### `lib/audit.ts`
- `logAudit()` — async helper that writes to `AuditLog`; silently swallows errors so failed audits never break the user action

#### `lib/ai.ts`
- `generateAiDraft()` — dual-mode: mock (default) or live OpenAI
- Mock mode generates realistic, fully-formatted templates for all 4 draft types without any API call
- Live OpenAI mode respects `ALLOW_PHI_TO_AI` env var — when `false`, only `displayName` and `internalId` are included in prompts (no DOB, diagnosis, phone, or other PHI)
- Draft types: `CALL_SCRIPT`, `SMS_MESSAGE`, `CHART_NOTE`, `WEEKLY_SUMMARY`
- Falls back to mock on any API error

#### `lib/csvImport.ts`
- `validateCsvRow()` — validates required fields and date formats; returns `_valid`, `_errors`, and `_rowIndex` metadata per row
- `CSV_TEMPLATE_HEADERS` and `CSV_TEMPLATE_EXAMPLE` — downloadable template constants

#### `lib/types.ts`
- Shared TypeScript interfaces: `PatientWithStatus`, `EnrollmentWithProtocol`, `DashboardStats`

---

### API Routes (`app/api/`)

#### `GET /api/dashboard`
- Aggregates all active enrollments; computes status for each using `computeEnrollmentStatus()`
- Returns: stat counts (dueToday, dueThisWeek, overdue, needsOutreach, highPriority, completedThisWeek), top 10 urgent patients sorted by severity, status count map for chart

#### `GET /api/patients`
- Supports `search` (name/ID/provider) and `activeOnly` query params
- Returns patients with active enrollments and open outreach task counts included

#### `POST /api/patients`
- Creates a new patient; enforces unique `internalId`; writes audit log entry

#### `GET /api/patients/[id]`
- Full patient detail: enrollments with protocols, last 30 treatment events, all outreach tasks (with enrollment/protocol context)

#### `PUT /api/patients/[id]`
- Updates patient demographic fields; writes audit log entry

#### `POST /api/enrollments`
- Creates a new treatment enrollment for a patient; writes audit log entry

#### `PATCH /api/enrollments/[id]`
- Multi-action endpoint supporting:
  - `COMPLETED` — updates `lastTreatmentDate`, calculates next `nextDueDate` from protocol interval, creates `TreatmentEvent`
  - `MISSED` — creates `TreatmentEvent`, auto-creates a HIGH priority `OutreachTask`
  - `RESCHEDULE` — updates `nextDueDate`, creates `TreatmentEvent`
  - `UPDATE_STATUS` — changes enrollment status (ACTIVE/PAUSED/DISCONTINUED)
- All actions write audit log entries

#### `GET /api/outreach`
- Returns open outreach tasks (excludes CLOSED by default); supports `status` and `priority` filters
- Sorted by priority (URGENT first) then due date

#### `POST /api/outreach`
- Creates a new outreach task; writes audit log entry

#### `PATCH /api/outreach/[id]`
- Updates outreach task status and outcome note; sets `lastAttemptAt` timestamp; writes audit log entry

#### `POST /api/ai`
- Looks up enrollment with patient + protocol + recent outreach history
- Calls `generateAiDraft()` with safe context
- Saves result to `AiDraft` table; writes audit log entry (records which AI provider was used)

#### `GET /api/audit`
- Paginated audit log (default 50/page); returns total count for pagination

#### `POST /api/import`
- Accepts parsed CSV rows + filename
- Creates `ImportBatch` record; upserts patients by `internalId`; creates or updates `TreatmentEnrollment` if protocol name matches
- Returns per-row error details for display; writes audit log entry

#### `GET /api/protocols`
- Returns all protocols with active enrollment counts

#### `POST /api/protocols`
- Creates a custom (non-built-in) protocol; writes audit log entry

---

### Shared Components (`components/`)

- **`Sidebar.tsx`** — Fixed left nav (64 = 256px wide); active route highlighted; Adherix brand mark; role/phase indicator in footer
- **`StatusBadge.tsx`** — Renders colored pill badge for any `TreatmentStatus`; supports `sm` and `md` sizes
- **`PageHeader.tsx`** — Consistent page title + subtitle + optional action button slot
- **`EmptyState.tsx`** — Centered icon + message + optional action for empty lists
- **`LoadingSpinner.tsx`** — Animated spinner with label for async states

---

### App Layout (`app/layout.tsx`, `app/globals.css`)

- Root layout wraps all pages with `<Sidebar>` + `<main>` two-column structure
- Global CSS defines Tailwind layers with reusable `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-sm`, `.card`, `.table-row-hover` classes

---

### Pages

#### Dashboard (`app/page.tsx`)
- 6 stat cards: High Priority (purple), Overdue (red), Due Today (yellow), Due This Week (blue), Needs Outreach (orange), Completed This Week (green)
- Urgent patient list (top 10) with name, protocol, days label, status badge, and link to detail
- Horizontal bar chart (Recharts `BarChart`) showing patient count per status, color-coded to match status palette
- Quick link to Outreach Queue

#### Patients List (`app/patients/page.tsx`)
- Table with columns: Patient (name + ID), Protocol, Last Treatment, Next Due (with days label), Status badge, Provider, View button
- Debounced search input (300ms) filtering by name/ID/provider via API
- Status dropdown filter applied client-side after fetch
- Add Patient modal with form validation and duplicate ID detection

#### Patient Detail (`app/patients/[id]/page.tsx`)
- 3-column layout: patient info card, active enrollment card, action buttons, draft generator — then timeline + outreach tasks
- Action buttons: Mark Completed, Mark Missed, Reschedule (modal with date picker), Create Outreach Task
- Draft generator buttons: Call Script, SMS Message, Chart Note, Weekly Summary — output shown inline in a monospace pre block
- Activity timeline: merges `TreatmentEvent` and `OutreachTask` records sorted by date, color-coded by event type
- Open outreach tasks panel with link to Outreach Queue

#### Outreach Queue (`app/outreach/page.tsx`)
- Cards sorted by priority (URGENT → HIGH → NORMAL → LOW)
- Per-task action buttons: Mark Contacted, Voicemail Left, Rescheduled (with note modal), Notify Provider, Generate Call Script, Generate Chart Note, Close Task
- Draft modal shows generated content with tab-switch between Call Script / SMS / Chart Note
- Outcome note modal for Rescheduled and Close actions
- Status + priority filter dropdowns
- Summary line showing urgent/high count

#### Protocols (`app/protocols/page.tsx`)
- Cards grouped by category (Addiction Medicine, Schizophrenia, Ketamine, Spravato)
- Each card shows: interval, due-soon threshold, overdue-after, escalation-after, active patient count, built-in indicator
- Add Custom Protocol modal with all configurable fields

#### CSV Import (`app/import/page.tsx`)
- Drag-and-drop zone + click-to-browse file input
- PapaParse used client-side; no file upload to server — parsed in-browser
- Preview table with per-row validation status and inline error messages
- Row count badges (valid/invalid) before import
- Import button disabled when 0 valid rows
- Result summary card on success
- Downloadable CSV template button
- Column reference table when no file is loaded

#### Audit Log (`app/audit/page.tsx`)
- Paginated table (50/page) with timestamp, actor, action badge (color-coded by action type), entity type, truncated entity ID, metadata preview
- Previous/Next pagination controls

#### Settings (`app/settings/page.tsx`)
- HIPAA compliance warning banner with full checklist
- Current configuration display (AI provider, PHI-to-AI status, database, audit logging)
- Phase roadmap (Phase 1 current → Phase 2 → Phase 3)
- Future integrations section: Practice Fusion EHR, Twilio SMS, AI (BAA-covered)
- AI environment variable reference with example `.env` block

---

### Seed Data (`prisma/seed.ts`)

Seeded 9 built-in treatment protocols:

| Protocol | Category | Interval |
|---|---|---|
| Vivitrol | Addiction Medicine | 28 days |
| Sublocade | Addiction Medicine | 30 days |
| Invega Sustenna | Schizophrenia | 30 days |
| Invega Trinza | Schizophrenia | 90 days |
| Abilify Maintena | Schizophrenia | 30 days |
| Aristada | Schizophrenia | 30 days |
| Ketamine Induction | Ketamine | 3 days |
| Ketamine Maintenance | Ketamine | 28 days |
| Spravato | Spravato | 7 days |

Seeded 20 mock patients covering all status scenarios:

| Patient | Protocol | Status |
|---|---|---|
| J. Doe (PF-10294) | Vivitrol | HIGH PRIORITY — 12 days overdue |
| A. Kim (PF-10388) | Sublocade | HIGH PRIORITY — 9 days overdue |
| M. Reyes (PF-10318) | Invega Sustenna | OVERDUE — 4 days |
| T. Park (PF-10421) | Abilify Maintena | OVERDUE — 5 days, outreach contacted |
| R. Morales (PF-10377) | Invega Trinza | DUE TODAY |
| L. Chen (PF-10512) | Spravato | DUE TODAY |
| S. Pham (PF-10301) | Ketamine Induction | DUE TODAY (session 4 of 6) |
| T. Walsh (PF-10355) | Vivitrol | DUE SOON — 4 days |
| D. Okafor (PF-10466) | Sublocade | DUE SOON — 6 days |
| C. Mbanaso (PF-10533) | Aristada | DUE SOON — 5 days |
| E. Vasquez (PF-10601) | Invega Sustenna | ON TRACK — 15 days |
| N. Adeyemi (PF-10645) | Abilify Maintena | ON TRACK — 16 days |
| B. Osei (PF-10677) | Ketamine Maintenance | ON TRACK — 21 days |
| H. Nguyen (PF-10711) | Vivitrol | COMPLETED this week |
| G. Tanaka (PF-10745) | Spravato | COMPLETED this week |
| F. Romero (PF-10780) | Invega Trinza | PAUSED — insurance hold |
| K. Abara (PF-10815) | Aristada | ON TRACK — 10 days |
| P. Singh (PF-10849) | Abilify Maintena | OVERDUE — 8 days (borderline escalation) |
| W. Mensah (PF-10883) | Invega Sustenna | NEEDS OUTREACH — open reminder task |
| I. Zhao (PF-10917) | Ketamine Maintenance | ON TRACK — 18 days |

Also seeded: 59 treatment events, 6 open outreach tasks (2 urgent, 2 high), 8 audit log entries, 4 users.

---

### README (`README.md`)

- Product summary and daily operational question Adherix answers
- Step-by-step local setup instructions
- Full npm script reference table
- Built-in protocol table with all threshold values
- HIPAA disclaimer with full compliance checklist
- AI configuration reference
- CSV import format specification
- Known Phase 1 limitations
- Phase roadmap (Phase 1 → 2 → 3)
- Future integration notes: Practice Fusion EHR, Twilio SMS, BAA-covered AI

---

### Build Results

```
✓ Compiled successfully (Next.js 15.5.18)
✓ 0 TypeScript errors
✓ 18 routes built (8 pages + 10 API route groups)
✓ Database seeded (SQLite, Prisma 5.22.0)
```
