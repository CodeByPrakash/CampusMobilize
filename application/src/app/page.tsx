"use client";

import React from "react";
import { usePersona } from "../context/PersonaContext";
import LodgeComplaintView from "../components/views/LodgeComplaintView";
import MyComplaintsView from "../components/views/MyComplaintsView";
import HostelRepTriageView from "../components/views/HostelRepTriageView";
import CaretakerKanbanView from "../components/views/CaretakerKanbanView";
import WardenApprovalsView from "../components/views/WardenApprovalsView";
import CampusCommandCenterView from "../components/views/CampusCommandCenterView";

export default function Home() {
  const { activeTab } = usePersona();

  switch (activeTab) {
    case "lodge_complaint":
      return <LodgeComplaintView />;

    case "my_complaints":
      return <MyComplaintsView />;

    case "triage":
      return <HostelRepTriageView />;

    case "kanban":
    case "scorecard":
      return <CaretakerKanbanView />;

    case "approvals":
    case "hostel_intel":
      return <WardenApprovalsView />;

    case "command_center":
    case "decision_dashboard":
    case "utilities":
    case "rewards":
    case "reports":
      return <CampusCommandCenterView />;

    default:
      return <MyComplaintsView />;
  }
}
