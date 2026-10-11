"use client";

import React, { useState } from "react";
import { usePersona } from "../../context/PersonaContext";
import { createComplaint } from "../../lib/api";
import {
  AlertTriangle,
  CheckCircle2,
  Zap,
  Droplets,
  Sparkles,
  Home,
  Shield,
  HelpCircle,
  Users,
  Send,
  Info,
  FileText
} from "lucide-react";

const CATEGORIES = [
  { code: "AUTO", label: "Auto (AI Inference)", icon: <Sparkles className="w-4 h-4 text-emerald-400" /> },
  { code: "ELECTRICAL", label: "Electrical", icon: <Zap className="w-4 h-4 text-amber-400" /> },
  { code: "WATER", label: "Water & Plumbing", icon: <Droplets className="w-4 h-4 text-blue-400" /> },
  { code: "HYGIENE", label: "Hygiene", icon: <Sparkles className="w-4 h-4 text-teal-400" /> },
  { code: "CIVIL", label: "Civil / Woodwork", icon: <Home className="w-4 h-4 text-orange-400" /> },
  { code: "SECURITY", label: "Security & Safety", icon: <Shield className="w-4 h-4 text-red-400" /> },
  { code: "MISC", label: "Miscellaneous", icon: <HelpCircle className="w-4 h-4 text-slate-400" /> }
];

const HOSTELS = [
  { code: "HB-3", name: "Homi Bhabha Hall (HB-3)" },
  { code: "KMS", name: "Kiran Mazumdar-Shaw Hall (KMS)" },
  { code: "CVR", name: "C.V. Raman Hall (CVR)" },
  { code: "GDB", name: "Gopabandhu Das Hall (GDB)" }
];

const BLOCKS = ["A Block", "B Block", "C Block", "Pump Room Area", "Mess Block", "Common Corridors"];

export default function LodgeComplaintView({ onSuccess }: { onSuccess?: () => void }) {
  const { activePersona, setActiveTab } = usePersona();

  const [category, setCategory] = useState<string>("AUTO");
  const [hostel, setHostel] = useState<string>(activePersona.hostelCode || "HB-3");
  const [block, setBlock] = useState<string>("A Block");
  const [roomNo, setRoomNo] = useState<string>("204");
  const [locationText, setLocationText] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [severity, setSeverity] = useState<number>(3);
  const [peopleAffected, setPeopleAffected] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successTicket, setSuccessTicket] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const isEmergency = severity === 5 || title.toLowerCase().includes("fire") || title.toLowerCase().includes("wire");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const payload = {
        title,
        description,
        category_code: category,
        hostel_code: hostel,
        block_name: block,
        location_text: locationText || `${block}, Rm ${roomNo}`,
        severity,
        people_affected: peopleAffected,
        reported_by: activePersona.id,
        actor_role: activePersona.role,
        priority: isEmergency ? "P1" : undefined
      };

      const res = await createComplaint(payload, activePersona);
      setSuccessTicket(res);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successTicket) {
    return (
      <div className="max-w-2xl mx-auto glass-panel p-8 rounded-2xl text-center space-y-6 animate-in fade-in">
        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Complaint Lodged Successfully</h2>
          <div className="mt-2 inline-block px-4 py-1.5 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono text-base font-bold">
            {successTicket.ticket_no}
          </div>
        </div>
        <p className="text-slate-300 text-sm max-w-md mx-auto">
          AI triage has assigned priority{" "}
          <span className="font-bold text-white">{successTicket.priority}</span> ({successTicket.category_code}) with Risk Score{" "}
          <span className="font-bold text-white">{successTicket.risk_score}/100</span>.
          {successTicket.priority === "P1" && (
            <span className="block mt-2 text-rose-400 font-semibold">
              ⚡ High-Risk P1 Event: Verification bypassed; Caretaker auto-dispatched with 2-hour SLA deadline!
            </span>
          )}
        </p>

        <div className="flex justify-center space-x-3 pt-4">
          <button
            onClick={() => {
              setSuccessTicket(null);
              setTitle("");
              setDescription("");
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-sm hover:bg-slate-700"
          >
            Lodge Another Complaint
          </button>
          <button
            onClick={() => setActiveTab("my_complaints")}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-sm font-semibold"
          >
            Track in My Complaints
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center">
          <FileText className="w-6 h-6 mr-2.5 text-emerald-400" />
          Lodge Campus Facility Complaint
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Logged in as <span className="text-emerald-400 font-medium">{activePersona.name}</span> ({activePersona.designation})
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-sm flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 text-red-400 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 glass-panel p-6 sm:p-8 rounded-2xl">
        {/* Step 1: Category */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            1. Issue Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat.code}
                onClick={() => setCategory(cat.code)}
                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center space-x-2 transition-all ${
                  category === cat.code
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold"
                    : "bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                {cat.icon}
                <span className="truncate">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Location Picker */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Hostel</label>
            <select
              value={hostel}
              onChange={(e) => setHostel(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              {HOSTELS.map((h) => (
                <option key={h.code} value={h.code}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Block / Area</label>
            <select
              value={block}
              onChange={(e) => setBlock(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              {BLOCKS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Room # / Specific Spot</label>
            <input
              type="text"
              value={roomNo}
              onChange={(e) => setRoomNo(e.target.value)}
              placeholder="e.g. 204 or Washroom 2F"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Step 3: Details */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Issue Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Ceiling fan speed regulator broken"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Detailed Description</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the failure, duration, and any physical hazard..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Step 4: Severity & People Affected */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-400">Severity Level: {severity}/5</label>
              <span className={`text-xs font-bold ${severity >= 4 ? "text-rose-400" : "text-amber-400"}`}>
                {severity === 5 ? "Critical Hazard" : severity >= 3 ? "Major Operational" : "Minor Inconvenience"}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              value={severity}
              onChange={(e) => setSeverity(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-400">Estimated People Affected</label>
              <span className="text-xs font-bold text-slate-200">{peopleAffected} students</span>
            </div>
            <input
              type="number"
              min={1}
              max={500}
              value={peopleAffected}
              onChange={(e) => setPeopleAffected(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Live AI Triage Alert Box */}
        {isEmergency && (
          <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-red-200">
              <span className="font-bold text-red-100">Life-Safety Emergency Detected (P1):</span> This ticket will trigger instant automatic assignment, skipping normal verification stages and notifying the Warden immediately.
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-50"
        >
          {isSubmitting ? (
            <span>Triage & Lodging via AI...</span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Submit Complaint for Autonomous Triage</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
