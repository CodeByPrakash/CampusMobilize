import { Persona } from "../types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export function getHeaders(persona?: Persona): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json"
  };
  if (persona) {
    headers["X-Actor-Role"] = persona.role;
    headers["X-Actor-Id"] = persona.id;
    if (persona.hostelCode) {
      headers["X-Hostel-Code"] = persona.hostelCode;
    }
  }
  return headers;
}

export async function fetchComplaints(persona?: Persona, params?: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE_URL}/complaints${query ? `?${query}` : ""}`, {
    headers: getHeaders(persona)
  });
  if (!res.ok) throw new Error("Failed to fetch complaints");
  return res.json();
}

export async function createComplaint(payload: any, persona?: Persona) {
  const res = await fetch(`${BASE_URL}/complaints`, {
    method: "POST",
    headers: getHeaders(persona),
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to lodge complaint");
  }
  return res.json();
}

export async function transitionComplaint(ticketId: string, payload: any, persona?: Persona) {
  const body = {
    ...payload,
    actor_role: payload.actor_role || persona?.role,
    actor_id: payload.actor_id || persona?.id
  };
  const res = await fetch(`${BASE_URL}/complaints/${ticketId}/events`, {
    method: "POST",
    headers: getHeaders(persona),
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to transition state");
  }
  return res.json();
}

export async function upvoteComplaint(ticketId: string, persona?: Persona) {
  const res = await fetch(`${BASE_URL}/complaints/${ticketId}/upvote`, {
    method: "POST",
    headers: getHeaders(persona)
  });
  if (!res.ok) throw new Error("Failed to upvote complaint");
  return res.json();
}

export async function fetchTimeline(ticketId: string, persona?: Persona) {
  const res = await fetch(`${BASE_URL}/complaints/${ticketId}/timeline`, {
    headers: getHeaders(persona)
  });
  if (!res.ok) throw new Error("Failed to fetch timeline");
  return res.json();
}

export async function fetchCRI(persona?: Persona) {
  const res = await fetch(`${BASE_URL}/analytics/risk-index`, {
    headers: getHeaders(persona)
  });
  if (!res.ok) throw new Error("Failed to fetch Campus Risk Index");
  return res.json();
}

export async function fetchForecasts(utility: string = "electricity", monthsAhead: number = 3, persona?: Persona) {
  const res = await fetch(`${BASE_URL}/utilities/forecasts?utility=${utility}&months_ahead=${monthsAhead}`, {
    headers: getHeaders(persona)
  });
  if (!res.ok) throw new Error("Failed to fetch utility forecasts");
  return res.json();
}

export async function fetchEvents(persona?: Persona) {
  const res = await fetch(`${BASE_URL}/events`, {
    headers: getHeaders(persona)
  });
  if (!res.ok) throw new Error("Failed to fetch campus events");
  return res.json();
}

export async function fetchEventPrebrief(eventId: string, persona?: Persona) {
  const res = await fetch(`${BASE_URL}/events/${eventId}/prebrief`, {
    method: "POST",
    headers: getHeaders(persona)
  });
  if (!res.ok) throw new Error("Failed to generate festival pre-brief");
  return res.json();
}

export async function fetchCaretakerPerformance(hostelCode: string = "HB-3", persona?: Persona) {
  const res = await fetch(`${BASE_URL}/performance/hostel/${hostelCode}`, {
    headers: getHeaders(persona)
  });
  if (!res.ok) throw new Error("Failed to fetch caretaker performance");
  return res.json();
}

export async function fetchCampusHostelRatings(persona?: Persona) {
  const res = await fetch(`${BASE_URL}/performance/campus`, {
    headers: getHeaders(persona)
  });
  if (!res.ok) throw new Error("Failed to fetch campus hostel ratings");
  return res.json();
}

export async function fetchRewards(persona?: Persona) {
  const res = await fetch(`${BASE_URL}/rewards`, {
    headers: getHeaders(persona)
  });
  if (!res.ok) throw new Error("Failed to fetch rewards ledger");
  return res.json();
}

export async function approveReward(rewardId: string, persona?: Persona) {
  const res = await fetch(`${BASE_URL}/rewards/${rewardId}/approve`, {
    method: "POST",
    headers: getHeaders(persona)
  });
  if (!res.ok) throw new Error("Failed to approve reward");
  return res.json();
}

export async function triggerSlaTick(persona?: Persona) {
  const res = await fetch(`${BASE_URL}/sla/tick`, {
    method: "POST",
    headers: getHeaders(persona)
  });
  if (!res.ok) throw new Error("Failed to trigger SLA check");
  return res.json();
}

export async function fetchEmailLogs(persona?: Persona) {
  const res = await fetch(`${BASE_URL}/notifications/email-logs`, {
    headers: getHeaders(persona)
  });
  if (!res.ok) throw new Error("Failed to fetch email logs");
  return res.json();
}
