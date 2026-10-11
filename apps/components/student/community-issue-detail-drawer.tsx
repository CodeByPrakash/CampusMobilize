"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  XIcon,
  ThumbsUpIcon,
  Share2Icon,
  MapPinIcon,
  ClockIcon,
  SparklesIcon,
  AlertTriangleIcon,
  ShieldCheckIcon,
  UserIcon,
  CheckCircle2Icon,
  MessageSquareIcon,
  SendIcon,
  ExternalLinkIcon,
  ZapIcon,
  DropletsIcon,
  HammerIcon,
  FlameIcon,
  TrendingUpIcon,
  PhoneIcon,
  CheckIcon,
  CopyIcon,
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner";
import { apiGetComplaintTimeline, apiUpvoteComplaint } from "@/lib/api";

export interface CommunityComment {
  id: string;
  authorName: string;
  authorRoom: string;
  text: string;
  timeAgo: string;
  isVerified?: boolean;
}

interface CommunityIssueDetailDrawerProps {
  ticket: any | null;
  isOpen: boolean;
  onClose: () => void;
  hasUpvoted: boolean;
  upvoteCount: number;
  onToggleUpvote: (ticketId: string) => void;
}

export function CommunityIssueDetailDrawer({
  ticket,
  isOpen,
  onClose,
  hasUpvoted,
  upvoteCount,
  onToggleUpvote,
}: CommunityIssueDetailDrawerProps) {
  const [timeline, setTimeline] = React.useState<any[]>([]);
  const [timelineLoading, setTimelineLoading] = React.useState<boolean>(false);
  const [copiedLink, setCopiedLink] = React.useState<boolean>(false);
  const [affectedCount, setAffectedCount] = React.useState<number>(8);
  const [hasMarkedAffected, setHasMarkedAffected] = React.useState<boolean>(false);

  // Community peer comments state
  const [comments, setComments] = React.useState<CommunityComment[]>([]);
  const [newCommentText, setNewCommentText] = React.useState<string>("");

  // Load audit timeline & comments when ticket changes
  React.useEffect(() => {
    if (ticket) {
      setHasMarkedAffected(false);
      setAffectedCount(ticket.people_affected || 6);

      // Seed initial realistic comments based on ticket category
      const ticketTitle = (ticket.title || "").toLowerCase();
      const initialComments: CommunityComment[] = [];

      if (ticketTitle.includes("fan") || ticketTitle.includes("regulator") || ticket.category_code?.includes("ELEC")) {
        initialComments.push(
          {
            id: "c-1",
            authorName: "Rahul Sharma",
            authorRoom: "Room 206",
            text: "Same burning plastic smell was leaking into the corridor during evening study hours. Definitely needs urgent rewiring.",
            timeAgo: "3 hours ago",
          },
          {
            id: "c-2",
            authorName: "Diya Patel (CR)",
            authorRoom: "B-Wing Rep",
            text: "Verified on site during wing inspection. Reported to Caretaker R. Das for immediate electrician assignment.",
            timeAgo: "2 hours ago",
            isVerified: true,
          }
        );
      } else if (ticketTitle.includes("water") || ticketTitle.includes("cooler") || ticket.category_code?.includes("WATER")) {
        initialComments.push(
          {
            id: "c-1",
            authorName: "Soumya Das",
            authorRoom: "D-Block 102",
            text: "Water taste has been completely metallic since yesterday morning. Everyone on 1st floor has been having to walk over to CVR mess.",
            timeAgo: "4 hours ago",
          },
          {
            id: "c-2",
            authorName: "Rohan Mehta (Rep)",
            authorRoom: "Hostel Rep",
            text: "Piping pressure collapsed due to air blockage in the pump line. Maintenance team notified.",
            timeAgo: "1 hour ago",
            isVerified: true,
          }
        );
      } else {
        initialComments.push(
          {
            id: "c-1",
            authorName: "Amit Verma",
            authorRoom: "Room 312",
            text: "I noticed this issue as well. Really hope the maintenance crew fixes this before the weekend.",
            timeAgo: "5 hours ago",
          }
        );
      }
      setComments(initialComments);

      // Fetch official audit timeline from backend
      async function loadTimeline() {
        setTimelineLoading(true);
        try {
          const tId = ticket.ticket_no || ticket.id;
          const events = await apiGetComplaintTimeline(tId);
          if (Array.isArray(events) && events.length > 0) {
            setTimeline(events);
          } else {
            // Fallback default lifecycle
            setTimeline([
              {
                id: "e-1",
                from_status: null,
                to_status: "OPEN",
                actor_role: "STUDENT",
                note: "Complaint filed via CampusIQ Student Portal with location tag.",
                created_at: ticket.created_at || new Date().toISOString(),
              },
              {
                id: "e-2",
                from_status: "OPEN",
                to_status: ticket.status || "VERIFIED",
                actor_role: "HOSTEL_REP",
                note: "Endorsed by peer community upvotes. Forwarded to maintenance desk.",
                created_at: new Date().toISOString(),
              },
            ]);
          }
        } catch {
          setTimeline([
            {
              id: "e-1",
              from_status: null,
              to_status: "OPEN",
              actor_role: "STUDENT",
              note: "Complaint lodged by resident student.",
              created_at: ticket.created_at || new Date().toISOString(),
            },
            {
              id: "e-2",
              from_status: "OPEN",
              to_status: ticket.status || "IN_PROGRESS",
              actor_role: "CARETAKER",
              note: "Active in maintenance queue with assigned technician.",
              created_at: new Date().toISOString(),
            },
          ]);
        } finally {
          setTimelineLoading(false);
        }
      }
      loadTimeline();
    }
  }, [ticket]);

  // Esc key listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !ticket) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/student/upvotes#${ticket.ticket_no || ticket.id}`
    );
    setCopiedLink(true);
    toast.success("Ticket link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleMarkAffected = () => {
    if (!hasMarkedAffected) {
      setAffectedCount((prev) => prev + 1);
      setHasMarkedAffected(true);
      toast.success("You endorsed this issue as an affected resident!");
    } else {
      setAffectedCount((prev) => prev - 1);
      setHasMarkedAffected(false);
      toast.info("Endorsement removed.");
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment: CommunityComment = {
      id: `c-${Date.now()}`,
      authorName: "Aryan Sharma (You)",
      authorRoom: "Room 204",
      text: newCommentText.trim(),
      timeAgo: "Just now",
    };

    setComments((prev) => [newComment, ...prev]);
    setNewCommentText("");
    toast.success("Comment added to community thread!");
  };

  const isElectrical = ticket.category_code?.includes("ELEC");
  const isWater = ticket.category_code?.includes("WATER") || ticket.category_code?.includes("HYGIENE");
  const isP1 = ticket.priority === "P1";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Dimmed Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* FULL-HEIGHT RIGHT-SIDE SLIDE-OVER POPUP */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10 z-50">
        <div className="w-screen max-w-xl md:max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300 ease-out">
          {/* 1. STICKY TOP HEADER */}
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs font-bold text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs">
                {ticket.ticket_no || ticket.id}
              </span>

              <Badge
                variant="outline"
                className={`text-[10px] font-bold ${
                  isP1
                    ? "bg-rose-50 text-rose-700 border-rose-300"
                    : ticket.priority === "P2"
                    ? "bg-amber-50 text-amber-700 border-amber-300"
                    : "bg-slate-50 text-slate-700 border-slate-200"
                }`}
              >
                {ticket.priority || "P3"} PRIORITY
              </Badge>

              <Badge
                variant="outline"
                className={`text-[10px] uppercase font-mono ${
                  isElectrical
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : isWater
                    ? "bg-blue-50 text-blue-800 border-blue-200"
                    : "bg-purple-50 text-purple-800 border-purple-200"
                }`}
              >
                {ticket.category_code || "GENERAL"}
              </Badge>

              <Badge
                className={`text-[10px] font-semibold py-0.5 px-2 ${
                  ticket.status === "RESOLVED" || ticket.status === "CLOSED"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : ticket.status === "IN_PROGRESS"
                    ? "bg-blue-100 text-blue-800 border-blue-300"
                    : ticket.status === "ASSIGNED"
                    ? "bg-indigo-100 text-indigo-800 border-indigo-300"
                    : "bg-slate-100 text-slate-800 border-slate-300"
                }`}
              >
                {ticket.status}
              </Badge>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleCopyLink}
                className="text-slate-500 hover:text-slate-800 rounded-full"
                title="Copy share link"
              >
                {copiedLink ? <CheckIcon className="size-4 text-emerald-600" /> : <Share2Icon className="size-4" />}
              </Button>

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 rounded-full"
              >
                <XIcon className="size-5" />
                <span className="sr-only">Close drawer</span>
              </Button>
            </div>
          </div>

          {/* 2. SCROLLABLE BODY (Full Height Display) */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* Post Author & Main Content Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {ticket.reported_by ? ticket.reported_by.charAt(0).toUpperCase() : "A"}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Resident Student</span>
                      <span className="text-[10px] text-slate-400 font-normal">• Verified Student</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Hostel 14 (HB-3) • {ticket.block_name || "B-Block"}
                    </p>
                  </div>
                </div>

                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <ClockIcon className="size-3" />
                  Lodged {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : "Today"}
                </span>
              </div>

              <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug tracking-tight">
                {ticket.title}
              </h1>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {ticket.description}
              </div>

              {/* Location & Impact Banner */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center gap-2">
                  <MapPinIcon className="size-4 text-indigo-600 shrink-0" />
                  <div className="truncate">
                    <span className="text-[10px] text-slate-400 block font-medium">Exact Location</span>
                    <strong className="text-slate-800 text-xs truncate">
                      {ticket.location_text || `${ticket.block_name || "Block B"}, Room ${ticket.room_no || "204"}`}
                    </strong>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center gap-2">
                  <UsersIcon className="size-4 text-indigo-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Residents Affected</span>
                    <strong className="text-slate-800 text-xs">
                      {affectedCount} Hostelites
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* CampusIQ AI Intelligence Triage Panel */}
            <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                  <SparklesIcon className="size-4 text-indigo-600" />
                  <span>CampusIQ AI Autonomous Triage Intelligence</span>
                </div>
                <Badge className="bg-indigo-600 text-white text-[10px] font-mono">
                  Neural Model v3.0
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                  <span className="text-[10px] text-slate-400 block">Risk Score</span>
                  <span
                    className={`text-sm font-bold font-mono ${
                      (ticket.risk_score || 75) > 80
                        ? "text-rose-600"
                        : (ticket.risk_score || 75) > 50
                        ? "text-amber-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {Math.round(ticket.risk_score || 78)}/100
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                  <span className="text-[10px] text-slate-400 block">AI Category Confidence</span>
                  <span className="text-sm font-bold font-mono text-indigo-700">
                    {Math.round((ticket.ai_category_confidence || 0.96) * 100)}%
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                  <span className="text-[10px] text-slate-400 block">Queue Boost</span>
                  <span className="text-sm font-bold font-mono text-emerald-600">
                    +{Math.min(45, upvoteCount * 3.5).toFixed(0)} ranks
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-indigo-900 leading-relaxed bg-white/80 p-2.5 rounded-lg border border-indigo-100">
                <strong>Autonomous Prioritization:</strong> Each community upvote adds weight to the dynamic SLA queue rank (§2.2). Issues reaching &gt;10 upvotes trigger priority escalation alerts to the Warden.
              </p>
            </Card>

            {/* Assigned Tradesman & Work Order Details (if assigned) */}
            {ticket.assigned_to_name && (
              <Card className="border-slate-200 bg-white p-4 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Designated Institute Tradesman
                  </span>
                  <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
                    Work Order Dispatched
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-800 text-xs">
                      {isElectrical ? (
                        <ZapIcon className="size-5 text-amber-500" />
                      ) : (
                        <DropletsIcon className="size-5 text-blue-500" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {ticket.assigned_to_name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {isElectrical ? "Senior Electrician" : "Head Plumber"} • Institute Works Dept
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-mono text-indigo-600 font-semibold">
                    SLA: {isP1 ? "2h Turnaround" : "8h Turnaround"}
                  </span>
                </div>
              </Card>
            )}

            {/* Official Audit Timeline */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheckIcon className="size-3.5 text-indigo-600" />
                  Official Verification & Action Timeline
                </h4>
                <span className="text-[11px] text-slate-400">
                  {timeline.length} Recorded Milestones
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                {timelineLoading ? (
                  <div className="text-xs text-slate-400 py-3 text-center">Loading audit timeline...</div>
                ) : (
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {timeline.map((evt: any, eIdx: number) => (
                      <div key={evt.id || eIdx} className="relative space-y-1">
                        <div className="absolute -left-6 top-0.5 size-3.5 rounded-full bg-indigo-600 border-2 border-white shadow-2xs" />
                        <div className="flex items-center justify-between text-xs">
                          <strong className="text-slate-900 font-mono">
                            {evt.to_status}
                          </strong>
                          <span className="text-[10px] text-slate-400">
                            {evt.actor_role} • {evt.created_at ? new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Today"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          {evt.note || `Transitioned status to ${evt.to_status}`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Community Peer Discussion & Confirmation Comments */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquareIcon className="size-3.5 text-indigo-600" />
                  Hostel Peer Confirmations ({comments.length})
                </h4>
                <span className="text-[11px] text-slate-400">
                  Visible to Hostel 14 residents
                </span>
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Confirm or add details (e.g., 'Same issue on 3rd floor')..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 bg-white"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1 shrink-0 px-3 rounded-xl"
                >
                  <SendIcon className="size-3" />
                  <span>Post</span>
                </Button>
              </form>

              {/* Comments List */}
              <div className="space-y-2.5 pt-1">
                {comments.map((cm) => (
                  <div
                    key={cm.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <strong className="text-slate-800">{cm.authorName}</strong>
                        <span className="text-[10px] text-slate-400">({cm.authorRoom})</span>
                        {cm.isVerified && (
                          <Badge className="bg-emerald-100 text-emerald-800 text-[9px] py-0 px-1">
                            Staff Verified
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">{cm.timeAgo}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {cm.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. STICKY BOTTOM FOOTER (Primary Community Actions) */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Upvote Button */}
              <Button
                size="sm"
                onClick={() => onToggleUpvote(ticket.id)}
                className={`flex-1 sm:flex-none text-xs gap-1.5 font-bold px-4 py-2 rounded-xl transition-all shadow-2xs ${
                  hasUpvoted
                    ? "bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-600/20"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
              >
                <ThumbsUpIcon className={`size-3.5 ${hasUpvoted ? "fill-white" : ""}`} />
                <span>
                  {hasUpvoted ? `Upvoted (${upvoteCount})` : `Upvote Issue (${upvoteCount})`}
                </span>
              </Button>

              {/* Endorse as Affected Button */}
              <Button
                size="sm"
                variant="outline"
                onClick={handleMarkAffected}
                className={`text-xs gap-1.5 rounded-xl border-slate-200 ${
                  hasMarkedAffected
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800 font-bold"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <UsersIcon className="size-3.5" />
                <span>{hasMarkedAffected ? "Endorsed (+1)" : "I'm Also Affected"}</span>
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs text-slate-500 hover:text-slate-800 w-full sm:w-auto"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
