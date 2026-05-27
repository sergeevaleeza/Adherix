# Clinivore PRD

## Product Name

**Clinivore**

## Product Type

Staff-facing psychiatric treatment continuity dashboard for behavioral health practices.

## One-Line Product Summary

Clinivore helps psychiatric practices track scheduled treatments, identify due or overdue patients, generate outreach scripts, and prepare Practice Fusion-ready chart-note drafts.

---

# 1. Product Vision

Clinivore is not a generic medication reminder app. It is a psychiatric treatment continuity workflow system designed for practices that manage recurring, high-stakes treatments such as ketamine, Spravato, Vivitrol, Sublocade, and long-acting injectable antipsychotics.

The first version should answer one daily operational question:

> Who is due, who is overdue, who needs outreach, and what note should go into Practice Fusion?

---

# 2. Target Users

## Primary Users

- Psychiatrist
- Office manager
- Medical assistant
- Front desk coordinator
- Billing/admin staff involved in patient follow-up

## Initial Practice Type

Small-to-mid psychiatric practice offering scheduled psychiatric treatments, including ketamine, addiction management injections, and long-acting antipsychotic injections.

---

# 3. Problem Statement

Psychiatric practices offering scheduled treatments often rely on manual workflows to track who is due, overdue, missed, contacted, rescheduled, or documented. These workflows may live across the EHR schedule, staff memory, spreadsheets, phone notes, and incomplete chart documentation.

This creates several problems:

- Patients fall through the cracks after missed treatments.
- Staff spend time manually identifying overdue patients.
- Outreach attempts are inconsistently documented.
- Providers may not be aware when high-risk patients miss injections or ketamine sessions.
- Missed appointments create lost revenue and continuity-of-care risk.

Existing tools handle appointment reminders or EHR documentation, but they usually do not provide a treatment-protocol-specific workflow for psychiatric injections and ketamine care.

---

# 4. Product Positioning

## Do Not Position As

- A general medication reminder app
- A patient-facing wellness app
- An EHR replacement
- A generic texting platform

## Position As

> A psychiatric treatment continuity dashboard that helps behavioral health practices prevent missed treatment gaps and document follow-up workflows.

## Core Differentiator

Practice Fusion is the chart.  
Messaging tools are communication channels.  
**Clinivore is the treatment continuity brain.**

---

# 5. Phase 1 MVP Goal

Build a quick-win internal MVP that allows a psychiatric office to:

1. Add or import patients.
2. Assign treatment protocols.
3. Track due and overdue treatments.
4. Generate outreach scripts.
5. Generate Practice Fusion-ready chart-note drafts.
6. Mark outreach status.
7. Track basic pilot metrics.
8. Maintain an audit log of major actions.

---

# 6. Phase 1 Non-Goals

Do **not** build these in Phase 1:

- Real Practice Fusion API integration
- SMS sending
- Patient portal
- Billing
- Claims
- Full EHR replacement
- Complex AI agent
- MCP access to real FHIR data
- Clinical decision support
- Mobile app
- Insurance eligibility checks
- Automated prescribing workflows

---

# 7. Initial Treatment Categories

Clinivore Phase 1 should support the following treatment categories:

- Ketamine / IV ketamine
- Spravato
- Vivitrol
- Sublocade
- Invega Sustenna
- Invega Trinza
- Abilify Maintena
- Aristada
- Other custom treatment

---

# 8. Core Workflow

## Daily Staff Workflow

1. Staff opens the morning dashboard.
2. Staff reviews due today, due this week, overdue, and high-priority patients.
3. Staff opens the outreach queue.
4. Staff selects an overdue patient.
5. Staff generates an outreach script.
6. Staff calls or messages the patient outside the app.
7. Staff marks voicemail/contact/rescheduled/provider notified.
8. Staff generates a Practice Fusion-ready chart note.
9. Staff copies the note into Practice Fusion.
10. Audit log records the action.

---

# 9. Phase 1 Core Features

## 9.1 Morning Dashboard

The dashboard should be the primary landing page.

### Dashboard Cards

| Card | Meaning |
|---|---|
| Due Today | Treatments scheduled today |
| Due This Week | Treatments due within the next 7 days |
| Overdue | Patients past due date plus overdue threshold |
| Needs Outreach | Missed/overdue patients without completed outreach |
| High Priority | LAI/addiction/ketamine patients beyond escalation threshold |
| Completed This Week | Treatments completed in the current week |

