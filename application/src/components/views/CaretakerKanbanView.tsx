"use client";

import React, { useState, useEffect } from "react";
import { usePersona } from "../../context/PersonaContext";
import {
  fetchComplaints,
  transitionComplaint,
  triggerSlaTick
} from "../../lib/api";
import { Complaint } from "../../types";
import {
  Clock,
  Play,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Camera,
  MapPin,
  Tag,
  Zap,
  Filter,
  X,
  ChevronRight,
  Flame
} from "lucide-react";

export default function CaretakerKanbanView() {
  const { activePersona } = usePersona();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [slaTicking, setSlaTicking] = useState<boolean>(false);

  // Resolution modal state
  const [resolvingTicket, setResolvingTicket] = useState<Complaint | null>(null);
  const [resolutionNote, setResolutionNote] = useState<string>("");
  const [resolutionPhotoUrl, setResolutionPhotoUrl] = useState<string>(
    "/photos/resolved_repaired_switchboard.jpg"
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (activePersona.hostelCode) {
        params.hostel_code = activePersona.hostelCode;
      }
      const data = await fetchComplaints(activePersona, params);
      setComplaints(data.items || []);
    } catch (err) {
      console.error("Failed to load caretaker tasks:", err);
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
          note: `Work started by ${activePersona.name} (${activePersona.designation})`
        },
        activePersona
      );
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to start work");
    } finally {
      setProcessingId(null);
    }
  };

  const handleResolveSubmit = async () => {
    if (!resolvingTicket) return;
    if (!resolutionNote.trim()) {
      alert("Please provide completion notes describing work done.");
      return;
    }

    setProcessingId(resolvingTicket.id);
    try {
      await transitionComplaint(
        resolvingTicket.id,
        {
          to_status: "RESOLVED",
          note: resolutionNote.trim(),
          photo_url: resolutionPhotoUrl
        },
        activePersona
      );
      setResolvingTicket(null);
      setResolutionNote("");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to mark ticket resolved");
    } finally {
      setProcessingId(null);
    }
  };

  const handleTriggerSlaSimulation = async () => {
    setSlaTicking(true);
    try {
      const res = await triggerSlaTick(activePersona);
      alert(
        `SLA Background Check Completed!\nWarnings Sent: ${res.warnings_sent || 0}\nBreaches Escalated: ${res.breaches_escalated || 0}\nInactivity Escalations: ${res.inactivity_escalations || 0}`
      );
      await loadData();
    } catch (err: any) {
      alert("SLA simulation error: " + err.message);
    } finally {
      setSlaTicking(false);
    }
  };

  // Filter complaints
  const filtered = complaints.filter(
    (c) => categoryFilter === "ALL" || c.category_code === categoryFilter
  );

  // Group into Kanban columns
  const assignedColumn = filtered.filter(
    (c) => c.status === "ASSIGNED" || c.status === "VERIFIED"
  );
  const inProgressColumn = filtered.filter((c) => c.status === "IN_PROGRESS");
  const resolvedColumn = filtered.filter((c) => c.status === "RESOLVED");
  const escalatedColumn = filtered.filter(
    (c) => c.status === "ESCALATED" || ((c.risk_score || 0) >= 75 && c.status !== "CLOSED" && c.status !== "RESOLVED")
  );

  const calculateSlaRemaining = (deadlineStr?: string) => {
    if (!deadlineStr) return null;
    const deadline = new Date(deadlineStr).getTime();
    const now = Date.now();
    const diffMs = deadline - now;
    if (diffMs < 0) {
      return { text: "BREACHED", color: "text-rose-400 bg-rose-500/20 border-rose-500/40" };
    }
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (diffHours < 2) {
      return { text: `${diffHours}h ${diffMins}m left`, color: "text-amber-400 bg-amber-500/20 border-amber-500/40" };
    }
    return { text: `${diffHours}h ${diffMins}m left`, color: "text-slate-300 bg-slate-800 border-slate-700" };
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Clock className="w-6 h-6 text-amber-400" />
            <span>Caretaker Operations Kanban Board</span>
            {activePersona.hostelCode && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                {activePersona.hostelCode}
              </span>
            )}
          </h2>
          <p className="text-sm text-slate-400">
            Smart queued dispatch, live SLA timers, priority rank badges, and photo proof verification.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleTriggerSlaSimulation}
            disabled={slaTicking}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-semibold transition"
          >
            <Flame className={`w-3.5 h-3.5 ${slaTicking ? "animate-spin" : ""}`} />
            <span>Simulate SLA Tick</span>
          </button>

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

      {/* Trade / Category Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center mr-1">
          <Filter className="w-3.5 h-3.5 mr-1" />
          Trade:
        </span>
        {["ALL", "ELECTRICAL", "PLUMBING", "CARPENTRY", "CIVIL", "CLEANING", "MESS"].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
              categoryFilter === cat
                ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-950"
                : "bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 4-Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {/* Column 1: Ready / Assigned */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Ready / Assigned
              </h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
              {assignedColumn.length}
            </span>
          </div>

          <div className="space-y-3 min-h-[400px]">
            {assignedColumn.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No tickets waiting in queue
              </div>
            ) : (
              assignedColumn.map((ticket) => (
                <KanbanCard
                  key={ticket.id}
                  ticket={ticket}
                  onStart={() => handleStartWork(ticket)}
                  isProcessing={processingId === ticket.id}
                  calculateSlaRemaining={calculateSlaRemaining}
                />
              ))
            )}
          </div>
        </div>

        {/* Column 2: In Progress */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                In Progress
              </h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
              {inProgressColumn.length}
            </span>
          </div>

          <div className="space-y-3 min-h-[400px]">
            {inProgressColumn.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No active jobs in progress
              </div>
            ) : (
              inProgressColumn.map((ticket) => (
                <KanbanCard
                  key={ticket.id}
                  ticket={ticket}
                  onResolve={() => {
                    setResolvingTicket(ticket);
                    setResolutionNote("");
                  }}
                  isProcessing={processingId === ticket.id}
                  calculateSlaRemaining={calculateSlaRemaining}
                />
              ))
            )}
          </div>
        </div>

        {/* Column 3: Resolved (Pending Warden Approval) */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Resolved (Audit Queue)
              </h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
              {resolvedColumn.length}
            </span>
          </div>

          <div className="space-y-3 min-h-[400px]">
            {resolvedColumn.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No tickets awaiting sign-off
              </div>
            ) : (
              resolvedColumn.map((ticket) => (
                <KanbanCard
                  key={ticket.id}
                  ticket={ticket}
                  isProcessing={false}
                  calculateSlaRemaining={calculateSlaRemaining}
                />
              ))
            )}
          </div>
        </div>

        {/* Column 4: Escalated / At Risk */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-300">
                Escalated / SLA Risk
              </h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-950/60 text-rose-300 border border-rose-500/30 font-bold">
              {escalatedColumn.length}
            </span>
          </div>

          <div className="space-y-3 min-h-[400px]">
            {escalatedColumn.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No active escalations
              </div>
            ) : (
              escalatedColumn.map((ticket) => (
                <KanbanCard
                  key={ticket.id}
                  ticket={ticket}
                  onStart={ticket.status === "ASSIGNED" || ticket.status === "VERIFIED" ? () => handleStartWork(ticket) : undefined}
                  onResolve={ticket.status === "IN_PROGRESS" ? () => {
                    setResolvingTicket(ticket);
                    setResolutionNote("");
                  } : undefined}
                  isProcessing={processingId === ticket.id}
                  calculateSlaRemaining={calculateSlaRemaining}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Resolution Completion Modal */}
      {resolvingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-400">
                  {resolvingTicket.ticket_no}
                </span>
                <h3 className="text-base font-bold text-white">
                  Mark Complaint Resolved
                </h3>
              </div>
              <button
                onClick={() => setResolvingTicket(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
              <span className="font-bold text-white">Issue:</span> {resolvingTicket.title}
              <div className="text-[11px] text-slate-500 mt-1">
                Room: {resolvingTicket.room_no || "General"} • {resolvingTicket.hostel_code}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">
                Resolution Notes (Required):
              </label>
              <textarea
                rows={3}
                placeholder="Describe parts replaced, wiring fixed, or maintenance performed..."
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Resolution Proof Photo URL:</span>
                </span>
                <span className="text-[11px] text-emerald-400 font-normal">Offline Mock Asset</span>
              </label>
              <input
                type="text"
                value={resolutionPhotoUrl}
                onChange={(e) => setResolutionPhotoUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <div className="flex gap-2">
                {[
                  "/photos/resolved_switchboard.jpg",
                  "/photos/resolved_pipeline.jpg",
                  "/photos/resolved_fan.jpg"
                ].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => setResolutionPhotoUrl(sample)}
                    className="text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 truncate"
                  >
                    {sample.split("/").pop()}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setResolvingTicket(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveSubmit}
                disabled={processingId === resolvingTicket.id}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950 transition"
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

function KanbanCard({
  ticket,
  onStart,
  onResolve,
  isProcessing,
  calculateSlaRemaining
}: {
  ticket: Complaint;
  onStart?: () => void;
  onResolve?: () => void;
  isProcessing: boolean;
  calculateSlaRemaining: (deadline?: string) => { text: string; color: string } | null;
}) {
  const slaInfo = calculateSlaRemaining(ticket.sla_deadline);

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-3.5 rounded-xl space-y-2.5 transition shadow-sm">
      {/* Top Meta */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] font-bold text-emerald-400">
          {ticket.ticket_no}
        </span>
        <div className="flex items-center space-x-1.5">
          {ticket.queue_rank !== undefined && ticket.queue_rank > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30 font-bold">
              #{ticket.queue_rank} Rank
            </span>
          )}
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
              ticket.priority === "P1"
                ? "bg-rose-500/20 text-rose-300"
                : ticket.priority === "P2"
                ? "bg-amber-500/20 text-amber-300"
                : "bg-blue-500/20 text-blue-300"
            }`}
          >
            {ticket.priority}
          </span>
        </div>
      </div>

      {/* Title */}
      <h4 className="text-xs font-bold text-white line-clamp-1">{ticket.title}</h4>

      {/* Location & Category */}
      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
        <span className="flex items-center space-x-1 bg-slate-800/80 px-1.5 py-0.5 rounded">
          <MapPin className="w-2.5 h-2.5" />
          <span>{ticket.hostel_code} {ticket.room_no ? `Rm ${ticket.room_no}` : ""}</span>
        </span>
        <span className="flex items-center space-x-1 bg-slate-800/80 px-1.5 py-0.5 rounded text-amber-400">
          <Tag className="w-2.5 h-2.5" />
          <span>{ticket.category_code}</span>
        </span>
      </div>

      {/* SLA Timer */}
      {slaInfo && (
        <div className={`flex items-center space-x-1.5 text-[10px] px-2 py-1 rounded-lg border font-medium ${slaInfo.color}`}>
          <Clock className="w-3 h-3" />
          <span>SLA: {slaInfo.text}</span>
        </div>
      )}

      {/* Action Button */}
      {onStart && (
        <button
          onClick={onStart}
          disabled={isProcessing}
          className="w-full flex items-center justify-center space-x-1.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition shadow-sm disabled:opacity-50 mt-1"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>Start Work</span>
        </button>
      )}

      {onResolve && (
        <button
          onClick={onResolve}
          disabled={isProcessing}
          className="w-full flex items-center justify-center space-x-1.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 mt-1"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Mark Resolved</span>
        </button>
      )}
    </div>
  );
}
