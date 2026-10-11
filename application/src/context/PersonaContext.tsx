"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Persona } from "../types";

export const CANONICAL_PERSONAS: Persona[] = [
  {
    id: "usr-student-aarav",
    name: "Aarav Sharma",
    role: "STUDENT",
    email: "student.hb3@campusiq.in",
    hostelCode: "HB-3",
    designation: "B.Tech Student (HB-3 Rm 204)",
    avatarColor: "bg-blue-600",
    description: "Standard student lodge & track flow",
    allowedTabs: ["my_complaints", "lodge_complaint"]
  },
  {
    id: "usr-cr-diya",
    name: "Diya Patel",
    role: "CR",
    email: "cr.hb3@campusiq.in",
    hostelCode: "HB-3",
    designation: "Class Rep (Wing Coordinator)",
    avatarColor: "bg-teal-600",
    description: "Lodges complaints on behalf of wing students",
    allowedTabs: ["my_complaints", "lodge_complaint"]
  },
  {
    id: "usr-rep-rohan",
    name: "Rohan Mehta",
    role: "HOSTEL_REP",
    email: "rep.hb3@campusiq.in",
    hostelCode: "HB-3",
    designation: "Hostel Representative (HB-3)",
    avatarColor: "bg-purple-600",
    description: "First-line triage inbox with 1-click verify & batch approval",
    allowedTabs: ["triage", "my_complaints", "lodge_complaint"]
  },
  {
    id: "usr-caretaker-das",
    name: "R. Das",
    role: "CARETAKER",
    email: "caretaker.hb3@campusiq.in",
    hostelCode: "HB-3",
    designation: "Senior Caretaker (Electrical & Plumbing)",
    avatarColor: "bg-amber-600",
    description: "Operational Kanban board with SLA countdown & risk badges",
    allowedTabs: ["kanban", "scorecard"]
  },
  {
    id: "usr-warden-nanda",
    name: "Dr. S. Nanda",
    role: "WARDEN",
    email: "warden.hb3@campusiq.in",
    hostelCode: "HB-3",
    designation: "Hall Warden (HB-3)",
    avatarColor: "bg-indigo-600",
    description: "Resolution photo approval & caretaker performance audit",
    allowedTabs: ["approvals", "hostel_intel", "triage", "kanban"]
  },
  {
    id: "usr-chief-warden-mishra",
    name: "Prof. M. Mishra",
    role: "CHIEF_WARDEN",
    email: "chief.warden@campusiq.in",
    hostelCode: null,
    designation: "Chief Warden (All 4 Halls)",
    avatarColor: "bg-rose-600",
    description: "Campus command center, CRI gauge, P1 board & festival pre-briefs",
    allowedTabs: ["command_center", "approvals", "utilities", "rewards", "reports"]
  },
  {
    id: "usr-estate-rao",
    name: "Col. (Retd.) P. Rao",
    role: "ESTATE_OFFICER",
    email: "estate@campusiq.in",
    hostelCode: null,
    designation: "Estate & Works Officer",
    avatarColor: "bg-cyan-600",
    description: "Utility bills, quantile demand forecasts & festival surge budgets",
    allowedTabs: ["utilities", "command_center", "reports"]
  },
  {
    id: "usr-director-sahoo",
    name: "Dr. K. Sahoo",
    role: "DIRECTOR",
    email: "director@campusiq.in",
    hostelCode: null,
    designation: "Director, NIT Rourkela",
    avatarColor: "bg-emerald-600",
    description: "Executive decision dashboard with CRI 0-100 & dignity rankings",
    allowedTabs: ["decision_dashboard", "command_center", "reports"]
  }
];

interface PersonaContextType {
  activePersona: Persona;
  setPersona: (p: Persona) => void;
  activeTab: string;
  setActiveTab: (t: string) => void;
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined);

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [activePersona, setActivePersona] = useState<Persona>(CANONICAL_PERSONAS[0]);
  const [activeTab, setActiveTab] = useState<string>("lodge_complaint");

  const handleSetPersona = (p: Persona) => {
    setActivePersona(p);
    // Switch to first allowed tab if current tab is not allowed
    if (!p.allowedTabs.includes(activeTab)) {
      setActiveTab(p.allowedTabs[0]);
    }
  };

  return (
    <PersonaContext.Provider
      value={{
        activePersona,
        setPersona: handleSetPersona,
        activeTab,
        setActiveTab
      }}
    >
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona() {
  const context = useContext(PersonaContext);
  if (!context) {
    throw new Error("usePersona must be used within a PersonaProvider");
  }
  return context;
}
