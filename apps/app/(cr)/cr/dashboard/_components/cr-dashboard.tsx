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
  UsersIcon,
  CheckCircle2Icon,
  ClockIcon,
  BuildingIcon,
  SendIcon,
  AlertTriangleIcon,
  ThumbsUpIcon,
} from "lucide-react";
import { toast } from "sonner";
import { apiCreateComplaint, apiUpvoteComplaint } from "@/lib/api";

interface WingComplaint {
  id: string;
  ticket_no: string;
  title: string;
  facility: string;
  wing_location: string;
  reported_for: string;
  status: "OPEN" | "VERIFIED" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED";
  upvotes: number;
  hasUpvoted?: boolean;
  loggedAt: string;
}

const INITIAL_WING_ISSUES: WingComplaint[] = [
  {
    id: "cr-1",
    ticket_no: "CMP-2026-0120",
    title: "Wing B Common Washroom: 3 of 4 geysers tripping breaker",
    facility: "Washroom Geysers",
    wing_location: "Wing B - 2nd Floor",
    reported_for: "Wing B Residents (18 Students)",
    status: "OPEN",
    upvotes: 18,
    loggedAt: "Today, 08:30 AM",
  },
  {
    id: "cr-2",
    ticket_no: "CMP-2026-0115",
    title: "RO Water Cooler Filter replacement light flashing red",
    facility: "Water Cooler",
    wing_location: "Wing B - Corridor Central",
    reported_for: "Wing B Floor 1 & 2",
    status: "VERIFIED",
    upvotes: 24,
    loggedAt: "Yesterday",
  },
  {
    id: "cr-3",
    ticket_no: "CMP-2026-0092",
    title: "Corridor night lights fuse blown in Wing B North Section",
    facility: "Electrical",
    wing_location: "Wing B - North Corridor",
    reported_for: "Rooms 201-212",
    status: "IN_PROGRESS",
    upvotes: 12,
    loggedAt: "2 days ago",
  },
];