### Dashboard Should Include

- Most urgent patients list
- Simple status chart
- Quick link to outreach queue
- Quick action buttons
- Empty states when no patients are due

---

## 9.2 Patient Roster

The patient roster should allow staff to search, filter, and manage patients.

### Required Fields

| Field | Example |
|---|---|
| Internal ID | PF-10291 |
| Display Name | Jane D. |
| Treatment | Vivitrol |
| Category | Addiction management |
| Protocol | Every 28 days |
| Last Treatment Date | 2026-05-01 |
| Next Due Date | 2026-05-29 |
| Status | Due soon / Overdue / Completed |
| Assigned Provider | Dr. Levinson |
| Last Outreach | Voicemail left |

### Features

- Search by display name, internal ID, treatment, or provider
- Filter by status
- Add patient
- Edit patient
- Open patient detail page

---

## 9.3 Treatment Protocols

The app should ship with built-in protocols and allow custom protocol creation later.

### Built-In Protocols

| Protocol | Default Schedule | Due Soon | Overdue After | Escalate After |
|---|---:|---:|---:|---:|
| Vivitrol monthly injection | Every 28 days | 7 days | 3 days | 7 days |
| Sublocade monthly injection | Every 30 days | 7 days | 3 days | 7 days |
| Invega Sustenna | Every 30 days | 10 days | 7 days | 14 days |
| Invega Trinza | Every 90 days | 14 days | 7 days | 14 days |
| Abilify Maintena | Every 30 days | 10 days | 7 days | 14 days |
| Aristada | Every 30 days by default | 10 days | 7 days | 14 days |
| Ketamine induction | Series/custom, default every 3 days | 1 day | 1 day | 3 days |
| Ketamine maintenance | Every 28 days | 7 days | 7 days | 14 days |
| Spravato | Custom, default every 7 days | 2 days | 1 day | 3 days |

### Each Protocol Should Include

- Name
- Category
- Default recurrence interval
- Due-soon window
- Overdue threshold
- Escalation threshold
- Description
- Default outreach language

---

## 9.4 Treatment Timeline

Each patient profile should show a chronological timeline.

### Timeline Event Types

- Treatment scheduled
- Treatment completed
- Treatment missed
- Appointment rescheduled
- Appointment cancelled
- Outreach attempted
- Voicemail left
- Patient contacted
- Provider notified
- Chart note generated

---

## 9.5 Outreach Queue

The outreach queue should be a worklist for staff.

### Queue Columns

| Column | Description |
|---|---|
| Patient | Display name/internal ID |
| Treatment | Active treatment protocol |
| Reason | Overdue, missed, due soon, etc. |
| Priority | Low, normal, high, urgent |
| Last Contact | Most recent outreach status |
| Due Date | Task due date |
| Action | Generate script, mark contacted, etc. |

### Actions

- Generate call script
- Generate SMS-style message
- Generate Practice Fusion chart note
- Mark contacted
- Mark voicemail left
- Mark rescheduled
- Mark provider notified
- Close task

---

## 9.6 AI Drafting

AI should be embedded in staff workflows, not presented as a chatbot.

### Draft Types

1. Call script
2. SMS-style outreach message
3. Practice Fusion chart note
4. Weekly provider summary

### AI Safety Rules

- AI output should always be editable.
- AI drafts should never be auto-sent.
- Do not send full PHI by default.
- Use patient display name or internal ID only unless a compliant AI vendor and BAA are configured.
- Do not include DOB, address, insurance, or detailed psychiatric history in AI prompts.
- Use neutral, non-shaming behavioral health language.

### Preferred Language

Use:

- “due for treatment”
- “missed appointment”
- “checking in”
- “help keep your care on track”
- “follow-up”

Avoid:

- “non-compliant”
- “failed treatment”
- “relapsed”
- “drug abuse”
- “you did not comply”

### Example Chart Note

```text
Patient was contacted regarding missed [Treatment] appointment originally due on [date]. [Outcome]. Patient remains [status]. Follow-up plan: [plan].
```

---

## 9.7 Practice Fusion CSV Import

Phase 1 should support CSV import instead of live Practice Fusion API integration.

### Supported Import Types

- Patient roster CSV
- Appointment report CSV
- Treatment roster CSV

