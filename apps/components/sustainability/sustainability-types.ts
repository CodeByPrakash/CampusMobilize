export type SustainabilityCategory = "all" | "energy" | "water" | "waste" | "safety";

export type RiskLevel = "high" | "moderate" | "low";

export interface CampusPlace {
  id: string;
  name: string;
  sector: string;
  category: "energy" | "water" | "waste" | "safety";
  lat: number;
  lng: number;
  riskScore: number; // 0 to 100
  riskLevel: RiskLevel;
  sustainabilityScore: number; // 0 to 100
  telemetry: {
    metricName: string;
    value: string;
    status: "optimal" | "warning" | "critical";
    target?: string;
  };
  activeTickets: number;
  aiRecommendation: string;
  recentIncident?: string;
}

export interface SectorBoundary {
  id: string;
  name: string;
  description: string;
  color: string;
  center: [number, number];
  polygon: [number, number][];
  avgRisk: number;
  avgSustainability: number;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number; // 0.1 to 1.0
  radius: number;
  category: "energy" | "water" | "waste" | "safety";
  label: string;
}

export interface DailyScoreTrend {
  date: string;
  sustainabilityScore: number;
  campusRiskIndex: number;
  energyEfficiency: number;
  waterRecovery: number;
  carbonOffsetKg: number;
  predictedScore: number;
}
