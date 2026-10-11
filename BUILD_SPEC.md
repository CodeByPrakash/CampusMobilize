# 🏢 CampusIQ — Campus Edition (NIT Rourkela)
## Full Build Specification for Agentic AI Development
**Version 3.0 · 2026-10-11 · Supersedes all prior CampusIQ docs**

---

## 0. HOW TO USE THIS DOCUMENT WITH AGENTIC AI

This is a **build bible**, not a pitch. Each phase in §14 is a self-contained, copy-paste-ready master prompt. Workflow:

1. Create a fresh git repo `campusiq-campus`.
2. Work through **Phases 1→7 in order**. Do not parallelize — each phase depends on the previous.
3. After every phase, run the phase's **Acceptance Tests** before prompting the next phase.
4. Paste the **Standing Rules** (§14.1) at the top of every agent session.
5. If an agent drifts, re-anchor it: *"Re-read §<n> of BUILD_SPEC.md. You violated rule #<k>."*

**Definition of done (whole project):** a judge can log in as each of the 8 personas, file a complaint as a student, watch it get auto-risk-scored and auto-assigned, receive a real email, move across a kanban, get closed by a warden, and see the hostel's Efficiency Rating change — with zero hardcoded data in any production code path.

---

## 1. VISION & SCOPE

**One campus. Full depth. Every role. Real workflow.**

CampusIQ Campus Edition is an autonomous facility-intelligence and complaint-operations platform for NIT Rourkela. It replaces WhatsApp-to-random-caretaker chaos with a single system of record:

> **Autonomous complaint intake → AI risk intelligence → prioritized decision command → verified resolution → performance accountability.**

### 1.1 In scope (v1)
- Complaint intake (student/CR) with photo evidence and location pinning
- AI triage: classification, duplicate merge, risk scoring, priority, smart assignment
- Role-true workflow: Student → Hostel Rep → Caretaker (kanban) → Warden → Chief Warden → Director
- SLA engine with auto-escalation and auto-email
- Utility-bill ingestion (PDF/CSV) to train consumption forecasters
- Festival/occasion demand prediction (Innovision, Technozion, Nitrutsav, exam season)
- Decision dashboard for authorities (water / electricity / hygiene / misc)
- Reward & performance system (professional, official-grade)
- Full audit trail on every state change

### 1.2 Out of scope (v1 — do not build)
- Payments, fees, hostel room allocation
- IoT hardware integration (design APIs to allow it later; simulate sensors)
- Multi-campus (the config layer must make it *possible*, but no second campus ships configured)

### 1.3 The two scores (never confuse them)
| Score | Answers | Range | Who sees it |
|---|---|---|---|
| **Risk Score** | How dangerous/urgent is this *issue*? | 0–100 | Everyone |
| **Ranking Score** | Where does this ticket sit in the *work queue right now*? | 0–100 + queue position | Caretaker, Warden, Chief Warden |

A P2 ticket at queue-rank #2 outranks a P2 at rank #19. A P1 always outranks everything. Details in §8.

---

## 2. ROLES & RBAC

### 2.1 Role hierarchy (mirrors NIT Rourkela's real chain)

```
STUDENT ──files──▶ complaint
CR (Class Rep) ──files on behalf / bulk-verify──▶ complaint
HOSTEL_REP (elected, per hostel) ──verifies / merges / escalates──▶ complaint
CARETAKER (per hostel: electrical | plumbing | civil | housekeeping) ──executes──▶ kanban
WARDEN (per hostel) ──approves closure / rejects / reassigns──▶ complaint
CHIEF_WARDEN (campus-wide) ──cross-hostel command, budgets, festival mode
ESTATE_OFFICER (campus-wide, optional) ──vendors, major works
DIRECTOR (read-only) ──govt-grade decision dashboard
ADMIN ──user management, SLA policy, categories
```

Information flows **up**, accountability flows **down**, every handoff is timestamped.

### 2.2 Permissions matrix (enforce server-side, never trust the UI)

| Capability | STUDENT | CR | HOSTEL_REP | CARETAKER | WARDEN | CHIEF_WARDEN | DIRECTOR | ADMIN |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| File complaint | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | – | ✔ |
| View own hostel complaints | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Verify / reject complaint | – | – | ✔ | – | ✔ | ✔ | – | – |
| Merge duplicates | – | – | ✔ | – | ✔ | – | – | – |
| Override severity/risk | – | – | ✔* | – | ✔ | ✔ | – | – |
| Assign / reassign | – | – | escalate-only | accept | ✔ | ✔ | – | ✔ |
| Move kanban (In Progress → Resolved) | – | – | – | ✔ | – | – | – | – |
| Approve closure / reject back | – | – | – | – | ✔ | ✔ | – | – |
| Cross-hostel view | – | – | – | – | – | ✔ | ✔ | ✔ |
| Festival pre-brief generator | – | – | – | – | – | ✔ | read | – |
| Utility bill upload | – | – | – | – | – | ✔ | – | ✔ |
| Reward approval | – | – | – | – | ✔ | ✔ | – | – |
| Export reports (PDF/CSV) | – | – | – | – | ✔ | ✔ | ✔ | ✔ |
| User/role management | – | – | – | – | – | – | – | ✔ |
| SLA policy / categories | – | – | – | – | – | – | – | ✔ |

\* Hostel Rep override is capped: may raise by exactly one priority class, must add a reason, override is logged and visible to the Warden.

---

## 3. COMPLAINT LIFECYCLE (STATE MACHINE)

The heart of the product. **All status changes go through the event endpoint** — no direct status writes anywhere.