### Expected CSV Columns

```text
internal_id,display_name,treatment_name,provider_name,last_treatment_date,next_due_date,phone_optional,email_optional,notes
```

### Import Flow

1. Upload CSV.
2. Parse file.
3. Preview rows.
4. Validate required fields.
5. Show invalid rows with errors.
6. Import valid rows.
7. Create or update patients.
8. Create treatment enrollments.
9. Create ImportBatch record.
10. Create AuditLog record.

---

## 9.8 Audit Log

Audit logging should be included from the beginning.

### Track Events

- Patient viewed
- Patient created
- Patient edited
- Treatment event created
- Outreach task created
- Outreach status updated
- AI draft generated
- CSV imported
- Chart note copied/generated

### Audit Log Fields

- Actor name
- Action
- Entity type
- Entity ID
- Metadata JSON
- Timestamp

---

# 10. Status Logic

For each active treatment enrollment:

| Status | Logic |
|---|---|
| On Track | Next due date is more than 7 days away |
| Due Soon | Next due date is within the next 7 days |
| Due Today | Next due date is today |
| Overdue | Today is after next due date plus overdue threshold |
| High Priority | Today is after next due date plus escalation threshold |
| Needs Outreach | Open outreach task exists |
| Completed | Recent treatment event marked completed |

---

# 11. Data Model

## User

- id
- name
- email
- role: ADMIN, PROVIDER, STAFF
- createdAt

## Patient

- id
- displayName
- internalId
- phoneOptional
- emailOptional
- providerName
- isActive
- createdAt
- updatedAt

## TreatmentProtocol

- id
- name
- category
- defaultIntervalDays
- dueSoonDays
- overdueAfterDays
- escalationAfterDays
- description
- isBuiltIn
- createdAt

## TreatmentEnrollment

- id
- patientId
- protocolId
- status: ACTIVE, PAUSED, DISCONTINUED
- startDate
- lastTreatmentDate
- nextDueDate
- notes
- createdAt
- updatedAt

## TreatmentEvent

- id
- patientId
- enrollmentId
- eventType: SCHEDULED, COMPLETED, MISSED, RESCHEDULED, CANCELLED
- eventDate
- status
- note
- createdAt

## OutreachTask

- id
- patientId
- enrollmentId
- reason
- status: OPEN, CONTACTED, VOICEMAIL_LEFT, RESCHEDULED, PROVIDER_NOTIFIED, CLOSED
- priority: LOW, NORMAL, HIGH, URGENT
- dueDate
- lastAttemptAt
- outcomeNote
- createdAt
- updatedAt

## AiDraft

- id
- patientId
- enrollmentId
- draftType: CALL_SCRIPT, SMS_MESSAGE, CHART_NOTE, WEEKLY_SUMMARY
- inputSummary
- content
- createdAt

## AuditLog

- id
- actorName
- action
- entityType
- entityId
- metadataJson
- createdAt

## ImportBatch

- id
- filename
- rowCount
- importedCount
- skippedCount
- status
- createdAt

---

# 12. Recommended Phase 1 Tech Stack

| Layer | Recommendation |
|---|---|
| Frontend | Next.js App Router + TypeScript |
| Styling | Tailwind CSS |
| Database | SQLite for local development |
| ORM | Prisma |
| CSV Import | PapaParse |
| Charts | Recharts |
| AI | Mock provider by default, optional OpenAI/Azure/OpenAI-compatible provider via env |
| Auth | Placeholder roles in Phase 1; real auth in Phase 2 |
| Deployment Later | HIPAA-capable Vercel/Supabase/Render/AWS configuration with BAAs |

---

# 13. Compliance Position

Phase 1 is a HIPAA-conscious prototype, not a certified HIPAA-compliant production system.

If real PHI is used, the system needs:

- BAA-covered hosting
- BAA-covered AI vendor if AI processes PHI
- Access controls
- Encryption at rest
- Encryption in transit
- Audit logging
- Data retention policy
- Breach response process
- Staff training
- Legal/compliance review

For the first development version:

- Use mock/deidentified data.
- Avoid detailed diagnosis notes.
- Use internal IDs.
- Do not send real PHI to AI.
- Keep AI output editable and manually reviewed.

---

# 14. Phase Roadmap

## Phase 1 — Quick Win MVP

Build local/demo-ready app with:

- Dashboard
- Patients
- Treatment protocols
- Treatment timeline
- Outreach queue
- AI draft generator with mock fallback
- CSV import
- Audit log
- Mock data

## Phase 2 — Pilot Office Version

Add:

- User login
- Role-based access
- Real database deployment
- HIPAA-capable infrastructure
- Pilot metrics
- Export reports
- Better CSV matching from Practice Fusion reports

## Phase 3 — Practice Fusion Integration

Add:

- SMART on FHIR research implementation
- OAuth connection
- Patient/appointment pull
- Note export workflow
- Deeper audit logging

## Phase 4 — Communication Integrations

Add:

- Twilio SMS under BAA
- Secure message templates
- Call tracking
- Two-way patient response logging

## Phase 5 — Analytics and Expansion

Add:

- Treatment gap trends
- Revenue recovery estimates
- No-show reduction metrics
- Provider-level summaries
- Multi-site support
- Predictive risk scoring

---

# 15. Pilot Study Design

## Pilot Name

**Psychiatric Treatment Continuity Pilot**

## Pilot Goal

Reduce missed scheduled psychiatric treatments and improve follow-up documentation.

## Pilot Length

8–12 weeks.

## Pilot Cohort

20–50 patients across:

- Ketamine treatment
- Addiction injections
- LAI antipsychotics

## Baseline Period

Use prior 8–12 weeks of Practice Fusion appointment data.

## Baseline Metrics

- Missed treatment rate
- Days overdue
- Time to outreach
- Time to reschedule
- Chart note completion rate
- Staff time spent on follow-up
- Revenue lost to missed treatment appointments

## Intervention Metrics

Track the same metrics while staff use Clinivore daily.

## Success Criteria

| Metric | Target |
|---|---|
| Time to outreach | Reduced by 30%+ |
| Days overdue | Reduced by 20%+ |
| Chart note completion | Increased to 90%+ |
| Staff time spent finding overdue patients | Reduced significantly |
| Rescheduled missed treatments | Increased |

---

# 16. Monetization Strategy

## Initial Model

Practice SaaS subscription.

| Plan | Suggested Price | Includes |
|---|---:|---|
| Pilot | Free or $199/month | 1 office, limited patients |
| Solo Practice | $299–$499/month | Dashboard, patients, outreach, notes |
| Small Clinic | $799–$1,500/month | Multi-provider, CSV imports, analytics |
| Pro | $1,500–$3,000/month | AI notes, advanced reporting, workflow tools |
| Integration Add-on | +$500–$1,000/month | Practice Fusion integration later |

## Sales Message

> Clinivore pays for itself if it helps recover even one or two missed ketamine or injection visits per month.

---

# 17. Key Risks

| Risk | Mitigation |
|---|---|
| Competing with EHRs | Stay lightweight and workflow-specific |
| HIPAA complexity | Use mock data first; add compliance infrastructure before real PHI |
| Staff adoption | Build around daily morning workflow |
| Too broad too early | Start with due/overdue/outreach/note workflow only |
| AI compliance | Mock AI by default; require BAA for PHI use |
| Practice Fusion integration delays | Start with CSV import |

---

# 18. Definition of Done for Phase 1

Phase 1 is complete when:

- App runs locally.
- Database can be seeded with mock data.
- Dashboard shows due/overdue/high-priority patients.
- Patient roster works with search and filters.
- Patient detail page shows protocol, timeline, and actions.
- Outreach queue works.
- AI draft generation works with mock fallback.
- CSV import works with preview and validation.
- Audit log records major actions.
- README explains setup, limitations, and HIPAA disclaimer.

---

# 19. Quick-Win Demo Script

1. Open Clinivore dashboard.
2. See 4 overdue patients and 2 high-priority patients.
3. Click overdue Vivitrol patient.
4. Generate call script.
5. Mark voicemail left.
6. Generate Practice Fusion chart note.
7. Copy note text.
8. Patient moves to awaiting response.
9. Audit log shows all actions.
10. Dashboard updates.

---

# 20. Final Recommendation

Build Phase 1 as a local/demo-ready staff dashboard with mock data and CSV import. Do not start with live Practice Fusion integration or SMS sending.

The first product should prove one thing:

> Psychiatric office staff can use Clinivore every morning to reduce missed treatment gaps and document follow-up faster.
