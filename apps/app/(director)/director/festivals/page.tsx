"use client";

import { FestivalDashboardView } from "@/components/festivals/festival-dashboard-view";

export default function DirectorFestivalsPage() {
  return (
    <FestivalDashboardView
      roleId="director"
      issuerName="Dr. K. Sahoo"
      issuerRole="DIRECTOR"
      issuerTitle="Director"
    />
  );
}
