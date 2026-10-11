"use client";

import React, { useState, useEffect } from "react";
import { usePersona } from "../../context/PersonaContext";
import {
  fetchCRI,
  fetchCampusHostelRatings,
  fetchForecasts,
  fetchRewards,
  approveReward,
  fetchEvents,
  fetchEventPrebrief
} from "../../lib/api";
import {
  Building2,
  Zap,
  Droplets,
  Award,
  AlertTriangle,
  TrendingUp,
  Download,
  Calendar,
  Sparkles,
  BarChart3,
  CheckCircle2,
  RefreshCw,
  Layers,
  Flame,
  ArrowUpRight
} from "lucide-react";

export default function AdminLeadershipDashboard() {
  const { activePersona, activeTab, setActiveTab } = usePersona();
  const [criData, setCriData] = useState<any>(null);
  const [hostelRatings, setHostelRatings] = useState<any[]>([]);
  const [utilityType, setUtilityType] = useState<"water" | "electricity" | "waste" | "mess">("water");
  const [isFestivalMode, setIsFestivalMode] = useState<boolean>(true);
  const [forecasts, setForecasts] = useState<any>(null);
  const [rewards, setRewards] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [prebrief, setPrebrief] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    try {
      try {
        const cri = await fetchCRI(activePersona);
        setCriData(cri);
      } catch (e) {
        console.warn(e);
      }

      try {
        const ratings = await fetchCampusHostelRatings(activePersona);
        setHostelRatings(ratings.hostels || []);
      } catch (e) {
        console.warn(e);
      }

      try {
        const rws = await fetchRewards(activePersona);
        setRewards(rws.rewards || []);
      } catch (e) {
        console.warn(e);
      }

      try {
        const evts = await fetchEvents(activePersona);
        setEvents(evts.events || []);
        if (evts.events && evts.events.length > 0) {
          const pb = await fetchEventPrebrief(evts.events[0].id, activePersona);
          setPrebrief(pb);
        }
      } catch (e) {
        console.warn(e);
      }

      try {
        const fc = await fetchForecasts("electricity", 3, activePersona);
        setForecasts(fc);
      } catch (e) {
        console.warn(e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activePersona]);

  const handleApproveReward = async (id: string) => {
    try {
      await approveReward(id, activePersona);
      alert("Reward approved successfully!");
      const rws = await fetchRewards(activePersona);
      setRewards(rws.rewards || []);
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  if (activeTab === "ai_prediction") {
    // Screen 9: AI Prediction & Resource Planning
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">AI Prediction & Resource Planning</h2>
            <p className="text-xs text-slate-500 mt-0.5">Smart predictions for efficient campus management and festival contingency.</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab("campus_overview")}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
            >
              ← Campus Overview
            </button>
            <a
              href="http://localhost:8000/api/v1/utilities/export-csv"
              download
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </a>
          </div>
        </div>

        {/* Prediction Category Tabs & Normal/Fest Toggle (Screen 9) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { key: "water", label: "Water Usage" },
              { key: "electricity", label: "Electricity Usage" },
              { key: "waste", label: "Waste Generation" },
              { key: "mess", label: "Mess Demand" }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setUtilityType(tab.key as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  utilityType === tab.key
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setIsFestivalMode(false)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                !isFestivalMode ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Normal Days
            </button>
            <button
              onClick={() => setIsFestivalMode(true)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                isFestivalMode ? "bg-rose-500 text-white shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Diwali / Innovision Fest</span>
            </button>
          </div>
        </div>

        {/* Interactive Usage Prediction Chart Card (Screen 9) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {utilityType === "water" ? "Water Usage Prediction (Hostel 14)" : "Electricity Demand Prediction (Campus)"}
              </h3>
              <p className="text-xs text-slate-400">Actual vs Predicted with 90% confidence surge boundaries</p>
            </div>

            <div className="flex items-center space-x-4 text-xs font-semibold">
              <span className="flex items-center space-x-1 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span>Actual Usage</span>
              </span>
              <span className="flex items-center space-x-1 text-blue-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span>Predicted Usage</span>
              </span>
              <span className="flex items-center space-x-1 text-rose-600">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Festival Surge (+40%)</span>
              </span>
            </div>
          </div>

          {/* Visual Prediction Graph Simulation (Screen 9) */}
          <div className="relative h-52 bg-slate-50 rounded-2xl p-4 flex items-end justify-between gap-4 border border-slate-200/80">
            {isFestivalMode && (
              <div className="absolute top-4 right-10 bg-rose-100 border border-rose-300 text-rose-800 text-xs px-3 py-1 rounded-xl font-bold flex items-center space-x-1">
                <span>Diwali Fest Surge: +40% Expected Increase</span>
              </div>
            )}

            {[
              { date: "Oct 10", actual: 40, pred: 42, fest: 42 },
              { date: "Oct 12", actual: 45, pred: 44, fest: 44 },
              { date: "Oct 14", actual: 43, pred: 46, fest: 46 },
              { date: "Oct 16", actual: 50, pred: 52, fest: 68 },
              { date: "Oct 18", actual: null, pred: 55, fest: 88 },
              { date: "Oct 20", actual: null, pred: 53, fest: 92 },
              { date: "Oct 22", actual: null, pred: 50, fest: 75 }
            ].map((pt, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="w-full flex items-end justify-center gap-1.5 h-36">
                  {pt.actual !== null && (
                    <div className="w-3 rounded-t bg-slate-400" style={{ height: `${pt.actual}%` }} title={`Actual: ${pt.actual} kL`} />
                  )}
                  <div className="w-3 rounded-t bg-blue-600" style={{ height: `${pt.pred}%` }} title={`Predicted: ${pt.pred} kL`} />
                  {isFestivalMode && (
                    <div className="w-3 rounded-t bg-rose-500 animate-pulse" style={{ height: `${pt.fest}%` }} title={`Festival Peak: ${pt.fest} kL`} />
                  )}
                </div>
                <span className="text-[10px] text-slate-500 font-semibold">{pt.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Previous Bills Data Table + Prediction Summary (Screen 9) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Previous Bills Data Table (Screen 9) */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Previous Bills Data</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Month</th>
                    <th className="p-3">Water (kL)</th>
                    <th className="p-3">Electricity (kWh)</th>
                    <th className="p-3">Cost (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { month: "Jul 2024", water: "12,400", power: "45,000", cost: "2,65,000" },
                    { month: "Aug 2024", water: "11,800", power: "43,200", cost: "2,70,000" },
                    { month: "Sep 2024", water: "13,200", power: "47,100", cost: "3,05,000" },
                    { month: "Oct 2024", water: "15,600", power: "52,300", cost: "3,40,000" }
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-bold text-slate-900">{row.month}</td>
                      <td className="p-3 text-slate-600">{row.water}</td>
                      <td className="p-3 text-slate-600">{row.power}</td>
                      <td className="p-3 font-semibold text-emerald-600">₹{row.cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Prediction Summary Card (Screen 9) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900">Prediction Summary</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900">
                <strong>+40% increase in water usage</strong> expected during Diwali & Innovision fest slots.
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                <strong>Extra power backup required</strong> from Oct 18 - Oct 22 to maintain continuous hostel power.
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                <strong>Increase mess food preparation by 30%</strong> due to extra campus guest footfall.
              </div>

              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900">
                <strong>Deploy additional cleaning staff</strong> at HB-3 and KMS common washrooms.
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Contingency Budget:</span>
                <span className="text-base font-extrabold text-slate-900">₹42,500</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT: Screen 8 (NIT Rourkela - Campus Overview)
  return (
    <div className="space-y-6">
      {/* 1. Header (Screen 8) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900">NIT Rourkela - Campus Overview</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
              NIT Admin
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">AI-powered insights for a smarter, cleaner campus.</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab("ai_prediction")}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>AI Resource Planning →</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Top Stats Row (Screen 8 Mockup) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">124</span>
            <span className="text-[11px] font-bold text-rose-600">↑ 12%</span>
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">Total Complaints</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-600">18</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 font-bold">URGENT</span>
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">High-Risk Issues</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600">87%</span>
            <span className="text-[11px] font-bold text-emerald-600">↑ 5%</span>
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">Resolution Rate</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-purple-600">2.4</span>
            <span className="text-xs text-slate-400 font-bold">days</span>
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">Avg. Resolution Time</div>
        </div>
      </div>

      {/* 3. Middle Row: Campus Infrastructure Status + AI Risk Heatmap (Screen 8) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Campus Infrastructure Status (Screen 8) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Campus Infrastructure Status</h3>
            <span className="text-xs text-emerald-600 font-bold">Live Monitoring</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center space-y-1">
              <div className="text-[11px] text-slate-500 font-medium">Electricity</div>
              <div className="text-xl font-black text-slate-900">88%</div>
              <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                Good
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center space-y-1">
              <div className="text-[11px] text-slate-500 font-medium">Water Supply</div>
              <div className="text-xl font-black text-amber-600">76%</div>
              <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                Warning
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center space-y-1">
              <div className="text-[11px] text-slate-500 font-medium">Hygiene</div>
              <div className="text-xl font-black text-slate-900">82%</div>
              <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                Good
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center space-y-1">
              <div className="text-[11px] text-slate-500 font-medium">Waste Mgmt</div>
              <div className="text-xl font-black text-slate-900">80%</div>
              <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                Active
              </span>
            </div>
          </div>

          {/* Inter-Hostel Efficiency Rating Table */}
          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-800 mb-2">Inter-Hostel Efficiency Ratings (ER §11.3)</h4>
            <div className="divide-y divide-slate-100 text-xs">
              {[
                { name: "Hostel 14 (HB-3)", er: 91.2, rank: 1, open: 4, res: "89%" },
                { name: "KMS Hall", er: 86.4, rank: 2, open: 6, res: "84%" },
                { name: "CVR Hall", er: 83.1, rank: 3, open: 5, res: "81%" },
                { name: "GDB Hall", er: 80.5, rank: 4, open: 3, res: "78%" }
              ].map((h) => (
                <div key={h.name} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-600">
                      #{h.rank}
                    </span>
                    <span className="font-bold text-slate-900">{h.name}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-slate-500">Res: {h.res}</span>
                    <span className="font-bold text-emerald-600">{h.er} ER</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: AI Risk Heatmap (Screen 8) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">AI Risk Heatmap (Campus)</h3>
            <span className="text-xs text-rose-600 font-bold flex items-center space-x-1">
              <Flame className="w-3.5 h-3.5" />
              <span>CRI: 20/100</span>
            </span>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">HB-3 Hall (Hostel 14)</span>
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px]">
                High Risk (Water)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">KMS Hall</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold text-[10px]">
                Medium (Mess)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">CVR Hall</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                Low Risk
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">GDB Hall</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                Low Risk
              </span>
            </div>
          </div>

          {/* AI Recommendations Box (Screen 8) */}
          <div className="space-y-2">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-900">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>AI Recommendations</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 leading-snug">
                1. Inspect water pipeline system in Hostel 14 (High risk of overflow).
              </div>
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 leading-snug">
                2. Increase cleaning frequency before first week of upcoming semester exams.
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 leading-snug">
                3. Allocate extra power backup during Diwali / Innovision fest.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Table: Recent High Priority Issues (Screen 8) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Recent High Priority Issues</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Ticket ID</th>
                <th className="p-3">Issue</th>
                <th className="p-3">Location</th>
                <th className="p-3">Risk Score</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { id: "CIQ-2026-00024", issue: "Water leakage", loc: "Hostel 14 • B-208", risk: "0.92 (High)", status: "Open", color: "rose" },
                { id: "CIQ-2026-00021", issue: "Electrical hazard", loc: "Academic Block", risk: "0.87 (High)", status: "In Progress", color: "amber" },
                { id: "CIQ-2026-00019", issue: "Mess food quality", loc: "Hostel 14 • Mess", risk: "0.78 (Med)", status: "Open", color: "rose" },
                { id: "CIQ-2026-00016", issue: "Garbage overflow", loc: "Hostel 12", risk: "0.71 (Med)", status: "In Progress", color: "amber" }
              ].map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-mono font-bold text-blue-600">{row.id}</td>
                  <td className="p-3 font-bold text-slate-900">{row.issue}</td>
                  <td className="p-3 text-slate-600">{row.loc}</td>
                  <td className="p-3 font-semibold text-rose-600">{row.risk}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        row.status === "Open" ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
