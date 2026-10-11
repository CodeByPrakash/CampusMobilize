"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Persona } from "../types";

export const CANONICAL_PERSONAS: Persona[] = [
  {
    id: "usr-student-aarav",
    name: "Aryan Sharma",
    role: "STUDENT",
    email: "aryan.student@nitrkl.ac.in",
    hostelCode: "Hostel 14 (HB-3)",
    designation: "B.Tech Student (Hostel 14, Rm 204)",
    avatarColor: "bg-blue-600",
    description: "Personal dashboard, lodge issues, live status tracking & reward points",
    allowedTabs: ["overview", "my_complaints", "lodge_complaint", "rewards", "analytics"]
  },
  {
    id: "usr-cr-diya",
    name: "Diya Patel",
    role: "CR",
    email: "diya.cr@nitrkl.ac.in",
    hostelCode: "Hostel 14 (HB-3)",
    designation: "Class Rep & Wing Coordinator",
    avatarColor: "bg-teal-600",
    description: "Filing on behalf of wing students, common facility tracking",
    allowedTabs: ["overview", "my_complaints", "lodge_complaint", "rewards", "analytics"]
  },
  {
    id: "usr-rep-rohan",
    name: "Rohan Mehta",
    role: "HOSTEL_REP",
    email: "rep.hb3@nitrkl.ac.in",
    hostelCode: "Hostel 14 (HB-3)",
    designation: "Hostel Representative (B-Block)",
    avatarColor: "bg-purple-600",
    description: "First-line triage inbox with 1-click verify & duplicate auto-merge",
    allowedTabs: ["rep_dashboard", "triage", "my_complaints", "lodge_complaint"]
  },
  {
    id: "usr-caretaker-das",
    name: "R. Das",
    role: "CARETAKER",
    email: "caretaker.hb3@nitrkl.ac.in",
    hostelCode: "Hostel 14 (HB-3)",
    designation: "Senior Caretaker (Electrical & Plumbing)",
    avatarColor: "bg-amber-600",
    description: "Operational Kanban board with SLA countdown & photo proof",
    allowedTabs: ["caretaker_kanban", "scorecard"]
  },
  {
    id: "usr-warden-nanda",
    name: "Dr. S. Nanda",
    role: "WARDEN",
    email: "warden.hb3@nitrkl.ac.in",
    hostelCode: "Hostel 14 (HB-3)",
    designation: "Hall Warden (Hostel 14)",
    avatarColor: "bg-indigo-600",
    description: "Category breakdown donut chart, resolution approvals & caretaker audit",
    allowedTabs: ["warden_dashboard", "approvals", "hostel_analytics"]
  },
  {
    id: "usr-chief-warden-mishra",
    name: "Prof. M. Mishra",
    role: "CHIEF_WARDEN",
    email: "chief.warden@nitrkl.ac.in",
    hostelCode: null,
    designation: "Chief Warden (All 4 Halls)",
    avatarColor: "bg-rose-600",
    description: "Campus command center, CRI gauge, festival surge pre-briefs & rewards",
    allowedTabs: ["campus_overview", "approvals", "ai_prediction", "rewards_admin", "reports"]
  },
  {
    id: "usr-estate-rao",
    name: "Col. (Retd.) P. Rao",
    role: "ESTATE_OFFICER",
    email: "estate@nitrkl.ac.in",
    hostelCode: null,
    designation: "Estate & Works Officer",
    avatarColor: "bg-cyan-600",
    description: "Quantile utility forecasts, festival budget estimates & bills parsing",
    allowedTabs: ["ai_prediction", "campus_overview", "reports"]
  },
  {
    id: "usr-director-sahoo",
    name: "Dr. K. Sahoo",
    role: "DIRECTOR",
    email: "director@nitrkl.ac.in",
    hostelCode: null,
    designation: "Director, NIT Rourkela",
    avatarColor: "bg-emerald-600",
    description: "NIT Admin Executive dashboard with Campus Risk Index & Dignity ranking",
    allowedTabs: ["campus_overview", "decision_board", "ai_prediction", "reports"]
  }
];

interface PersonaContextType {
  isLoggedIn: boolean;
  activePersona: Persona;
  setPersona: (p: Persona) => void;
  login: (p: Persona) => void;
  logout: () => void;
  activeTab: string;
  setActiveTab: (t: string) => void;
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined);

export function PersonaProvider({ children }: { children: ReactNode }) {
  // Start with login page initially so the user experiences the full landing and auth flow!
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [activePersona, setActivePersona] = useState<Persona>(CANONICAL_PERSONAS[0]);
  const [activeTab, setActiveTab] = useState<string>("overview");

  const handleSetPersona = (p: Persona) => {
    setActivePersona(p);
    if (!p.allowedTabs.includes(activeTab)) {
      setActiveTab(p.allowedTabs[0]);
    }
  };

  const login = (p: Persona) => {
    setActivePersona(p);
    setIsLoggedIn(true);
    setActiveTab(p.allowedTabs[0]);
  };

  const logout = () => {
    setIsLoggedIn(false);
  };

  return (
    <PersonaContext.Provider
      value={{
        isLoggedIn,
        activePersona,
        setPersona: handleSetPersona,
        login,
        logout,
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
