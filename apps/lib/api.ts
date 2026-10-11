/**
 * CampusIQ Backend API Client with RBAC Headers (§1, §2)
 * Sends X-Actor-Role, X-Actor-Id, and X-Hostel-Code headers on every request.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

export interface PersonaContext {
  role: string
  actor_id: string
  hostel_code: string
  name: string
}

export const ROLE_PERSONAS: Record<string, PersonaContext> = {
  student: {
    role: "STUDENT",
    actor_id: "usr-student-aarav",
    hostel_code: "HB-3",
    name: "Aryan Sharma",
  },
  cr: {
    role: "CR",
    actor_id: "usr-cr-diya",
    hostel_code: "HB-3",
    name: "Diya Patel",
  },
  hostel_rep: {
    role: "HOSTEL_REP",
    actor_id: "usr-rep-rohan",
    hostel_code: "HB-3",
    name: "Rohan Mehta",
  },
  caretaker: {
    role: "CARETAKER",
    actor_id: "usr-caretaker-das",
    hostel_code: "HB-3",
    name: "R. Das",
  },
  warden: {
    role: "WARDEN",
    actor_id: "usr-warden-nanda",
    hostel_code: "HB-3",
    name: "Dr. S. Nanda",
  },
  chief_warden: {
    role: "CHIEF_WARDEN",
    actor_id: "usr-chief-warden-mishra",
    hostel_code: "HB-3",
    name: "Prof. M. Mishra",
  },
  estate_officer: {
    role: "ESTATE_OFFICER",
    actor_id: "usr-estate-rao",
    hostel_code: "HB-3",
    name: "Col. (Retd.) P. Rao",
  },
  director: {
    role: "DIRECTOR",
    actor_id: "usr-director-sahoo",
    hostel_code: "HB-3",
    name: "Dr. K. Sahoo",
  },
}

export function getActivePersona(): PersonaContext {
  if (typeof window !== "undefined") {
    const roleId = localStorage.getItem("current_role_id") || "cr"
    return ROLE_PERSONAS[roleId] || ROLE_PERSONAS.cr
  }
  return ROLE_PERSONAS.cr
}

export function getAuthHeaders(): HeadersInit {
  const persona = getActivePersona()
  return {
    "Content-Type": "application/json",
    "X-Actor-Role": persona.role,
    "X-Actor-Id": persona.actor_id,
    "X-Hostel-Code": persona.hostel_code,
  }
}

/**
 * Complaints Endpoints
 */
export async function apiListComplaints(params?: {
  status?: string
  priority?: string
  category_code?: string
  hostel_code?: string
}) {
  const query = new URLSearchParams()
  if (params?.status) query.set("status", params.status)
  if (params?.priority) query.set("priority", params.priority)
  if (params?.category_code) query.set("category_code", params.category_code)
  if (params?.hostel_code) query.set("hostel_code", params.hostel_code)

  const url = `${API_BASE_URL}/complaints?${query.toString()}`
  const res = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`Failed to list complaints: ${res.statusText}`)
  return res.json()
}

