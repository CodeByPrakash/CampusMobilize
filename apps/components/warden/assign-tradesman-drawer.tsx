"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  XIcon,
  ZapIcon,
  DropletsIcon,
  HammerIcon,
  WrenchIcon,
  PhoneIcon,
  CheckCircle2Icon,
  ClockIcon,
  AlertTriangleIcon,
  ShieldCheckIcon,
  MapPinIcon,
  SendIcon,
  CalendarIcon,
  UserCheckIcon,
  SparklesIcon,
  MessageSquareIcon,
  CheckIcon,
} from "lucide-react";
import { toast } from "sonner";
import { apiTransitionComplaint } from "@/lib/api";

export interface Tradesman {
  id: string;
  name: string;
  trade: "Electrician" | "Plumber" | "Carpenter" | "Caretaker";
  tradeTitle: string;
  licenseNo?: string;
  rating: string;
  experienceYears: number;
  activeJobs: number;
  phone: string;
  isAvailable: boolean;
  avatarColor: string;
  specialties: string[];
}

export const TRADESMEN_ROSTER: Tradesman[] = [
  {
    id: "tm-1",
    name: "Suresh Babu",
    trade: "Electrician",
    tradeTitle: "Senior Institute Electrician",
    licenseNo: "ELE-4491-OD",
    rating: "4.9★",
    experienceYears: 12,
    activeJobs: 2,
    phone: "+91 94371 28910",
    isAvailable: true,
    avatarColor: "bg-amber-100 text-amber-800 border-amber-300",
    specialties: ["Burnt Regulators", "Switchboards", "Short Circuits", "Ceiling Fans"],
  },
  {
    id: "tm-2",
    name: "Maheswar Nayak",
    trade: "Plumber",
    tradeTitle: "Head Plumber & Pipefitter",
    licenseNo: "PLM-2204-OD",
    rating: "4.8★",
    experienceYears: 15,
    activeJobs: 1,
    phone: "+91 98610 55421",
    isAvailable: true,
    avatarColor: "bg-blue-100 text-blue-800 border-blue-300",
    specialties: ["Water Coolers", "Overhead Sumps", "Flush Valves", "Pipe Leakages"],
  },
  {
    id: "tm-3",
    name: "Pravat Kumar Jena",
    trade: "Electrician",
    tradeTitle: "Electrician Grade II",
    licenseNo: "ELE-8812-OD",
    rating: "4.7★",
    experienceYears: 7,
    activeJobs: 0,
    phone: "+91 94390 88214",
    isAvailable: true,
    avatarColor: "bg-amber-100 text-amber-800 border-amber-300",
    specialties: ["Tube Lights", "Corridor Wiring", "MCB Tripping", "Geysers"],
  },
  {
    id: "tm-4",
    name: "Bikram Rout",
    trade: "Plumber",
    tradeTitle: "Sanitation & Drainage Specialist",
    licenseNo: "PLM-3310-OD",
    rating: "4.7★",
    experienceYears: 9,
    activeJobs: 1,
    phone: "+91 99370 77123",
    isAvailable: true,
    avatarColor: "bg-blue-100 text-blue-800 border-blue-300",
    specialties: ["Drainage Blocks", "Bathroom Fittings", "RO Filtration", "Taps"],
  },
  {
    id: "tm-5",
    name: "Bijay Carpenter",
    trade: "Carpenter",
    tradeTitle: "Master Carpenter & Locksmith",
    licenseNo: "CRP-1082-OD",
    rating: "4.7★",
    experienceYears: 11,
    activeJobs: 0,
    phone: "+91 94382 11902",
    isAvailable: true,
    avatarColor: "bg-stone-100 text-stone-800 border-stone-300",
    specialties: ["Door Padlocks", "Window Latches", "Bed Repair", "Cupboards"],
  },
  {
    id: "tm-6",
    name: "R. Das",
    trade: "Caretaker",
    tradeTitle: "Senior Resident Caretaker",
    licenseNo: "CRT-0044-OD",
    rating: "4.8★",
    experienceYears: 14,
    activeJobs: 3,
    phone: "+91 97780 34120",
    isAvailable: true,
    avatarColor: "bg-purple-100 text-purple-800 border-purple-300",
    specialties: ["Emergency Triage", "First-Line Response", "Civil Coordination"],
  },
];

