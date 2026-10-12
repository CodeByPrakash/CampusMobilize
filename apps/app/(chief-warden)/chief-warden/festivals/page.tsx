"use client";

import { FestivalDashboardView } from "@/components/festivals/festival-dashboard-view";

export default function ChiefWardenFestivalsPage() {
  return (
    <FestivalDashboardView
      roleId="chief_warden"
      issuerName="Prof. M. Mishra"
      issuerRole="CHIEF_WARDEN"
      issuerTitle="Chief Warden"
    />
  );
}