export async function apiGetComplaint(idOrTicket: string) {
  const res = await fetch(`${API_BASE_URL}/complaints/${idOrTicket}`, {
    method: "GET",
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`Complaint not found: ${res.statusText}`)
  return res.json()
}

export async function apiGetComplaintTimeline(idOrTicket: string) {
  const res = await fetch(`${API_BASE_URL}/complaints/${idOrTicket}/timeline`, {
    method: "GET",
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`Failed to load timeline: ${res.statusText}`)
  return res.json()
}

export async function apiCreateComplaint(data: {
  title: string
  description: string
  category_code?: string
  priority?: string
  hostel_code?: string
  block_name?: string
  room_no?: string
  severity?: number
  people_affected?: number
  reported_for?: string
}) {
  const persona = getActivePersona()
  const payload = {
    ...data,
    reported_by: persona.actor_id,
    actor_role: persona.role,
    hostel_code: data.hostel_code || persona.hostel_code,
  }
  const res = await fetch(`${API_BASE_URL}/complaints`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Failed to lodge complaint: ${res.statusText}`)
  }
  return res.json()
}

export async function apiTransitionComplaint(
  idOrTicket: string,
  event: {
    to_status: string
    note?: string
    photo_url?: string
    assignee_id?: string
    severity?: number
    reason?: string
  }
) {
  const persona = getActivePersona()
  const payload = {
    ...event,
    actor_role: persona.role,
    actor_id: persona.actor_id,
  }
  const res = await fetch(`${API_BASE_URL}/complaints/${idOrTicket}/events`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Transition failed: ${res.statusText}`)
  }
  return res.json()
}

export async function apiMergeComplaints(
  masterIdOrTicket: string,
  duplicateTicketIds: string[],
  reason?: string
) {
  const res = await fetch(`${API_BASE_URL}/complaints/${masterIdOrTicket}/merge`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      duplicate_ticket_ids: duplicateTicketIds,
      reason: reason || "Auto-merged by Hostel Representative",
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Merge failed: ${res.statusText}`)
  }
  return res.json()
}

export async function apiOverridePriority(
  idOrTicket: string,
  newPriority: string,
  justification: string
) {
  const res = await fetch(`${API_BASE_URL}/complaints/${idOrTicket}/priority`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      new_priority: newPriority,
      justification,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Priority override failed: ${res.statusText}`)
  }
  return res.json()
}

