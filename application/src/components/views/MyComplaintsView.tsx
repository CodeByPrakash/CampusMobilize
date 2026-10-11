"use client";

import React, { useState, useEffect } from "react";
import { usePersona } from "../../context/PersonaContext";
import { fetchComplaints, upvoteComplaint, fetchTimeline } from "../../lib/api";
import { Complaint, TimelineEvent } from "../../types";
import {
  ThumbsUp,
  Clock,
  MapPin,
  Tag,
  AlertTriangle,
  History,
  X,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles
} from "lucide-react";

export default function MyComplaintsView() {
  const { activePersona } = usePersona();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Timeline modal state
  const [selectedTicket, setSelectedTicket] = useState<Complaint | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState<boolean>(false);
  const [upvotingId, setUpvotingId] = useState<string | null>(null);

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
      console.error("Failed to load complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activePersona]);

  const handleUpvote = async (complaintId: string) => {
    try {
      setUpvotingId(complaintId);
      const res = await upvoteComplaint(complaintId, activePersona);
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === complaintId ? { ...c, upvote_count: res.upvote_count } : c
        )
      );
    } catch (err: any) {
      alert(err.message || "Failed to upvote complaint");
    } finally {
      setUpvotingId(null);
    }
  };

  const handleOpenTimeline = async (complaint: Complaint) => {
    setSelectedTicket(complaint);
    setTimelineLoading(true);
    try {
      const res = await fetchTimeline(complaint.id, activePersona);
      setTimelineEvents(res.events || []);
    } catch (err) {
      console.error("Failed to load timeline:", err);
      setTimelineEvents([]);
    } finally {
      setTimelineLoading(false);
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    const matchesFilter =
      filterStatus === "ALL" || c.status.toUpperCase() === filterStatus;
    const matchesSearch =
      searchQuery === "" ||
      c.ticket_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.room_no && c.room_no.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "P1":
        return "bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse";
      case "P2":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "P3":
        return "bg-blue-500/20 text-blue-300 border-blue-500/40";
      default:
        return "bg-slate-700/50 text-slate-300 border-slate-600";
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "OPEN":
        return "bg-blue-950/60 text-blue-400 border-blue-500/30";
      case "VERIFIED":
        return "bg-teal-950/60 text-teal-300 border-teal-500/30";
      case "ASSIGNED":
        return "bg-indigo-950/60 text-indigo-300 border-indigo-500/30";
      case "IN_PROGRESS":
        return "bg-amber-950/60 text-amber-300 border-amber-500/30";
      case "RESOLVED":
        return "bg-emerald-950/60 text-emerald-300 border-emerald-500/30";
      case "CLOSED":
        return "bg-slate-800 text-slate-300 border-slate-700";
      case "REJECTED":
        return "bg-rose-950/60 text-rose-400 border-rose-500/30";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <span>Complaints & Live Tracking</span>
            {activePersona.hostelCode && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                {activePersona.hostelCode}
              </span>
            )}
          </h2>
          <p className="text-sm text-slate-400">
            Real-time status updates, SLA tracking, duplicate merges, and complete audit trail.
          </p>
        </div>
        <div className="flex items-center space-x-2">
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {["ALL", "OPEN", "VERIFIED", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterStatus === s
                  ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-950"
                  : "bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search ticket, title, room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Complaints Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-900/40 border border-slate-800/80 animate-pulse p-5" />
          ))}
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/30 border border-slate-800/80">
          <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No complaints found</h3>
          <p className="text-xs text-slate-500 mt-1">
            {filterStatus !== "ALL"
              ? `There are no complaints currently in "${filterStatus}" status.`
              : "No complaints have been lodged for this hostel yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredComplaints.map((c) => (
            <div
              key={c.id}
              className="bg-slate-900/70 border border-slate-800/90 hover:border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between transition-all shadow-sm hover:shadow-md"
            >
              <div className="space-y-3">
                {/* Header with ticket no and badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-emerald-400">
                        {c.ticket_no}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getPriorityBadge(c.priority)}`}>
                        {c.priority}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${getStatusBadge(c.status)}`}>
                        {c.status}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white line-clamp-1">
                      {c.title}
                    </h3>
                  </div>

                  {c.risk_score !== undefined && c.risk_score > 0 && (
                    <div className="flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{c.risk_score}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {c.description}
                </p>

                {/* Meta details */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 pt-1">
                  <span className="flex items-center space-x-1 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700/40">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{c.hostel_code || "Campus"} • {c.block_name || ""} {c.room_no ? `Rm ${c.room_no}` : ""}</span>
                  </span>

                  <span className="flex items-center space-x-1 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700/40 text-emerald-400">
                    <Tag className="w-3 h-3" />
                    <span>{c.category_code}</span>
                    {c.ai_category_confidence && (
                      <span className="opacity-70 text-[10px]">
                        ({Math.round(c.ai_category_confidence * 100)}%)
                      </span>
                    )}
                  </span>

                  {c.sla_deadline && (
                    <span className="flex items-center space-x-1 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700/40 text-slate-300">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>SLA: {new Date(c.sla_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  )}
                </div>

                {/* Duplicate Notification Banner */}
                {c.duplicate_of && (
                  <div className="flex items-center space-x-2 text-[11px] bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 px-3 py-1.5 rounded-xl">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Merged as duplicate with #{c.duplicate_of.slice(0, 8)}</span>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-800/80">
                <button
                  onClick={() => handleUpvote(c.id)}
                  disabled={upvotingId === c.id}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                    c.upvote_count > 0
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20"
                      : "bg-slate-800/70 border-slate-700/60 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${upvotingId === c.id ? "animate-bounce" : ""}`} />
                  <span>Upvote ({c.upvote_count})</span>
                </button>

                <button
                  onClick={() => handleOpenTimeline(c)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
                >
                  <History className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Audit Timeline</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audit Timeline Drawer / Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-emerald-400">
                    {selectedTicket.ticket_no}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getPriorityBadge(selectedTicket.priority)}`}>
                    {selectedTicket.priority}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${getStatusBadge(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white line-clamp-1">
                  {selectedTicket.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Timeline Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {timelineLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <RefreshCw className="w-7 h-7 text-emerald-500 animate-spin" />
                  <p className="text-xs text-slate-400">Loading audit events...</p>
                </div>
              ) : timelineEvents.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No timeline events recorded for this complaint.
                </div>
              ) : (
                <div className="relative border-l-2 border-slate-800 ml-4 space-y-6">
                  {timelineEvents.map((evt, idx) => (
                    <div key={evt.id || idx} className="relative pl-6">
                      {/* Timeline dot */}
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-900 border-2 border-emerald-500 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      </div>

                      {/* Event Card */}
                      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white">
                              {evt.to_status}
                            </span>
                            {evt.from_status && (
                              <span className="text-[10px] text-slate-400">
                                (from {evt.from_status})
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(evt.created_at).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>

                        {/* Actor Info */}
                        <div className="flex items-center space-x-2 text-[11px] text-slate-300">
                          <span className="px-2 py-0.5 rounded bg-slate-700 text-emerald-300 font-medium">
                            {evt.actor_role || "SYSTEM"}
                          </span>
                          <span className="text-slate-400">
                            {evt.actor_id || "system"}
                          </span>
                        </div>

                        {/* Note */}
                        {evt.note && (
                          <p className="text-xs text-slate-200 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                            {evt.note}
                          </p>
                        )}

                        {/* Photo preview if present */}
                        {evt.photo_url && (
                          <div className="pt-1">
                            <span className="text-[10px] text-emerald-400 font-medium">
                              Resolution Photo Attached: {evt.photo_url}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 flex justify-end bg-slate-900/90">
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