export function CrDashboard() {
  const [wingIssues, setWingIssues] = React.useState<WingComplaint[]>(INITIAL_WING_ISSUES);
  const [showBatchForm, setShowBatchForm] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Batch Form state
  const [facilityType, setFacilityType] = React.useState("Water Cooler");
  const [title, setTitle] = React.useState("");
  const [affectedStudents, setAffectedStudents] = React.useState("Wing B Residents");
  const [location, setLocation] = React.useState("Wing B - 2nd Floor");
  const [details, setDetails] = React.useState("");

  const handleLodgeBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please provide a title");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiCreateComplaint({
        title,
        description: `${details} (Reported by CR on behalf of: ${affectedStudents})`,
        category_code: facilityType.toUpperCase().replace(/\s+/g, "_"),
        block_name: "Wing B",
        room_no: location,
        severity: 3,
        reported_for: affectedStudents,
      }).catch(() => {});

      const newIssue: WingComplaint = {
        id: `cr-${Date.now()}`,
        ticket_no: `CMP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        title,
        facility: facilityType,
        wing_location: location,
        reported_for: affectedStudents,
        status: "OPEN",
        upvotes: 5,
        loggedAt: "Just now",
      };

      setWingIssues([newIssue, ...wingIssues]);
      toast.success("Common facility issue lodged on behalf of Wing B!");
      setTitle("");
      setDetails("");
      setShowBatchForm(false);
    } catch {
      toast.error("Failed to lodge batch issue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async (issue: WingComplaint) => {
    try {
      await apiUpvoteComplaint(issue.id).catch(() => {});
      setWingIssues((prev) =>
        prev.map((i) =>
          i.id === issue.id
            ? {
                ...i,
                upvotes: i.hasUpvoted ? i.upvotes - 1 : i.upvotes + 1,
                hasUpvoted: !i.hasUpvoted,
              }
            : i
        )
      );
      toast.success("Endorsement updated");
    } catch {
      toast.error("Failed to update endorsement");
    }
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Wing B Residents</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              48 Students
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1.5">
            <UsersIcon className="size-3.5" />
            <span>Rooms 201 – 224</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Common Issues</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              {wingIssues.filter((i) => i.status !== "RESOLVED").length}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1.5">
            <AlertTriangleIcon className="size-3.5" />
            <span>1 awaiting triage, 1 in progress</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Resolution SLA</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              91.4%
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2Icon className="size-3.5" />
            <span>Resolved within 24h</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Response Time</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              2.8 hrs
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1.5">
            <ClockIcon className="size-3.5" />
            <span>Hostel Rep verification time</span>
          </CardContent>
        </Card>
      </div>

      {/* CR Action Banner */}
      {showBatchForm ? (
        <Card>
          <CardHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Lodge Common Facility / Wing Issue (§2.2)</CardTitle>
                <CardDescription className="text-xs">
                  File on behalf of wing students or collective infrastructure
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBatchForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleLodgeBatch} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="facilityType" className="text-xs">Facility Category</Label>
                  <select
                    id="facilityType"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={facilityType}
                    onChange={(e) => setFacilityType(e.target.value)}
                  >
                    <option value="Water Cooler">RO Water Purifier / Cooler</option>
                    <option value="Washroom Geyser">Washroom Geyser / Water Heater</option>
                    <option value="Corridor Lighting">Corridor / Common Lighting</option>
                    <option value="Reading Room AC">Reading Room / Study Hall AC</option>
                    <option value="Wifi Router">Wi-Fi Access Point</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="affectedStudents" className="text-xs">Affected Group / Cohort</Label>
                  <Input
                    id="affectedStudents"
                    placeholder="e.g. Wing B 2nd Floor, Rms 201-208"
                    value={affectedStudents}
                    onChange={(e) => setAffectedStudents(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="location" className="text-xs">Precise Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs">Problem Summary</Label>
                <Input
                  id="title"
                  placeholder="e.g. Water cooler leaking onto corridor tiles causing slip risk"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="details" className="text-xs">Additional Context / Urgency</Label>
                <textarea
                  id="details"
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Notes for Warden & Caretaker inspection..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBatchForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Lodge Wing Issue"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="flex items-center justify-between rounded-lg border bg-card p-4">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-foreground">Class Rep & Wing Coordination</h3>
            <p className="text-xs text-muted-foreground">
              Directly file common amenities tickets on behalf of Wing B residents.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowBatchForm(true)}
            className="gap-1.5"
          >
            <SendIcon className="size-4" />
            <span>Lodge Wing Facility Issue</span>
          </Button>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="wing-issues" className="space-y-4">
        <TabsList>
          <TabsTrigger value="wing-issues">Wing B Active Issues ({wingIssues.length})</TabsTrigger>
          <TabsTrigger value="amenities">Common Amenities Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="wing-issues" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Wing B Facility Tracker</CardTitle>
              <CardDescription className="text-xs">
                Batch complaints filed for shared infrastructure and wing residents.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Facility & Issue</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Reported For</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Endorsements</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wingIssues.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell className="font-mono text-xs font-semibold">
                        {issue.ticket_no}
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        <div className="font-medium text-xs text-foreground truncate">
                          {issue.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {issue.facility} • {issue.loggedAt}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {issue.wing_location}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {issue.reported_for}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            issue.status === "OPEN"
                              ? "secondary"
                              : issue.status === "IN_PROGRESS"
                              ? "default"
                              : "outline"
                          }
                          className="text-[10px]"
                        >
                          {issue.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs font-semibold tabular-nums">
                          {issue.upvotes}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={issue.hasUpvoted ? "default" : "outline"}
                          size="sm"
                          className="h-8 gap-1.5 text-xs"
                          onClick={() => handleUpvote(issue)}
                        >
                          <ThumbsUpIcon className="size-3.5" />
                          <span>{issue.hasUpvoted ? "Endorsed" : "Endorse"}</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="amenities" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BuildingIcon className="size-4" />
                  <span>RO Water Purifier</span>
                </CardTitle>
                <CardDescription className="text-xs">Wing B Corridor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Filter Life:</span>
                  <Badge variant="destructive" className="text-[10px]">Critical (Replace)</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">TDS Level:</span>
                  <span className="font-mono">118 ppm (Good)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Serviced:</span>
                  <span>14 Jan 2026</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BuildingIcon className="size-4" />
                  <span>Washroom 2F Geysers</span>
                </CardTitle>
                <CardDescription className="text-xs">4 Active Units</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Operating:</span>
                  <span className="font-mono">1 of 4 working</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">MCB Breaker:</span>
                  <Badge variant="outline" className="text-[10px]">Tripping</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assigned:</span>
                  <span>R. Das (Caretaker)</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BuildingIcon className="size-4" />
                  <span>Study Room Wi-Fi AP</span>
                </CardTitle>
                <CardDescription className="text-xs">Cisco AP-14B</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Signal:</span>
                  <Badge variant="secondary" className="text-[10px]">Optimal</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Clients:</span>
                  <span className="font-mono">34 devices</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Latency:</span>
                  <span className="font-mono">8 ms</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