```
                        ┌────────────────────────────── ESCALATED ◀─────────────┐
                        │ (auto: SLA breach / P1 untouched 45 min)              │
                        ▼                                                       │
 [STUDENT]           [HOSTEL_REP]        [AUTO ENGINE]      [CARETAKER]     [WARDEN]
     │                    │                   │                 │              │
     ▼                    ▼                   ▼                 ▼              ▼
   OPEN ──verify────▶ VERIFIED ──auto-match─▶ ASSIGNED ──accept─▶ IN_PROGRESS
     │                    │                   │                 │              │
     │                 reject             reassign          resolve          approve
     │                    │                   │            (photo+note)        │
     ▼                    ▼                   ▼                 ▼              ▼
  REJECTED            REJECTED ◀────────── REASSIGNED     RESOLVED ──────▶ CLOSED
 (reason to                                                 │
  student)                                                  ▼
                                                       REJECTED_BACK
                                                       (reason → caretaker,
                                                        kanban → IN_PROGRESS)
```

Rules:
1. **P1 (Risk ≥ 80):** skips Hostel Rep verification. `OPEN → ASSIGNED` immediately; Hostel Rep + Warden notified in parallel. If untouched by the caretaker for **45 minutes** → auto `ESCALATED`, Chief Warden emailed.
2. **SLA engine:** background worker (every 60 s) checks active tickets. At **75% of SLA** → warning email to assignee + Warden. At **100%** → `ESCALATED`, Chief Warden emailed. Escalation adds +10 risk (cap 100).
3. **Every transition** writes a `complaint_events` row: `from_status, to_status, actor_id, actor_role, note, photo_url, created_at`. The public ticket timeline renders exactly from this table — never from mutable fields.
4. **REJECTED (intake):** student sees a polite reason; complaint is never deleted (audit).
5. **CLOSED is terminal.** Any further issue → new complaint linked via `parent_complaint_id`.

---

## 4. SYSTEM ARCHITECTURE

```
┌───────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                  │
│   Next.js 16 Web (role-routed)      Mobile web (PWA, student-first)   │
└────────────────┬──────────────────────────────────────────────────────┘
                 │ HTTPS / JSON
┌────────────────▼──────────────────────────────────────────────────────┐
│                    FastAPI v3 Backend  (Render / Railway)             │
│  ┌─────────────┐ ┌───────────────┐ ┌───────────────┐ ┌─────────────┐  │
│  │ Auth (JWT + │ │ Complaint     │ │ AI Engine     │ │ Reports &   │  │
│  │ role guard) │ │ Engine (FSM)  │ │ (§8)          │ │ Exporters   │  │
│  └─────────────┘ └──────┬────────┘ └──────┬────────┘ └─────────────┘  │
│  ┌─────────────┐ ┌──────▼────────┐ ┌──────▼────────┐ ┌─────────────┐  │
│  │ Mail Service│ │ SLA Worker    │ │ Reward Engine │ │ Forecast &  │  │
│  │ (SMTP queue)│ │ (APScheduler) │ │ (§11)         │ │ Bill Parser │  │
│  └─────────────┘ └───────────────┘ └───────────────┘ └─────────────┘  │
└───────┬──────────────────┬───────────────────┬────────────────────────┘
        │                  │                   │
┌───────▼──────┐   ┌───────▼───────┐   ┌───────▼────────┐
│  PostgreSQL  │   │ Redis (queue, │   │ Object storage │
│ (Neon/Supa-  │   │ cache, rate-  │   │ (S3/R2 —       │
│  base)       │   │ limit)        │   │ complaint photos)│
└──────────────┘   └───────────────┘   └────────────────┘
```

**Module rules:** the AI engine is a pure function of (complaint + context) → scores. It never writes state. The complaint engine owns all writes. Mail is fire-and-forget via Redis queue; a ticket's existence never depends on email delivery.

---

## 5. ENVIRONMENT VARIABLES (contract)

```
APP_ENV=development|staging|production
APP_SECRET=<random 64-hex>
API_BASE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql+psycopg://user:pass@host:5432/campusiq
REDIS_URL=redis://localhost:6379/0
JWT_ALG=HS256
JWT_ACCESS_TTL_MIN=30
JWT_REFRESH_TTL_DAYS=14
MAIL_PROVIDER=resend|smtp
RESEND_API_KEY=...
MAIL_FROM="CampusIQ Estate Office <no-reply@campusiq.in>"
MAIL_ENABLED=true            # false in dev → print to logs instead
S3_BUCKET=...  S3_ACCESS_KEY=...  S3_SECRET=...  S3_ENDPOINT=...
ML_MODELS_DIR=./models
ENABLE_FORECAST_TRAINING=true
```

---

## 6. DATABASE SCHEMA (PostgreSQL)

The agent must generate Alembic migrations from this schema. All tables get `id UUID PK DEFAULT gen_random_uuid()` and `created_at TIMESTAMPTZ DEFAULT now()`.

