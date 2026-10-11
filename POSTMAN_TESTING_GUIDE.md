# 🚀 Postman Testing Guide — CampusIQ Backend API

This guide explains step-by-step how to test the **CampusIQ Backend** (`FastAPI` + `PostgreSQL`) using **Postman**.

---

## ⚡ 1-Click Setup: Import Postman Collection

You can import the pre-configured Postman Collection directly into Postman:

1. Open **Postman**.
2. Click the **Import** button (top left).
3. Drag & drop or select the file:  
   📂 `c:\Users\absol\Desktop\BPUT_Hackathon\CampusIQ_Postman_Collection.json`
4. The entire collection will load with all **17 endpoints**, headers, JSON bodies, and automated `ticketId` variables configured.

---

## 🌐 Environment & Base Configuration

- **Base URL:** `http://127.0.0.1:8000/api/v1`
- **Interactive Swagger Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

### 🔑 Role-Based Headers (Mock Auth / RBAC)
All requests use custom HTTP headers to simulate the canonical personas:

| Header Key | Example Value | Description |
| :--- | :--- | :--- |
| `Content-Type` | `application/json` | Standard JSON payload header |
| `X-Actor-Role` | `STUDENT`, `HOSTEL_REP`, `CARETAKER`, `WARDEN`, `CHIEF_WARDEN`, `DIRECTOR` | User role for permission checks |
| `X-Actor-Id` | `usr-student-aarav`, `usr-rep-rohan`, `usr-caretaker-das`, `usr-warden-nanda` | Unique user persona ID |
| `X-Hostel-Code` | `HB-3` | Canonical hostel code |

---

## 📋 Step-by-Step API Testing Walkthrough

### 1. Health & Database Verification
- **Method:** `GET`
- **URL:** `http://127.0.0.1:8000/api/v1/health`
- **Expected Status:** `200 OK`
- **Response Example:**
```json
{
  "status": "HEALTHY",
  "service": "campusiq-backend",
  "campus": "NIT Rourkela",
  "offline_mode": true
}
```

---

### 2. Fetch Demonstration Personas
- **Method:** `GET`
- **URL:** `http://127.0.0.1:8000/api/v1/meta/personas`
- **Headers:** *(None required)*
- **Expected Status:** `200 OK`
- **Use:** Lists all 10 canonical personas (Aarav, Diya, Rohan, Das, Nanda, Mishra, Rao, Sahoo) with roles and contact information.

---

### 3. Step 1: Lodge Complaint (Student)
- **Method:** `POST`
- **URL:** `http://127.0.0.1:8000/api/v1/complaints`
- **Headers:**
  - `Content-Type`: `application/json`
  - `X-Actor-Role`: `STUDENT`
  - `X-Actor-Id`: `usr-student-aarav`
  - `X-Hostel-Code`: `HB-3`
- **Body (`raw` -> `JSON`):**
```json
{
  "title": "Main ceiling fan sparking and regulator burnt",
  "description": "Continuous sparks and burning odor coming from regulator inside room 204.",
  "category_code": "ELECTRICAL",
  "hostel_code": "HB-3",
  "block_name": "B Block",
  "room_no": "204",
  "severity": 4,
  "people_affected": 3
}
```
- **Expected Status:** `201 Created`
- **Note:** Copy the returned `"id"` (e.g., `e7bf34a0-e09b-482a-921d-aa17fde2b49a`). This is your `{{ticketId}}`.

---

### 4. Step 2: List Complaints (Filtered by Hostel)
- **Method:** `GET`
- **URL:** `http://127.0.0.1:8000/api/v1/complaints?hostel_code=HB-3`
- **Headers:**
  - `X-Actor-Role`: `STUDENT`
  - `X-Actor-Id`: `usr-student-aarav`
  - `X-Hostel-Code`: `HB-3`
- **Expected Status:** `200 OK`

---

### 5. Step 3: Upvote Complaint (Student Peer)
- **Method:** `POST`
- **URL:** `http://127.0.0.1:8000/api/v1/complaints/{{ticketId}}/upvote`
- **Headers:**
  - `X-Actor-Role`: `STUDENT`
  - `X-Actor-Id`: `usr-cr-diya`
  - `X-Hostel-Code`: `HB-3`
- **Expected Status:** `200 OK`
- **Response:** Increments `upvote_count` by 1.

---

### 6. Step 4: Triage & Verify (Hostel Rep: Rohan Mehta)
- **Method:** `POST`
- **URL:** `http://127.0.0.1:8000/api/v1/complaints/{{ticketId}}/events`
- **Headers:**
  - `Content-Type`: `application/json`
  - `X-Actor-Role`: `HOSTEL_REP`
  - `X-Actor-Id`: `usr-rep-rohan`
  - `X-Hostel-Code`: `HB-3`
- **Body (`raw` -> `JSON`):**
```json
{
  "to_status": "VERIFIED",
  "note": "Inspected on-site; genuine electrical hazard requiring electrician repair."
}
```
- **Expected Status:** `200 OK`
- **Result:** Ticket status moves from `OPEN` $\to$ `VERIFIED`.

---

### 7. Step 5: Assign to Caretaker (Warden: Dr. S. Nanda)
- **Method:** `POST`
- **URL:** `http://127.0.0.1:8000/api/v1/complaints/{{ticketId}}/events`
- **Headers:**
  - `Content-Type`: `application/json`
  - `X-Actor-Role`: `WARDEN`
  - `X-Actor-Id`: `usr-warden-nanda`
  - `X-Hostel-Code`: `HB-3`
