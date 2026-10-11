"use client";

import React, { useState, useEffect } from "react";
import { usePersona } from "../../context/PersonaContext";
import { fetchComplaints, transitionComplaint } from "../../lib/api";
import { Complaint } from "../../types";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  MapPin,
  Clock,
  Layers,
  Tag,
  CheckCheck,
  X
} from "lucide-react";

export default function HostelRepTriageView() {
  const { activePersona } = usePersona();
  const [openComplaints, setOpenComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Reject modal state
  const [rejectingTicket, setRejectingTicket] = useState<Complaint | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");

  const loadOpenComplaints = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { status: "OPEN" };
      if (activePersona.hostelCode) {
        params.hostel_code = activePersona.hostelCode;
      }
      const data = await fetchComplaints(activePersona, params);
      setOpenComplaints(data.items || []);
    } catch (err) {
      console.error("Failed to load open complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpenComplaints();
  }, [activePersona]);

  const handleVerify = async (complaint: Complaint) => {
    setProcessingId(complaint.id);
    try {
      await transitionComplaint(
        complaint.id,
        {
          to_status: "VERIFIED",
          note: `Verified by ${activePersona.name} (${activePersona.role}). Ready for Caretaker assignment.`
        },
        activePersona
      );
      setOpenComplaints((prev) => prev.filter((c) => c.id !== complaint.id));
    } catch (err: any) {
      alert(err.message || "Failed to verify complaint");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectingTicket) return;
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }

    setProcessingId(rejectingTicket.id);
    try {
      await transitionComplaint(
        rejectingTicket.id,
        {
          to_status: "REJECTED",
          note: rejectionReason.trim()
        },
        activePersona
      );
      setOpenComplaints((prev) => prev.filter((c) => c.id !== rejectingTicket.id));
      setRejectingTicket(null);
      setRejectionReason("");
    } catch (err: any) {
      alert(err.message || "Failed to reject complaint");
    } finally {
      setProcessingId(null);
    }
  };

  const handleBatchVerifyAll = async () => {
    if (openComplaints.length === 0) return;
    if (
      !confirm(
        `Are you sure you want to verify all ${openComplaints.length} pending complaints?`
      )
    )
      return;

    setLoading(true);
    try {
      for (const ticket of openComplaints) {
        await transitionComplaint(
          ticket.id,
          {
            to_status: "VERIFIED",
            note: `Batch verified by ${activePersona.name} (${activePersona.role}).`
          },
          activePersona
        );
      }
      setOpenComplaints([]);
    } catch (err: any) {
      alert("Error during batch verification: " + err.message);
      loadOpenComplaints();
    } finally {
      setLoading(false);
    }
  };

  const highRiskCount = openComplaints.filter(
    (c) => (c.risk_score && c.risk_score > 60) || c.priority === "P1" || c.priority === "P2"
  ).length;

  const duplicateCount = openComplaints.filter((c) => !!c.duplicate_of).length;

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <ShieldAlert className="w-6 h-6 text-purple-400" />
            <span>Hostel Representative Triage Inbox</span>
            {activePersona.hostelCode && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
                {activePersona.hostelCode}
              </span>
            )}
          </h2>
          <p className="text-sm text-slate-400">
            First-line triage to verify genuine issues, weed out duplicates or spam, and route to Caretakers.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {openComplaints.length > 0 && (
            <button
              onClick={handleBatchVerifyAll}
              disabled={loading}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-md shadow-purple-900/40"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Verify All ({openComplaints.length})</span>
            </button>
          )}

          <button
            onClick={loadOpenComplaints}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{openComplaints.length}</div>
            <div className="text-xs text-slate-400">Pending Triage</div>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{highRiskCount}</div>
            <div className="text-xs text-slate-400">High Risk / Urgent</div>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{duplicateCount}</div>
            <div className="text-xs text-slate-400">Suspected Duplicates</div>
          </div>
        </div>
      </div>

      {/* Triage Cards List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-36 rounded-2xl bg-slate-900/40 border border-slate-800/80 animate-pulse p-5"
            />
          ))}
        </div>
      ) : openComplaints.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/30 border border-slate-800/80">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">Triage Inbox Clean</h3>
          <p className="text-xs text-slate-500 mt-1">
            All complaints for {activePersona.hostelCode || "this hostel"} have been verified or resolved!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {openComplaints.map((c) => {
            const isProcessing = processingId === c.id;

            return (
              <div
                key={c.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 transition shadow-sm"
              >
                {/* Details */}
                <div className="space-y-2.5 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      {c.ticket_no}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        c.priority === "P1"
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse"
                          : c.priority === "P2"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-blue-500/20 text-blue-300 border-blue-500/40"
                      }`}
                    >
                      {c.priority}
                    </span>

                    <span className="flex items-center space-x-1 text-[11px] text-purple-300 bg-purple-950/50 border border-purple-500/30 px-2 py-0.5 rounded-lg">
                      <Tag className="w-3 h-3" />
                      <span>{c.category_code}</span>
                      {c.ai_category_confidence && (
                        <span className="font-bold">
                          ({Math.round(c.ai_category_confidence * 100)}% Match)
                        </span>
                      )}
                    </span>

                    {c.risk_score !== undefined && c.risk_score > 0 && (
                      <span className="flex items-center space-x-1 text-[11px] text-amber-300 bg-amber-950/50 border border-amber-500/30 px-2 py-0.5 rounded-lg font-bold">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Risk: {c.risk_score}/100</span>
                      </span>
                    )}

                    <span className="flex items-center space-x-1 text-[11px] text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-lg border border-slate-700/40">
                      <MapPin className="w-3 h-3" />
                      <span>{c.hostel_code} • {c.block_name || ""} {c.room_no ? `Rm ${c.room_no}` : ""}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white">{c.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{c.description}</p>

                  {c.duplicate_of && (
                    <div className="flex items-center space-x-2 text-xs bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 px-3 py-1.5 rounded-xl">
                      <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>
                        AI Engine detected duplicate of parent #{c.duplicate_of.slice(0, 8)}. Verifying will link upvotes.
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-3 shrink-0 pt-2 md:pt-0">
                  <button
                    onClick={() => handleVerify(c)}
                    disabled={isProcessing}
                    className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition shadow-md shadow-emerald-950 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isProcessing ? "Verifying..." : "Verify"}</span>
                  </button>

                  <button
                    onClick={() => {
                      setRejectingTicket(c);
                      setRejectionReason("");
                    }}
                    disabled={isProcessing}
                    className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-rose-400" />
                <span>Reject Complaint</span>
              </h3>
              <button
                onClick={() => setRejectingTicket(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Provide a clear reason why ticket <span className="font-mono text-emerald-400">{rejectingTicket.ticket_no}</span> is being rejected. This will be visible on the student's audit timeline.
            </p>

            <textarea
              rows={3}
              placeholder="e.g., Duplicate request already resolved, Out of scope for hostel facility, Invalid room number..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setRejectingTicket(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={processingId === rejectingTicket.id}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950 transition"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
