"use client";

import React, { useState } from "react";
import { usePersona, CANONICAL_PERSONAS } from "../context/PersonaContext";
import {
  Building2,
  LayoutDashboard,
  Layers,
  PlusCircle,
  Award,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Zap,
  Search,
  Bell,
  Radio,
  LogOut,
  ChevronDown,
  UserCheck,
  AlertTriangle,
  FileText,
  X,
  Sparkles
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { activePersona, activeTab, setActiveTab, logout, setPersona } = usePersona();
  const [showRoleSwitcher, setShowRoleSwitcher] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const getSidebarNavItems = () => {
    switch (activePersona.role) {
      case "STUDENT":
      case "CR":
        return [
          { key: "overview", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
          { key: "my_complaints", label: "My Complaints", icon: <Layers className="w-4 h-4" /> },
          { key: "lodge_complaint", label: "New Complaint", icon: <PlusCircle className="w-4 h-4" /> },
          { key: "rewards", label: "Rewards & Badges", icon: <Award className="w-4 h-4" /> },
          { key: "analytics", label: "Campus Live Status", icon: <BarChart3 className="w-4 h-4" /> },
        ];
      case "HOSTEL_REP":
        return [
          { key: "rep_dashboard", label: "Rep Triage Board", icon: <LayoutDashboard className="w-4 h-4" /> },
          { key: "triage", label: "Pending Verification", icon: <ShieldCheck className="w-4 h-4" /> },
          { key: "my_complaints", label: "Hostel Issues", icon: <Layers className="w-4 h-4" /> },
          { key: "lodge_complaint", label: "Raise Issue", icon: <PlusCircle className="w-4 h-4" /> },
        ];
      case "CARETAKER":
        return [
          { key: "caretaker_kanban", label: "Operations Kanban", icon: <Clock className="w-4 h-4" /> },
          { key: "scorecard", label: "My Scorecard", icon: <Award className="w-4 h-4" /> },
        ];
      case "WARDEN":
        return [
          { key: "warden_dashboard", label: "Warden Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
          { key: "approvals", label: "Resolution Approvals", icon: <CheckCircle2 className="w-4 h-4" /> },
          { key: "hostel_analytics", label: "Hostel Analytics", icon: <BarChart3 className="w-4 h-4" /> },
        ];
      default: // CHIEF_WARDEN, ESTATE_OFFICER, DIRECTOR
        return [
          { key: "campus_overview", label: "Campus Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
          { key: "ai_prediction", label: "AI Resource Planning", icon: <Zap className="w-4 h-4" /> },
          { key: "approvals", label: "Executive Approvals", icon: <CheckCircle2 className="w-4 h-4" /> },
          { key: "rewards_admin", label: "Rewards Ledger", icon: <Award className="w-4 h-4" /> },
          { key: "reports", label: "Executive Reports", icon: <FileText className="w-4 h-4" /> },
        ];
    }
  };

  const navItems = getSidebarNavItems();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* 1. Left Vertical Sidebar (Screens 3, 5, 6, 7, 8) */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 hidden md:flex sticky top-0 h-screen z-30">
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-100 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-base text-slate-900 tracking-tight">CampusIQ</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  NIT-R
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium">{activePersona.role} Portal</div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="p-4 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Navigation
            </div>
            {navItems.map((item) => {
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-blue-50 text-blue-600 font-bold shadow-xs border border-blue-100"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <span className={isActive ? "text-blue-600" : "text-slate-400"}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer: User Card & Switch Role Button */}
        <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/50">
          <div className="flex items-center space-x-2.5 p-2 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <div className={`w-8 h-8 rounded-lg ${activePersona.avatarColor} flex items-center justify-center font-bold text-white text-xs shadow-xs`}>
              {activePersona.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate">{activePersona.name}</div>
              <div className="text-[10px] text-slate-500 truncate">{activePersona.designation}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowRoleSwitcher(true)}
              className="w-full py-1.5 px-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold transition flex items-center justify-center space-x-1"
            >
              <UserCheck className="w-3 h-3 text-blue-600" />
              <span>Switch</span>
            </button>
            <button
              onClick={logout}
              className="w-full py-1.5 px-2 rounded-lg bg-white hover:bg-rose-50 border border-slate-200 text-rose-600 text-[11px] font-bold transition flex items-center justify-center space-x-1"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Area + Top Navigation Bar */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 sm:px-8 py-3 flex items-center justify-between gap-4">
          {/* Left: Mobile Title / Breadcrumb */}
          <div className="flex items-center space-x-3">
            <div className="md:hidden flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-slate-900 text-sm">CampusIQ</span>
            </div>

            <div className="hidden sm:flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-400">NIT Rourkela</span>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-bold text-slate-800">
                {activePersona.hostelCode || "Central Campus Administration"}
              </span>
            </div>
          </div>

          {/* Center: Search Bar (Screens 3, 5, 6, 7) */}
          <div className="flex-1 max-w-md relative hidden sm:block">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search anything... (tickets, room, category, status)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 transition"
            />
          </div>

          {/* Right: Offline status, Notifications, Profile pill */}
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium">
              <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
              <span>100% Offline Active</span>
            </div>

            {/* Notifications Alert Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition border border-slate-200 bg-white"
                title="View Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
              </button>

              {/* Notification Popover (Screen 10 Mail/Notification mockup) */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span>CampusIQ Alerts & SLA Notifications</span>
                    </span>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Sample Alert Card (Screen 10 mockup) */}
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-rose-800">
                      <span>High Risk Issue Detected</span>
                      <span className="text-[10px] text-rose-600">Just now</span>
                    </div>
                    <p className="text-xs text-rose-900 leading-snug">
                      Continuous water leakage reported in B Block, room 208. AI classified WATER with 0.94 confidence.
                    </p>
                    <div className="text-[11px] text-rose-700 font-medium pt-1">
                      Priority: P1 • SLA: 2 Hours • Escalation: Warden Notified
                    </div>
                  </div>

                  <div className="text-center pt-1">
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-[11px] text-blue-600 hover:underline font-semibold"
                    >
                      Mark all as read
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Pill & Role switch */}
            <button
              onClick={() => setShowRoleSwitcher(true)}
              className="flex items-center space-x-2 pl-2 pr-3 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition"
            >
              <div className={`w-7 h-7 rounded-lg ${activePersona.avatarColor} flex items-center justify-center font-bold text-white text-xs`}>
                {activePersona.name.charAt(0)}
              </div>
              <span className="text-xs font-bold text-slate-800 hidden sm:inline">
                {activePersona.name.split(" ")[0]}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* 3. Role Switcher Modal Dialog */}
      {showRoleSwitcher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                  <span>Switch Demonstration Role (§15)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Instantaneous switch between Student, Rep, Caretaker, Warden, and Admin dashboards.
                </p>
              </div>
              <button
                onClick={() => setShowRoleSwitcher(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {CANONICAL_PERSONAS.map((p) => {
                const isCurrent = p.id === activePersona.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setPersona(p);
                      setShowRoleSwitcher(false);
                    }}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-2 ${
                      isCurrent
                        ? "bg-blue-50/60 border-blue-500 shadow-sm ring-1 ring-blue-500/30"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-9 h-9 rounded-xl ${p.avatarColor} flex items-center justify-center font-bold text-white text-xs`}>
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                          <span>{p.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-600 text-white font-bold">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">{p.designation}</div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{p.description}</p>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="font-mono text-slate-400">{p.role}</span>
                      <span className="text-blue-600 font-bold">Select Role →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
