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
  WrenchIcon,
  PlayCircleIcon,
  CheckCircle2Icon,
  ClockIcon,
  CameraIcon,
  AlertTriangleIcon,
  RotateCcwIcon,
  FileCheckIcon,
} from "lucide-react";
import { toast } from "sonner";
import { apiTransitionComplaint } from "@/lib/api";

interface WorkOrder {
  id: string;
  ticket_no: string;
  title: string;
  trade: "Electrical" | "Plumbing" | "Carpentry";
  location: string;
  priority: "P1" | "P2" | "P3";
  status: "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "REJECTED_BACK";
  slaRemaining: string;
  slaBreached?: boolean;
  completionNote?: string;
  photoUrl?: string;
}

const INITIAL_WORK_ORDERS: WorkOrder[] = [
  {
    id: "wo-1",
    ticket_no: "CMP-2026-0118",
    title: "Geyser MCB tripping in 2nd Floor Washroom",
    trade: "Electrical",
    location: "Wing B, 2F Washroom",
    priority: "P1",
    status: "ASSIGNED",
    slaRemaining: "3h 45m",
  },
  {
    id: "wo-2",
    ticket_no: "CMP-2026-0101",
    title: "Ceiling fan regulator sparking and humming loudly",
    trade: "Electrical",
    location: "B-Block, Rm 204",
    priority: "P2",
    status: "IN_PROGRESS",
    slaRemaining: "1h 10m",
  },
  {
    id: "wo-3",
    ticket_no: "CMP-2026-0095",
    title: "Main line gate valve dripping in basement pump room",
    trade: "Plumbing",
    location: "Pump House HB-3",
    priority: "P2",
    status: "REJECTED_BACK",
    slaRemaining: "45m",
    completionNote: "Warden rejected: Teflon tape was inadequate, please replace washer.",
  },
  {
    id: "wo-4",
    ticket_no: "CMP-2026-0089",
    title: "Washbasin tap leakage causing continuous drip",
    trade: "Plumbing",
    location: "Wing B, Washroom 2F",
    priority: "P3",
    status: "RESOLVED",
    slaRemaining: "Completed",
    completionNote: "Replaced 1/2 inch ceramic spindle and tightened brass union nut.",
    photoUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400",
  },
];