interface AssignTradesmanDrawerProps {
  ticket: any | null;
  isOpen: boolean;
  onClose: () => void;
  initialTrade?: "Electrician" | "Plumber" | "Carpenter" | "Caretaker" | "All";
  onSuccess?: (ticketId: string, tradesman: Tradesman, note: string) => void;
}

export function AssignTradesmanDrawer({
  ticket,
  isOpen,
  onClose,
  initialTrade = "All",
  onSuccess,
}: AssignTradesmanDrawerProps) {
  const [selectedTrade, setSelectedTrade] = React.useState<string>(initialTrade);
  const [selectedTradesman, setSelectedTradesman] = React.useState<Tradesman | null>(null);
  const [priorityOverride, setPriorityOverride] = React.useState<string>("P2");
  const [customInstructions, setCustomInstructions] = React.useState<string>("");
  const [notifySms, setNotifySms] = React.useState<boolean>(true);
  const [notifyResident, setNotifyResident] = React.useState<boolean>(true);
  const [submitting, setSubmitting] = React.useState<boolean>(false);

  // Sync state whenever ticket or initialTrade changes
  React.useEffect(() => {
    if (ticket) {
      // Auto-detect optimal trade from ticket category
      const cat = (ticket.category_code || "").toUpperCase();
      let defaultTrade = initialTrade;
      if (initialTrade === "All") {
        if (cat.includes("ELEC")) defaultTrade = "Electrician";
        else if (cat.includes("WATER") || cat.includes("HYGIENE")) defaultTrade = "Plumber";
        else if (cat.includes("CIVIL") || cat.includes("SECURITY")) defaultTrade = "Carpenter";
        else defaultTrade = "All";
      }
      setSelectedTrade(defaultTrade);

      // Pre-select the highest rated available tradesman for that trade
      const filtered = TRADESMEN_ROSTER.filter(
        (tm) => defaultTrade === "All" || tm.trade === defaultTrade
      );
      if (filtered.length > 0) {
        setSelectedTradesman(filtered[0]);
      } else {
        setSelectedTradesman(TRADESMEN_ROSTER[0]);
      }

      setPriorityOverride(ticket.priority || "P2");

      // Generate suggested instruction based on ticket title
      const titleLower = (ticket.title || "").toLowerCase();
      if (titleLower.includes("fan") || titleLower.includes("regulator")) {
        setCustomInstructions("Carry spare 10A fan regulator, wire stripper, and multi-meter. Inspect ceiling hook wiring.");
      } else if (titleLower.includes("cooler") || titleLower.includes("water")) {
        setCustomInstructions("Check inline filter cartridges, compressor inlet pressure, and drainage pipe collar.");
      } else if (titleLower.includes("lock") || titleLower.includes("gate")) {
        setCustomInstructions("Inspect padlock shackle and door alignment. Replace with heavy-duty Godrej 65mm lock if broken.");
      } else {
        setCustomInstructions("Inspect issue with room occupant, test circuit/piping, and take completion proof photo.");
      }
    }
  }, [ticket, initialTrade]);

  // Handle ESC key to close
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Filter roster by active trade tab
  const filteredRoster = React.useMemo(() => {
    if (selectedTrade === "All") return TRADESMEN_ROSTER;
    return TRADESMEN_ROSTER.filter((tm) => tm.trade === selectedTrade);
  }, [selectedTrade]);

  if (!isOpen || !ticket) return null;

  const handleConfirmAssignment = async () => {
    if (!selectedTradesman) {
      toast.error("Please select a tradesman to dispatch.");
      return;
    }

    setSubmitting(true);
    const ticketId = ticket.ticket_no || ticket.id;

    try {
      const assignmentNote = `Assigned to ${selectedTradesman.name} (${selectedTradesman.trade}) by Warden Dr. S. Nanda. Instructions: ${customInstructions || "Immediate inspection & repair."}`;

      await apiTransitionComplaint(ticketId, {
        to_status: "ASSIGNED",
        assignee_id: selectedTradesman.id,
        tradesman_name: selectedTradesman.name,
        trade: selectedTradesman.trade,
        note: assignmentNote,
      });

      toast.success(
        `Work order dispatched to ${selectedTradesman.name}! ${
          notifySms ? "SMS & WhatsApp alert dispatched." : ""
        }`
      );

      if (onSuccess) {
        onSuccess(ticketId, selectedTradesman, assignmentNote);
      }
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Failed to assign tradesman. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getTradeIcon = (trade: string) => {
    switch (trade) {
      case "Electrician":
        return <ZapIcon className="size-4 text-amber-500" />;
      case "Plumber":
        return <DropletsIcon className="size-4 text-blue-500" />;
      case "Carpenter":
        return <HammerIcon className="size-4 text-stone-600" />;
      default:
        return <WrenchIcon className="size-4 text-indigo-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Full-Height Right-Side Slide-Over Popup */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 z-50">
        <div className="w-screen max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300 ease-out">
          {/* 1. STICKY TOP HEADER */}
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-start justify-between shrink-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-indigo-600 text-white text-[11px] font-mono px-2 py-0.5">
                  {ticket.ticket_no || ticket.id}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-[11px] font-semibold ${
                    ticket.priority === "P1"
                      ? "bg-rose-50 text-rose-700 border-rose-300"
                      : ticket.priority === "P2"
                      ? "bg-amber-50 text-amber-700 border-amber-300"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}
                >
                  {ticket.priority || "P3"} Priority
                </Badge>
                <Badge variant="outline" className="text-[11px] font-mono uppercase bg-white">
                  {ticket.category_code || "GENERAL"}
                </Badge>
              </div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Assign Tradesman & Dispatch Work Order
              </h2>
              <p className="text-xs text-slate-500">
                Official Warden resource allocation with SLA enforcement & mobile alert.
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full"
            >
              <XIcon className="size-5" />
              <span className="sr-only">Close drawer</span>
            </Button>
          </div>

          {/* 2. SCROLLABLE BODY (Full display height content) */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* Complaint Summary Card */}
            <Card className="border-slate-200 bg-white shadow-2xs p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Resident Complaint
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {ticket.title}
                  </h3>
                </div>
                <Badge
                  variant="outline"
                  className="text-[11px] bg-slate-50 text-slate-700 border-slate-200 shrink-0"
                >
                  Status: {ticket.status}
                </Badge>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                {ticket.description}
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <MapPinIcon className="size-3.5 text-indigo-500 shrink-0" />
                  <span className="truncate">
                    {ticket.location_text || `${ticket.block_name || "Block B"}, Rm ${ticket.room_no || "204"}`}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ClockIcon className="size-3.5 text-slate-400 shrink-0" />
                  <span>
                    SLA Target:{" "}
                    <strong className="text-slate-800">
                      {ticket.priority === "P1" ? "2 Hours" : ticket.priority === "P2" ? "8 Hours" : "24 Hours"}
                    </strong>
                  </span>
                </div>
              </div>

              {/* AI Recommendation Badge */}
              <div className="flex items-center gap-2 p-2 bg-indigo-50/80 rounded-md border border-indigo-100 text-[11px] text-indigo-900">
                <SparklesIcon className="size-3.5 text-indigo-600 shrink-0 animate-pulse" />
                <span>
                  <strong>CampusIQ Recommendation:</strong> Skill match suggests{" "}
                  {ticket.category_code?.includes("ELEC")
                    ? "Senior Electrician (Suresh Babu)"
                    : ticket.category_code?.includes("WATER")
                    ? "Head Plumber (Maheswar Nayak)"
                    : "Resident Caretaker (R. Das)"}.
                </span>
              </div>
            </Card>

            {/* Trade Selection Tabs */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Filter By Trade Specialty</span>
                <span className="text-[11px] font-normal text-slate-400">
                  {filteredRoster.length} technicians available
                </span>
              </label>

              <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                {["All", "Electrician", "Plumber", "Carpenter"].map((trade) => {
                  const isActive = selectedTrade === trade;
                  return (
                    <button
                      key={trade}
                      type="button"
                      onClick={() => {
                        setSelectedTrade(trade);
                        const list =
                          trade === "All"
                            ? TRADESMEN_ROSTER
                            : TRADESMEN_ROSTER.filter((t) => t.trade === trade);
                        if (list.length > 0) setSelectedTradesman(list[0]);
                      }}
                      className={`text-xs font-semibold py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        isActive
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {trade === "Electrician" && <ZapIcon className="size-3 text-amber-500" />}
                      {trade === "Plumber" && <DropletsIcon className="size-3 text-blue-500" />}
                      {trade === "Carpenter" && <HammerIcon className="size-3 text-stone-500" />}
                      <span>{trade}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Select Technician Roster */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Available Certified Institute Tradesmen</span>
                <span className="text-[11px] font-normal text-slate-500">
                  Click to select technician
                </span>
              </label>

              <div className="space-y-2">
                {filteredRoster.map((tm) => {
                  const isSelected = selectedTradesman?.id === tm.id;
                  return (
                    <div
                      key={tm.id}
                      onClick={() => setSelectedTradesman(tm)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-600/15 shadow-2xs"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`size-10 rounded-xl flex items-center justify-center border font-bold text-xs shrink-0 ${tm.avatarColor}`}
                        >
                          {getTradeIcon(tm.trade)}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">
                              {tm.name}
                            </h4>
                            <Badge variant="outline" className="text-[10px] bg-white font-normal">
                              {tm.tradeTitle}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                            <span className="font-semibold text-amber-600">{tm.rating}</span>
                            <span>{tm.experienceYears} yrs exp</span>
                            <span className="font-mono text-[11px]">{tm.licenseNo}</span>
                          </div>

                          <div className="flex flex-wrap gap-1 pt-1">
                            {tm.specialties.slice(0, 3).map((spec, sIdx) => (
                              <span
                                key={sIdx}
                                className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded"
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                        <div className="flex items-center gap-1.5">
                          <Badge
                            className={`text-[10px] font-medium ${
                              tm.activeJobs === 0
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                : tm.activeJobs === 1
                                ? "bg-blue-100 text-blue-800 border-blue-200"
                                : "bg-amber-100 text-amber-800 border-amber-200"
                            }`}
                          >
                            {tm.activeJobs === 0
                              ? "Immediate (0 Jobs)"
                              : `${tm.activeJobs} Active Jobs`}
                          </Badge>
                          <div
                            className={`size-4 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? "border-indigo-600 bg-indigo-600 text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isSelected && <CheckIcon className="size-3" />}
                          </div>
                        </div>

                        <a
                          href={`tel:${tm.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-mono pt-2"
                        >
                          <PhoneIcon className="size-3" />
                          {tm.phone}
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SLA Priority & Deadline Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Dispatch Priority & SLA Turnaround</span>
                <span className="text-[11px] font-mono text-slate-400">
                  Target: {priorityOverride}
                </span>
              </label>

              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                {[
                  { prio: "P1", label: "2 Hours", desc: "Emergency" },
                  { prio: "P2", label: "8 Hours", desc: "Priority" },
                  { prio: "P3", label: "24 Hours", desc: "Standard" },
                  { prio: "P4", label: "48 Hours", desc: "Scheduled" },
                ].map((item) => (
                  <button
                    key={item.prio}
                    type="button"
                    onClick={() => setPriorityOverride(item.prio)}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      priorityOverride === item.prio
                        ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600/20"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="font-bold text-slate-900">{item.prio}</div>
                    <div className="text-[11px] font-semibold text-indigo-700">{item.label}</div>
                    <div className="text-[10px] text-slate-400">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Special Instructions Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MessageSquareIcon className="size-3.5 text-indigo-600" />
                <span>Warden Instructions for Technician</span>
              </label>
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Enter specific repair notes, parts required, or safety precautions..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none resize-none h-20 bg-white text-slate-800"
              />
            </div>

            {/* Notification Checkboxes */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={notifySms}
                  onChange={(e) => setNotifySms(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 accent-indigo-600"
                />
                <span>Send SMS & WhatsApp work-order dispatch notification to tradesman</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={notifyResident}
                  onChange={(e) => setNotifyResident(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 accent-indigo-600"
                />
                <span>Notify resident student with technician contact and ETA</span>
              </label>
            </div>
          </div>

          {/* 3. STICKY BOTTOM FOOTER */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/90 flex items-center justify-between gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={submitting}
              className="text-xs text-slate-600"
            >
              Cancel
            </Button>

            <Button
              size="sm"
              onClick={handleConfirmAssignment}
              disabled={submitting || !selectedTradesman}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 gap-1.5 shadow-2xs"
            >
              {submitting ? (
                <>
                  <div className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Dispatching Order...</span>
                </>
              ) : (
                <>
                  <SendIcon className="size-3.5" />
                  <span>
                    Dispatch to {selectedTradesman?.name || "Tradesman"}
                  </span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
