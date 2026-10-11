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
  ShieldCheckIcon,
  UserPlusIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  AlertTriangleIcon,
  RotateCcwIcon,
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner";
import { apiTransitionComplaint } from "@/lib/api";

interface WardenTicket {
  id: string;
  ticket_no: string;
  title: string;
  category: string;
  location: string;
  priority: "P1" | "P2" | "P3";
  status: "OPEN" | "VERIFIED" | "ASSIGNED" | "RESOLVED" | "CLOSED" | "REJECTED_BACK";
  assignee?: string;
  photoUrl?: string;
  note?: string;
}

const INITIAL_WARDEN_TICKETS: WardenTicket[] = [
  {
    id: "w-1",
    ticket_no: "CMP-2026-0125",
    title: "Window latch stuck open in Rm 312 during heavy rain",
    category: "Carpentry",
    location: "Rm 312",
    priority: "P2",
    status: "VERIFIED",
  },
  {
    id: "w-2",
    ticket_no: "CMP-2026-0118",
    title: "Geyser MCB tripping in 2nd Floor Washroom",
    category: "Electrical",
    location: "Wing B, 2F Washroom",
    priority: "P1",
    status: "ASSIGNED",
    assignee: "R. Das (Senior Caretaker)",
  },
  {
    id: "w-3",
    ticket_no: "CMP-2026-0089",
    title: "Washbasin tap leakage causing continuous drip",
    category: "Plumbing",
    location: "Wing B, Washroom 2F",
    priority: "P3",
    status: "RESOLVED",
    assignee: "R. Das (Senior Caretaker)",
    photoUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400",
    note: "Replaced 1/2 inch ceramic spindle and tightened brass union nut.",
  },
  {
    id: "w-4",
    ticket_no: "CMP-2026-0054",
    title: "LAN port RJ45 jack broken, loose contact",
    category: "Network",
    location: "Rm 204",
    priority: "P3",
    status: "CLOSED",
    assignee: "M. Panda (Network Tech)",
  },
];

