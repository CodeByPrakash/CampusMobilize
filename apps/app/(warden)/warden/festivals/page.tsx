"use client";

import { FestivalDashboardView } from "@/components/festivals/festival-dashboard-view";

export default function WardenFestivalsPage() {
  return (
    <FestivalDashboardView
      roleId="warden"
      issuerName="Dr. S. Nanda"
      issuerRole="WARDEN"
      issuerTitle="Hall Warden"
    />
  );
}