```sql
-- ── Identity ─────────────────────────────────────────────
CREATE TABLE hostels (
  code TEXT UNIQUE NOT NULL,            -- 'HB-3'
  name TEXT NOT NULL,
  type TEXT DEFAULT 'boys',             -- boys|girls|married|international
  resident_count INT DEFAULT 0,
  warden_id UUID REFERENCES users(id)
);
CREATE TABLE users (
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN
    ('STUDENT','CR','HOSTEL_REP','CARETAKER','WARDEN',
     'CHIEF_WARDEN','ESTATE_OFFICER','DIRECTOR','ADMIN')),
  hostel_id UUID REFERENCES hostels(id),
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ
);
CREATE TABLE blocks (
  hostel_id UUID REFERENCES hostels(id),
  name TEXT NOT NULL,                   -- 'A Block', 'Pump Room'
  kind TEXT                             -- residential|utility|common
);
CREATE TABLE rooms (
  block_id UUID REFERENCES blocks(id),
  room_no TEXT NOT NULL
);
CREATE TABLE caretaker_skills (         -- drives the assignment matcher
  user_id UUID REFERENCES users(id),
  skill TEXT NOT NULL,                  -- electrical|plumbing|civil|housekeeping
  proficiency INT DEFAULT 3 CHECK (proficiency BETWEEN 1 AND 5),
  PRIMARY KEY (user_id, skill)
);

-- ── Complaints ───────────────────────────────────────────
CREATE TABLE categories (
  code TEXT PRIMARY KEY,                -- ELECTRICAL, WATER, HYGIENE, CIVIL, SECURITY, MISC
  name TEXT NOT NULL,
  default_severity INT NOT NULL CHECK (default_severity BETWEEN 1 AND 5),
  sla_class TEXT NOT NULL               -- P1|P2|P3|P4
);
CREATE TABLE sla_policies (
  priority TEXT PRIMARY KEY,            -- P1|P2|P3|P4
  sla_hours INT NOT NULL,
  warning_at_pct INT DEFAULT 75,
  p1_escalation_minutes INT DEFAULT 45
);
CREATE TABLE complaints (
  ticket_no TEXT UNIQUE NOT NULL,       -- 'CIQ-2026-00001' (sequence per year)
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category_code TEXT REFERENCES categories(code),
  hostel_id UUID REFERENCES hostels(id),
  block_id UUID REFERENCES blocks(id),
  room_id UUID REFERENCES rooms(id),
  location_text TEXT,
  lat NUMERIC(9,6), lng NUMERIC(9,6),
  reported_by UUID REFERENCES users(id),
  reported_for UUID REFERENCES users(id),   -- CR filing on behalf
  parent_complaint_id UUID REFERENCES complaints(id),
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN
    ('OPEN','VERIFIED','ASSIGNED','IN_PROGRESS','RESOLVED',
     'CLOSED','REJECTED','REJECTED_BACK','REASSIGNED','ESCALATED')),
  priority TEXT NOT NULL DEFAULT 'P3' CHECK (priority IN ('P1','P2','P3','P4')),
  severity INT NOT NULL DEFAULT 3 CHECK (severity BETWEEN 1 AND 5),
  -- AI outputs (nullable until engine runs; human overrides logged)
  risk_score NUMERIC(5,2),
  risk_explanation TEXT,
  ranking_score NUMERIC(5,2),
  queue_rank INT,
  duplicate_of UUID REFERENCES complaints(id),
  ai_category_confidence NUMERIC(4,3),
  assigned_to UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ,
  sla_deadline TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES users(id),
  resolution_note TEXT,
  resolution_photo_url TEXT,
  people_affected INT DEFAULT 1,
  upvote_count INT DEFAULT 0
);
CREATE INDEX idx_complaints_status ON complaints(status, hostel_id);
CREATE INDEX idx_complaints_sla ON complaints(sla_deadline)
  WHERE status NOT IN ('CLOSED','REJECTED');

CREATE TABLE complaint_events (         -- the ONLY source of truth for the timeline
  complaint_id UUID REFERENCES complaints(id),
  from_status TEXT,
  to_status TEXT NOT NULL,
  actor_id UUID REFERENCES users(id),
  actor_role TEXT,
  note TEXT,
  photo_url TEXT,
  meta JSONB DEFAULT '{}'
);
CREATE TABLE complaint_media (
  complaint_id UUID REFERENCES complaints(id),
  file_url TEXT NOT NULL,
  file_kind TEXT DEFAULT 'image',
  uploaded_by UUID REFERENCES users(id)
);
CREATE TABLE complaint_upvotes (
  complaint_id UUID REFERENCES complaints(id),
  user_id UUID REFERENCES users(id),
  PRIMARY KEY (complaint_id, user_id)
);

-- ── Utilities, bills, events, forecasts ──────────────────
CREATE TABLE utility_bills (
  hostel_id UUID REFERENCES hostels(id),    -- NULL = campus-wide meter
  utility TEXT NOT NULL,                    -- electricity|water
  bill_month DATE NOT NULL,
  units_consumed NUMERIC(12,2) NOT NULL,    -- kWh or kL
  amount_inr NUMERIC(12,2) NOT NULL,
  tariff_rate NUMERIC(10,4),
  source_file_url TEXT,
  parsed_confidence NUMERIC(4,3),
  uploaded_by UUID REFERENCES users(id),
  UNIQUE (hostel_id, utility, bill_month)
);
CREATE TABLE events (                   -- festivals / occasions / exam season
  name TEXT NOT NULL,
  kind TEXT NOT NULL,                   -- festival|techfest|exam|convocation|maintenance_drive
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  expected_footfall INT,
  water_surge_multiplier NUMERIC(4,2) DEFAULT 1.0,
  electricity_surge_multiplier NUMERIC(4,2) DEFAULT 1.0,
  hygiene_pressure_multiplier NUMERIC(4,2) DEFAULT 1.0,
  declared_by UUID REFERENCES users(id)
);
CREATE TABLE forecasts (
  scope TEXT NOT NULL,                  -- hostel_id or 'campus'
  utility TEXT NOT NULL,
  target_month DATE NOT NULL,
  predicted_units NUMERIC(12,2) NOT NULL,
  lower_ci NUMERIC(12,2), upper_ci NUMERIC(12,2),
  model_version TEXT,
  event_id UUID REFERENCES events(id)
);

-- ── Performance & rewards ────────────────────────────────
CREATE TABLE performance_scores (       -- snapshot per staff user per month
  user_id UUID REFERENCES users(id),
  hostel_id UUID REFERENCES hostels(id),
  month DATE NOT NULL,
  sla_compliance_pct NUMERIC(5,2),
  first_time_resolution_pct NUMERIC(5,2),
  avg_resolution_hours NUMERIC(8,2),
  rating_avg NUMERIC(3,2),
  performance_index NUMERIC(5,2),       -- 0–100, see §11
  hostel_rank INT,
  UNIQUE (user_id, month)
);
CREATE TABLE reward_ledger (
  user_id UUID REFERENCES users(id),
  month DATE NOT NULL,
  kind TEXT NOT NULL,                   -- certificate|incentive_recommendation|commendation
  status TEXT DEFAULT 'proposed',       -- proposed|approved|awarded
  approved_by UUID REFERENCES users(id),
  note TEXT
);
CREATE TABLE hostel_ratings (           -- monthly, per hostel
  hostel_id UUID REFERENCES hostels(id),
  month DATE NOT NULL,
  efficiency_rating NUMERIC(5,2),       -- 0–100, see §11
  resolution_time_score NUMERIC(5,2),
  per_resident_energy NUMERIC(10,3),
  per_resident_water NUMERIC(10,3),
  hygiene_audit_score NUMERIC(5,2),
  recurrence_penalty NUMERIC(5,2),
  campus_rank INT,
  PRIMARY KEY (hostel_id, month)
);

-- ── Notifications & mail ─────────────────────────────────
CREATE TABLE notifications (
  user_id UUID REFERENCES users(id),
  kind TEXT NOT NULL,                   -- p1_raised|sla_warning|escalated|resolved|approved|...
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE
);
CREATE TABLE email_log (
  template TEXT NOT NULL,
  to_emails TEXT NOT NULL,
  cc_emails TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'queued',         -- queued|sent|failed|disabled_dev
  sent_at TIMESTAMPTZ
);
```

