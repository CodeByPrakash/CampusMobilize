# 🛡️ CampusIQ Roles, Permissions & FSM State Machine Guide

This document defines the **Role-Based Access Control (RBAC)**, **Persona Capabilities**, and **Finite State Machine (FSM)** transition rules enforced by the CampusIQ Backend (`FastAPI` + `PostgreSQL`).

---

## 🔑 1. How Roles Are Passed to Backend APIs

In CampusIQ, client authentication and role context are communicated via HTTP request headers:

```http
Content-Type: application/json
X-Actor-Role: <ROLE>
X-Actor-Id: <USER_ID>
X-Hostel-Code: <HOSTEL_CODE>
```

- **`X-Actor-Role`**: Specifies the calling role (e.g., `STUDENT`, `HOSTEL_REP`, `CARETAKER`, `WARDEN`).
- **`X-Actor-Id`**: The specific persona identifier (e.g., `usr-student-aarav`, `usr-rep-rohan`).
- **`X-Hostel-Code`**: Canonical hostel identifier (e.g., `HB-3`, `KMS`, `CVR`, `GDB`).

---

## 👥 2. Canonical Roles & What They Can Do

### 🎓 1. `STUDENT` (e.g., *Aarav Sharma*)
- **Scope**: Own Hostel (`HB-3`)
- **Allowed Actions**:
  - **Lodge complaints** (`POST /api/v1/complaints`) with issue title, description, category, block name, room number, severity (1–5), and photo evidence.
  - **Upvote complaints** (`POST /api/v1/complaints/{id}/upvote`) submitted by other residents in the hostel.
  - **View own hostel complaints** and track live status.
  - View personal reward points and resolution history.
- **Restrictions**:
  - Cannot triage, verify, assign, resolve, or close tickets.

---

### 📢 2. `CR` — Class Representative / Wing Coordinator (e.g., *Diya Patel*)
- **Scope**: Own Hostel (`HB-3`)
- **Allowed Actions**:
  - File complaints on behalf of wing students or common facilities (washrooms, corridors, water purifiers).
  - All capabilities of a `STUDENT`.
  - Batch tracking of common facility issues.
- **Restrictions**:
  - Cannot execute FSM lifecycle transitions (verification, assignment, closure).

---

### 🗳️ 3. `HOSTEL_REP` — Elected Hostel Representative (e.g., *Rohan Mehta*)
- **Scope**: Own Hostel (`HB-3`)
- **Allowed Actions**:
  - **First-line triage inbox**:
    - `OPEN` $\to$ `VERIFIED`: 1-click on-site verification of genuine complaints.
    - `OPEN` $\to$ `REJECTED`: Rejection of duplicate, frivolous, or non-actionable complaints (requires mandatory reason).
    - `VERIFIED` $\to$ `REJECTED`: Rejection before assignment if deemed invalid.
  - **Deduplication**: Auto-merge duplicate complaints into a master parent ticket.
  - **Priority escalation**: Override/raise priority by exactly 1 class with logged justification.
- **Restrictions**:
  - Cannot directly assign caretakers (escalates to Warden).
  - Cannot close tickets.

---

### 🛠️ 4. `CARETAKER` — Hall Tradesman (e.g., *R. Das* — Electrical & Plumbing)
- **Scope**: Own Hostel (`HB-3`)
- **Allowed Actions**:
  - **Operational Kanban Board**:
    - `ASSIGNED` $\to$ `IN_PROGRESS`: Accept ticket and begin work.
    - `REASSIGNED` $\to$ `IN_PROGRESS`: Begin work on reassigned ticket.
    - `REJECTED_BACK` $\to$ `IN_PROGRESS`: Resume work when Warden rejects incomplete resolution.
    - `IN_PROGRESS` $\to$ `RESOLVED`: Complete work. **Requires completion note and photo proof URL**.
  - Monitor SLA countdown timer and priority rank.
- **Restrictions**:
  - Cannot verify initial tickets.
  - Cannot mark a ticket `CLOSED` (requires Warden approval).

---

### 🏛️ 5. `WARDEN` — Hall Warden (e.g., *Dr. S. Nanda*)
- **Scope**: Own Hostel (`HB-3`)
- **Allowed Actions**:
  - **Hall Executive Decision Command**:
    - `VERIFIED` $\to$ `ASSIGNED`: Assign verified complaints to designated caretakers.
    - `OPEN` $\to$ `ASSIGNED`: Assign emergency P1 complaints directly.
    - `ASSIGNED` $\to$ `REASSIGNED`: Reassign ticket to another tradesman.
    - `RESOLVED` $\to$ `CLOSED`: Inspect caretaker's photo proof and approve final closure.
    - `RESOLVED` $\to$ `REJECTED_BACK`: Reject resolution back to caretaker with mandatory feedback.
    - `OPEN` $\to$ `REJECTED` / `VERIFIED` $\to$ `REJECTED`: Reject invalid complaints.
  - View category breakdown donut charts, resolution time stats, and caretaker SLA scorecards.
