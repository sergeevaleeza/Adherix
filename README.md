# Adherix — Psychiatric Treatment Continuity Dashboard

> **Phase 1 MVP** — A staff-facing workflow system for behavioral health practices managing recurring psychiatric treatments.

## What Is Adherix?

Adherix helps psychiatric practice staff answer one daily question:

> **Who is due, who is overdue, who needs outreach, and what note should go into the chart?**

It tracks scheduled treatments like ketamine, Spravato, Vivitrol, Sublocade, Invega Sustenna, Invega Trinza, Abilify Maintena, and Aristada — and surfaces who needs attention today.

**This is NOT a generic medication reminder app.** It's a staff-facing treatment continuity workflow system.

---

## How to Run Locally

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# 1. Clone or enter the project directory
cd adherix

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env

# 4. Push the Prisma schema to SQLite
npm run prisma:push

# 5. Seed the database with 20 mock patients
npm run prisma:seed

# 6. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run prisma:push` | Apply schema to SQLite database |
| `npm run prisma:seed` | Seed with 20 mock patients |
| `npm run prisma:studio` | Open Prisma Studio (visual DB browser) |
| `npm run reset:db` | Delete and re-seed database |

---

## Features (Phase 1)

| Screen | What It Does |
|---|---|
| **Dashboard** | Cards for due today/week, overdue, urgent; status bar chart; urgent patient list |
| **Patients** | Searchable/filterable table; add patient; status badges |
| **Patient Detail** | Timeline, active enrollment, mark completed/missed/reschedule, generate AI drafts |
| **Outreach Queue** | All open tasks sorted by priority; mark contacted/voicemail/rescheduled; generate chart notes |
| **Protocols** | View all 9 built-in protocols; add custom protocols |
| **CSV Import** | Drag-and-drop CSV upload; preview + validate; import patients + enrollments |
| **Audit Log** | Paginated log of all staff actions |
| **Settings** | HIPAA disclaimer; AI config reference; phase roadmap |

### Built-In Protocols

| Protocol | Category | Interval | Due Soon | Overdue After | Escalate After |
|---|---|---|---|---|---|
| Vivitrol | Addiction Medicine | 28 days | 7 days | 3 days | 7 days |
| Sublocade | Addiction Medicine | 30 days | 7 days | 3 days | 7 days |
| Invega Sustenna | Schizophrenia | 30 days | 10 days | 7 days | 14 days |
| Invega Trinza | Schizophrenia | 90 days | 14 days | 7 days | 14 days |
| Abilify Maintena | Schizophrenia | 30 days | 10 days | 7 days | 14 days |
| Aristada | Schizophrenia | 30 days | 10 days | 7 days | 14 days |
| Ketamine Induction | Ketamine | 3 days | 1 day | 1 day | 3 days |
| Ketamine Maintenance | Ketamine | 28 days | 7 days | 7 days | 14 days |
| Spravato | Spravato | 7 days | 2 days | 1 day | 3 days |

---

## ⚠️ HIPAA Disclaimer

**This is a Phase 1 prototype. It is NOT certified HIPAA-compliant for production use with real patient health information.**

The seed data uses fictional initials and mock identifiers only. No real PHI is included.

### Before using with real PHI, your practice MUST:

1. **Hosting**: Deploy on HIPAA-compliant, BAA-covered infrastructure (AWS HIPAA, Azure Healthcare, Google Cloud Healthcare)
2. **Access controls**: Implement real authentication (MFA), role-based access, session timeouts
3. **Encryption**: Enforce TLS 1.2+ in transit; encrypt the database at rest
4. **Audit policy**: Establish audit log retention, monitoring, and alerting per HIPAA §164.312
5. **BAA agreements**: Sign BAAs with all vendors (hosting, AI, SMS)
6. **AI**: Only use BAA-covered AI vendors (Azure OpenAI HIPAA tier, AWS Bedrock HIPAA, etc.) — and only if `ALLOW_PHI_TO_AI=true` in a compliant deployment
7. **Security Risk Analysis**: Conduct a formal SRA as required by HIPAA Security Rule
8. **Legal review**: Consult a healthcare compliance attorney before go-live

**By default, `ALLOW_PHI_TO_AI=false`** — even if AI is enabled, only `displayName` and `internalId` are included in prompts.

---

## AI Configuration

Adherix ships with a mock AI mode (no API key needed). For real drafts:

```env
# In .env:
AI_PROVIDER=openai        # or: mock, azure_openai
AI_API_KEY=sk-...
AI_MODEL=gpt-4o
ALLOW_PHI_TO_AI=false     # Set true ONLY with BAA-covered vendor in compliant deployment
```

Generated draft types: `CALL_SCRIPT`, `SMS_MESSAGE`, `CHART_NOTE`, `WEEKLY_SUMMARY`

---

## CSV Import Format

```csv
internal_id,display_name,treatment_name,provider_name,last_treatment_date,next_due_date,phone_optional,email_optional,notes
PT-001,J. Smith,Vivitrol,Dr. Jones,2026-04-15,2026-05-15,555-0100,,Monthly injection
```

- `treatment_name` must match a known protocol name
- Dates must be `YYYY-MM-DD`
- Existing patients (by `internal_id`) are updated, not duplicated

---

## Known Limitations (Phase 1)

- No real authentication — any staff member can access all data
- SQLite only — not suitable for multi-user production deployment
- No real SMS/outreach sending (Twilio integration planned for Phase 2)
- No real EHR integration (Practice Fusion integration planned for Phase 2)
- AI drafts are mock templates unless configured with real API key
- No automated reminders or scheduled jobs
- No multi-practice or multi-tenant support yet
- No file attachments or document management

---

## Phase Roadmap

| Phase | Focus |
|---|---|
| **Phase 1** (current) | Core dashboard, patient tracking, outreach queue, CSV import, mock AI, audit log |
| **Phase 2** | Auth/roles, Practice Fusion integration, Twilio SMS, real AI (BAA-covered), hosted deployment |
| **Phase 3** | Provider mobile view, automated reminders, billing code suggestions, analytics, multi-practice |

---

## Future Integration Notes

### Practice Fusion EHR

Phase 2 will integrate via the Practice Fusion API to:
- Pull scheduled appointments and patient demographics
- Push chart notes generated by Adherix directly to the patient chart
- Sync treatment completion status

Requires: Practice Fusion API credentials, OAuth setup, and a BAA with Practice Fusion.

### Twilio / SMS

Phase 2 will add Twilio for:
- Outbound SMS appointment reminders
- Automated callback scheduling
- Voicemail drop capability

Requires: HIPAA-compliant Twilio account, BAA, TCPA-compliant opt-in tracking.

---

## Tech Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS** — utility-first styling
- **Prisma ORM** + **SQLite** (local dev)
- **Recharts** — dashboard bar charts
- **PapaParse** — CSV parsing

---

*Adherix Phase 1 MVP — Built for psychiatric behavioral health practices.*