---

## 7. API CONTRACT (FastAPI)

Base path `/api/v1`. Auth: `Authorization: Bearer <access_token>`. All list endpoints support `?page=&page_size=&sort=&filter=`. Error format everywhere:

```json
{ "error": { "code": "FORBIDDEN_ROLE", "message": "...", "detail": {} } }
```

### 7.1 Auth
| Method | Route | Body | Returns |
|---|---|---|---|
| POST | `/auth/register` | email, password, full_name, role, hostel_code | user (first user becomes ADMIN) |
| POST | `/auth/login` | email, password | `{access_token, refresh_token, user}` |
| POST | `/auth/refresh` | refresh_token | new access token |
| GET | `/auth/me` | – | current user + permissions array |

### 7.2 Reference data
| Method | Route | Notes |
|---|---|---|
| GET | `/meta/hostels` | list of hostels, blocks, rooms (for pickers) |
| GET | `/meta/categories` | categories with default severity + SLA class |
| GET | `/meta/sla-policies` | P1–P4 SLA table |

### 7.3 Complaints
| Method | Route | Body / Query | Permission |
|---|---|---|---|
| POST | `/complaints` | ComplaintCreate (below) | any active user |
| GET | `/complaints` | `status, priority, category, hostel_id, q, mine, assigned_to_me` | scope-limited (§2.2) |
| GET | `/complaints/{id}` | – | scope-limited |
| GET | `/complaints/{id}/timeline` | – | events ordered asc |
| POST | `/complaints/{id}/media` | multipart file | uploader |
| POST | `/complaints/{id}/upvote` | – | same-hostel users |

**ComplaintCreate**
```json
{
  "title": "Water leakage near pump room",
  "description": "Water is leaking...",
  "category_code": "WATER",
  "hostel_code": "HB-3",
  "block_id": "...", "room_id": null,
  "location_text": "Pump room, ground floor",
  "lat": 22.253, "lng": 84.904,
  "people_affected": 30,
  "reported_for": null
}
```

### 7.4 Workflow events (the ONLY way to change status)
| Method | Route | Body | Permission |
|---|---|---|---|
| POST | `/complaints/{id}/events` | `EventRequest` (below) | per transition matrix (§7.5) |

**EventRequest**
```json
{ "to_status": "ASSIGNED", "note": "...", "photo_url": null,
  "assignee_id": "...", "severity": null, "reason": "..." }
```

**Allowed transitions (server-enforced):**
| from | to | allowed roles | extra |
|---|---|---|---|
| OPEN | VERIFIED | HOSTEL_REP, WARDEN, CHIEF_WARDEN | sets verified_by/at |
| OPEN | REJECTED | HOSTEL_REP, WARDEN | reason required |
| OPEN | ASSIGNED | system (P1 auto) | skips verify when risk≥80 |
| VERIFIED | ASSIGNED | system, WARDEN, CHIEF_WARDEN | sets assigned_to/at, sla_deadline |
| VERIFIED | REJECTED | HOSTEL_REP, WARDEN | reason required |
| ASSIGNED | IN_PROGRESS | assigned CARETAKER | |
| ASSIGNED | REASSIGNED | WARDEN, CHIEF_WARDEN | new assignee required |
| REASSIGNED | IN_PROGRESS | new CARETAKER | |
| IN_PROGRESS | RESOLVED | assigned CARETAKER | resolution_note + photo required |
| RESOLVED | CLOSED | WARDEN, CHIEF_WARDEN | approval |
| RESOLVED | REJECTED_BACK | WARDEN, CHIEF_WARDEN | reason required |
| REJECTED_BACK | IN_PROGRESS | assigned CARETAKER | |
| *active* | ESCALATED | SLA worker only | +10 risk, notify CHIEF_WARDEN |

Any other transition → `409 INVALID_TRANSITION`. Each valid one: write event, update complaint, recompute ranking, fire notifications + emails.

### 7.5 AI & analytics
| Method | Route | Notes |
|---|---|---|
| POST | `/ai/recompute/{complaint_id}` | re-run risk + ranking (manual, WARDEN+) |
| GET | `/ai/queue?hostel_id=` | ranked work queue with risk + ranking scores |
| GET | `/analytics/hostel/{code}?months=6` | complaint volumes, SLA compliance, category mix, top recurring locations |
| GET | `/analytics/campus?months=6` | cross-hostel comparison (CHIEF_WARDEN, DIRECTOR, ADMIN) |
| GET | `/analytics/risk-index` | campus risk index 0–100 (§8.6) |

### 7.6 Utilities, bills, forecasts
| Method | Route | Notes |
|---|---|---|
| POST | `/utilities/bills/upload` | multipart PDF/CSV; parses → `utility_bills`; returns extracted rows + confidence |
| GET | `/utilities/bills` | list bills |
| POST | `/utilities/forecasts/train` | train/fine-tune forecaster on bills (CHIEF_WARDEN, ADMIN) |
| GET | `/utilities/forecasts?utility=electricity&months_ahead=3` | predictions + CI |
| POST | `/events` | create event (CHIEF_WARDEN) |
| GET | `/events/upcoming` | events in next 90 days |
| POST | `/events/{id}/prebrief` | generate festival pre-brief (§8.5) |

