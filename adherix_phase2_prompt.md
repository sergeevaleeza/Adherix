# Adherix — Claude Code Prompt: Phase 2

## Current State

Adherix v0.2.0 is complete with 0 TypeScript errors. Everything below is already built and working — do not modify it:

- Next.js 15 App Router + TypeScript + Tailwind CSS
- Prisma 5 schema with 9 models (PostgreSQL-ready)
- NextAuth v5 with Credentials provider, JWT sessions, role-based middleware
- 8 pages: Dashboard, Patients, Patient Detail, Outreach Queue, Protocols, CSV Import, Audit Log, Settings, Reports
- 12 API routes covering all CRUD, outreach workflows, AI drafts, reporting
- `lib/ai.ts` — dual-mode mock/OpenAI with `ALLOW_PHI_TO_AI` safety flag
- `railway.json` deployment config
- `app/api/health/route.ts` health check

**Read before starting:** Run `cat lib/ai.ts`, `cat lib/audit.ts`, `cat prisma/schema.prisma`, `cat .env.example`, and `ls app/api/` to confirm current state before touching anything.

---

## Task 1 — Deploy to Railway

### Goal
Get the app live on a hosted URL so the pilot office can access it from any browser. This is the single most important task — nothing else matters until the app is accessible.

### Step-by-step instructions for Claude Code to execute

**Step 1 — Verify build**
```bash
npm run build
```
Must complete with 0 errors before proceeding.

**Step 2 — Confirm migration files exist**
```bash
ls prisma/migrations/
```
If empty, there are no migration files yet. Run:
```bash
# Requires a local Postgres instance or Docker
docker run --name adherix-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=adherix -p 5432:5432 -d postgres:15
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/adherix" npx prisma migrate dev --name init
```
Commit the generated `prisma/migrations/` folder — Railway needs it.

**Step 3 — Generate NEXTAUTH_SECRET**
```bash
openssl rand -base64 32
```
Save the output — this goes into Railway environment variables.

**Step 4 — Create `Procfile`** (Railway alternative to railway.json startCommand)
```
web: npx prisma migrate deploy && npm start
```

**Step 5 — Update `railway.json`** to ensure it is correct:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npx prisma migrate deploy && npx prisma db seed && npm start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 60,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

**Step 6 — Add `nixpacks.toml`** (project root) to ensure Node version:
```toml
[phases.setup]
nixPkgs = ["nodejs_20"]
```

**Step 7 — Verify `package.json`** has these scripts (add any missing):
```json
{
  "scripts": {
    "build": "next build",
    "start": "next start",
    "dev": "next dev",
    "postinstall": "prisma generate",
    "migrate:prod": "prisma migrate deploy",
    "db:seed:prod": "prisma db seed"
  }
}
```

**Step 8 — Print Railway deployment checklist** to the terminal:
```
============================================
RAILWAY DEPLOYMENT CHECKLIST
============================================
1. Push this repo to GitHub (if not already)
2. Go to railway.app → New Project → Deploy from GitHub repo
3. Add a PostgreSQL plugin to the project
4. Set these environment variables in Railway:
   DATABASE_URL        → (Railway sets this automatically from the Postgres plugin)
   NEXTAUTH_SECRET     → (the openssl output from Step 3)
   NEXTAUTH_URL        → https://YOUR-APP-NAME.up.railway.app
   NODE_ENV            → production
   AI_PROVIDER         → mock  (keep mock until BAA is signed)
   ALLOW_PHI_TO_AI     → false
5. Deploy — Railway will run: prisma migrate deploy && prisma db seed && npm start
6. Visit /api/health to confirm deployment
7. Log in with seeded credentials (change immediately after first login)
============================================
```

### What NOT to do
- Do not attempt to deploy automatically — Railway requires browser-based OAuth
- Do not hardcode any URLs or secrets
- Do not modify the auth or database logic

---

## Task 2 — Swap AI from OpenAI to Anthropic Claude

