"use client";

import React, { useState, useEffect } from "react";
import { usePersona } from "../../context/PersonaContext";
import {
  fetchComplaints,
  transitionComplaint,
  fetchCaretakerPerformance
} from "../../lib/api";
import { Complaint, CaretakerPerformanceScore } from "../../types";
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Camera,
  Award,
  RefreshCw,
  Building2,
  Clock,
  MapPin,
  Tag,
  ShieldCheck,
  UserCheck,
  FileCheck,
  AlertCircle
} from "lucide-react";

export default function WardenApprovalsView() {
  const { activePersona } = usePersona();
  const [resolvedComplaints, setResolvedComplaints] = useState<Complaint[]>([]);
  const [caretakers, setCaretakers] = useState<CaretakerPerformanceScore[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Rework modal state
  const [reworkTicket, setReworkTicket] = useState<Complaint | null>(null);
  const [reworkNote, setReworkNote] = useState<string>("");

  const loadData = async () => {
    setLoading(true);
    try {
      const hostelCode = activePersona.hostelCode || "HB-3";
      // Fetch tickets in RESOLVED status
      const data = await fetchComplaints(activePersona, {
        status: "RESOLVED",
        hostel_code: hostelCode
      });
      setResolvedComplaints(data.items || []);

      // Fetch caretaker performance for this hostel
      try {
        const perfData = await fetchCaretakerPerformance(hostelCode, activePersona);
        setCaretakers(perfData.scores || []);
      } catch (err) {
        console.warn("Could not load caretaker scores:", err);
      }
    } catch (err) {
      console.error("Failed to load warden approvals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activePersona]);

  const handleApproveClosure = async (ticket: Complaint) => {
    setProcessingId(ticket.id);
    try {
      await transitionComplaint(
        ticket.id,
        {
          to_status: "CLOSED",
          note: `Final inspection approved by ${activePersona.name} (${activePersona.role}). Issue formally closed.`
        },
        activePersona
      );
      setResolvedComplaints((prev) => prev.filter((c) => c.id !== ticket.id));
    } catch (err: any) {
      alert(err.message || "Failed to approve closure");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReworkSubmit = async () => {
    if (!reworkTicket) return;
    if (!reworkNote.trim()) {
      alert("Please specify the reason/rework instructions.");
      return;
    }

    setProcessingId(reworkTicket.id);
    try {
      await transitionComplaint(
        reworkTicket.id,
        {
          to_status: "IN_PROGRESS",
          note: `Rework requested by Warden: ${reworkNote.trim()}`
        },
        activePersona
      );
      setResolvedComplaints((prev) => prev.filter((c) => c.id !== reworkTicket.id));
      setReworkTicket(null);
      setReworkNote("");
    } catch (err: any) {
      alert(err.message || "Failed to send rework request");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <span>Warden Resolution Approvals & Sign-Off</span>
            {activePersona.hostelCode && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                {activePersona.hostelCode}
              </span>
            )}
          </h2>
          <p className="text-sm text-slate-400">
            Administrative sign-off on caretaker completed tasks. Inspect resolution notes and photo proof before formal closure.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Grid: Pending Approvals (Left 2 cols) & Caretaker Performance Leaderboard (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Approvals Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>Pending Inspections ({resolvedComplaints.length})</span>
            </h3>
            <span className="text-xs text-slate-400">Status: RESOLVED</span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-44 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse" />
              ))}
            </div>
          ) : resolvedComplaints.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/30 border border-slate-800">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h4 className="text-base font-semibold text-slate-200">
                All Completed Work Signed Off
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                There are no resolved complaints currently waiting for Warden approval.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {resolvedComplaints.map((c) => {
                const isProcessing = processingId === c.id;

                return (
                  <div
                    key={c.id}
                    className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 transition shadow-sm"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-emerald-400">
                            {c.ticket_no}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              c.priority === "P1"
                                ? "bg-rose-500/20 text-rose-300"
                                : "bg-blue-500/20 text-blue-300"
                            }`}
                          >
                            {c.priority}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-500/30 font-bold">
                            RESOLVED
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white mt-1">
                          {c.title}
                        </h4>
                      </div>

                      <div className="text-right text-xs text-slate-400">
                        <MapPin className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                        <span>{c.hostel_code} • {c.block_name || ""} {c.room_no ? `Rm ${c.room_no}` : ""}</span>
                      </div>
                    </div>

                    {/* Complaint issue summary */}
                    <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                      <span className="font-bold text-slate-400">Original Issue:</span> {c.description}
                    </p>

                    {/* Caretaker Resolution Proof Card */}
                    <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-300 flex items-center space-x-1.5">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Caretaker Resolution Report</span>
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          Assigned: {c.assigned_to_name || c.assigned_to || "R. Das"}
                        </span>
                      </div>

                      {c.resolution_note ? (
                        <p className="text-xs text-slate-200 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                          &ldquo;{c.resolution_note}&rdquo;
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 italic">
                          No notes attached.
                        </p>
                      )}

                      {c.resolution_photo_url && (
                        <div className="flex items-center space-x-2 text-[11px] text-emerald-400 pt-1">
                          <Camera className="w-3.5 h-3.5" />
                          <span>Photo Proof: <code className="text-white">{c.resolution_photo_url}</code></span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end space-x-3 pt-1">
                      <button
                        onClick={() => {
                          setReworkTicket(c);
                          setReworkNote("");
                        }}
                        disabled={isProcessing}
                        className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition disabled:opacity-50"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Request Rework</span>
                      </button>

                      <button
                        onClick={() => handleApproveClosure(c)}
                        disabled={isProcessing}
                        className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition shadow-md shadow-emerald-950 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isProcessing ? "Closing..." : "Approve Closure (CLOSED)"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Caretaker Performance Index (§11.1) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Caretaker Scorecards</span>
            </h3>
            <span className="text-xs text-emerald-400 font-semibold">
              Hostel PI (§11.1)
            </span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-4">
            <p className="text-xs text-slate-400">
              Evaluated on SLA compliance, first-time resolution, throughput, and rework rate.
            </p>

            {caretakers.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No caretakers registered for this hostel yet.
              </div>
            ) : (
              <div className="space-y-3">
                {caretakers.map((ct) => (
                  <div
                    key={ct.user_id}
                    className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">
                          {ct.caretaker_name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {ct.role}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-emerald-400">
                          {ct.performance_index.toFixed(1)} / 100
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Rank #{ct.hostel_rank || 1}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800">
                      <div>
                        <span className="text-slate-500">SLA Met:</span>{" "}
                        <span className="font-semibold text-slate-200">
                          {Math.round(ct.sla_compliance_pct)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">First-Time Fix:</span>{" "}
                        <span className="font-semibold text-slate-200">
                          {Math.round(ct.first_time_resolution_pct)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Completed:</span>{" "}
                        <span className="font-semibold text-slate-200">
                          {ct.throughput_count} tasks
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Rework Rate:</span>{" "}
                        <span className="font-semibold text-amber-400">
                          {Math.round(ct.rework_rate_pct)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rework Reason Modal */}
      {reworkTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <RotateCcw className="w-5 h-5 text-amber-400" />
              <span>Send Back for Rework</span>
            </h3>

            <p className="text-xs text-slate-400">
              Provide feedback for ticket <span className="font-mono text-emerald-400">{reworkTicket.ticket_no}</span>. The ticket status will revert to <code className="text-amber-400">IN_PROGRESS</code>.
            </p>

            <textarea
              rows={3}
              placeholder="e.g., Switchboard still loose, water leakage persists under the sink, please re-inspect..."
              value={reworkNote}
              onChange={(e) => setReworkNote(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setReworkTicket(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleReworkSubmit}
                disabled={processingId === reworkTicket.id}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-950 transition"
              >
                Send to Caretaker
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