### 7.7 Performance & rewards
| Method | Route | Notes |
|---|---|---|
| GET | `/performance/me` | my scorecard (staff roles) |
| GET | `/performance/hostel/{code}?month=` | per-caretaker table (WARDEN+) |
| GET | `/performance/campus?month=` | hostel ranking table (CHIEF_WARDEN, DIRECTOR) |
| POST | `/rewards/propose` | propose reward for a user (system or WARDEN) |
| POST | `/rewards/{id}/approve` | approve (CHIEF_WARDEN) |

### 7.8 Admin
| Method | Route | Notes |
|---|---|---|
| GET/POST/PATCH | `/admin/users` | CRUD, role change, deactivate |
| POST | `/admin/users/{id}/skills` | set caretaker skills |
| PUT | `/admin/sla-policies` | adjust SLA table |
| GET | `/admin/audit?entity=` | read complaint_events / email_log |

### 7.9 Reports & export
| Method | Route | Notes |
|---|---|---|
| GET | `/reports/monthly?month=` | full month pack: volumes, SLA, utilities, hostel ratings |
| GET | `/reports/monthly.pdf` | same as PDF (server-rendered, official letterhead style) |
| GET | `/reports/export.csv?dataset=` | complaints / bills / performance CSV |

---

## 8. AI ENGINE SPECIFICATION

The AI engine lives in `backend/app/ai/`. Every model has `train()`, `predict()`, `evaluate()` and a persisted artifact under `ML_MODELS_DIR`. **Rule: if a model artifact is missing, the engine falls back to the deterministic heuristic in this section — never to hardcoded constants.**

### 8.1 Complaint classifier
- **Input:** title + description.
- **Output:** `category_code`, `confidence`.
- **v1 model:** TF-IDF (1–2 grams) + Logistic Regression. Baseline target ≥ 0.90 macro-F1 on a hand-labelled seed set (≥ 300 rows provided in `seed_data/complaint_train.jsonl`).
- **v2 (stretch):** fine-tune `distilbert-base-uncased` — but only if v1 falls short.
- **Fallback:** keyword scoring map per category (e.g. "leak|pipe|water|tap" → WATER).

### 8.2 Duplicate detection
- **Input:** new complaint vs complaints in same hostel, status in (OPEN, VERIFIED, ASSIGNED, IN_PROGRESS), opened within last 14 days.
- **Method:** sentence embeddings (all-MiniLM-L6-v2, 384-d) cosine similarity + location token overlap.
- **Rule:** sim ≥ 0.85 AND (same block OR same location_text) → mark `duplicate_of`, increment `upvote_count` on the parent, notify the filer ("merged with CIQ-2026-00012"). Do NOT auto-delete.

### 8.3 Risk Score (0–100)

```
risk = 100 × ( 0.30×severity_norm
             + 0.25×people_affected_norm
             + 0.20×escalation_velocity
             + 0.15×asset_criticality
             + 0.10×vulnerability_context )

severity_norm        = (severity − 1) / 4
people_affected_norm = min(people_affected / 400, 1)      # 400 ≈ one full hostel block
escalation_velocity  = min(complaints_on_same_block_72h / 5, 1)
asset_criticality    = map(location/asset → 0.2 general room, 0.6 corridor/common,
                           0.8 pump/electrical panel, 1.0 fire-safety equipment)
vulnerability_context= 1.0 during active events or 22:00–06:00; 0.4 exam weeks; 0.2 otherwise
```

**Worked example:** leak at HB-3 pump room, severity 4, 30 people, 3 related complaints in 72 h, asset = pump (0.8), filed 21:14 →
`0.30×0.75 + 0.25×0.075 + 0.20×0.6 + 0.15×0.8 + 0.10×1.0 = 0.574 → risk 57.4` → P2.
The same complaint filed 10 AM → 47.4; with 6 related complaints and 150 people → **82 → P1**.
Always persist `risk_explanation` as human-readable factors, e.g.:
> "Risk 82 (P1): severity high · 150 people affected · 6 related complaints in 72h · pump-room asset · night hours."

**Priority bands:** ≥80 P1 · 60–79 P2 · 40–59 P3 · <40 P4.

### 8.4 Ranking Score
Recomputed on every queue-affecting event (and by the SLA worker every minute):

```
sla_total   = sla_hours(priority) × 3600
elapsed     = now − assigned_at (or now − created_at if unassigned)
urgency     = max(0, 1 − remaining/sla_total)          # 0 → fresh, 1 → breached
ranking_score = risk × (1 + 0.5 × urgency²)
```

`queue_rank` = position after sorting active tickets by (priority class asc, ranking_score desc). Display: `RISK 78 · QUEUE #4 of 23`.

### 8.5 Festival/occasion forecasting
- **Features:** monthly bill history (units), resident count, month-of-year, event multipliers (from `events`), historical complaint rates by category.
- **Model:** gradient-boosted regressor (LightGBM or XGBoost) with quantile loss for 90% CI; Prophet baseline for comparison; keep whichever wins on time-split validation.
- **Training data:** `utility_bills` (real) + synthetic generator for cold-start (keep your existing generators as `ml/data_generators/`, clearly marked).
- **Pre-brief generator** (deterministic template over model outputs):
  > "Innovision in 12 days — predicted water demand +38%, electricity +22%, hygiene complaints ×3.1. Recommended: pre-inspect pumps in HB-1, HB-5; schedule 4 extra sweepers; budget ≈ ₹52,000."
- **Bill parser:** PDF → pdfplumber table extraction → regex fallback for NIT Rourkela electricity/water bill formats; CSV → direct. Every parse stores `parsed_confidence`; below 0.8 → queued for manual confirm in UI.

