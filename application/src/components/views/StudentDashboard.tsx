"use client";

import React, { useState, useEffect } from "react";
import { usePersona } from "../../context/PersonaContext";
import { fetchComplaints, createComplaint, fetchTimeline } from "../../lib/api";
import { Complaint, TimelineEvent } from "../../types";
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  Zap,
  Droplets,
  Sparkles,
  MapPin,
  Camera,
  Layers,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Tag,
  ThumbsUp,
  RefreshCw,
  Radio,
  FileText
} from "lucide-react";

export default function StudentDashboard() {
  const { activePersona, activeTab, setActiveTab } = usePersona();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Selected complaint for Timeline tracking (Screen 5)
  const [selectedTicket, setSelectedTicket] = useState<Complaint | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);

  // Wizard State (Screen 4)
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [newTitle, setNewTitle] = useState<string>("Water leakage in B Block room 208");
  const [newDesc, setNewDesc] = useState<string>(
    "There is continuous water leakage in B Block, room 208 since last night. It is causing water wastage and making the floor slippery."
  );
  const [newCategory, setNewCategory] = useState<string>("WATER");
  const [newSubcategory, setNewSubcategory] = useState<string>("Leakage");
  const [newBlock, setNewBlock] = useState<string>("B-Block");
  const [newRoom, setNewRoom] = useState<string>("208");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchComplaints(activePersona, {
        hostel_code: "HB-3"
      });
      const items = data.items || [];
      setComplaints(items);
      if (items.length > 0 && !selectedTicket) {
        setSelectedTicket(items[0]);
        loadTimeline(items[0].id);
      }
    } catch (e) {
      console.warn("Could not load student complaints:", e);
    } finally {
      setLoading(false);
    }
  };

  const loadTimeline = async (ticketId: string) => {
    try {
      const res = await fetchTimeline(ticketId, activePersona);
      setTimelineEvents(res.events || []);
    } catch (e) {
      console.warn("Could not load timeline:", e);
    }
  };

  useEffect(() => {
    loadData();
  }, [activePersona]);

  const handleSelectTicket = (c: Complaint) => {
    setSelectedTicket(c);
    loadTimeline(c.id);
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await createComplaint(
        {
          title: newTitle,
          description: newDesc,
          category_code: newCategory,
          hostel_code: "HB-3",
          block_name: newBlock,
          room_no: newRoom,
          people_affected: 4,
          severity: 3
        },
        activePersona
      );
      alert(`Complaint lodged successfully! Ticket: ${res.ticket_no}`);
      await loadData();
      setActiveTab("my_complaints");
    } catch (err: any) {
      alert("Error submitting complaint: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCount = complaints.filter((c) => c.status === "OPEN" || c.status === "VERIFIED").length;
  const inProgressCount = complaints.filter((c) => c.status === "ASSIGNED" || c.status === "IN_PROGRESS").length;
  const resolvedCount = complaints.filter((c) => c.status === "RESOLVED" || c.status === "CLOSED").length;

  // Render Sub-Views based on activeTab
  if (activeTab === "lodge_complaint") {
    return (
      <div className="space-y-6">
        {/* Wizard Header (Screen 4) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Raise a New Complaint</h2>
            <p className="text-xs text-slate-500 mt-0.5">Help us keep NIT Rourkela better, cleaner, and safer.</p>
          </div>
          <button
            onClick={() => setActiveTab("overview")}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* 4-Step Progress Indicator (Screen 4) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between max-w-2xl mx-auto">
          {[
            { step: 1, label: "Details" },
            { step: 2, label: "Location" },
            { step: 3, label: "Media" },
            { step: 4, label: "Review" }
          ].map((s) => (
            <div key={s.step} className="flex items-center space-x-2">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  wizardStep >= s.step
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {s.step}
              </span>
              <span
                className={`text-xs font-semibold hidden sm:inline ${
                  wizardStep >= s.step ? "text-slate-900" : "text-slate-400"
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Complaint Form Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs max-w-2xl mx-auto space-y-6">
          <form onSubmit={handleSubmitComplaint} className="space-y-5">
            {/* Category & Subcategory */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="WATER">Water Supply & Plumbing</option>
                  <option value="ELECTRICAL">Electricity & Power</option>
                  <option value="HYGIENE">Hygiene & Housekeeping</option>
                  <option value="CIVIL">Civil & Carpentry</option>
                  <option value="MISC">Mess & Facilities</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Subcategory</label>
                <input
                  type="text"
                  value={newSubcategory}
                  onChange={(e) => setNewSubcategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  placeholder="e.g. Pipe Leakage, Wiring, Fan"
                />
              </div>
            </div>

            {/* AI Priority Auto-Suggestion Box (Screen 4) */}
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-900 flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-rose-600" />
                  <span>Priority (Auto-suggested by AI): High</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white">
                  P1 / High
                </span>
              </div>
              <p className="text-xs text-rose-800 leading-relaxed">
                🤖 <strong>AI Suggestion:</strong> Marked High due to water wastage, potential slippery floor hazard, and corridor impact.
              </p>
            </div>

            {/* Title & Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Issue Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Description</label>
              <textarea
                rows={3}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-600 leading-relaxed"
              />
            </div>

            {/* Location: Hostel, Block, Room */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Hostel</label>
                <input
                  type="text"
                  disabled
                  value="Hostel 14 (HB-3)"
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-600 font-medium cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Block</label>
                <input
                  type="text"
                  value={newBlock}
                  onChange={(e) => setNewBlock(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Room No</label>
                <input
                  type="text"
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* Attach Photos / Videos Preview */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Attach Photos / Videos</span>
                <span className="text-[11px] text-slate-400 font-normal">Offline sample asset attached</span>
              </label>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span className="font-mono text-[11px]">leakage_pipe_b208.jpg</span>
                </div>
                <span className="text-[11px] text-emerald-600 font-bold">✓ Attached</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition disabled:opacity-50"
              >
                {isSubmitting ? "Dispatching AI..." : "Submit Complaint →"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (activeTab === "my_complaints") {
    // Screen 5: Complaint Tracking (Student View)
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h2 className="text-xl font-bold text-slate-900">My Complaints & Tracking</h2>
            <p className="text-xs text-slate-500 mt-0.5">Track the live status of your raised issues with immutable timeline events.</p>
          </div>
          <button
            onClick={() => setActiveTab("lodge_complaint")}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Complaint</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {["ALL", "OPEN", "IN_PROGRESS", "RESOLVED"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                filterStatus === status
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {status === "ALL" ? `All (${complaints.length})` : status.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* 2-Column Layout (Screen 5): List on Left, Interactive Timeline on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Complaint Cards */}
          <div className="lg:col-span-7 space-y-3">
            {complaints.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
                No complaints recorded yet. Click &ldquo;New Complaint&rdquo; to raise one.
              </div>
            ) : (
              complaints.map((c) => {
                const isSelected = selectedTicket?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectTicket(c)}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all space-y-2.5 ${
                      isSelected
                        ? "bg-blue-50/40 border-blue-500 shadow-sm ring-1 ring-blue-500/20"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-blue-600">{c.ticket_no}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            c.priority === "P1"
                              ? "bg-rose-100 text-rose-700"
                              : c.priority === "P2"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {c.priority}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          c.status === "CLOSED" || c.status === "RESOLVED"
                            ? "bg-emerald-100 text-emerald-700"
                            : c.status === "IN_PROGRESS"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900">{c.title}</h4>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>{c.hostel_code || "Hostel 14"} • {c.block_name || "B Block"} {c.room_no ? `Rm ${c.room_no}` : ""}</span>
                      <span className="text-blue-600 font-semibold">Inspect Timeline →</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Status Timeline Drawer (Screen 5) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5 sticky top-24">
            {selectedTicket ? (
              <>
                <div className="pb-3 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-600">
                      {selectedTicket.ticket_no}
                    </span>
                    <span className="text-[11px] text-slate-400">Live Audit Trail</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">{selectedTicket.title}</h3>
                </div>

                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Status Timeline
                </div>

                <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
                  {timelineEvents.length === 0 ? (
                    <div className="pl-6 text-xs text-slate-400">Loading audit events...</div>
                  ) : (
                    timelineEvents.map((evt, idx) => (
                      <div key={evt.id || idx} className="relative pl-6">
                        <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-white border-2 border-blue-600" />
                        <div className="space-y-0.5">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                            <span>{evt.to_status}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              {new Date(evt.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <div className="text-[11px] text-blue-600 font-medium">
                            By {evt.actor_role || "SYSTEM"} ({evt.actor_id || "Aarav Sharma"})
                          </div>
                          {evt.note && (
                            <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                              {evt.note}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                Select a complaint on the left to inspect its live status timeline.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === "rewards") {
    // Screen 11: Rewards & Gamification
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Rewards & Recognition</h2>
            <p className="text-xs text-slate-500 mt-0.5">Your contributions make a difference. Earn points for verifying and reporting issues.</p>
          </div>
          <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-xl border border-blue-200">
            <Award className="w-5 h-5 text-blue-600" />
            <div className="text-right">
              <span className="text-lg font-black text-blue-600 leading-none block">120</span>
              <span className="text-[10px] text-slate-500 font-semibold">Your Points</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Top Contributors Leaderboard */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Top Contributors (This Month)</span>
            </h3>

            <div className="divide-y divide-slate-100">
              {[
                { rank: 1, name: "Aryan S.", points: 320, hostel: "HB-3" },
                { rank: 2, name: "Priya M.", points: 280, hostel: "KMS" },
                { rank: 3, name: "Rahul K.", points: 240, hostel: "HB-3" },
                { rank: 4, name: "Sneha P.", points: 200, hostel: "CVR" },
                { rank: 5, name: "Aditya R.", points: 180, hostel: "GDB" }
              ].map((c) => (
                <div key={c.rank} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                        c.rank === 1
                          ? "bg-amber-100 text-amber-800"
                          : c.rank === 2
                          ? "bg-slate-200 text-slate-800"
                          : c.rank === 3
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {c.rank}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900">{c.name}</span>
                      <span className="text-[10px] text-slate-400 block">{c.hostel}</span>
                    </div>
                  </div>
                  <span className="font-extrabold text-blue-600 text-sm">{c.points} pts</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Badges Earned */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Award className="w-4 h-4 text-purple-600" />
              <span>Your Badges</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-2xl">🏅</div>
                <div className="text-xs font-bold text-slate-800">First Report</div>
                <div className="text-[10px] text-slate-500">First issue verified</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-2xl">🌱</div>
                <div className="text-xs font-bold text-slate-800">Clean Campus</div>
                <div className="text-[10px] text-slate-500">5+ hygiene reports</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-2xl">🤝</div>
                <div className="text-xs font-bold text-slate-800">Community Hero</div>
                <div className="text-[10px] text-slate-500">20+ helpful upvotes</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-2xl">⭐</div>
                <div className="text-xs font-bold text-slate-800">Top 10%</div>
                <div className="text-[10px] text-slate-500">Campus leader</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT: Screen 3 (Student Dashboard Overview)
  return (
    <div className="space-y-6">
      {/* 1. Greeting Banner (Screen 3) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Hello, Aryan 👋
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Let&apos;s make NIT Rourkela better together.</p>
        </div>

        <button
          onClick={() => setActiveTab("lodge_complaint")}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ New Complaint</span>
        </button>
      </div>

      {/* 2. Top Stats Cards (Screen 3) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-amber-600">{openCount || 2}</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Open</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-blue-600">{inProgressCount || 3}</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">In Progress</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-emerald-600">{resolvedCount || 5}</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Resolved</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-purple-600">120</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Reward Points</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 font-bold">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard Grid (Screen 3: Recent Complaints + Campus Live Status) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Recent Complaints (Screen 3) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Recent Complaints</h3>
            <button
              onClick={() => setActiveTab("my_complaints")}
              className="text-xs text-blue-600 font-bold hover:underline"
            >
              View All →
            </button>
          </div>

          <div className="space-y-3">
            {[
              {
                id: "1",
                title: "Water leakage in B Block",
                location: "Hostel 14 • Room 208",
                priority: "High",
                status: "In Progress",
                time: "2 days ago",
                color: "rose"
              },
              {
                id: "2",
                title: "Mess food quality issue",
                location: "Hostel 14 • Mess",
                priority: "Medium",
                status: "Open",
                time: "3 days ago",
                color: "amber"
              },
              {
                id: "3",
                title: "Street light not working",
                location: "Near Library Road",
                priority: "High",
                status: "Resolved",
                time: "5 days ago",
                color: "emerald"
              }
            ].map((item) => (
              <div
                key={item.id}
                onClick={() => setActiveTab("my_complaints")}
                className="p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                  <div className="text-[11px] text-slate-500 mt-0.5">{item.location}</div>
                </div>

                <div className="flex items-center space-x-2.5">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.priority === "High"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {item.priority}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.status === "Resolved"
                        ? "bg-emerald-100 text-emerald-700"
                        : item.status === "In Progress"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {item.status}
                  </span>
                  <span className="text-[10px] text-slate-400">{item.time}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Banner: Earn Rewards (Screen 3) */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 text-white flex items-center justify-between shadow-md shadow-blue-500/20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white text-xl">
                🏆
              </div>
              <div>
                <h4 className="text-xs font-bold">Earn Rewards</h4>
                <p className="text-[11px] text-blue-100">Report. Participate. Improve your campus.</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab("rewards")}
              className="px-3 py-1.5 rounded-xl bg-white text-blue-600 font-bold text-xs hover:bg-blue-50 transition"
            >
              View Rewards
            </button>
          </div>
        </div>

        {/* Right Column: Campus Live Status (Screen 3) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Campus Live Status</h3>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live NIT-R</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-center space-y-1">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-xs font-bold">
                ⚡
              </div>
              <div className="text-base font-black text-slate-900">88%</div>
              <div className="text-[10px] text-slate-500">Electricity</div>
              <span className="inline-block text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700">
                Good
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-center space-y-1">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto text-xs font-bold">
                💧
              </div>
              <div className="text-base font-black text-slate-900">76%</div>
              <div className="text-[10px] text-slate-500">Water Supply</div>
              <span className="inline-block text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700">
                Good
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-center space-y-1">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-xs font-bold">
                🧹
              </div>
              <div className="text-base font-black text-slate-900">82%</div>
              <div className="text-[10px] text-slate-500">Hygiene</div>
              <span className="inline-block text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700">
                Good
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-center space-y-1">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto text-xs font-bold">
                📶
              </div>
              <div className="text-base font-black text-slate-900">91%</div>
              <div className="text-[10px] text-slate-500">Network / WiFi</div>
              <span className="inline-block text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700">
                91% Good
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