### Why
The current `lib/ai.ts` uses OpenAI. Since Anthropic offers a BAA for HIPAA-covered use cases (unlike OpenAI's standard API), Claude is the better long-term choice for this product. Also: Anthropic's claude-sonnet-4-20250514 produces better clinical tone for psychiatric outreach than GPT-4o.

### What to change

**Install:**
```bash
npm install @anthropic-ai/sdk
```

**`lib/ai.ts` — update live AI section only**

Keep the entire mock mode exactly as-is. Only change the live AI provider section.

Replace the OpenAI import and client with:
```typescript
import Anthropic from '@anthropic-ai/sdk'
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
```

Replace the OpenAI completion call with:
```typescript
const message = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 600,
  messages: [{ role: 'user', content: prompt }]
})
const text = message.content[0].type === 'text' ? message.content[0].text : ''
```

**Update `.env.example`** — replace OpenAI vars with:
```
# Anthropic Claude AI (Phase 2 — requires BAA for PHI use)
AI_PROVIDER=mock
ANTHROPIC_API_KEY=sk-ant-...
ALLOW_PHI_TO_AI=false

# When ALLOW_PHI_TO_AI=false: only displayName and internalId are sent to AI
# When ALLOW_PHI_TO_AI=true: only use with a signed Anthropic BAA
```

**Update `app/settings/page.tsx`** — change the AI configuration section:
- Replace "OpenAI" references with "Anthropic Claude (claude-sonnet-4-20250514)"
- Update the env var reference block to show `ANTHROPIC_API_KEY`
- Keep the BAA warning exactly as-is — it still applies

**Update `lib/audit.ts`** — when logging AI draft generation, record `claude-sonnet-4-20250514` as the model name instead of gpt-4o.

**`app/api/ai/route.ts`** — update the audit log entry to record `anthropic` as the provider.

### Prompt improvements for psychiatric context

While you have `lib/ai.ts` open, improve the prompts for all 4 draft types. The current prompts are generic. Update them to be psychiatry-specific:

**CALL_SCRIPT prompt additions:**
- "This is a psychiatric practice. Use warm, non-stigmatizing language."
- "Never use: non-compliant, failed, relapsed, drug abuse, non-adherent"
- "Use instead: due for treatment, missed appointment, checking in, support, help keep care on track"
- "Keep under 120 words. Format as a phone script the staff reads aloud."
- "End with a specific callback number or next step."

**SMS_MESSAGE prompt additions:**
- "Maximum 160 characters. Warm and professional."
- "Do not include diagnosis, drug names, or treatment details in SMS — privacy risk."
- "Example format: Hi [Name], this is Dr. [Provider]'s office. Please call us at [number] when you can. We'd like to connect with you about your care."

**CHART_NOTE prompt additions:**
- "Write a 2-4 sentence clinical documentation note suitable for a medical record."
- "Use objective language. Document facts only — what was attempted, when, outcome."
- "Do not speculate about patient behavior, diagnosis, or compliance."
- "Suitable for direct copy-paste into Practice Fusion."

**WEEKLY_SUMMARY prompt additions:**
- "Write a brief practice summary for the office manager."
- "Include: total completed this week, total missed, patients needing follow-up, any escalations."
- "Professional tone, 4-6 sentences."

### Requirements
- Mock mode must still work with `AI_PROVIDER=mock` — do not break it
- `ALLOW_PHI_TO_AI=false` behavior must be preserved exactly
- `npm run build` passes with 0 TypeScript errors after change

---

## Task 3 — Twilio SMS Outreach

### Goal
Add one-click SMS sending from the Outreach Queue. Staff clicks "Send SMS", a pre-drafted message appears for review, they confirm, and Twilio sends it. The send is logged to the audit log and the outreach task is updated.

### Install
```bash
npm install twilio
npm install --save-dev @types/twilio
```

### Schema changes (`prisma/schema.prisma`)

Add `SMS_SENT` to the `OutreachTaskStatus` enum:
```prisma
enum OutreachTaskStatus {
  OPEN
  CONTACTED
  VOICEMAIL_LEFT
  SMS_SENT          // new
  RESCHEDULED
  PROVIDER_NOTIFIED
  CLOSED
}
```

Add `smsSid String?` field to `OutreachTask` model to store Twilio message SID for delivery tracking.

Run after schema change:
```bash
npx prisma migrate dev --name add_sms_status
npx prisma generate
```

### New file: `lib/twilio.ts`

```typescript
// lib/twilio.ts
import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken  = process.env.TWILIO_AUTH_TOKEN
const fromNumber = process.env.TWILIO_FROM_NUMBER

export async function sendSms(to: string, body: string): Promise<{ sid: string }> {
  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('Twilio not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER.')
  }
  // Sanitize body — never include diagnosis or drug names per TCPA/privacy best practices
  const client = twilio(accountSid, authToken)
  const message = await client.messages.create({ body, from: fromNumber, to })
  return { sid: message.sid }
}

export function isTwilioConfigured(): boolean {
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER)
}
```

### New API route: `POST /api/outreach/[id]/sms`

- Look up the `OutreachTask` by `id`, include patient phone and provider name
- Validate patient has a phone number — return 400 if missing
- Accept `{ message: string }` in request body — the staff-reviewed message text
- Validate message does not exceed 160 characters
- Call `sendSms(patient.phone, message)`
- On success:
  - Update `OutreachTask` status to `SMS_SENT`
  - Store `smsSid` on the task
  - Set `lastAttemptAt` to now
  - Write audit log: action `OUTREACH_SMS_SENT`, include Twilio SID in metadata
- Return `{ success: true, sid }`
- On Twilio error: return 502 with `{ error: 'SMS delivery failed', details: err.message }`

### UI changes: `app/outreach/page.tsx`

Add "Send SMS" button to each outreach task card (show only if patient has a phone number on file).

**SMS flow:**
1. Staff clicks "Send SMS"
2. Modal opens with:
   - Pre-populated message (generated from `POST /api/ai` with type `SMS_MESSAGE`, or a default template if AI is in mock mode)
   - Character counter (160 max, red when over)
   - Patient name and phone number shown for confirmation
   - Privacy reminder: "Do not include diagnosis, medication names, or clinical details in SMS"
   - "Send" button (disabled if over 160 chars) and "Cancel"
3. On confirm: `POST /api/outreach/[id]/sms` with reviewed message
4. On success: task status updates to `SMS_SENT`, success toast "SMS sent to [phone]"
5. On error: error toast with message

**Status badge** — add `SMS_SENT` to `StatusBadge` or wherever outreach task statuses are displayed, with a blue/teal color.

### Update `.env.example`
```
# Twilio SMS (Phase 2 — requires TCPA-compliant patient opt-in tracking)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_FROM_NUMBER=+1XXXXXXXXXX
```

### Update `app/settings/page.tsx`
- Add Twilio configuration status to the "Current Configuration" section
- Show `isTwilioConfigured()` result as ENABLED/DISABLED badge
- Update the "Future Integrations" Twilio section to show it's now available

### Requirements
- If Twilio is not configured, the "Send SMS" button is hidden entirely (no broken states)
- Message body is always staff-reviewed before sending — never auto-sent
- Phone numbers are never logged in audit metadata — only `smsSid` and task ID
- `npm run build` passes with 0 TypeScript errors

---

## Task 4 — Patient Notes

### Goal
Add a simple free-text notes field to each patient. Used for: insurance notes, contact preferences, care coordinator observations, anything that doesn't fit in structured fields.

### Schema changes

Add to `Patient` model:
```prisma
notes        String?   // Free-text coordinator notes
notesUpdatedAt DateTime?
notesUpdatedBy String?  // Actor name from session
```

Run:
```bash
npx prisma migrate dev --name add_patient_notes
npx prisma generate
```

### API changes: `PUT /api/patients/[id]`

The existing endpoint already handles patient updates. Add `notes` to the allowed update fields. When notes are updated:
- Set `notesUpdatedAt = new Date()`
- Set `notesUpdatedBy` from session user name
- Write audit log entry with action `UPDATE_PATIENT_NOTES` (do not log the note content — it may contain PHI)

### UI changes: `app/patients/[id]/page.tsx`

Add a "Coordinator Notes" section below the activity timeline:
- Shows current notes in a styled `<pre>` or text block (preserve line breaks)
- "Edit Notes" button opens an inline textarea (not a modal — keep it simple)
- Textarea: full width, 4 rows minimum, expandable
- "Save" and "Cancel" buttons appear when editing
- Show `notesUpdatedAt` and `notesUpdatedBy` below the notes ("Last updated May 25, 2026 by Leeza M.")
- Empty state: "No notes yet. Add coordinator notes, insurance details, or contact preferences."

### Requirements
- Notes are never sent to AI (add a check in `lib/ai.ts` — if notes are somehow in scope, exclude them)
- No character limit — coordinators should be able to write as much as needed
- Notes are editable, not append-only (unlike the audit log)
- `npm run build` passes with 0 TypeScript errors

---

## Task 5 — Practice Fusion Semi-Automated Import

### Goal
Improve the CSV import to automatically detect missed appointments from a Practice Fusion appointment export, without manual row-by-row review.

### Context
Practice Fusion can export appointment reports as CSV. The columns in a typical PF appointment export are:
`Patient Name, Date of Birth, Appointment Date, Appointment Time, Appointment Type, Provider, Status`

Where `Status` is typically: `Completed`, `No Show`, `Cancelled`, `Rescheduled`, `Scheduled`

### Update `lib/csvImport.ts`

Add a second import mode: `PF_APPOINTMENTS` alongside the existing patient roster mode.

Add `PF_APPOINTMENT_HEADERS`:
```typescript
export const PF_APPOINTMENT_HEADERS = [
  'patient_name',      // or "Patient Name" — normalize on import
  'date_of_birth',
  'appointment_date',
  'appointment_type',
  'provider',
  'status'             // Completed | No Show | Cancelled | Rescheduled
]
```

Add `parsePfAppointmentRow()`:
```typescript
export function parsePfAppointmentRow(row: Record<string, string>): {
  displayName: string
  dob: string
  appointmentDate: string
  appointmentType: string
  provider: string
  status: 'completed' | 'missed' | 'rescheduled' | 'cancelled' | 'unknown'
  _valid: boolean
  _errors: string[]
}
```

Status mapping:
- `Completed` → `completed`
- `No Show` → `missed`
- `Cancelled` → `cancelled`
- `Rescheduled` → `rescheduled`
- anything else → `unknown`

Add `matchPatientByNameDob()`:
```typescript
// Fuzzy match: normalize names (trim, lowercase, handle "Last, First" vs "First Last")
// Match on: normalized name + exact DOB
// Returns: { patient, confidence: 'exact' | 'fuzzy' | 'none' }
export async function matchPatientByNameDob(
  displayName: string,
  dob: string
): Promise<{ patient: Patient | null, confidence: 'exact' | 'fuzzy' | 'none' }>
```

Name normalization rules:
- Strip punctuation, lowercase
- Handle "Doe, Jane" → "jane doe"
- Handle "Jane Doe" → "jane doe"
- If exact match: confidence = `exact`
- If Levenshtein distance ≤ 2 (install `fastest-levenshtein`): confidence = `fuzzy`
- No match: confidence = `none`

```bash
npm install fastest-levenshtein
```

### New API route: `POST /api/import/appointments`

- Accept `{ rows: PfAppointmentRow[], filename: string }`
- For each row:
  1. Run `matchPatientByNameDob()`
  2. If matched (exact or fuzzy) and status is `missed`:
     - Create `TreatmentEvent` (type: MISSED) with the appointment date
     - Auto-create `OutreachTask` (priority: HIGH) for missed appointments
     - Update enrollment `nextDueDate` if current value is in the past
  3. If matched and status is `completed`:
     - Create `TreatmentEvent` (type: COMPLETED)
     - Update `lastTreatmentDate` and calculate new `nextDueDate`
  4. If no match: flag for manual review
- Return:
  ```typescript
  {
    processed: number,
    matched: number,
    unmatched: number,
    missedDetected: number,
    outreachTasksCreated: number,
    unmatchedRows: Array<{ displayName, dob, appointmentDate, reason }>
  }
  ```
- Write audit log: `CSV_APPOINTMENT_IMPORT`

### UI changes: `app/import/page.tsx`

Add a second import tab: "Appointment Report" alongside the existing "Patient Roster" tab.

Appointment Report tab:
- Same drag-and-drop zone
- After file is parsed, show a preview table: Patient Name | DOB | Date | Type | Status | Match Result
- Match Result column shows: ✓ Exact Match / ~ Fuzzy Match (with matched name shown) / ✗ No Match
- Confidence color-coding: green (exact), yellow (fuzzy), red (none)
- Summary before import: "12 matched · 2 no-shows detected · 1 unmatched"
- Import button runs `POST /api/import/appointments`
- Result card shows: processed, missed detected, outreach tasks created, unmatched rows
- Unmatched rows shown in a collapsible section with "Add Manually" button linking to Add Patient

Add a "Download PF Template" button that shows a modal with:
- Instructions for exporting from Practice Fusion (Reports → Appointments → Export)
- The expected column names
- A sample row

### Requirements
- Fuzzy matching must never auto-merge patients with low confidence — flag for review instead
- No patient data is overwritten without a match confidence of `exact` or explicit staff confirmation for `fuzzy`
- `npm run build` passes with 0 TypeScript errors

---

## Execution Order

1. **Task 1 first** — get the app deployed. Everything else builds on a live URL.
2. **Task 4** — Patient notes is the smallest change, lowest risk, high daily value.
3. **Task 2** — Swap AI provider. Mock mode must keep working throughout.
4. **Task 3** — Twilio SMS. Depends on stable schema and working AI for draft generation.
5. **Task 5** — PF appointment import last. Most complex, most edge cases.

After each task: `npm run build` → 0 errors → commit → proceed.

---

## Environment Variables Summary

After Phase 2, `.env.example` should document all of these:

```bash
# Database
DATABASE_URL="postgresql://..."          # Required

# Auth
NEXTAUTH_SECRET=""                       # Required — openssl rand -base64 32
NEXTAUTH_URL="https://your-app.railway.app"  # Required in production

# AI — Anthropic
AI_PROVIDER=mock                         # mock | anthropic
ANTHROPIC_API_KEY=sk-ant-...            # Required when AI_PROVIDER=anthropic
ALLOW_PHI_TO_AI=false                   # Never set true without signed BAA

# Twilio SMS
TWILIO_ACCOUNT_SID=ACxxx...             # Optional — SMS disabled if not set
TWILIO_AUTH_TOKEN=xxx...                # Optional
TWILIO_FROM_NUMBER=+1XXXXXXXXXX         # Optional

# App
NODE_ENV=production
```

---

## What NOT to Change

- `lib/status.ts` — do not touch
- `lib/auth.ts` — do not touch
- `middleware.ts` — do not touch
- Any existing API route response shape — pages depend on them
- `prisma/seed.ts` — do not touch (add a separate seed file if needed)
- The Tailwind config or global CSS utility classes
- The HIPAA warning in `app/settings/page.tsx` — it must stay accurate

---

## Definition of Done

- [ ] `npm run build` passes with 0 TypeScript errors
- [ ] `railway.json` and `nixpacks.toml` are correct and committed
- [ ] Migration files exist in `prisma/migrations/`
- [ ] Railway deployment checklist printed to terminal
- [ ] `lib/ai.ts` uses Anthropic SDK when `AI_PROVIDER=anthropic`
- [ ] Mock mode still works with `AI_PROVIDER=mock`
- [ ] AI prompts use psychiatric-appropriate language
- [ ] Twilio `sendSms()` in `lib/twilio.ts`
- [ ] `POST /api/outreach/[id]/sms` route working
- [ ] "Send SMS" button in Outreach Queue (hidden when Twilio not configured)
- [ ] SMS requires staff review before sending — never auto-sends
- [ ] Patient notes field on Patient Detail page
- [ ] Notes save/edit/cancel flow working
- [ ] PF Appointment import tab on CSV Import page
- [ ] `matchPatientByNameDob()` with exact + fuzzy matching
- [ ] Missed appointment auto-detection creates OutreachTasks
- [ ] All new schema changes migrated and Prisma client regenerated