### 8.6 Campus Risk Index (for the Director dashboard)
Weighted composite, 0–100, computed daily:
```
CRI = 0.35×open_P1_P2_ratio + 0.25×sla_breach_rate_30d
    + 0.20×utility_anomaly_zscore + 0.20×hygiene_complaint_trend
```
Each sub-metric normalized 0–100; store history for trend chart.

---

## 9. FRONTEND SPECIFICATION (Next.js 16 + Tailwind v4 + shadcn/ui)

### 9.1 Global
- **Role-routed shell:** after login, the sidebar renders ONLY the modules the role may use (§2.2). All data fetches send the JWT; the API enforces scope anyway.
- **Design language:** clean, official, trustworthy. Light mode default, dark mode supported. Dense data tables, no cartoon gamification. Colors: slate neutrals + one accent (emerald). Severity chips: P1 red, P2 amber, P3 blue, P4 slate.
- **PWA:** installable; student flow must work on a 360px screen.

### 9.2 Pages per role
| Route | Audience | Contents |
|---|---|---|
| `/login` | all | email + password; demo-persona quick-login chips (dev only) |
| `/file` | STUDENT, CR | 3-step form: category → location pin (hostel/block/room picker + map pin) → details + photo + people affected. Shows live AI category guess + duplicate warning. |
| `/my` | STUDENT, CR | my complaints with status chips and timeline preview |
| `/triage` | HOSTEL_REP | inbox of OPEN complaints: AI category/confidence, dup-suggestion banner, one-click Verify / Reject (reason), escalate. Batch verify for CR-flagged items. |
| `/kanban` | CARETAKER | 4 columns (To Do=ASSIGNED, In Progress, Resolved-pending-approval, Escalated). Cards show ticket_no, title, category, RISK + QUEUE #, SLA countdown ring. Drag-and-drop calls the events API. |
| `/approvals` | WARDEN | RESOLVED queue with before/after photos → Approve (CLOSED) / Reject back (reason). SLA breach alerts at top. |
| `/hostel` | WARDEN | hostel analytics: volumes by category, SLA compliance %, caretaker performance table, hostel rating trend, reward proposals. |
| `/command` | CHIEF_WARDEN | cross-hostel table, campus risk index, P1 board, festival pre-brief panel, bill upload, forecast panel, reward approvals. |
| `/decision` | DIRECTOR | read-only: campus risk index, utility burn vs budget, SLA compliance, category heatmap, festival readiness, top recurring failure assets, export buttons. |
| `/ticket/[id]` | all (scoped) | full timeline from `complaint_events`, photos, risk explanation, both scores, SLA deadline, actions available to THIS role only. |
| `/admin` | ADMIN | users, roles, skills, SLA policies, audit viewer, email log. |

### 9.3 Key components
- `RiskBadge` — score + band, tooltip with explanation factors.
- `QueueRankChip` — `#4 of 23` with ranking_score on hover.
- `SlaCountdown` — ring turning red after warning threshold.
- `KanbanBoard` — dnd-kit, optimistic updates, rollback on API error.
- `Timeline` — renders events; avatars from actor role.
- `PreBriefCard` — festival forecast output.
- `BillUpload` — drag-drop PDF/CSV with parse preview + confirm.
- `PerfTable` / `HostelRatingTable` — dense tables with month selector.

---

## 10. MAIL SYSTEM

### 10.1 Plumbing
Redis queue `mail` + worker. Every send writes `email_log`. `MAIL_ENABLED=false` → log as `disabled_dev` and print body. Templates rendered server-side (Jinja2). All emails share an official signature block:

```
— CampusIQ Facility Intelligence
  Estate Office, NIT Rourkela
  This is an automated notification. Ticket: {link}
```

### 10.2 Triggers → templates
| Trigger | Template | To / Cc |
|---|---|---|
| P1 raised | `p1_urgent` | Warden; Cc Chief Warden, Hostel Rep |
| P2–P4 assigned | `assigned` | assignee; Cc Warden |
| SLA warning (75%) | `sla_warning` | assignee; Cc Warden |
| SLA breach | `escalated` | Chief Warden; Cc Warden, assignee |
| Resolved (needs approval) | `resolution_pending` | Warden |
| Closed | `closed` | reporter; Cc Hostel Rep |
| Rejected at intake | `rejected` | reporter (polite, with reason) |
| Duplicate merged | `merged` | reporter (parent ticket link) |
| Festival pre-brief | `prebrief` | Chief Warden; Cc Wardens, Estate |
| Weekly hostel scorecard | `scorecard` | Wardens; Cc Chief Warden |
| New account credentials | `welcome` | new user |

### 10.3 Template: `p1_urgent` (norm for all)
```
Subject: [CAMPUSIQ · URGENT] {ticket_no} {title} — Action Required

To: {warden_name}, {hostel_code} | Cc: Chief Warden, Estate Office
Ref: {ticket_no} | Raised: {created_at}

SUMMARY
{ai_summary}

RISK SCORE: {risk}/100 ({priority}) | QUEUE RANK: #{queue_rank}
FACTORS: {risk_explanation}

ASSIGNED: {assignee_name} ({assignee_skills}) — auto-matched
SLA: {sla_hours}h | BREACH AT: {sla_deadline} (auto-escalates to Chief Warden)

Dashboard: {FRONTEND_URL}/ticket/{id}
```

---

## 11. REWARD & PERFORMANCE SYSTEM

### 11.1 Caretaker Performance Index (monthly, 0–100)
```
PI = 100 × ( 0.45×sla_compliance
           + 0.30×first_time_resolution
           + 0.15×(rating_avg/5)
           + 0.10×throughput_norm ) − 5×rework_rate
```
- `first_time_resolution` = share of tickets CLOSED without a REJECTED_BACK.
- `throughput_norm` = min(tickets_closed / hostel_avg, 1).
- Recomputed monthly by worker; stored in `performance_scores`; shown as a **professional scorecard**, not a game.

