"use client";

import React from "react";
import { usePersona } from "../context/PersonaContext";
import LandingLoginView from "../components/LandingLoginView";
import DashboardLayout from "../components/DashboardLayout";
import StudentDashboard from "../components/views/StudentDashboard";
import HostelRepDashboard from "../components/views/HostelRepDashboard";
import CaretakerDashboard from "../components/views/CaretakerDashboard";
import WardenDashboard from "../components/views/WardenDashboard";
import AdminLeadershipDashboard from "../components/views/AdminLeadershipDashboard";

export default function Home() {
  const { isLoggedIn, activePersona } = usePersona();

  // 1. If not logged in, render Public Landing & Login Experience (Screens 1 & 2)
  if (!isLoggedIn) {
    return <LandingLoginView />;
  }

  // 2. If logged in, render the Dedicated Role Dashboard inside DashboardLayout (Screens 3 - 9, 11)
  const renderRoleDashboard = () => {
    switch (activePersona.role) {
      case "STUDENT":
      case "CR":
        return <StudentDashboard />;

      case "HOSTEL_REP":
        return <HostelRepDashboard />;

      case "CARETAKER":
        return <CaretakerDashboard />;

      case "WARDEN":
        return <WardenDashboard />;

      case "CHIEF_WARDEN":
      case "ESTATE_OFFICER":
      case "DIRECTOR":
      default:
        return <AdminLeadershipDashboard />;
    }
  };

  return <DashboardLayout>{renderRoleDashboard()}</DashboardLayout>;
}
