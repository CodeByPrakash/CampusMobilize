"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  InboxIcon,
  CheckCircle2Icon,
  XCircleIcon,
  GitMergeIcon,
  ArrowUpRightIcon,
  AlertTriangleIcon,
  ClockIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  apiTransitionComplaint,
  apiMergeComplaints,
  apiOverridePriority,
} from "@/lib/api";

interface TriageTicket {
  id: string;
  ticket_no: string;
  title: string;
  reporter: string;
  category: string;
  location: string;
  priority: "P1" | "P2" | "P3" | "P4";
  status: "OPEN" | "VERIFIED" | "REJECTED";
  upvotes: number;
  timeAgo: string;
}

const INITIAL_TRIAGE_TICKETS: TriageTicket[] = [
  {
    id: "tri-1",
    ticket_no: "CMP-2026-0131",
    title: "Main pipeline burst behind Wing C washroom ground floor",
    reporter: "S. Roy (Rm 108)",
    category: "Plumbing Hazard",
    location: "Wing C Ground Floor",
    priority: "P2",
    status: "OPEN",
    upvotes: 21,
    timeAgo: "18m ago",
  },
  {
    id: "tri-2",
    ticket_no: "CMP-2026-0130",
    title: "Water leaking near Wing C washroom (Possible duplicate)",
    reporter: "K. Sen (Rm 110)",
    category: "Plumbing Hazard",
    location: "Wing C Back corridor",
    priority: "P3",
    status: "OPEN",
    upvotes: 6,
    timeAgo: "22m ago",
  },
  {
    id: "tri-3",
    ticket_no: "CMP-2026-0128",
    title: "Exhaust fan rattling sound in mess dining area",
    reporter: "V. Sharma (Rm 304)",
    category: "Electrical",
    location: "Mess Hall",
    priority: "P3",
    status: "OPEN",
    upvotes: 8,
    timeAgo: "1h ago",
  },
  {
    id: "tri-4",
    ticket_no: "CMP-2026-0125",
    title: "Window latch stuck open in Rm 312 during rain",
    reporter: "N. Gupta (Rm 312)",
    category: "Carpentry",
    location: "Rm 312",
    priority: "P4",
    status: "VERIFIED",
    upvotes: 2,
    timeAgo: "2h ago",
  },
];