### 11.2 Rewards (professional, official)
- Top caretaker per hostel (PI ≥ 75): `certificate` — "CampusIQ Excellence — <month>", listed in the official monthly report.
- Top caretaker campus-wide: `incentive_recommendation` — recommendation note to Warden/Chief Warden for institutional incentive. Human approval required; the system only *proposes*.
- Perfect-PI months: `commendation` letter entry.
- Never display raw rupee amounts; never gamify with badges/avatars.

### 11.3 Hostel Efficiency Rating (monthly, 0–100)
```
ER = 0.35×resolution_time_score + 0.25×(100 − per_resident_energy_index)
   + 0.20×(100 − per_resident_water_index) + 0.20×hygiene_audit_score
   − recurrence_penalty
```
Published as a dignified cross-hostel ranking table (Wardens + Chief Warden + Director). This creates healthy rivalry without looking childish.

---

## 12. SECURITY & RELIABILITY

1. Passwords: argon2/bcrypt hashing. JWT access 30 min + refresh 14 d, stored httpOnly cookie or secure storage.
2. Server-side RBAC on every endpoint via a single `require_role(...)` dependency; scope checks (same-hostel) in the data layer.
3. Rate limits: login 5/min/IP; complaint create 10/min/user; upload 5 MB max, images only (JPEG/PNG/WebP).
4. Uploads: random object keys, content-type validated, virus-scan hook stub for later.
5. Audit: `complaint_events` immutable (no UPDATE/DELETE endpoints). `email_log` append-only.
6. SLA worker: idempotent (uses `SELECT ... FOR UPDATE SKIP LOCKED`), safe on multi-instance deploys.
7. Secrets only via env; `.env.example` committed, real `.env` never.
8. CORS: allowlist `FRONTEND_URL` only.

---

## 13. DEPLOYMENT

| Piece | Service | Notes |
|---|---|---|
| Frontend | Vercel | `app/` Next.js 16, env `NEXT_PUBLIC_API_URL` |
| Backend | Render / Railway | `backend/`, uvicorn, health `/api/v1/health` |
| Postgres | Neon / Supabase | pooled connection for serverless safety |
| Redis | Upstash | queue + cache |
| Mail | Resend (or SMTP) | verified domain `campusiq.in` |
| Storage | Cloudflare R2 / S3 | complaint photos |

CI: GitHub Actions — backend pytest + ruff, frontend tsc + build + lint; deploy on main.

---

## 14. AGENTIC BUILD PLAN (COPY-PASTE PROMPTS)

### 14.1 STANDING RULES — paste at the top of EVERY agent session
```
You are building CampusIQ Campus Edition (NIT Rourkela) from BUILD_SPEC.md.
Hard rules:
1. Zero hardcoded demo data in any production code path. Seed data lives only in seed scripts.
2. Every endpoint enforces server-side RBAC per §2.2. Never trust the UI.
3. All status changes go through the event endpoint + complaint_events (§3).
4. Every feature ships with its acceptance tests (pytest for backend, vitest for frontend). Write tests FIRST.
5. If the spec is ambiguous, choose the simplest option consistent with the spec and leave a `NOTE(spec):` comment.
6. Run the phase acceptance tests and paste results before claiming done.
7. Never modify the state machine (§3) without explicit instruction.
```

### 14.2 PHASE 1 — Backend foundation & auth
```
[PASTE STANDING RULES]
Phase 1 task: repo scaffold + PostgreSQL schema (§6) via Alembic + config (§5) +
FastAPI app skeleton with health check. Implement auth (§7.1): register (first user
→ ADMIN), login, refresh, /auth/me returning role + permissions array.
Seed script: 8 demo personas per §15 with real relationships (hostels, wardens,
caretakers with skills).
Acceptance tests:
- pytest: register→login→/auth/me returns role; second user cannot self-assign ADMIN.
- pytest: unauthenticated request to /complaints returns 401.
- pytest: seeded personas all log in.
- Alembic upgrade/downgrade round-trip clean.
```

### 14.3 PHASE 2 — Complaint engine (FSM)
```
[PASTE STANDING RULES]
Phase 2 task: implement §7.3–7.4 fully: ComplaintCreate, scoped list/get, media
upload, upvote, and the /events endpoint enforcing the transition matrix exactly
as §7.4's table (409 on invalid). Every transition writes complaint_events and
updates mutable fields transactionally. Implement ticket_no sequence CIQ-<year>-#####.
Acceptance tests:
- pytest matrix: for EVERY (from,to) pair in §7.4, allowed roles succeed (201) and
  forbidden roles get 403; invalid pairs get 409.
- pytest: timeline endpoint returns events in order; no direct status write exists.
- pytest: scope — student from HB-3 cannot GET a ticket from HB-5 (404, not 403).
- pytest: resolution requires note + photo; rejection requires reason.
```

### 14.4 PHASE 3 — AI engine
```
[PASTE STANDING RULES]
Phase 3 task: implement §8. Deterministic heuristics FIRST exactly as specified
(they are the guaranteed fallback), then the ML models (§8.1 classifier, §8.2
embeddings dedup, §8.5 forecaster) trained from seed data. Wire: complaint create →
classify → dedup → risk → priority → auto-assign (§8 matcher) → emails (§10).
Queue endpoints §7.5. Recompute risk on escalation (+10, cap 100).
Acceptance tests:
- pytest: the §8.3 worked example inputs produce risk 57.4 (night) / 47.4 (day) / 82 (P1).
- pytest: duplicate with sim≥0.85 same block → merged, upvote++.
- pytest: P1 skips verification (OPEN→ASSIGNED) and emails trigger (mail dev log).
- pytest: ranking: as SLA deadline approaches, ranking_score rises; queue order stable.
- pytest: model artifact missing → heuristic fallback, no crash.
- pytest: forecaster trains on ≥12 synthetic months and predicts next month within 2× MAE bound.
```

