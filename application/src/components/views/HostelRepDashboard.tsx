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
  Clock,
  Layers,
  MapPin,
  RefreshCw,
  Sparkles,
  Tag,
  CheckCheck,
  X
} from "lucide-react";

export default function HostelRepDashboard() {
  const { activePersona } = usePersona();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Reject modal state
  const [rejectTicket, setRejectTicket] = useState<Complaint | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchComplaints(activePersona, {
        hostel_code: "HB-3"
      });
      setComplaints(data.items || []);
    } catch (e) {
      console.warn("Could not load rep complaints:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activePersona]);

  const handleVerify = async (ticket: Complaint) => {
    setProcessingId(ticket.id);
    try {
      await transitionComplaint(
        ticket.id,
        {
          to_status: "VERIFIED",
          note: `Verified by ${activePersona.name} (Hostel Rep). Ready for Caretaker assignment.`
        },
        activePersona
      );
      await loadData();
    } catch (err: any) {
      alert("Error verifying ticket: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectTicket) return;
    if (!rejectReason.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }

    setProcessingId(rejectTicket.id);
    try {
      await transitionComplaint(
        rejectTicket.id,
        {
          to_status: "REJECTED",
          note: rejectReason.trim()
        },
        activePersona
      );
      setRejectTicket(null);
      setRejectReason("");
      await loadData();
    } catch (err: any) {
      alert("Error rejecting ticket: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // Group columns for Screen 6
  const todoTickets = complaints.filter((c) => c.status === "OPEN");
  const inProgressTickets = complaints.filter(
    (c) => c.status === "VERIFIED" || c.status === "ASSIGNED" || c.status === "IN_PROGRESS"
  );
  const resolvedTickets = complaints.filter(
    (c) => c.status === "RESOLVED" || c.status === "CLOSED"
  );
  const highPriorityCount = complaints.filter(
    (c) => c.priority === "P1" || c.priority === "P2"
  ).length;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner (Screen 6) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 font-bold">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-slate-900">B Block • Hostel 14</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold">
                Rep Triage Board
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              First-line review for student issues. Verify genuine problems, eliminate duplicates, and dispatch to caretakers.
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 2. Stats Row (Screen 6 Mockup) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-2xl font-black text-slate-900">{complaints.length || 12}</div>
          <div className="text-xs text-slate-500 font-medium">Total Issues</div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-2xl font-black text-rose-600">{highPriorityCount || 4}</div>
          <div className="text-xs text-slate-500 font-medium">High Priority</div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-2xl font-black text-blue-600">{inProgressTickets.length || 5}</div>
          <div className="text-xs text-slate-500 font-medium">In Progress</div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-2xl font-black text-emerald-600">{resolvedTickets.length || 3}</div>
          <div className="text-xs text-slate-500 font-medium">Resolved</div>
        </div>
      </div>

      {/* 3. 3-Column Triage Kanban Board (Screen 6 Mockup) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Column 1: To Do / Pending Triage */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              To Do ({todoTickets.length})
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>

          <div className="space-y-3 min-h-[400px]">
            {todoTickets.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200 p-4">
                All pending complaints verified!
              </div>
            ) : (
              todoTickets.map((t) => (
                <div
                  key={t.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3 hover:border-slate-300 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-blue-600">{t.ticket_no}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        t.priority === "P1"
                          ? "bg-rose-100 text-rose-700"
                          : t.priority === "P2"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900">{t.title}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{t.description}</p>

                  <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                    <MapPin className="w-3 h-3" />
                    <span>{t.block_name || "B Block"} {t.room_no ? `Rm ${t.room_no}` : ""}</span>
                  </div>

                  {t.duplicate_of && (
                    <div className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 p-1.5 rounded-lg flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-indigo-500" />
                      <span>Duplicate link detected</span>
                    </div>
                  )}

                  {/* 1-Click Verify and Reject Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleVerify(t)}
                      disabled={processingId === t.id}
                      className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center justify-center space-x-1 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Verify</span>
                    </button>
                    <button
                      onClick={() => {
                        setRejectTicket(t);
                        setRejectReason("");
                      }}
                      disabled={processingId === t.id}
                      className="py-1.5 px-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 disabled:opacity-50"
                    >
                      <XCircle className="w-3 h-3" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: In Progress */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              In Progress ({inProgressTickets.length})
            </span>
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          </div>

          <div className="space-y-3 min-h-[400px]">
            {inProgressTickets.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200 p-4">
                No active jobs currently in progress.
              </div>
            ) : (
              inProgressTickets.map((t) => (
                <div
                  key={t.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2 hover:border-slate-300 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-blue-600">{t.ticket_no}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {t.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{t.title}</h4>
                  <div className="text-[11px] text-slate-500">
                    {t.block_name || "B Block"} {t.room_no ? `Rm ${t.room_no}` : ""}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Resolved */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Resolved ({resolvedTickets.length})
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>

          <div className="space-y-3 min-h-[400px]">
            {resolvedTickets.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200 p-4">
                No completed complaints yet.
              </div>
            ) : (
              resolvedTickets.map((t) => (
                <div
                  key={t.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2 hover:border-slate-300 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-blue-600">{t.ticket_no}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      Resolved
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{t.title}</h4>
                  <div className="text-[11px] text-slate-500">
                    {t.block_name || "B Block"} {t.room_no ? `Rm ${t.room_no}` : ""}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Rejection Justification Modal */}
      {rejectTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                <span>Reject Complaint</span>
              </h3>
              <button onClick={() => setRejectTicket(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Provide a clear justification why ticket <span className="font-mono text-blue-600 font-bold">{rejectTicket.ticket_no}</span> is being rejected:
            </p>

            <textarea
              rows={3}
              placeholder="e.g. Invalid room number, duplicate issue already being serviced, out of scope..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-rose-600"
            />

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setRejectTicket(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={processingId === rejectTicket.id}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition"
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
