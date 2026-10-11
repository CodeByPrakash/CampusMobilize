"use client";

import React, { useState } from "react";
import { usePersona, CANONICAL_PERSONAS } from "../context/PersonaContext";
import { Persona } from "../types";
import {
  ShieldAlert,
  Flame,
  CheckCircle2,
  Clock,
  Layers,
  BarChart3,
  Building2,
  FileText,
  Award,
  Zap,
  Users,
  Radio,
  ChevronRight,
  KeyRound,
  X,
  Check,
  Mail,
  ShieldCheck
} from "lucide-react";

export const TAB_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  lodge_complaint: { label: "Lodge Complaint", icon: <FileText className="w-4 h-4" /> },
  my_complaints: { label: "My Complaints", icon: <Layers className="w-4 h-4" /> },
  triage: { label: "Triage Inbox", icon: <ShieldAlert className="w-4 h-4" /> },
  kanban: { label: "Caretaker Kanban", icon: <Clock className="w-4 h-4" /> },
  scorecard: { label: "My Scorecard", icon: <Award className="w-4 h-4" /> },
  approvals: { label: "Resolution Approvals", icon: <CheckCircle2 className="w-4 h-4" /> },
  hostel_intel: { label: "Hostel Intelligence", icon: <Building2 className="w-4 h-4" /> },
  command_center: { label: "Campus Command & CRI", icon: <Flame className="w-4 h-4" /> },
  decision_dashboard: { label: "Director Decision Board", icon: <BarChart3 className="w-4 h-4" /> },
  utilities: { label: "Utilities & Forecasts", icon: <Zap className="w-4 h-4" /> },
  rewards: { label: "Rewards Ledger", icon: <Award className="w-4 h-4" /> },
  reports: { label: "Executive Reports & Audit", icon: <FileText className="w-4 h-4" /> }
};

export default function Navbar() {
  const { activePersona, setPersona, activeTab, setActiveTab } = usePersona();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const handleSelectPersona = (p: Persona) => {
    setPersona(p);
    setIsModalOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        {/* 1. Global Header Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-900/30">
              <Building2 className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-white">CampusIQ</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  NIT Rourkela
                </span>
              </div>
              <p className="text-xs text-slate-400">Autonomous Facility Intelligence & Complaint Operations</p>
            </div>
          </div>

          {/* Offline Badge & Active Persona Badge */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-xs text-emerald-400">
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              <span className="font-medium">100% Offline Mode</span>
            </div>

            {/* Profile & Demo Account Trigger */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-2.5 pl-3 border-l border-slate-800 hover:opacity-90 transition group text-left"
              title="Click to open 8-Persona Demo Login Hub"
            >
              <div className={`w-8 h-8 rounded-full ${activePersona.avatarColor} flex items-center justify-center font-bold text-white text-xs shadow-md ring-2 ring-transparent group-hover:ring-emerald-500 transition`}>
                {activePersona.name.charAt(0)}
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-slate-200 flex items-center space-x-1">
                  <span>{activePersona.name}</span>
                  <KeyRound className="w-3 h-3 text-emerald-400 ml-1 opacity-70 group-hover:opacity-100" />
                </div>
                <div className="text-[11px] text-emerald-400 font-medium">{activePersona.designation}</div>
              </div>
            </button>
          </div>
        </div>

        {/* 2. 1-Click Persona Switcher Carousel Banner (§15) */}
        <div className="bg-slate-900/90 border-t border-b border-slate-800/80 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap flex items-center">
                <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Quick Switch Persona:
              </span>
              <div className="flex items-center space-x-1.5">
                {CANONICAL_PERSONAS.map((p) => {
                  const isSelected = p.id === activePersona.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPersona(p)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                        isSelected
                          ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-900/40 scale-105"
                          : "bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/50"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${p.avatarColor}`} />
                      <span>{p.name.split(" ")[0]}</span>
                      <span className="opacity-70 text-[10px]">({p.role})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="hidden lg:flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition whitespace-nowrap"
            >
              <KeyRound className="w-3 h-3" />
              <span>Demo Login Hub</span>
            </button>
          </div>
        </div>

        {/* 3. Role-Routed Navigation Tabs (§2.2, §9.1) */}
        <div className="bg-slate-950 px-4">
          <div className="max-w-7xl mx-auto flex space-x-1 overflow-x-auto py-1.5">
            {activePersona.allowedTabs.map((tabKey) => {
              const isTabActive = activeTab === tabKey;
              const tabInfo = TAB_LABELS[tabKey] || { label: tabKey, icon: <ChevronRight className="w-4 h-4" /> };
              return (
                <button
                  key={tabKey}
                  onClick={() => setActiveTab(tabKey)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    isTabActive
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  {tabInfo.icon}
                  <span>{tabInfo.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* 4. Demonstration Persona Login Hub Modal (§15) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div>
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-bold text-white">
                    NIT Rourkela Demonstration Personas (§15)
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    8 Canonical Accounts
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  1-Click Instant Login for Hackathon Judges & Evaluators. No password or JWT blockage required.
                </p>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Personas Grid */}
            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
              {CANONICAL_PERSONAS.map((p) => {
                const isSelected = p.id === activePersona.id;

                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPersona(p)}
                    className={`cursor-pointer rounded-2xl p-4.5 border transition-all flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? "bg-slate-800/90 border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-950"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
                    }`}
                  >
                    <div>
                      {/* Top row */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-10 h-10 rounded-full ${p.avatarColor} flex items-center justify-center font-bold text-white text-sm shadow`}
                          >
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white flex items-center space-x-1.5">
                              <span>{p.name}</span>
                              {isSelected && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500 text-slate-950 font-black">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-emerald-400 font-medium">
                              {p.designation}
                            </div>
                          </div>
                        </div>

                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-bold border border-slate-700">
                          {p.role}
                        </span>
                      </div>

                      {/* Email & Scope */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 my-2">
                        <span className="flex items-center space-x-1">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <code className="text-slate-300">{p.email}</code>
                        </span>
                        {p.hostelCode && (
                          <span className="px-2 py-0.5 rounded bg-slate-800/80 text-teal-300 font-semibold border border-teal-500/30">
                            Scope: {p.hostelCode}
                          </span>
                        )}
                        {!p.hostelCode && (
                          <span className="px-2 py-0.5 rounded bg-slate-800/80 text-rose-300 font-semibold border border-rose-500/30">
                            Scope: Campus-Wide
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {p.description}
                      </p>
                    </div>

                    {/* Bottom action button */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">
                        {p.allowedTabs.length} Modules Allowed
                      </span>

                      <button
                        type="button"
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                          isSelected
                            ? "bg-emerald-500 text-slate-950"
                            : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Currently Logged In</span>
                          </>
                        ) : (
                          <>
                            <span>Log In As {p.name.split(" ")[0]}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/90 text-xs text-slate-400">
              <span>
                Simulates real-world role-based access control with zero server credentials needed.
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