### 14.5 PHASE 4 — SLA worker & mail worker
```
[PASTE STANDING RULES]
Phase 4 task: APScheduler SLA worker (60s, idempotent, SKIP LOCKED) implementing §3
rules 1–2; Redis mail queue + worker with all §10.2 templates; notifications table
writes. MAIL_ENABLED=false path prints bodies.
Acceptance tests:
- pytest (time-mocked): ticket at 75% SLA → warning email; at 100% → ESCALATED +
  chief warden email; risk +10.
- pytest: P1 untouched 45 min → ESCALATED.
- pytest: worker is idempotent — two concurrent runs produce one escalation.
- pytest: every template renders with real seeded data (snapshot test).
```

### 14.6 PHASE 5 — Frontend
```
[PASTE STANDING RULES]
Phase 5 task: Next.js 16 app per §9. Role-routed shell, all pages in §9.2 for all 8
personas, components in §9.3. Kanban via dnd-kit with optimistic update + rollback.
Ticket page timeline from events API. Decision dashboard for DIRECTOR with export buttons.
Acceptance tests:
- vitest: role-routed nav renders exactly §2.2 modules per persona.
- e2e (playwright): student files complaint → appears in Hostel Rep triage →
  verified → appears in caretaker kanban → resolved → approved by warden → CLOSED;
  timeline shows every step with correct actor.
- e2e: P1 flow emails appear in dev mail log.
- vitest: risk badge tooltip shows explanation factors.
- npm run build passes clean.
```

### 14.7 PHASE 6 — Utilities, forecasts, events, rewards
```
[PASTE STANDING RULES]
Phase 6 task: §7.6 bills upload + parser + manual-confirm queue; forecast training +
predictions + CI; events CRUD + pre-brief generator; §7.7 performance computation
worker (monthly) + rewards propose/approve; §7.9 report pack + PDF + CSV exports;
§8.6 campus risk index.
Acceptance tests:
- pytest: sample NIT-R bill PDF (provided in fixtures) parses to expected units/amount;
  low-confidence parse queues for confirm.
- pytest: pre-brief for seeded Innovision event includes surge numbers + recommendations.
- pytest: monthly worker computes PI for seeded caretakers; reward proposal → approve flow.
- pytest: /reports/monthly.pdf returns a valid PDF with expected sections.
```

### 14.8 PHASE 7 — Hardening & deployment
```
[PASTE STANDING RULES]
Phase 7 task: §12 security items, §13 deployment (Vercel + Render + Neon + Upstash +
Resend + R2), CI workflow, README with run instructions, demo script (§16) rehearsed.
Acceptance tests:
- Full §15 demo script executed end-to-end on the deployed URL.
- CI green on main. Security checklist §12 verified (rate limits, CORS, RBAC spot checks).
- Lighthouse ≥ 90 on /file (mobile).
```

---

## 15. SEED DATA (demonstration personas)

| Persona | Role | Email | Hostel |
|---|---|---|---|
| Aarav Sharma | STUDENT | student.hb3@campusiq.in | HB-3 |
| Diya Patel (CR) | CR | cr.hb3@campusiq.in | HB-3 |
| Rohan Mehta | HOSTEL_REP | rep.hb3@campusiq.in | HB-3 |
| R. Das | CARETAKER | caretaker.hb3@campusiq.in | HB-3 (electrical, plumbing) |
| Dr. S. Nanda | WARDEN | warden.hb3@campusiq.in | HB-3 |
| Prof. M. Mishra | CHIEF_WARDEN | chief.warden@campusiq.in | – |
| Col. (Retd.) P. Rao | ESTATE_OFFICER | estate@campusiq.in | – |
| Dr. K. Sahoo | DIRECTOR | director@campusiq.in | – |
| (system) | ADMIN | admin@campusiq.in | – |

Seed also: 4 hostels (HB-3, KMS, CVR, GDB) with blocks/rooms; categories + SLA table (P1 2h, P2 8h, P3 48h, P4 7d); 12 months synthetic utility bills; one upcoming event (Innovision, +38% water, +22% electricity); 300-row labelled complaint training set.

---

## 16. DEMO SCRIPT (for judges — rehearse before presenting)

1. **Student files** a water-leak complaint at HB-3 pump room, 21:14, photo attached → AI shows "WATER (0.94)"; 10s later a second similar complaint auto-merges ("Merged with CIQ-2026-00012").
2. **Risk engine** scores it; show the explanation factors; with seeded velocity it lands P1 → warden's inbox shows the URGENT email (open the dev mail log / real inbox).
3. **Caretaker kanban:** card appears at QUEUE #1 with red SLA ring; drag to In Progress → Resolved with after-photo.
4. **Warden** Approves → CLOSED; student gets closure email; timeline shows every actor.
5. **Chief Warden command view:** uploads a past bill → forecast panel updates; clicks "Generate pre-brief" for Innovision → the email renders with surge numbers + recommendations.
6. **Director dashboard:** campus risk index, utility burn vs budget, hostel ranking table, export PDF.
7. **Rewards:** monthly worker ran in seed → caretaker scorecard + proposed certificate; Chief Warden approves.
8. Close with the scaling story: same engine, new sector config = hospital or municipal campus.

---

## 17. REPOSITORY LAYOUT

```
campusiq-campus/
├── BUILD_SPEC.md
├── backend/
│   ├── app/
│   │   ├── main.py  config.py  deps.py
│   │   ├── auth/  users/  complaints/  events/  ai/  mail/  workers/
│   │   ├── utilities/  performance/  reports/  admin/
│   │   └── models/          # SQLAlchemy models mirroring §6
│   ├── alembic/
│   ├── tests/
│   ├── seed_data/
│   └── requirements.txt
├── ml/
│   ├── data_generators/     # synthetic cold-start generators (kept from v2)
│   ├── training/            # train scripts + evaluation reports
│   └── models/              # artifacts (gitignored)
├── app/                     # Next.js 16 frontend (§9)
│   ├── app/  components/  lib/  e2e/
└── .github/workflows/
```

---

*End of specification. Any conflict: §3 (state machine) and §2.2 (permissions) always win.*
