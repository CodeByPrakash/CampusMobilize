export interface RoleDefinition {
  id: string
  name: string
  title: string
  roleKey: string
  description: string
  color: string
  badgeColor?: string
  initial: string
  email: string
  route: string
  badge?: string
}

export const ROLES: RoleDefinition[] = [
  {
    id: "student",
    name: "Aryan Sharma",
    title: "B.Tech Student (Hostel 14, Rm 204)",
    roleKey: "STUDENT",
    description: "Personal dashboard, lodge issues, live status tracking & reward points",
    color: "#2563eb",
    initial: "A",
    email: "aryan@student.nitrkl.ac.in",
    route: "/student/dashboard",
  },
  {
    id: "cr",
    name: "Diya Patel",
    title: "Class Rep & Wing Coordinator",
    roleKey: "CR",
    description: "Filing on behalf of wing students, common facility tracking",
    color: "#0d9488",
    initial: "D",
    email: "diya@cr.nitrkl.ac.in",
    route: "/cr/dashboard",
    badge: "ACTIVE",
  },
  {
    id: "hostel_rep",
    name: "Rohan Mehta",
    title: "Hostel Representative (B-Block)",
    roleKey: "HOSTEL_REP",
    description: "First-line triage inbox with 1-click verify & duplicate auto-merge",
    color: "#9333ea",
    initial: "R",
    email: "rohan@rep.nitrkl.ac.in",
    route: "/hostel-rep/dashboard",
  },
  {
    id: "caretaker",
    name: "R. Das",
    title: "Senior Caretaker (Electrical & Plumbing)",
    roleKey: "CARETAKER",
    description: "Operational Kanban board with SLA countdown & photo proof",
    color: "#ea580c",
    initial: "R",
    email: "rdas@caretaker.nitrkl.ac.in",
    route: "/care-taker/dashboard",
  },
  {
    id: "warden",
    name: "Dr. S. Nanda",
    title: "Hall Warden (Hostel 14)",
    roleKey: "WARDEN",
    description: "Category breakdown donut chart, resolution approvals & caretaker audit",
    color: "#3b82f6",
    initial: "D",
    email: "snanda@warden.nitrkl.ac.in",
    route: "/warden/dashboard",
  },
  {
    id: "chief_warden",
    name: "Prof. M. Mishra",
    title: "Chief Warden (All 4 Halls)",
    roleKey: "CHIEF_WARDEN",
    description: "Campus command center, CRI gauge, festival surge pre-briefs & rewards",
    color: "#e11d48",
    initial: "P",
    email: "mmishra@chiefwarden.nitrkl.ac.in",
    route: "/chief-warden/dashboard",
  },
  {
    id: "estate_officer",
    name: "Col. (Retd.) P. Rao",
    title: "Estate & Works Officer",
    roleKey: "ESTATE_OFFICER",
    description: "Quantile utility forecasts, festival budget estimates & bills parsing",
    color: "#0284c7",
    initial: "C",
    email: "prao@estate.nitrkl.ac.in",
    route: "/estate-officer/dashboard",
  },
  {
    id: "director",
    name: "Dr. K. Sahoo",
    title: "Director, NIT Rourkela",
    roleKey: "DIRECTOR",
    description: "NIT Admin Executive dashboard with Campus Risk Index & Dignity ranking",
    color: "#059669",
    initial: "D",
    email: "director@nitrkl.ac.in",
    route: "/director/dashboard",
  },
]

export const DEFAULT_ROLE = ROLES[1] // Diya Patel (CR) as shown ACTIVE in prompt
