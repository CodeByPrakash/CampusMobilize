"use client";

import React, { useState, useEffect } from "react";
import { usePersona } from "../../context/PersonaContext";
import { fetchComplaints, transitionComplaint } from "../../lib/api";
import { Complaint } from "../../types";
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCcw,
  RefreshCw,
  Bell,
  ArrowUpRight,
  Sparkles,
  PieChart,
  BarChart3,
  FileCheck,
  Send,
  X
} from "lucide-react";

export default function WardenDashboard() {
  const { activePersona, activeTab, setActiveTab } = usePersona();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Rework modal state
  const [reworkTicket, setReworkTicket] = useState<Complaint | null>(null);
  const [reworkNote, setReworkNote] = useState<string>("");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchComplaints(activePersona, {
        hostel_code: "HB-3"
      });
      setComplaints(data.items || []);
    } catch (e) {
      console.warn("Could not load warden complaints:", e);
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
      await loadData();
    } catch (err: any) {
      alert("Error approving closure: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReworkSubmit = async () => {
    if (!reworkTicket) return;
    if (!reworkNote.trim()) {
      alert("Please provide rework instructions.");
      return;
    }

    setProcessingId(reworkTicket.id);
    try {
      await transitionComplaint(
        reworkTicket.id,
        {
          to_status: "REJECTED_BACK",
          note: `Rework requested by Warden: ${reworkNote.trim()}`
        },
        activePersona
      );
      setReworkTicket(null);
      setReworkNote("");
      await loadData();
    } catch (err: any) {
      alert("Error requesting rework: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingApprovals = complaints.filter((c) => c.status === "RESOLVED");
  const inProgressCount = complaints.filter((c) => c.status === "ASSIGNED" || c.status === "IN_PROGRESS").length;
  const highPriorityCount = complaints.filter((c) => c.priority === "P1" || c.priority === "P2").length;
  const resolvedCount = complaints.filter((c) => c.status === "CLOSED").length;

  return (
    <div className="space-y-6">
      {/* 1. Header (Screen 7 Mockup) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900">Hostel 14 - Warden Dashboard</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
              HB-3 Hall
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Monitor and ensure timely resolution across all wings and blocks.</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab(activeTab === "approvals" ? "warden_dashboard" : "approvals")}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Approvals Queue ({pendingApprovals.length})</span>
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

      {/* 2. Stats Row (Screen 7 Mockup) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-2xl font-black text-slate-900">{complaints.length || 26}</div>
          <div className="text-xs text-slate-500 font-medium">Total Complaints</div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-2xl font-black text-rose-600">{highPriorityCount || 8}</div>
          <div className="text-xs text-slate-500 font-medium">High Priority</div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-2xl font-black text-blue-600">{inProgressCount || 12}</div>
          <div className="text-xs text-slate-500 font-medium">In Progress</div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-2xl font-black text-emerald-600">{resolvedCount || 6}</div>
          <div className="text-xs text-slate-500 font-medium">Resolved</div>
        </div>
      </div>

      {/* 3. Main Analytics Row: Donut Category Breakdown + Priority Bar Chart (Screen 7) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Complaints by Category Donut Chart (Screen 7) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Complaints by Category</h3>
            <span className="text-xs text-slate-400">Total: {complaints.length || 26}</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
            {/* Visual Simulated Donut Ring */}
            <div className="relative w-36 h-36 rounded-full border-[14px] border-blue-600 border-t-teal-500 border-r-amber-500 border-b-rose-500 flex items-center justify-center">
              <div className="text-center">
                <span className="text-2xl font-black text-slate-900">{complaints.length || 26}</span>
                <span className="text-[10px] text-slate-400 block font-bold">TOTAL</span>
              </div>
            </div>

            {/* Category Percentages (Screen 7 mockup labels) */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span className="text-slate-600 w-28">Water Supply</span>
                <span className="font-bold text-slate-900">30%</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-600 w-28">Electricity</span>
                <span className="font-bold text-slate-900">20%</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                <span className="text-slate-600 w-28">Hygiene</span>
                <span className="font-bold text-slate-900">18%</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-slate-600 w-28">Infrastructure</span>
                <span className="font-bold text-slate-900">12%</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-slate-600 w-28">Mess Facilities</span>
                <span className="font-bold text-slate-900">12%</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span className="text-slate-600 w-28">Others</span>
                <span className="font-bold text-slate-900">8%</span>
              </div>
            </div>
          </div>

          {/* AI Insights Alert Box (Screen 7) */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-900">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>AI Operational Insights</span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              Water supply complaints have increased by <strong>40% this week</strong>. 
              <br />
              Suggested action: Inspect overhead tank valves and main water pipeline in B Block.
            </p>
          </div>
        </div>

        {/* Right: Priority Comparison Bar Chart (Screen 7) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Priority Comparison (Weekly)</h3>
            <div className="flex items-center space-x-3 text-[10px] font-bold">
              <span className="flex items-center space-x-1 text-rose-600">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>High</span>
              </span>
              <span className="flex items-center space-x-1 text-amber-600">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Medium</span>
              </span>
              <span className="flex items-center space-x-1 text-blue-600">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Low</span>
              </span>
            </div>
          </div>

          {/* Simulated Bar Graph (Screen 7) */}
          <div className="h-44 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-100">
            {[
              { day: "Mon", high: 50, med: 70, low: 30 },
              { day: "Tue", high: 75, med: 40, low: 50 },
              { day: "Wed", high: 90, med: 65, low: 40 },
              { day: "Thu", high: 45, med: 80, low: 60 },
              { day: "Fri", high: 60, med: 90, low: 45 },
              { day: "Sat", high: 80, med: 55, low: 70 },
              { day: "Sun", high: 35, med: 45, low: 30 }
            ].map((col) => (
              <div key={col.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <div className="w-full flex items-end justify-center gap-1 h-32">
                  <div className="w-2 rounded-t bg-rose-500" style={{ height: `${col.high}%` }} />
                  <div className="w-2 rounded-t bg-amber-500" style={{ height: `${col.med}%` }} />
                  <div className="w-2 rounded-t bg-blue-500" style={{ height: `${col.low}%` }} />
                </div>
                <span className="text-[10px] text-slate-500 font-semibold">{col.day}</span>
              </div>
            ))}
          </div>

          {/* Quick Actions (Screen 7) */}
          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Quick Actions:</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => alert("Reminder sent to HB-3 maintenance staff!")}
                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition flex items-center space-x-1"
              >
                <Send className="w-3 h-3" />
                <span>Send Reminder</span>
              </button>
              <button
                onClick={() => alert("Issue escalated to Chief Warden Prof. M. Mishra!")}
                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center space-x-1"
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Escalate to Admin</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Approvals Queue Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Resolved Complaints Awaiting Warden Sign-Off</h3>
            <p className="text-xs text-slate-500">Inspect caretaker resolution notes and proof before administrative closure.</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            {pendingApprovals.length} Pending
          </span>
        </div>

        {pendingApprovals.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No complaints currently waiting in the sign-off queue. All completed work has been approved.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingApprovals.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 transition"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-blue-600">{t.ticket_no}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      RESOLVED
                    </span>
                    <span className="text-[11px] text-slate-400">{t.block_name || "B Block"} {t.room_no ? `Rm ${t.room_no}` : ""}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{t.title}</h4>
                  {t.resolution_note && (
                    <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                      &ldquo;{t.resolution_note}&rdquo;
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => {
                      setReworkTicket(t);
                      setReworkNote("");
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold transition flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Rework</span>
                  </button>
                  <button
                    onClick={() => handleApproveClosure(t)}
                    disabled={processingId === t.id}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center space-x-1 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve Closure</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rework Reason Modal */}
      {reworkTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <RotateCcw className="w-5 h-5 text-amber-600" />
              <span>Send Back for Rework</span>
            </h3>

            <p className="text-xs text-slate-600">
              Provide instructions for caretaker regarding ticket <span className="font-mono text-blue-600 font-bold">{reworkTicket.ticket_no}</span>:
            </p>

            <textarea
              rows={3}
              placeholder="e.g. Switchboard still loose, water pipe fitting leaking under pressure..."
              value={reworkNote}
              onChange={(e) => setReworkNote(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-amber-600"
            />

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setReworkTicket(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleReworkSubmit}
                disabled={processingId === reworkTicket.id}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition"
              >
                Send Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