export async function apiUpvoteComplaint(idOrTicket: string) {
  const res = await fetch(`${API_BASE_URL}/complaints/${idOrTicket}/upvote`, {
    method: "POST",
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Upvote failed: ${res.statusText}`)
  }
  return res.json()
}

export async function apiDeleteComplaint(idOrTicket: string) {
  const res = await fetch(`${API_BASE_URL}/complaints/${idOrTicket}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Delete failed: ${res.statusText}`)
  }
  return res.json()
}


/**
 * Analytics, Utilities & Rewards Endpoints
 */
export async function apiGetCampusRiskIndex() {
  const res = await fetch(`${API_BASE_URL}/analytics/risk-index`, {
    method: "GET",
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error("Failed to load CRI")
  return res.json()
}

export async function apiGetUtilityForecasts(utility: string = "electricity", months: number = 3) {
  const res = await fetch(`${API_BASE_URL}/utilities/forecasts?utility=${utility}&months_ahead=${months}`, {
    method: "GET",
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error("Failed to load utility forecasts")
  return res.json()
}

export async function apiListRewards() {
  const res = await fetch(`${API_BASE_URL}/rewards`, {
    method: "GET",
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error("Failed to load rewards")
  return res.json()
}

export async function apiApproveReward(rewardId: string) {
  const res = await fetch(`${API_BASE_URL}/rewards/${rewardId}/approve`, {
    method: "POST",
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || "Failed to approve reward")
  }
  return res.json()
}

export async function apiProposeReward(data: {
  user_id: string
  kind: string
  note?: string
  month?: string
}) {
  const res = await fetch(`${API_BASE_URL}/rewards/propose`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || "Failed to propose reward")
  }
  return res.json()
}

export async function apiGetHostels() {
  const res = await fetch(`${API_BASE_URL}/meta/hostels`, {
    method: "GET",
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error("Failed to load hostels")
  return res.json()
}

export async function apiGetCategories() {
  const res = await fetch(`${API_BASE_URL}/meta/categories`, {
    method: "GET",
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error("Failed to load categories")
  return res.json()
}

export async function apiGetCampusRatings() {
  const res = await fetch(`${API_BASE_URL}/performance/campus`, {
    method: "GET",
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error("Failed to load campus ratings")
  return res.json()
}

export async function apiGetHostelPerformance(hostelCode: string = "HB-3") {
  const res = await fetch(`${API_BASE_URL}/performance/hostel/${hostelCode}`, {
    method: "GET",
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error("Failed to load hostel staff performance")
  return res.json()
}

export async function apiGetMyPerformance() {
  const res = await fetch(`${API_BASE_URL}/performance/my`, {
    method: "GET",
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error("Failed to load my performance")
  return res.json()
}

export async function apiGetEvents() {
  const res = await fetch(`${API_BASE_URL}/events`, {
    method: "GET",
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error("Failed to load campus events")
  return res.json()
}

export async function apiGetEventPrebrief(eventId: string) {
  const res = await fetch(`${API_BASE_URL}/events/${eventId}/prebrief`, {
    method: "GET",
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    // Retry with POST if GET fails
    const postRes = await fetch(`${API_BASE_URL}/events/${eventId}/prebrief`, {
      method: "POST",
      headers: getAuthHeaders(),
    })
    if (!postRes.ok) throw new Error("Failed to load event pre-brief")
    return postRes.json()
  }
  return res.json()
}

export async function apiIssueChiefWardenMandate(eventId: string, payload: Record<string, any> = {}) {
  const res = await fetch(`${API_BASE_URL}/events/${eventId}/mandate`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error("Failed to issue Chief Warden mandate")
  return res.json()
}

export async function apiGetChiefWardenMandate(eventId: string) {
  const res = await fetch(`${API_BASE_URL}/events/${eventId}/mandate`, {
    method: "GET",
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error("Failed to load Chief Warden mandate")
  return res.json()
}

export async function apiSimulateFacilityStress(payload: Record<string, any>) {
  const res = await fetch(`${API_BASE_URL}/ai/facility-stress/simulate`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error("Failed to run facility stress simulation")
  return res.json()
}

export async function apiGetUtilityBills() {
  const res = await fetch(`${API_BASE_URL}/utilities/bills`, {
    method: "GET",
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error("Failed to load utility bills")
  return res.json()
}

export async function apiGetContinuousLearningStatus() {
  const res = await fetch(`${API_BASE_URL}/ai/continuous-learning/status`, {
    method: "GET",
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error("Failed to load learning status")
  return res.json()
}

export async function apiGetRankedQueue(hostelCode?: string) {
  const url = hostelCode
    ? `${API_BASE_URL}/ai/queue?hostel_code=${hostelCode}`
    : `${API_BASE_URL}/ai/queue`
  const res = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error("Failed to load ranked queue")
  return res.json()
}

export async function apiPredictCategory(title: string, description: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/ai/triage`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        title,
        description,
        hostel_code: "HB-3",
      }),
    })
    if (res.ok) {
      const data = await res.json()
      return {
        predicted_category: data.category || data.predicted_category || "ELECTRICAL",
        confidence: data.confidence || 0.88,
      }
    }
  } catch {
    // fallback
  }

  const text = `${title} ${description}`.toLowerCase()
  if (
    text.includes("water") ||
    text.includes("leak") ||
    text.includes("tap") ||
    text.includes("flush") ||
    text.includes("pipe") ||
    text.includes("cooler") ||
    text.includes("ro")
  ) {
    return { predicted_category: "PLUMBING", confidence: 0.92 }
  }
  if (
    text.includes("light") ||
    text.includes("fan") ||
    text.includes("switch") ||
    text.includes("spark") ||
    text.includes("power") ||
    text.includes("mcb") ||
    text.includes("wire")
  ) {
    return { predicted_category: "ELECTRICAL", confidence: 0.95 }
  }
  if (
    text.includes("door") ||
    text.includes("lock") ||
    text.includes("window") ||
    text.includes("bed") ||
    text.includes("cupboard") ||
    text.includes("chair") ||
    text.includes("desk")
  ) {
    return { predicted_category: "CARPENTRY", confidence: 0.9 }
  }
  return { predicted_category: "CIVIL", confidence: 0.85 }
}

export async function apiUploadToS3(
  file: File,
  folder: string = "complaints"
): Promise<{ success: boolean; url: string; filename: string; bucket: string }> {
  const persona = getActivePersona()
  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch(`${API_BASE_URL}/uploads?folder=${folder}`, {
    method: "POST",
    headers: {
      "X-Actor-Role": persona.role,
      "X-Actor-Id": persona.actor_id,
      "X-Hostel-Code": persona.hostel_code,
    },
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || "Failed to upload image to S3 bucket")
  }
  return res.json()
}