- **Restrictions**:
  - Scoped to own hostel; cannot view or edit complaints from other hostels.

---

### 🎖️ 6. `CHIEF_WARDEN` — Campus-Wide Chief Warden (e.g., *Prof. M. Mishra*)
- **Scope**: **Campus-Wide** (All 4 Halls: `HB-3`, `KMS`, `CVR`, `GDB`)
- **Allowed Actions**:
  - Cross-hostel visibility across all halls of residence.
  - Authority to execute **any** state transition (`VERIFIED`, `ASSIGNED`, `REASSIGNED`, `CLOSED`).
  - **Force Escalate**: Transition any ticket to `ESCALATED` on SLA breach or emergency.
  - Approve monthly caretaker performance rewards ledger (`POST /api/v1/performance/rewards/{id}/approve`).
  - Review festival/occasion demand pre-briefs (Innovision, ISM, Nitrutsav).

---

### ⚡ 7. `ESTATE_OFFICER` — Estate & Works Officer (e.g., *Col. (Retd.) P. Rao*)
- **Scope**: **Campus-Wide**
- **Allowed Actions**:
  - Access campus utility consumption dashboards and 36-month baseline data.
  - Query **P10, P50, and P90 quantile utility forecasts** (`GET /api/v1/utilities/forecasts`).
  - Upload and parse monthly utility bills (PDF / CSV).
  - Review infrastructure health alerts (transformer surges, major pipe bursts).

---

### 🌐 8. `DIRECTOR` — Executive Governance (e.g., *Dr. K. Sahoo*)
- **Scope**: **Campus-Wide** (Executive Read)
- **Allowed Actions**:
  - Real-time **Campus Risk Index (CRI: 0–100)** gauge.
  - Hall Dignity & Living Standard Rankings.
  - Strategic decisions, high-level infrastructure audits, and SLA compliance metrics.

---

### ⚙️ 9. `ADMIN` & `SLA_WORKER`
- **`ADMIN`**: System-wide administrative permissions; can perform any transition, manage reference metadata, and configure SLA policies.
- **`SLA_WORKER` / `SYSTEM`**: Automated background worker that flags overdue tickets as `ESCALATED` when SLA hours are breached.

---

## 📊 3. Permissions Matrix

| Capability | STUDENT | CR | HOSTEL_REP | CARETAKER | WARDEN | CHIEF_WARDEN | ESTATE_OFFICER | DIRECTOR | ADMIN |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **File Complaint** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | – | – | ✅ |
| **View Own Hostel Tickets** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Upvote Complaints** | ✅ | ✅ | ✅ | – | – | – | – | – | – |
| **Triage & Verify (`VERIFIED`)** | – | – | ✅ | – | ✅ | ✅ | – | – | ✅ |
| **Reject Complaint (`REJECTED`)** | – | – | ✅ | – | ✅ | ✅ | – | – | ✅ |
| **Assign / Reassign Caretaker** | – | – | – | – | ✅ | ✅ | – | – | ✅ |
| **Start Work (`IN_PROGRESS`)** | – | – | – | ✅ | ✅ | ✅ | – | – | ✅ |
| **Resolve with Photo (`RESOLVED`)** | – | – | – | ✅ | ✅ | ✅ | – | – | ✅ |
| **Approve Closure (`CLOSED`)** | – | – | – | – | ✅ | ✅ | – | – | ✅ |
| **Reject Back (`REJECTED_BACK`)** | – | – | – | – | ✅ | ✅ | – | – | ✅ |
| **Cross-Hostel View (All 4 Halls)** | – | – | – | – | – | ✅ | ✅ | ✅ | ✅ |
| **Campus Risk Index (CRI)** | – | – | – | – | – | ✅ | ✅ | ✅ | ✅ |
| **Quantile Utility Forecasts** | – | – | – | – | – | ✅ | ✅ | – | ✅ |
| **Approve Caretaker Rewards** | – | – | – | – | – | ✅ | – | – | ✅ |

---

## 🔄 4. FSM State Transition Rules (`TRANSITION_RULES`)

All status updates must pass through `POST /api/v1/complaints/{id}/events`. The backend enforces the following valid transitions:

```
                          ┌──────────────────────── ESCALATED ◀─────────────────────────┐
                          │ (Triggered by SLA_WORKER / CHIEF_WARDEN on SLA breach)       │
                          ▼                                                             │
   [STUDENT]          [HOSTEL_REP]        [AUTO / WARDEN]     [CARETAKER]          [WARDEN]
       │                   │                     │                 │                  │
       ▼                   ▼                     ▼                 ▼                  ▼
     OPEN ───verify───▶ VERIFIED ───assign───▶ ASSIGNED ──start──▶ IN_PROGRESS
       │                   │                     │                 │                  │
    reject              reject                reassign          resolve            approve
       │                   │                     │             (note+photo)           │
       ▼                   ▼                     ▼                 ▼                  ▼
    REJECTED            REJECTED ◀────────── REASSIGNED        RESOLVED ──────────▶ CLOSED
  (with reason)       (with reason)                                │
                                                                   ▼
                                                             REJECTED_BACK
                                                             (with reason)
```

### Exact Backend Transition Mapping:

| From Status | To Status | Allowed Roles | Mandatory Validation |
| :--- | :--- | :--- | :--- |
| `OPEN` | `VERIFIED` | `HOSTEL_REP`, `WARDEN`, `CHIEF_WARDEN`, `ADMIN` | Rep adds verification note |
| `OPEN` | `REJECTED` | `HOSTEL_REP`, `WARDEN`, `CHIEF_WARDEN`, `ADMIN` | Requires rejection `reason` (min 3 chars) |
| `OPEN` | `ASSIGNED` | `SYSTEM`, `AUTO_ENGINE`, `WARDEN`, `CHIEF_WARDEN`, `ADMIN` | Emergency P1 auto-bypass (§3 Rule 1) |
| `VERIFIED` | `ASSIGNED` | `SYSTEM`, `AUTO_ENGINE`, `WARDEN`, `CHIEF_WARDEN`, `ADMIN` | Requires `assignee_id` |
| `VERIFIED` | `REJECTED` | `HOSTEL_REP`, `WARDEN`, `CHIEF_WARDEN`, `ADMIN` | Requires rejection `reason` |
| `ASSIGNED` | `IN_PROGRESS` | `CARETAKER`, `WARDEN`, `CHIEF_WARDEN`, `ADMIN` | Caretaker starts work |
| `ASSIGNED` | `REASSIGNED` | `WARDEN`, `CHIEF_WARDEN`, `ADMIN` | Assigns new tradesman |
| `REASSIGNED` | `IN_PROGRESS` | `CARETAKER`, `WARDEN`, `CHIEF_WARDEN`, `ADMIN` | Caretaker starts work |
| `IN_PROGRESS` | `RESOLVED` | `CARETAKER`, `WARDEN`, `CHIEF_WARDEN`, `ADMIN` | **Requires `note` AND `photo_url`** |
| `RESOLVED` | `CLOSED` | `WARDEN`, `CHIEF_WARDEN`, `ADMIN` | Warden inspects & closes |
| `RESOLVED` | `REJECTED_BACK` | `WARDEN`, `CHIEF_WARDEN`, `ADMIN` | Requires feedback `reason` |
| `REJECTED_BACK` | `IN_PROGRESS` | `CARETAKER`, `WARDEN`, `CHIEF_WARDEN`, `ADMIN` | Caretaker resumes work |
| *(Any State)* | `ESCALATED` | `SLA_WORKER`, `SYSTEM`, `ADMIN`, `CHIEF_WARDEN` | Risk score increases +10 |

---

## 🔒 5. Scope Isolation (Hostel vs Cross-Hostel)

Defined in [`backend/app/api/complaints.py:43`](file:///c:/Users/absol/Desktop/BPUT_Hackathon/backend/app/api/complaints.py#L43):

```python
CROSS_HOSTEL_ROLES = ["CHIEF_WARDEN", "DIRECTOR", "ESTATE_OFFICER", "ADMIN"]
```

1. **Hostel-Scoped Roles** (`STUDENT`, `CR`, `HOSTEL_REP`, `CARETAKER`, `WARDEN`):
   - All `GET /complaints` lists are automatically filtered to the user's hostel (e.g. `HB-3`).
   - Querying a ticket from another hostel returns `HTTP 404 Not Found`.
2. **Cross-Hostel Roles** (`CHIEF_WARDEN`, `DIRECTOR`, `ESTATE_OFFICER`, `ADMIN`):
   - Can inspect and query complaints across all 4 hostels (`HB-3`, `KMS`, `CVR`, `GDB`).
   - Can filter by any `hostel_code` query parameter.
