export type Role =
  | "STUDENT"
  | "CR"
  | "HOSTEL_REP"
  | "CARETAKER"
  | "WARDEN"
  | "CHIEF_WARDEN"
  | "ESTATE_OFFICER"
  | "DIRECTOR"
  | "ADMIN";

export interface Persona {
  id: string;
  name: string;
  role: Role;
  email: string;
  hostelCode: string | null;
  designation: string;
  avatarColor: string;
  description: string;
  allowedTabs: string[];
}

export interface Complaint {
  id: string;
  ticket_no: string;
  title: string;
  description: string;
  category_code: string;
  hostel_code?: string;
  block_name?: string;
  room_no?: string;
  location_text?: string;
  status: string;
  priority: string;
  severity: number;
  risk_score?: number;
  risk_explanation?: string;
  ranking_score?: number;
  queue_rank?: number;
  duplicate_of?: string;
  ai_category_confidence?: number;
  assigned_to?: string;
  assigned_to_name?: string;
  assigned_at?: string;
  sla_deadline?: string;
  verified_by?: string;
  verified_at?: string;
  resolved_at?: string;
  closed_at?: string;
  resolution_note?: string;
  resolution_photo_url?: string;
  people_affected: number;
  upvote_count: number;
  reported_by?: string;
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  complaint_id: string;
  from_status?: string;
  to_status: string;
  actor_id?: string;
  actor_role?: string;
  note?: string;
  photo_url?: string;
  created_at: string;
}

export interface CampusRiskIndexData {
  campus_risk_index: number;
  status: string;
  status_label: string;
  badge_color: string;
  band: string;
  components: {
    open_p1_p2_ratio: number;
    sla_breach_rate_30d: number;
    utility_anomaly_norm: number;
    hygiene_trend_norm: number;
  };
  open_high_risk_tickets: number;
  total_active_tickets: number;
  escalated_tickets: number;
}

export interface CampusEventData {
  id: string;
  name: string;
  kind: string;
  starts_on: string;
  ends_on: string;
  expected_footfall: number;
  water_surge_multiplier: number;
  electricity_surge_multiplier: number;
}

export interface CaretakerPerformanceScore {
  user_id: string;
  caretaker_name: string;
  role: string;
  performance_index: number;
  sla_compliance_pct: number;
  first_time_resolution_pct: number;
  throughput_count: number;
  rework_rate_pct: number;
  rating_avg: number;
  hostel_rank?: number;
}

export interface HostelEfficiencyScore {
  hostel_id: string;
  hostel_code: string;
  hostel_name: string;
  efficiency_rating: number;
  resolution_rate_pct: number;
  open_complaints: number;
  resolved_complaints: number;
  per_resident_energy_index: number;
  per_resident_water_index: number;
  hygiene_audit_score: number;
  campus_rank: number;
}