- **Body (`raw` -> `JSON`):**
```json
{
  "to_status": "ASSIGNED",
  "assignee_id": "usr-caretaker-das",
  "note": "Assigned to Senior Caretaker R. Das for immediate switchboard servicing."
}
```
- **Expected Status:** `200 OK`
- **Result:** Status moves from `VERIFIED` $\to$ `ASSIGNED`.

---

### 8. Step 6: Start Work (Caretaker: R. Das)
- **Method:** `POST`
- **URL:** `http://127.0.0.1:8000/api/v1/complaints/{{ticketId}}/events`
- **Headers:**
  - `Content-Type`: `application/json`
  - `X-Actor-Role`: `CARETAKER`
  - `X-Actor-Id`: `usr-caretaker-das`
  - `X-Hostel-Code`: `HB-3`
- **Body (`raw` -> `JSON`):**
```json
{
  "to_status": "IN_PROGRESS",
  "note": "Work started: Replacing regulator module and securing high-amp wiring."
}
```
- **Expected Status:** `200 OK`
- **Result:** Status moves from `ASSIGNED` $\to$ `IN_PROGRESS`.

---

### 9. Step 7: Resolve with Photo Proof (Caretaker: R. Das)
- **Method:** `POST`
- **URL:** `http://127.0.0.1:8000/api/v1/complaints/{{ticketId}}/events`
- **Headers:**
  - `Content-Type`: `application/json`
  - `X-Actor-Role`: `CARETAKER`
  - `X-Actor-Id`: `usr-caretaker-das`
  - `X-Hostel-Code`: `HB-3`
- **Body (`raw` -> `JSON`):**
```json
{
  "to_status": "RESOLVED",
  "note": "Replaced burnt regulator with ISI-certified unit. Verified circuit voltage.",
  "photo_url": "/proofs/hb3_room204_fixed.jpg"
}
```
- **Expected Status:** `200 OK`
- **Result:** Status moves from `IN_PROGRESS` $\to$ `RESOLVED`.

---

### 10. Step 8: Inspection Approval & Closure (Warden)
- **Method:** `POST`
- **URL:** `http://127.0.0.1:8000/api/v1/complaints/{{ticketId}}/events`
- **Headers:**
  - `Content-Type`: `application/json`
  - `X-Actor-Role`: `WARDEN`
  - `X-Actor-Id`: `usr-warden-nanda`
  - `X-Hostel-Code`: `HB-3`
- **Body (`raw` -> `JSON`):**
```json
{
  "to_status": "CLOSED",
  "note": "Photo proof verified; room student signed off. Ticket closed."
}
```
- **Expected Status:** `200 OK`
- **Result:** Status moves from `RESOLVED` $\to$ `CLOSED`.

---

### 11. Step 9: Audit Timeline & FSM History
- **Method:** `GET`
- **URL:** `http://127.0.0.1:8000/api/v1/complaints/{{ticketId}}/timeline`
- **Headers:**
  - `X-Actor-Role`: `STUDENT`
  - `X-Actor-Id`: `usr-student-aarav`
- **Expected Status:** `200 OK`
- **Response:** Complete chronological array of all transition events with timestamp, actor name, action notes, and photo proof URL.

---

### 12. Local AI ML Categorization Test
- **Method:** `POST`
- **URL:** `http://127.0.0.1:8000/api/v1/ai/predict-category`
- **Headers:**
  - `Content-Type`: `application/json`
- **Body (`raw` -> `JSON`):**
```json
{
  "title": "Water purifier in first floor leaking continuously",
  "description": "The filter pipe is cracked and water is puddling near room 108 corridor."
}
```
- **Expected Status:** `200 OK`
- **Response Example:**
```json
{
  "predicted_category": "WATER",
  "confidence": 0.89,
  "suggested_priority": "P2",
  "model_type": "TF-IDF + SGDClassifier (Local Offline)"
}
```

---

### 13. Campus Risk Index (CRI) Analytics
- **Method:** `GET`
- **URL:** `http://127.0.0.1:8000/api/v1/analytics/risk-index`
- **Headers:**
  - `X-Actor-Role`: `DIRECTOR`
  - `X-Actor-Id`: `usr-director-sahoo`
- **Expected Status:** `200 OK`
- **Response:** Real-time campus risk score (0 to 100), active hazard hotspots, and dignity ranking across all hostels.

---

### 14. Quantile Utility Forecasts (36-Month Model)
- **Method:** `GET`
- **URL:** `http://127.0.0.1:8000/api/v1/utilities/forecasts?utility=electricity&months_ahead=3`
- **Headers:**
  - `X-Actor-Role`: `ESTATE_OFFICER`
  - `X-Actor-Id`: `usr-estate-rao`
- **Expected Status:** `200 OK`
- **Response:** P10, P50, and P90 quantile electricity forecasts for next 3 months with peak festival surge warnings.

---

## 🛠️ Quick cURL Commands for Terminal Testing

### 1. Lodge Complaint:
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/complaints" \
     -H "Content-Type: application/json" \
     -H "X-Actor-Role: STUDENT" \
     -H "X-Actor-Id: usr-student-aarav" \
     -H "X-Hostel-Code: HB-3" \
     -d '{"title": "Water leakage in washroom", "description": "Tap leaking", "category_code": "WATER", "hostel_code": "HB-3", "block_name": "A Block", "room_no": "101", "severity": 3, "people_affected": 2}'
```

### 2. Verify by Hostel Rep:
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/complaints/<TICKET_ID>/events" \
     -H "Content-Type: application/json" \
     -H "X-Actor-Role: HOSTEL_REP" \
     -H "X-Actor-Id: usr-rep-rohan" \
     -H "X-Hostel-Code: HB-3" \
     -d '{"to_status": "VERIFIED", "note": "Verified genuine leak"}'
```