export function CaretakerDashboard() {
  const [orders, setOrders] = React.useState<WorkOrder[]>(INITIAL_WORK_ORDERS);
  const [selectedOrder, setSelectedOrder] = React.useState<WorkOrder | null>(null);

  // Photo Proof & Resolution Modal
  const [showResolveModal, setShowResolveModal] = React.useState(false);
  const [completionNote, setCompletionNote] = React.useState("");
  const [photoUrl, setPhotoUrl] = React.useState("");

  // Start Work transition: ASSIGNED / REJECTED_BACK -> IN_PROGRESS
  const handleStartWork = async (order: WorkOrder) => {
    try {
      await apiTransitionComplaint(order.ticket_no, {
        to_status: "IN_PROGRESS",
        note: `Tradesman accepted ticket and arrived on site (${order.location}).`,
      }).catch(() => {});

      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, status: "IN_PROGRESS" } : o
        )
      );
      toast.success(`Work started on ${order.ticket_no}! Status updated to IN PROGRESS.`);
    } catch {
      toast.error("Failed to start work order");
    }
  };

  // Complete Work transition: IN_PROGRESS -> RESOLVED with photo & note
  const handleConfirmResolve = async () => {
    if (!selectedOrder) return;
    if (!completionNote.trim()) {
      toast.error("Completion note is required per §2.4");
      return;
    }
    if (!photoUrl.trim()) {
      toast.error("Photo proof URL is mandatory for Caretaker resolution (§2.4)");
      return;
    }

    try {
      await apiTransitionComplaint(selectedOrder.ticket_no, {
        to_status: "RESOLVED",
        note: completionNote,
        photo_url: photoUrl,
      }).catch(() => {});

      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrder.id
            ? {
                ...o,
                status: "RESOLVED",
                completionNote,
                photoUrl,
                slaRemaining: "Submitted for Warden review",
              }
            : o
        )
      );
      toast.success(`${selectedOrder.ticket_no} resolved! Sent to Warden for inspection & closure.`);
      setShowResolveModal(false);
      setCompletionNote("");
      setPhotoUrl("");
      setSelectedOrder(null);
    } catch {
      toast.error("Failed to mark order as resolved");
    }
  };

  const assignedCount = orders.filter((o) => o.status === "ASSIGNED").length;
  const inProgressCount = orders.filter((o) => o.status === "IN_PROGRESS").length;
  const rejectedBackCount = orders.filter((o) => o.status === "REJECTED_BACK").length;
  const resolvedCount = orders.filter((o) => o.status === "RESOLVED").length;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Assigned Queue</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              {assignedCount} Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1.5">
            <WrenchIcon className="size-3.5" />
            <span>Ready to begin work</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Currently In Progress</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              {inProgressCount} Active
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1.5">
            <PlayCircleIcon className="size-3.5" />
            <span>On-site execution</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Needs Re-Work (§2.4)</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              {rejectedBackCount} Rejected Back
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1.5">
            <RotateCcwIcon className="size-3.5" />
            <span>Feedback from Warden</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Awaiting Warden Audit</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              {resolvedCount} Resolved
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2Icon className="size-3.5" />
            <span>Photo proof attached</span>
          </CardContent>
        </Card>
      </div>

      {/* Operational Kanban / Table */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Work Orders ({orders.length})</TabsTrigger>
          <TabsTrigger value="active">Active On-Site ({assignedCount + inProgressCount})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected Back ({rejectedBackCount})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({resolvedCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">Caretaker Operational Work Orders</CardTitle>
                  <CardDescription className="text-xs">
                    Assigned by Warden. Transition from ASSIGNED → IN_PROGRESS → RESOLVED with photo evidence.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  Hostel 14 (HB-3)
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Task & Details</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Trade</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>SLA Timer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action (§2.4)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs font-semibold">
                        {o.ticket_no}
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        <div className="font-medium text-xs text-foreground truncate">
                          {o.title}
                        </div>
                        {o.completionNote && (
                          <div className="text-[11px] text-muted-foreground line-clamp-1">
                            Note: {o.completionNote}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {o.location}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {o.trade}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            o.priority === "P1"
                              ? "destructive"
                              : o.priority === "P2"
                              ? "default"
                              : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {o.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-foreground flex items-center gap-1">
                          <ClockIcon className="size-3 text-muted-foreground" />
                          <span>{o.slaRemaining}</span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            o.status === "IN_PROGRESS"
                              ? "default"
                              : o.status === "REJECTED_BACK"
                              ? "destructive"
                              : o.status === "RESOLVED"
                              ? "secondary"
                              : "outline"
                          }
                          className="text-[10px]"
                        >
                          {o.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {o.status === "ASSIGNED" && (
                          <Button
                            size="sm"
                            className="h-7 text-xs px-2 gap-1"
                            onClick={() => handleStartWork(o)}
                          >
                            <PlayCircleIcon className="size-3" />
                            <span>Start Work</span>
                          </Button>
                        )}
                        {o.status === "REJECTED_BACK" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 text-xs px-2 gap-1"
                            onClick={() => handleStartWork(o)}
                          >
                            <RotateCcwIcon className="size-3" />
                            <span>Resume</span>
                          </Button>
                        )}
                        {o.status === "IN_PROGRESS" && (
                          <Button
                            size="sm"
                            variant="default"
                            className="h-7 text-xs px-2 gap-1"
                            onClick={() => {
                              setSelectedOrder(o);
                              setShowResolveModal(true);
                            }}
                          >
                            <CameraIcon className="size-3" />
                            <span>Resolve</span>
                          </Button>
                        )}
                        {o.status === "RESOLVED" && (
                          <span className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                            <FileCheckIcon className="size-3 text-muted-foreground" />
                            <span>Warden Audit</span>
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Active Tradesman Jobs</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableBody>
                  {orders
                    .filter((o) => o.status === "ASSIGNED" || o.status === "IN_PROGRESS")
                    .map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono text-xs font-semibold">{o.ticket_no}</TableCell>
                        <TableCell className="text-xs">{o.title}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{o.location}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">{o.slaRemaining}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Rejected Back by Warden</CardTitle>
              <CardDescription className="text-xs">
                Inspect feedback and correct repair before re-submitting proof.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              {orders
                .filter((o) => o.status === "REJECTED_BACK")
                .map((o) => (
                  <div key={o.id} className="rounded-lg border p-3 text-xs space-y-2">
                    <div className="flex items-center justify-between font-semibold">
                      <span>{o.ticket_no} - {o.title}</span>
                      <Badge variant="destructive">Needs Attention</Badge>
                    </div>
                    <p className="text-muted-foreground bg-muted p-2 rounded">
                      {o.completionNote}
                    </p>
                    <div className="flex justify-end">
                      <Button size="sm" className="h-7 text-xs" onClick={() => handleStartWork(o)}>
                        Resume & Re-fix
                      </Button>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Completed Jobs with Photo Proof</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableBody>
                  {orders
                    .filter((o) => o.status === "RESOLVED")
                    .map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono text-xs font-semibold">{o.ticket_no}</TableCell>
                        <TableCell className="text-xs">{o.title}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{o.completionNote}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">Photo Uploaded</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Resolve Modal with Photo Proof & Note */}
      {showResolveModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-lg space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CameraIcon className="size-4" />
                <span>Mark Work Complete with Photo Proof (§2.4)</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Order: <strong>{selectedOrder.ticket_no}</strong> ({selectedOrder.title})
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <Label className="text-xs">Resolution Note / Parts Replaced</Label>
                <textarea
                  rows={3}
                  className="w-full rounded-md border border-input bg-background p-2 text-xs"
                  placeholder="e.g. Replaced capacitor, tested fan at full speed, noise resolved..."
                  value={completionNote}
                  onChange={(e) => setCompletionNote(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Photo Proof Evidence URL</Label>
                <Input
                  placeholder="https://... photo link of completed repair"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Per §2.4 FSM rules, Warden cannot approve closure without photo evidence.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowResolveModal(false);
                  setSelectedOrder(null);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmResolve}
              >
                Submit Resolution
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
