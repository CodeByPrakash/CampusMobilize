"use client";

import React, { useState } from "react";
import { usePersona, CANONICAL_PERSONAS } from "../context/PersonaContext";
import { Persona } from "../types";
import {
  Building2,
  ShieldCheck,
  Zap,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Lock,
  Mail,
  UserCheck,
  ChevronRight,
  Droplets,
  Flame,
  Radio,
  Award
} from "lucide-react";

export default function LandingLoginView() {
  const { login } = usePersona();
  const [activeLoginTab, setActiveLoginTab] = useState<"STUDENT" | "HOSTEL_REP" | "CARETAKER" | "WARDEN" | "ADMIN">("STUDENT");
  const [emailInput, setEmailInput] = useState<string>("aryan.student@nitrkl.ac.in");
  const [passwordInput, setPasswordInput] = useState<string>("••••••••••••");

  const filteredPersonas = CANONICAL_PERSONAS.filter((p) => {
    if (activeLoginTab === "STUDENT") return p.role === "STUDENT" || p.role === "CR";
    if (activeLoginTab === "HOSTEL_REP") return p.role === "HOSTEL_REP";
    if (activeLoginTab === "CARETAKER") return p.role === "CARETAKER";
    if (activeLoginTab === "WARDEN") return p.role === "WARDEN";
    if (activeLoginTab === "ADMIN") return p.role === "CHIEF_WARDEN" || p.role === "ESTATE_OFFICER" || p.role === "DIRECTOR";
    return true;
  });

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Match by email or fall back to first in tab
    const matched = CANONICAL_PERSONAS.find((p) => p.email.toLowerCase() === emailInput.toLowerCase()) || filteredPersonas[0];
    login(matched);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* 1. Public Header Bar (Screen 1) */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">CampusIQ</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                  NIT Rourkela
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Autonomous Facility Intelligence & Operations</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
            <a href="#hero" className="hover:text-blue-600 transition">Home</a>
            <a href="#features" className="hover:text-blue-600 transition">Features</a>
            <a href="#demo-login" className="hover:text-blue-600 transition">Role Portals</a>
            <a href="#about" className="hover:text-blue-600 transition">About</a>
          </nav>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium">
              <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>100% Offline Edge Mode</span>
            </div>

            <a
              href="#demo-login"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/30 transition flex items-center space-x-1.5"
            >
              <span>Sign In / Demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* 2. Hero Section (Screen 1 Mockup) */}
      <section id="hero" className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headline & CTA */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Next-Gen Autonomous Campus Infrastructure</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              A Smarter, Cleaner, Safer{" "}
              <span className="text-blue-600 underline decoration-blue-200 underline-offset-8">
                NIT Rourkela
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
              AI-powered campus operations for a better tomorrow. Real-time complaint dispatch, intelligent deduplication, 
              live SLA monitoring, and predictive utility surge planning across all halls of residence.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#demo-login"
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-600/30 transition flex items-center space-x-2"
              >
                <span>Get Started Now</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#features"
                className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-semibold shadow-sm transition"
              >
                Explore Features
              </a>
            </div>

            {/* Quick Metrics (Screen 1 Bottom Banner) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-200">
              <div>
                <div className="text-2xl font-black text-slate-900">5000+</div>
                <div className="text-xs text-slate-500 font-medium">Students</div>
              </div>
              <div>
                <div className="text-2xl font-black text-blue-600">20+</div>
                <div className="text-xs text-slate-500 font-medium">Hostel Blocks</div>
              </div>
              <div>
                <div className="text-2xl font-black text-emerald-600">Real-time</div>
                <div className="text-xs text-slate-500 font-medium">Issue Tracking</div>
              </div>
              <div>
                <div className="text-2xl font-black text-purple-600">AI</div>
                <div className="text-xs text-slate-500 font-medium">Predictive Ops</div>
              </div>
            </div>
          </div>

          {/* Right Column: Campus Banner Card */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xl shadow-slate-200/50 space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-tr from-blue-900 via-slate-800 to-indigo-900 aspect-[4/3] flex items-center justify-center p-6 text-white text-center">
                {/* Decorative overlay */}
                <div className="absolute inset-0 bg-blue-950/40 backdrop-blur-[2px]" />
                <div className="relative z-10 space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mx-auto flex items-center justify-center text-white">
                    <Building2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">NIT Rourkela Main Campus</h3>
                    <p className="text-xs text-blue-200 mt-1">Hostels: HB-3 • KMS • CVR • GDB</p>
                  </div>
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Campus Facility Network Online</span>
                  </div>
                </div>
              </div>

              {/* Live Ticker Box */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span className="flex items-center space-x-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Live Campus Health</span>
                  </span>
                  <span className="text-emerald-600 font-bold">94.8% Operational</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Water</span>
                    <span className="font-bold text-slate-800">Normal</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Power</span>
                    <span className="font-bold text-slate-800">Active</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">SLA Rate</span>
                    <span className="font-bold text-emerald-600">92%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Login / Signup & 1-Click Role Switcher Section (Screen 2 Mockup) */}
      <section id="demo-login" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full bg-white rounded-3xl border border-slate-200 my-8 shadow-sm">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Authentication & Role Gate
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900">
            Sign In to Your CampusIQ Dashboard
          </h2>
          <p className="text-sm text-slate-500">
            Select your role or click any of the 8 canonical demonstration personas to immediately experience tailored permissions and workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Classic Login Card (Screen 2) */}
          <div className="lg:col-span-5 bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-200 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Welcome Back</h3>
              <p className="text-xs text-slate-500 mt-0.5">Sign in to continue to CampusIQ NIT Rourkela</p>
            </div>

            {/* Role Category Tabs */}
            <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-semibold overflow-x-auto scrollbar-none">
              {(["STUDENT", "HOSTEL_REP", "CARETAKER", "WARDEN", "ADMIN"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveLoginTab(tab);
                    const p = CANONICAL_PERSONAS.find((item) => {
                      if (tab === "STUDENT") return item.role === "STUDENT";
                      if (tab === "HOSTEL_REP") return item.role === "HOSTEL_REP";
                      if (tab === "CARETAKER") return item.role === "CARETAKER";
                      if (tab === "WARDEN") return item.role === "WARDEN";
                      return item.role === "CHIEF_WARDEN";
                    });
                    if (p) setEmailInput(p.email);
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-center transition whitespace-nowrap ${
                    activeLoginTab === tab
                      ? "bg-white text-blue-600 font-bold shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab === "HOSTEL_REP" ? "Rep" : tab === "CARETAKER" ? "Staff" : tab.charAt(0) + tab.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Login Form */}
            <form onSubmit={handleCustomLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Institute Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                    placeholder="username@nitrkl.ac.in"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-slate-700">Password</label>
                  <span className="text-blue-600 hover:underline cursor-pointer">Forgot Password?</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition flex items-center justify-center space-x-2"
              >
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="text-center pt-2">
              <p className="text-xs text-slate-500">
                One Campus • Many Voices • Smarter Solutions
              </p>
            </div>
          </div>

          {/* Right: 1-Click Canonical Persona Portals (§15) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <span>Instant 1-Click Demo Portals (§15)</span>
              </h3>
              <span className="text-xs text-slate-500">Click any card to enter</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {CANONICAL_PERSONAS.map((p) => (
                <div
                  key={p.id}
                  onClick={() => login(p)}
                  className="cursor-pointer bg-white hover:bg-blue-50/40 p-4 rounded-2xl border border-slate-200 hover:border-blue-400 shadow-sm transition-all flex flex-col justify-between group space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-9 h-9 rounded-xl ${p.avatarColor} flex items-center justify-center font-bold text-white text-xs shadow-sm`}>
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition">
                            {p.name}
                          </h4>
                          <span className="text-[10px] text-slate-500">{p.designation}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
                        {p.role}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-mono truncate max-w-[140px]">{p.email}</span>
                    <span className="text-blue-600 font-bold flex items-center space-x-0.5 group-hover:translate-x-0.5 transition">
                      <span>Launch</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p>© 2026 CampusIQ NIT Rourkela Edition. 100% Offline Capable Autonomous Facility Intelligence.</p>
      </footer>
    </div>
  );
}