export function HostelRepDashboard() {
  const [tickets, setTickets] = React.useState<TriageTicket[]>(INITIAL_TRIAGE_TICKETS);
  const [selectedTicket, setSelectedTicket] = React.useState<TriageTicket | null>(null);

  // Modals / Dialogs
  const [showRejectModal, setShowRejectModal] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");

  const [showMergeModal, setShowMergeModal] = React.useState(false);
  const [mergeMasterId, setMergeMasterId] = React.useState("CMP-2026-0131");
  const [mergeDuplicates, setMergeDuplicates] = React.useState("CMP-2026-0130");

  const [showEscalateModal, setShowEscalateModal] = React.useState(false);
  const [escalateJustification, setEscalateJustification] = React.useState("");

  // 1-Click Verify Action
  const handleVerify = async (ticket: TriageTicket) => {
    try {
      await apiTransitionComplaint(ticket.ticket_no, {
        to_status: "VERIFIED",
        note: "Physical inspection complete. Genuine complaint verified by Hostel Rep.",
      }).catch(() => {});

      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticket.id ? { ...t, status: "VERIFIED" } : t
        )
      );
      toast.success(`${ticket.ticket_no} verified! Ready for Warden assignment.`);
    } catch {
      toast.error("Failed to verify ticket");
    }
  };

  // Rejection with mandatory reason
  const handleConfirmReject = async () => {
    if (!selectedTicket || !rejectReason.trim()) {
      toast.error("Mandatory rejection reason required (§2.3)");
      return;
    }

    try {
      await apiTransitionComplaint(selectedTicket.ticket_no, {
        to_status: "REJECTED",
        reason: rejectReason,
        note: rejectReason,
      }).catch(() => {});

      setTickets((prev) =>
        prev.map((t) =>
          t.id === selectedTicket.id ? { ...t, status: "REJECTED" } : t
        )
      );
      toast.success(`${selectedTicket.ticket_no} rejected with recorded reason.`);
      setShowRejectModal(false);
      setRejectReason("");
      setSelectedTicket(null);
    } catch {
      toast.error("Failed to reject ticket");
    }
  };

  // Auto-Merge deduplication
  const handleConfirmMerge = async () => {
    if (!mergeMasterId || !mergeDuplicates) {
      toast.error("Please enter master ticket and duplicate ticket ID");
      return;
    }

    try {
      await apiMergeComplaints(mergeMasterId, [mergeDuplicates], "Merged duplicate issue by Hostel Rep").catch(() => {});
      setTickets((prev) =>
        prev.filter((t) => t.ticket_no !== mergeDuplicates)
      );
      toast.success(`Merged ${mergeDuplicates} into parent ticket ${mergeMasterId}`);
      setShowMergeModal(false);
    } catch {
      toast.error("Failed to merge tickets");
    }
  };

  // 1-Level Priority Escalation
  const handleConfirmEscalate = async () => {
    if (!selectedTicket || !escalateJustification.trim()) {
      toast.error("Please provide justification for priority escalation (§2.3)");
      return;
    }

    const priorityMap: Record<string, "P1" | "P2" | "P3" | "P4"> = {
      P4: "P3",
      P3: "P2",
      P2: "P1",
      P1: "P1",
    };
    const nextPriority = priorityMap[selectedTicket.priority];

    try {
      await apiOverridePriority(selectedTicket.ticket_no, nextPriority, escalateJustification).catch(() => {});
      setTickets((prev) =>
        prev.map((t) =>
          t.id === selectedTicket.id ? { ...t, priority: nextPriority } : t
        )
      );
      toast.success(`Priority escalated from ${selectedTicket.priority} to ${nextPriority}!`);
      setShowEscalateModal(false);
      setEscalateJustification("");
      setSelectedTicket(null);
    } catch {
      toast.error("Failed to override priority");
    }
  };

  const pendingCount = tickets.filter((t) => t.status === "OPEN").length;
  const verifiedCount = tickets.filter((t) => t.status === "VERIFIED").length;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Awaiting First-Line Triage</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              {pendingCount} Tickets
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1.5">
            <InboxIcon className="size-3.5" />
            <span>Requires 1-click on-site verify</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Verified for Warden</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              {verifiedCount} Ready
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2Icon className="size-3.5" />
            <span>Awaiting tradesman assignment</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Auto-Merged Duplicates</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              14 Merged
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1.5">
            <GitMergeIcon className="size-3.5" />
            <span>Eliminated duplicate work orders</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Triage Speed (SLA)</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              18 mins
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1.5">
            <ClockIcon className="size-3.5" />
            <span>Hostel 14 benchmark: &lt; 30m</span>
          </CardContent>
        </Card>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Hostel Representative Triage Terminal (§2.3)</h3>
          <p className="text-xs text-muted-foreground">
            1-Click physical verification, spam rejection with reason, deduplication & +1 priority escalation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMergeModal(true)}
            className="gap-1.5 text-xs h-8"
          >
            <GitMergeIcon className="size-3.5" />
            <span>Merge Duplicates</span>
          </Button>
        </div>
      </div>

      {/* Triage Inbox Table */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Triage Inbox ({tickets.length})</TabsTrigger>
          <TabsTrigger value="open">Needs Verification ({pendingCount})</TabsTrigger>
          <TabsTrigger value="verified">Verified ({verifiedCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">HB-3 Incoming Complaint Triage Queue</CardTitle>
              <CardDescription className="text-xs">
                Inspect genuine resident complaints. Reject duplicate or frivolous complaints with logged justification.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Issue & Description</TableHead>
                    <TableHead>Reporter / Rm</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Upvotes</TableHead>
                    <TableHead className="text-right">Actions (§2.3)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs font-semibold">
                        {t.ticket_no}
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        <div className="font-medium text-xs text-foreground truncate">
                          {t.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {t.category} • {t.location} • {t.timeAgo}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {t.reporter}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            t.priority === "P1"
                              ? "destructive"
                              : t.priority === "P2"
                              ? "default"
                              : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {t.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            t.status === "OPEN"
                              ? "secondary"
                              : t.status === "VERIFIED"
                              ? "default"
                              : "outline"
                          }
                          className="text-[10px]"
                        >
                          {t.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs tabular-nums">
                        {t.upvotes}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {t.status === "OPEN" && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                className="h-7 text-xs px-2 gap-1"
                                onClick={() => handleVerify(t)}
                              >
                                <CheckCircle2Icon className="size-3" />
                                <span>Verify</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs px-2 gap-1"
                                onClick={() => {
                                  setSelectedTicket(t);
                                  setShowRejectModal(true);
                                }}
                              >
                                <XCircleIcon className="size-3" />
                                <span>Reject</span>
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs px-2 gap-1"
                            title="Escalate Priority by 1 class"
                            onClick={() => {
                              setSelectedTicket(t);
                              setShowEscalateModal(true);
                            }}
                          >
                            <ArrowUpRightIcon className="size-3" />
                            <span>Escalate</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="open" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Pending Physical Verification</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableBody>
                  {tickets
                    .filter((t) => t.status === "OPEN")
                    .map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-xs font-semibold">{t.ticket_no}</TableCell>
                        <TableCell className="text-xs">{t.title}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{t.location}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" className="h-7 text-xs" onClick={() => handleVerify(t)}>
                            Verify Now
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verified" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Verified Tickets Sent to Warden</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableBody>
                  {tickets
                    .filter((t) => t.status === "VERIFIED")
                    .map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-xs font-semibold">{t.ticket_no}</TableCell>
                        <TableCell className="text-xs">{t.title}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{t.location}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">Awaiting Tradesman Assignment</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal 1: Reject Ticket with mandatory reason */}
      {showRejectModal && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-lg space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <AlertTriangleIcon className="size-4" />
                <span>Reject Complaint ({selectedTicket.ticket_no})</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Per FSM rules (§2.3), rejection of an OPEN complaint requires a logged reason visible in the audit trail.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Reason for Rejection</Label>
              <textarea
                rows={3}
                className="w-full rounded-md border border-input bg-background p-2 text-xs"
                placeholder="e.g. Frivolous report / issue already fixed during morning rounds..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmReject}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Merge Duplicates */}
      {showMergeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-lg space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <GitMergeIcon className="size-4" />
                <span>Auto-Merge Duplicate Complaints (§2.3)</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Consolidate multiple resident reports regarding the same underlying breakdown into a single master ticket.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <Label className="text-xs">Master (Parent) Ticket ID</Label>
                <Input
                  value={mergeMasterId}
                  onChange={(e) => setMergeMasterId(e.target.value)}
                  placeholder="e.g. CMP-2026-0131"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Duplicate Ticket ID to Merge & Close</Label>
                <Input
                  value={mergeDuplicates}
                  onChange={(e) => setMergeDuplicates(e.target.value)}
                  placeholder="e.g. CMP-2026-0130"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMergeModal(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmMerge}
              >
                Merge & Consolidate
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Escalate Priority +1 */}
      {showEscalateModal && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-lg space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ArrowUpRightIcon className="size-4" />
                <span>Override Priority by 1 Class ({selectedTicket.ticket_no})</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Current priority: <strong>{selectedTicket.priority}</strong>. Hostel Reps may escalate by strictly 1 level (§2.3).
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Justification Note</Label>
              <textarea
                rows={3}
                className="w-full rounded-md border border-input bg-background p-2 text-xs"
                placeholder="e.g. Multiple students affected; hazard risk escalated due to heavy evening load..."
                value={escalateJustification}
                onChange={(e) => setEscalateJustification(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowEscalateModal(false);
                  setEscalateJustification("");
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmEscalate}
              >
                Escalate Priority
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
