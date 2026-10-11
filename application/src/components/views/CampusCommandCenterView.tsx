"use client";

import React, { useState, useEffect } from "react";
import { usePersona } from "../../context/PersonaContext";
import {
  fetchCRI,
  fetchCampusHostelRatings,
  fetchEvents,
  fetchEventPrebrief,
  fetchForecasts,
  fetchRewards,
  approveReward,
  triggerSlaTick
} from "../../lib/api";
import {
  CampusRiskIndexData,
  HostelEfficiencyScore,
  CampusEventData
} from "../../types";
import {
  Flame,
  Building2,
  Calendar,
  Zap,
  Award,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Download,
  Sparkles,
  BarChart3,
  Droplets,
  DollarSign,
  ShieldAlert,
  ArrowUpRight,
  Clock
} from "lucide-react";

export default function CampusCommandCenterView() {
  const { activePersona } = usePersona();
  const [criData, setCriData] = useState<CampusRiskIndexData | null>(null);
  const [hostelRatings, setHostelRatings] = useState<HostelEfficiencyScore[]>([]);
  const [events, setEvents] = useState<CampusEventData[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [prebriefResult, setPrebriefResult] = useState<any>(null);
  const [utilityType, setUtilityType] = useState<"electricity" | "water">("electricity");
  const [forecasts, setForecasts] = useState<any>(null);
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [prebriefLoading, setPrebriefLoading] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<
    "overview" | "rankings" | "festivals" | "utilities" | "rewards"
  >("overview");

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch CRI
      try {
        const cri = await fetchCRI(activePersona);
        setCriData(cri);
      } catch (e) {
        console.warn("CRI fetch error:", e);
      }

      // 2. Fetch Hostel Ratings
      try {
        const ratings = await fetchCampusHostelRatings(activePersona);
        setHostelRatings(ratings.hostels || []);
      } catch (e) {
        console.warn("Ratings fetch error:", e);
      }

      // 3. Fetch Events
      try {
        const evts = await fetchEvents(activePersona);
        setEvents(evts.events || []);
        if (evts.events && evts.events.length > 0) {
          setSelectedEventId(evts.events[0].id);
        }
      } catch (e) {
        console.warn("Events fetch error:", e);
      }

      // 4. Fetch Forecasts
      try {
        const fc = await fetchForecasts(utilityType, 3, activePersona);
        setForecasts(fc);
      } catch (e) {
        console.warn("Forecasts fetch error:", e);
      }

      // 5. Fetch Rewards
      try {
        const rws = await fetchRewards(activePersona);
        setRewards(rws.rewards || []);
      } catch (e) {
        console.warn("Rewards fetch error:", e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activePersona]);

  useEffect(() => {
    // Reload forecast on utility change
    fetchForecasts(utilityType, 3, activePersona)
      .then((fc) => setForecasts(fc))
      .catch((e) => console.warn(e));
  }, [utilityType]);

  const handleGeneratePrebrief = async () => {
    if (!selectedEventId) return;
    setPrebriefLoading(true);
    try {
      const res = await fetchEventPrebrief(selectedEventId, activePersona);
      setPrebriefResult(res);
    } catch (err: any) {
      alert("Failed to generate prebrief: " + err.message);
    } finally {
      setPrebriefLoading(false);
    }
  };

  const handleApproveReward = async (rewardId: string) => {
    try {
      await approveReward(rewardId, activePersona);
      alert("Reward approved successfully!");
      const rws = await fetchRewards(activePersona);
      setRewards(rws.rewards || []);
    } catch (err: any) {
      alert("Failed to approve reward: " + err.message);
    }
  };

  const getCriColor = (cri: number) => {
    if (cri < 25) return { text: "text-emerald-400", bg: "bg-emerald-500", border: "border-emerald-500/40", label: "LOW RISK" };
    if (cri < 50) return { text: "text-blue-400", bg: "bg-blue-500", border: "border-blue-500/40", label: "MODERATE" };
    if (cri < 75) return { text: "text-amber-400", bg: "bg-amber-500", border: "border-amber-500/40", label: "ELEVATED" };
    if (cri < 90) return { text: "text-orange-400", bg: "bg-orange-500", border: "border-orange-500/40", label: "HIGH RISK" };
    return { text: "text-rose-400", bg: "bg-rose-500", border: "border-rose-500/40", label: "CRITICAL ALERT" };
  };

  const criInfo = getCriColor(criData?.campus_risk_index || 18);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Flame className="w-6 h-6 text-rose-500" />
            <span>Campus Executive Command Center</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
              All 4 NIT Rourkela Halls
            </span>
          </h2>
          <p className="text-sm text-slate-400">
            Real-time Campus Risk Index (CRI), Inter-Hostel Efficiency Rating, Festival Utility Pre-Briefs & Rewards.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href="http://localhost:8000/api/v1/utilities/export-csv"
            download
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </a>

          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Section Sub-Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        {[
          { key: "overview", label: "Campus Risk Index (CRI)", icon: <Flame className="w-4 h-4" /> },
          { key: "rankings", label: "Hostel Efficiency Rankings", icon: <Building2 className="w-4 h-4" /> },
          { key: "festivals", label: "Festival Surge Pre-Brief", icon: <Calendar className="w-4 h-4" /> },
          { key: "utilities", label: "Quantile Utility Forecast", icon: <Zap className="w-4 h-4" /> },
          { key: "rewards", label: "Rewards Ledger", icon: <Award className="w-4 h-4" /> }
        ].map((sec) => (
          <button
            key={sec.key}
            onClick={() => setActiveSection(sec.key as any)}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeSection === sec.key
                ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            {sec.icon}
            <span>{sec.label}</span>
          </button>
        ))}
      </div>

      {/* Section 1: Overview & Campus Risk Index */}
      {activeSection === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* CRI Gauge Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-between text-center relative overflow-hidden">
              <div className="w-full flex justify-between items-center text-xs text-slate-400 mb-2">
                <span className="font-bold uppercase tracking-wider text-slate-300">
                  Campus Risk Score
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${criInfo.border} ${criInfo.text}`}>
                  {criInfo.label}
                </span>
              </div>

              {/* Visual Meter */}
              <div className="relative my-6 flex items-center justify-center">
                <div className="w-44 h-44 rounded-full border-8 border-slate-800 flex items-center justify-center relative shadow-inner">
                  <div className="flex flex-col items-center">
                    <span className={`text-5xl font-black ${criInfo.text}`}>
                      {criData?.campus_risk_index ?? 18}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 uppercase mt-1">
                      out of 100
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400 max-w-xs">
                Composite campus risk index based on P1 ratios, 30-day SLA breaches, utility anomalies, and hygiene complaints.
              </p>
            </div>

            {/* CRI 4-Component Breakdown (§10.3) */}
            <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-5">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  <span>Weighted CRI Parameter Breakdown (§10.3)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automated metric weights preventing campus facility outages and cascading failures.
                </p>
              </div>

              <div className="space-y-4">
                {/* 1. Open P1/P2 (35%) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-semibold">
                      1. Open P1 / P2 Ratio (35% Weight)
                    </span>
                    <span className="font-bold text-emerald-400">
                      {Math.round((criData?.components?.open_p1_p2_ratio ?? 0.15) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.min(100, (criData?.components?.open_p1_p2_ratio ?? 0.15) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* 2. SLA Breach Rate (25%) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-semibold">
                      2. 30-Day SLA Breach Rate (25% Weight)
                    </span>
                    <span className="font-bold text-blue-400">
                      {Math.round((criData?.components?.sla_breach_rate_30d ?? 0.10) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${Math.min(100, (criData?.components?.sla_breach_rate_30d ?? 0.10) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* 3. Utility Anomaly (20%) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-semibold">
                      3. Utility Anomaly Z-Score (20% Weight)
                    </span>
                    <span className="font-bold text-amber-400">
                      {Math.round((criData?.components?.utility_anomaly_norm ?? 0.12) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${Math.min(100, (criData?.components?.utility_anomaly_norm ?? 0.12) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* 4. Hygiene Trend (20%) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-semibold">
                      4. Hygiene & Sanitation Trend (20% Weight)
                    </span>
                    <span className="font-bold text-teal-400">
                      {Math.round((criData?.components?.hygiene_trend_norm ?? 0.08) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full"
                      style={{ width: `${Math.min(100, (criData?.components?.hygiene_trend_norm ?? 0.08) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Active Ticket Counts */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-800">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <div className="text-lg font-bold text-white">
                    {criData?.total_active_tickets ?? 4}
                  </div>
                  <div className="text-[10px] text-slate-400">Active Tickets</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <div className="text-lg font-bold text-rose-400">
                    {criData?.open_high_risk_tickets ?? 1}
                  </div>
                  <div className="text-[10px] text-slate-400">Open High Risk</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <div className="text-lg font-bold text-amber-400">
                    {criData?.escalated_tickets ?? 0}
                  </div>
                  <div className="text-[10px] text-slate-400">Escalated Tickets</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Hostel Efficiency Rankings (§11.3) */}
      {activeSection === "rankings" && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-indigo-400" />
              <span>Inter-Hostel Efficiency Rating (ER §11.3)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Dignified rankings across HB-3, KMS, CVR, and GDB halls to encourage healthy institutional collaboration.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Campus Rank</th>
                  <th className="p-3.5">Hostel Name</th>
                  <th className="p-3.5">Efficiency Rating</th>
                  <th className="p-3.5">Resolution %</th>
                  <th className="p-3.5">Open Issues</th>
                  <th className="p-3.5">Energy / Resident</th>
                  <th className="p-3.5">Water / Resident</th>
                  <th className="p-3.5">Hygiene Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {hostelRatings.map((h) => (
                  <tr key={h.hostel_id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-bold">
                      <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-mono text-emerald-400">
                        #{h.campus_rank}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-white">{h.hostel_name}</div>
                      <div className="text-[10px] text-slate-400">{h.hostel_code}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-sm text-emerald-400">
                        {h.efficiency_rating.toFixed(1)}
                      </span>
                      <span className="text-[10px] text-slate-500"> / 100</span>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-200">
                      {Math.round(h.resolution_rate_pct)}%
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                        {h.open_complaints}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-300">
                      {h.per_resident_energy_index.toFixed(1)} kWh
                    </td>
                    <td className="p-3.5 text-slate-300">
                      {h.per_resident_water_index.toFixed(1)} L
                    </td>
                    <td className="p-3.5 font-semibold text-teal-400">
                      {h.hygiene_audit_score} / 100
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section 3: Festival Surge Pre-Brief Generator (§10.2) */}
      {activeSection === "festivals" && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <span>Festival Surge & Mega-Event Pre-Brief Generator (§10.2)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Predictive preparation for Innovision, ISM, and cultural festivals with surge multipliers and contingency budgets.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name} ({ev.kind})
                  </option>
                ))}
              </select>

              <button
                onClick={handleGeneratePrebrief}
                disabled={prebriefLoading || !selectedEventId}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-md shadow-amber-950 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{prebriefLoading ? "Simulating..." : "Generate Pre-Brief"}</span>
              </button>
            </div>
          </div>

          {prebriefResult ? (
            <div className="space-y-6 border-t border-slate-800 pt-6">
              {/* Event Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="text-xs text-slate-400">Expected Footfall</div>
                  <div className="text-xl font-bold text-white mt-1">
                    +{prebriefResult.footfall_surge || 3500} visitors
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="text-xs text-slate-400">Water Demand Multiplier</div>
                  <div className="text-xl font-bold text-teal-400 mt-1">
                    {prebriefResult.predicted_surges?.water || "1.45x"}
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="text-xs text-slate-400">Electricity Demand Multiplier</div>
                  <div className="text-xl font-bold text-amber-400 mt-1">
                    {prebriefResult.predicted_surges?.electricity || "1.30x"}
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="text-xs text-slate-400">Est. Contingency Budget</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">
                    ₹{prebriefResult.budget_inr ? prebriefResult.budget_inr.toLocaleString() : "42,500"}
                  </div>
                </div>
              </div>

              {/* Critical Hostels & Recommendations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Critical Hostels Identified</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(prebriefResult.critical_hostels || ["HB-3", "KMS"]).map((h: string) => (
                      <span
                        key={h}
                        className="px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold"
                      >
                        {h} Hall of Residence
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 pt-2">
                    These hostels are projected to face high visitor density and peak bathroom / mess load during the event.
                  </p>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Proactive Preparation Recommendations</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {(
                      prebriefResult.recommendations || [
                        "Pre-fill overhead water storage reservoirs 12h prior to festival opening.",
                        "Inspect diesel backup generator in HB-3 and KMS.",
                        "Station plumbing caretaker on standby during evening concert slots.",
                        "Procure extra sanitation kits and emergency water tanker delivery."
                      ]
                    ).map((rec: string, i: number) => (
                      <li key={i} className="flex items-start space-x-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400">
              Select an upcoming event above and click &ldquo;Generate Pre-Brief&rdquo; to simulate festival readiness.
            </div>
          )}
        </div>
      )}

      {/* Section 4: Predictive Utility Forecaster (§10.1) */}
      {activeSection === "utilities" && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                <span>Offline Quantile Utility Forecaster (§10.1)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                3-Month lookahead with p10 (conservative), p50 (median), and p90 (surge peak) predictions.
              </p>
            </div>

            <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setUtilityType("electricity")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  utilityType === "electricity"
                    ? "bg-amber-500 text-slate-950 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Electricity</span>
              </button>
              <button
                onClick={() => setUtilityType("water")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  utilityType === "water"
                    ? "bg-teal-500 text-slate-950 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Droplets className="w-3.5 h-3.5" />
                <span>Water</span>
              </button>
            </div>
          </div>

          {forecasts?.forecasts ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {forecasts.forecasts.map((fc: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      {fc.month_label || `Month +${idx + 1}`}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      {utilityType.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-400">p50 Expected (Median):</span>
                      <span className="text-xl font-bold text-white">
                        {Math.round(fc.p50_units).toLocaleString()}{" "}
                        <span className="text-xs font-normal text-slate-400">
                          {utilityType === "electricity" ? "kWh" : "kL"}
                        </span>
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline text-xs">
                      <span className="text-slate-500">p10 Lower Bound:</span>
                      <span className="text-slate-300 font-medium">
                        {Math.round(fc.p10_units).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline text-xs">
                      <span className="text-slate-500">p90 Peak Surge:</span>
                      <span className="text-amber-400 font-bold">
                        {Math.round(fc.p90_units).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Budget Estimate:</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      ₹{Math.round(fc.projected_cost_inr || fc.p50_units * 7.5).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
              Loading quantile projections...
            </div>
          )}
        </div>
      )}

      {/* Section 5: Rewards Ledger (§11.2) */}
      {activeSection === "rewards" && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span>Caretaker Rewards Ledger & Incentive Grants (§11.2)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Transparent, tamper-proof rewards ledger based on caretaker SLA compliance and zero-rework milestones.
            </p>
          </div>

          <div className="space-y-3">
            {rewards.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                No active rewards in the ledger.
              </div>
            ) : (
              rewards.map((rw) => (
                <div
                  key={rw.id}
                  className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white">
                        {rw.caretaker_name || rw.caretaker_id}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold">
                        {rw.milestone_kind}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {rw.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{rw.description}</p>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <div className="text-right">
                      <div className="text-base font-bold text-emerald-400">
                        ₹{rw.amount_inr}
                      </div>
                      <div className="text-[10px] text-slate-500">Incentive Grant</div>
                    </div>

                    {rw.status === "PENDING" && (
                      <button
                        onClick={() => handleApproveReward(rw.id)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition shadow-md shadow-emerald-950"
                      >
                        Approve Grant
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
