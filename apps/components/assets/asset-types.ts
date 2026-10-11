export type AssetCategory = "energy" | "water" | "facility" | "safety";

export type AssetStatus = "operational" | "maintenance" | "repair" | "critical";

export interface AssetItem {
  id: string;
  name: string;
  tag: string;
  category: AssetCategory;
  location: string;
  status: AssetStatus;
  healthScore: number;
  lastInspected: string;
  assignedTechnician?: string;
  manufacturer?: string;
  installedYear: number;
  powerRating?: string;
  capacity?: string;
  notes?: string;
}

export interface AssetColumnDefinition {
  id: AssetStatus;
  title: string;
  description: string;
  badge: string;
}