export function WardenDashboard() {
  const [tickets, setTickets] = React.useState<WardenTicket[]>(INITIAL_WARDEN_TICKETS);
  const [selectedTicket, setSelectedTicket] = React.useState<WardenTicket | null>(null);

  // Assign Caretaker Modal
  const [showAssignModal, setShowAssignModal] = React.useState(false);
  const [selectedAssignee, setSelectedAssignee] = React.useState("R. Das (Electrical/Plumbing)");

  // Inspect Photo & Approve/Reject Modal
  const [showAuditModal, setShowAuditModal] = React.useState(false);
  const [rejectFeedback, setRejectFeedback] = React.useState("");

  // Assign tradesman: VERIFIED / OPEN -> ASSIGNED
  const handleConfirmAssign = async () => {
    if (!selectedTicket) return;

    try {
      await apiTransitionComplaint(selectedTicket.ticket_no, {
        to_status: "ASSIGNED",
        assignee_id: selectedAssignee,
        note: `Assigned to ${selectedAssignee} by Warden Dr. S. Nanda`,
      }).catch(() => {});

      setTickets((prev) =>
        prev.map((t) =>
          t.id === selectedTicket.id
            ? { ...t, status: "ASSIGNED", assignee: selectedAssignee }
            : t
        )
      );
      toast.success(`${selectedTicket.ticket_no} assigned to ${selectedAssignee}`);
      setShowAssignModal(false);
      setSelectedTicket(null);
    } catch {
      toast.error("Failed to assign ticket");
    }
  };

  // Approve Closure: RESOLVED -> CLOSED
  const handleApproveClosure = async () => {
    if (!selectedTicket) return;

    try {
      await apiTransitionComplaint(selectedTicket.ticket_no, {
        to_status: "CLOSED",
        note: "Photo proof inspected and approved. Ticket marked CLOSED by Warden Dr. S. Nanda.",
      }).catch(() => {});

      setTickets((prev) =>
        prev.map((t) =>
          t.id === selectedTicket.id ? { ...t, status: "CLOSED" } : t
        )
      );
      toast.success(`${selectedTicket.ticket_no} closed successfully!`);
      setShowAuditModal(false);
      setSelectedTicket(null);
    } catch {
      toast.error("Failed to approve closure");
    }
  };

  // Reject Back to Caretaker: RESOLVED -> REJECTED_BACK
  const handleRejectBack = async () => {
    if (!selectedTicket) return;
    if (!rejectFeedback.trim()) {
      toast.error("Mandatory feedback required when rejecting resolution (§2.5)");
      return;
    }

    try {
      await apiTransitionComplaint(selectedTicket.ticket_no, {
        to_status: "REJECTED_BACK",
        note: rejectFeedback,
        reason: rejectFeedback,
      }).catch(() => {});

      setTickets((prev) =>
        prev.map((t) =>
          t.id === selectedTicket.id
            ? { ...t, status: "REJECTED_BACK", note: rejectFeedback }
            : t
        )
      );
      toast.success(`${selectedTicket.ticket_no} sent back to tradesman with feedback.`);
      setShowAuditModal(false);
      setRejectFeedback("");
      setSelectedTicket(null);
    } catch {
      toast.error("Failed to reject back");
    }
  };

  const verifiedQueue = tickets.filter((t) => t.status === "VERIFIED");
  const auditQueue = tickets.filter((t) => t.status === "RESOLVED");

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Awaiting Caretaker Assignment</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              {verifiedQueue.length} Tickets
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1.5">
            <UserPlusIcon className="size-3.5" />
            <span>Verified by Hostel Rep</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ready for Warden Audit</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              {auditQueue.length} Resolutions
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1.5">
            <EyeIcon className="size-3.5" />
            <span>Photo proof attached</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Tradesmen</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              4 Staff
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1.5">
            <UsersIcon className="size-3.5" />
            <span>Electrical, Plumbing, Civil</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Hostel 14 SLA Adherence</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              96.8%
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1.5">
            <ClockIcon className="size-3.5" />
            <span>Zero escalated breaches</span>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Hall Ticket Registry ({tickets.length})</TabsTrigger>
          <TabsTrigger value="assign">Needs Assignment ({verifiedQueue.length})</TabsTrigger>
          <TabsTrigger value="audit">Pending Resolution Audit ({auditQueue.length})</TabsTrigger>
          <TabsTrigger value="scorecard">Caretaker SLA Scorecard</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Hall 14 Executive Oversight & Assignment</CardTitle>
              <CardDescription className="text-xs">
                Assign verified complaints to tradesmen, audit photo proof, and approve final closure.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Issue Details</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead className="text-right">Warden Decision (§2.5)</TableHead>
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
                          {t.category}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {t.location}
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
                            t.status === "CLOSED"
                              ? "outline"
                              : t.status === "RESOLVED"
                              ? "secondary"
                              : t.status === "ASSIGNED"
                              ? "outline"
                              : "default"
                          }
                          className="text-[10px]"
                        >
                          {t.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {t.assignee || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {t.status === "VERIFIED" && (
                          <Button
                            size="sm"
                            className="h-7 text-xs px-2 gap-1"
                            onClick={() => {
                              setSelectedTicket(t);
                              setShowAssignModal(true);
                            }}
                          >
                            <UserPlusIcon className="size-3" />
                            <span>Assign</span>
                          </Button>
                        )}
                        {t.status === "RESOLVED" && (
                          <Button
                            size="sm"
                            variant="default"
                            className="h-7 text-xs px-2 gap-1"
                            onClick={() => {
                              setSelectedTicket(t);
                              setShowAuditModal(true);
                            }}
                          >
                            <EyeIcon className="size-3" />
                            <span>Audit & Close</span>
                          </Button>
                        )}
                        {t.status === "CLOSED" && (
                          <Badge variant="outline" className="text-[10px]">
                            Approved
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assign" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Ready for Tradesman Assignment</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableBody>
                  {verifiedQueue.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs font-semibold">{t.ticket_no}</TableCell>
                      <TableCell className="text-xs">{t.title}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{t.location}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            setSelectedTicket(t);
                            setShowAssignModal(true);
                          }}
                        >
                          Assign Staff
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Resolutions Pending Photo Proof Approval</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              {auditQueue.map((t) => (
                <div key={t.id} className="rounded-lg border p-4 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm">{t.ticket_no} - {t.title}</div>
                      <div className="text-muted-foreground">Tradesman: {t.assignee}</div>
                    </div>
                    <Badge variant="secondary">RESOLVED</Badge>
                  </div>
                  <div className="rounded bg-muted p-2.5">
                    <span className="font-medium">Completion Note:</span> {t.note}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedTicket(t);
                        setShowAuditModal(true);
                      }}
                    >
                      Inspect Photo & Decide
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scorecard" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">R. Das</CardTitle>
                <CardDescription className="text-xs">Senior Caretaker (Electrical & Plumbing)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed This Month:</span>
                  <span className="font-mono font-semibold">28 tickets</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SLA Breach Rate:</span>
                  <Badge variant="secondary" className="text-[10px]">0% (Flawless)</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Resolution Time:</span>
                  <span>1.4 hours</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">S. Soren</CardTitle>
                <CardDescription className="text-xs">Junior Caretaker (Sanitation & Civil)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed This Month:</span>
                  <span className="font-mono font-semibold">19 tickets</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SLA Breach Rate:</span>
                  <Badge variant="outline" className="text-[10px]">3.2%</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Resolution Time:</span>
                  <span>2.6 hours</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">M. Panda</CardTitle>
                <CardDescription className="text-xs">Network & Wi-Fi Technician</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed This Month:</span>
                  <span className="font-mono font-semibold">14 tickets</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SLA Breach Rate:</span>
                  <Badge variant="secondary" className="text-[10px]">1.1%</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Resolution Time:</span>
                  <span>1.8 hours</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal 1: Assign Tradesman */}
      {showAssignModal && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-lg space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <UserPlusIcon className="size-4" />
                <span>Assign Tradesman ({selectedTicket.ticket_no})</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedTicket.title} ({selectedTicket.category})
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <Label className="text-xs">Designated Hall Tradesman</Label>
              <select
                className="w-full rounded-md border border-input bg-background p-2 text-xs"
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
              >
                <option value="R. Das (Senior Caretaker - Electrical/Plumbing)">R. Das (Senior Caretaker - Electrical/Plumbing)</option>
                <option value="S. Soren (Junior Caretaker - Civil/Sanitation)">S. Soren (Junior Caretaker - Civil/Sanitation)</option>
                <option value="M. Panda (Network / LAN Specialist)">M. Panda (Network / LAN Specialist)</option>
                <option value="External Campus Works Squad">External Campus Works Squad</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedTicket(null);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmAssign}
              >
                Confirm Assignment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Audit Photo & Approve Closure / Reject Back */}
      {showAuditModal && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border bg-background p-6 shadow-lg space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <EyeIcon className="size-4" />
                <span>Audit Resolution & Photo Proof ({selectedTicket.ticket_no})</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Completed by {selectedTicket.assignee || "Caretaker"}
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded bg-muted p-2.5">
                <span className="font-semibold">Tradesman Note:</span> {selectedTicket.note || "Repair executed on site."}
              </div>

              {selectedTicket.photoUrl && (
                <div className="space-y-1">
                  <span className="font-semibold text-xs">Photo Evidence Attached:</span>
                  <div className="overflow-hidden rounded-md border">
                    <img
                      src={selectedTicket.photoUrl}
                      alt="Proof"
                      className="h-44 w-full object-cover"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-xs">Feedback (Only required if rejecting resolution back)</Label>
                <textarea
                  rows={2}
                  className="w-full rounded-md border border-input bg-background p-2 text-xs"
                  placeholder="e.g. Inadequate sealing observed. Please replace washer and re-tighten..."
                  value={rejectFeedback}
                  onChange={(e) => setRejectFeedback(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAuditModal(false);
                  setSelectedTicket(null);
                }}
              >
                Close
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={handleRejectBack}
                >
                  <RotateCcwIcon className="size-3.5 mr-1" />
                  Reject Back
                </Button>
                <Button
                  size="sm"
                  onClick={handleApproveClosure}
                >
                  <CheckCircle2Icon className="size-3.5 mr-1" />
                  Approve Closure
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
