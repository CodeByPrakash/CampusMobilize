"use client";

import React, { useState, useEffect } from "react";
import { usePersona } from "../../context/PersonaContext";
import {
  fetchComplaints,
  transitionComplaint,
  triggerSlaTick,
  fetchCaretakerPerformance
} from "../../lib/api";
import { Complaint, CaretakerPerformanceScore } from "../../types";
import {
  Clock,
  Play,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Camera,
  MapPin,
  Tag,
  Award,
  Flame,
  X,
  Filter,
  Check
} from "lucide-react";

export default function CaretakerDashboard() {
  const { activePersona, activeTab, setActiveTab } = usePersona();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [caretakerScore, setCaretakerScore] = useState<CaretakerPerformanceScore | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [tradeFilter, setTradeFilter] = useState<string>("ALL");

  // Resolution modal state
  const [resolveTicket, setResolveTicket] = useState<Complaint | null>(null);
  const [resolutionNote, setResolutionNote] = useState<string>("");
  const [resolutionPhoto, setResolutionPhoto] = useState<string>("/photos/resolved_repaired_switchboard.jpg");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchComplaints(activePersona, {
        hostel_code: "HB-3"
      });
      setComplaints(data.items || []);

      try {
        const perf = await fetchCaretakerPerformance("HB-3", activePersona);
        if (perf.scores && perf.scores.length > 0) {
          setCaretakerScore(perf.scores[0]);
        }
      } catch (e) {
        console.warn("Could not load caretaker performance:", e);
      }
    } catch (e) {
      console.warn("Could not load caretaker complaints:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activePersona]);

  const handleStartWork = async (ticket: Complaint) => {
    setProcessingId(ticket.id);
    try {
      await transitionComplaint(
        ticket.id,
        {
          to_status: "IN_PROGRESS",
          note: `Work initiated by ${activePersona.name} (${activePersona.designation})`
        },
        activePersona
      );
      await loadData();
    } catch (err: any) {
      alert("Error starting work: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleResolveSubmit = async () => {
    if (!resolveTicket) return;
    if (!resolutionNote.trim()) {
      alert("Please provide completion notes describing work done.");
      return;
    }

    setProcessingId(resolveTicket.id);
    try {
      await transitionComplaint(
        resolveTicket.id,
        {
          to_status: "RESOLVED",
          note: resolutionNote.trim(),
          photo_url: resolutionPhoto
        },
        activePersona
      );
      setResolveTicket(null);
      setResolutionNote("");
      await loadData();
    } catch (err: any) {
      alert("Error submitting resolution: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // Filter complaints
  const filtered = complaints.filter(
    (c) => tradeFilter === "ALL" || c.category_code === tradeFilter
  );

  const assignedCol = filtered.filter((c) => c.status === "ASSIGNED" || c.status === "VERIFIED");
  const inProgressCol = filtered.filter((c) => c.status === "IN_PROGRESS");
  const resolvedCol = filtered.filter((c) => c.status === "RESOLVED");
  const escalatedCol = filtered.filter((c) => c.status === "ESCALATED" || ((c.risk_score || 0) >= 75 && c.status !== "CLOSED" && c.status !== "RESOLVED"));

  if (activeTab === "scorecard") {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Caretaker Performance Scorecard (§11.1)</h2>
            <p className="text-xs text-slate-500 mt-0.5">Objective, non-gamified institutional performance evaluation.</p>
          </div>
          <button
            onClick={() => setActiveTab("caretaker_kanban")}
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            ← Back to Operations Kanban
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-2xl font-black text-blue-600">
              {caretakerScore ? caretakerScore.performance_index.toFixed(1) : "88.5"} / 100
            </div>
            <div className="text-xs text-slate-500 font-medium">Performance Index (PI)</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-2xl font-black text-emerald-600">
              {caretakerScore ? Math.round(caretakerScore.sla_compliance_pct) : 94}%
            </div>
            <div className="text-xs text-slate-500 font-medium">SLA Compliance Rate</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-2xl font-black text-purple-600">
              {caretakerScore ? Math.round(caretakerScore.first_time_resolution_pct) : 90}%
            </div>
            <div className="text-xs text-slate-500 font-medium">First-Time Resolution</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-2xl font-black text-amber-600">
              {caretakerScore ? Math.round(caretakerScore.rework_rate_pct) : 2.5}%
            </div>
            <div className="text-xs text-slate-500 font-medium">Rework Rate</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900">Caretaker Operations Kanban</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
              HB-3 • Electrical & Plumbing
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational task board with SLA countdown rings, priority ranks, and photo verification.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab("scorecard")}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition"
          >
            <Award className="w-3.5 h-3.5" />
            <span>My Scorecard</span>
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

      {/* 2. Trade Filters */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center mr-1">
          <Filter className="w-3.5 h-3.5 mr-1" />
          Trade:
        </span>
        {["ALL", "ELECTRICAL", "WATER", "CIVIL", "HYGIENE"].map((cat) => (
          <button
            key={cat}
            onClick={() => setTradeFilter(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              tradeFilter === cat
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {cat === "WATER" ? "PLUMBING" : cat}
          </button>
        ))}
      </div>

      {/* 3. 4-Column Operations Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {/* Column 1: Ready / Assigned */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Assigned / Ready ({assignedCol.length})
            </span>
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          </div>

          <div className="space-y-3 min-h-[400px]">
            {assignedCol.map((t) => (
              <div key={t.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-blue-600">{t.ticket_no}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      t.priority === "P1"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {t.priority}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900">{t.title}</h4>
                <div className="text-[11px] text-slate-500">
                  {t.hostel_code} • {t.block_name || "A Block"} {t.room_no ? `Rm ${t.room_no}` : ""}
                </div>

                <button
                  onClick={() => handleStartWork(t)}
                  disabled={processingId === t.id}
                  className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center justify-center space-x-1 disabled:opacity-50 mt-2"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Start Work</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: In Progress */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              In Progress ({inProgressCol.length})
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          </div>

          <div className="space-y-3 min-h-[400px]">
            {inProgressCol.map((t) => (
              <div key={t.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-blue-600">{t.ticket_no}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    Active
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900">{t.title}</h4>
                <div className="text-[11px] text-slate-500">
                  {t.hostel_code} • {t.block_name || "A Block"} {t.room_no ? `Rm ${t.room_no}` : ""}
                </div>

                <button
                  onClick={() => {
                    setResolveTicket(t);
                    setResolutionNote("");
                  }}
                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center justify-center space-x-1 mt-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Resolved</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Resolved */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Resolved ({resolvedCol.length})
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>

          <div className="space-y-3 min-h-[400px]">
            {resolvedCol.map((t) => (
              <div key={t.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-blue-600">{t.ticket_no}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    Audit Queue
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900">{t.title}</h4>
                <div className="text-[11px] text-slate-500">
                  {t.hostel_code} • {t.block_name || "A Block"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 4: Escalated / SLA Risk */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
              Escalated / Risk ({escalatedCol.length})
            </span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          </div>

          <div className="space-y-3 min-h-[400px]">
            {escalatedCol.map((t) => (
              <div key={t.id} className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-rose-600">{t.ticket_no}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                    High Risk
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900">{t.title}</h4>
                <div className="text-[11px] text-slate-500">
                  {t.hostel_code} • {t.block_name || "A Block"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resolution Photo Proof Modal */}
      {resolveTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-blue-600">{resolveTicket.ticket_no}</span>
                <h3 className="text-base font-bold text-slate-900">Mark Issue Resolved</h3>
              </div>
              <button onClick={() => setResolveTicket(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700">
              <span className="font-bold">Issue:</span> {resolveTicket.title}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Resolution Notes (Required):</label>
              <textarea
                rows={3}
                placeholder="Describe parts replaced or maintenance performed..."
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Proof Photo URL:</span>
                <span className="text-[11px] text-slate-400 font-normal">Offline Mock Asset</span>
              </label>
              <input
                type="text"
                value={resolutionPhoto}
                onChange={(e) => setResolutionPhoto(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setResolveTicket(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveSubmit}
                disabled={processingId === resolveTicket.id}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
              >
                Submit Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
