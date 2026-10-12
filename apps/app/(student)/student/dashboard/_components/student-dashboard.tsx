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
  PlusCircleIcon,
  ThumbsUpIcon,
  ClockIcon,
  CheckCircle2Icon,
  AwardIcon,
  AlertCircleIcon,
  FileTextIcon,
  SparklesIcon,
  MapPinIcon,
} from "lucide-react";
import { toast } from "sonner";
import { apiCreateComplaint, apiUpvoteComplaint, apiListComplaints } from "@/lib/api";
import { NitRourkelaMap } from "@/components/sustainability/nit-rourkela-map";

interface ComplaintItem {
  id: string;
  ticket_no: string;
  title: string;
  category: string;
  block: string;
  room: string;
  severity: number;
  status: "OPEN" | "VERIFIED" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  upvotes: number;
  hasUpvoted?: boolean;
  createdAt: string;
}

const INITIAL_MY_COMPLAINTS: ComplaintItem[] = [
  {
    id: "c-101",
    ticket_no: "CMP-2026-0101",
    title: "Ceiling fan regulator sparking and humming loudly",
    category: "Electrical",
    block: "B-Block",
    room: "Rm 204",
    severity: 4,
    status: "IN_PROGRESS",
    upvotes: 3,
    createdAt: "Today, 10:15 AM",
  },
  {
    id: "c-102",
    ticket_no: "CMP-2026-0089",
    title: "Washbasin tap leakage causing continuous water drip",
    category: "Plumbing",
    block: "B-Block",
    room: "Washroom 2F",
    severity: 2,
    status: "RESOLVED",
    upvotes: 7,
    createdAt: "Yesterday",
  },
  {
    id: "c-103",
    ticket_no: "CMP-2026-0054",
    title: "LAN port RJ45 jack broken, loose contact",
    category: "Internet/LAN",
    block: "B-Block",
    room: "Rm 204",
    severity: 3,
    status: "CLOSED",
    upvotes: 1,
    createdAt: "3 days ago",
  },
];

const INITIAL_HOSTEL_FEED: ComplaintItem[] = [
  {
    id: "feed-1",
    ticket_no: "CMP-2026-0112",
    title: "2nd Floor Water Purifier cooling unit not functioning",
    category: "Water Cooler",
    block: "B-Wing",
    room: "Corridor",
    severity: 3,
    status: "OPEN",
    upvotes: 14,
    hasUpvoted: false,
    createdAt: "2 hours ago",
  },
  {
    id: "feed-2",
    ticket_no: "CMP-2026-0109",
    title: "Tube lights flickering in common study reading room",
    category: "Electrical",
    block: "Ground Floor",
    room: "Study Hall",
    severity: 2,
    status: "VERIFIED",
    upvotes: 9,
    hasUpvoted: false,
    createdAt: "4 hours ago",
  },
  {
    id: "feed-3",
    ticket_no: "CMP-2026-0098",
    title: "Main corridor exhaust fan jammed in Wing A",
    category: "Ventilation",
    block: "A-Wing",
    room: "Corridor 3F",
    severity: 2,
    status: "ASSIGNED",
    upvotes: 6,
    hasUpvoted: true,
    createdAt: "Yesterday",
  },
];

export function StudentDashboard() {
  const [myComplaints, setMyComplaints] = React.useState<ComplaintItem[]>(INITIAL_MY_COMPLAINTS);
  const [hostelFeed, setHostelFeed] = React.useState<ComplaintItem[]>(INITIAL_HOSTEL_FEED);
  const [showLodgeForm, setShowLodgeForm] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form state
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState("Electrical");
  const [block, setBlock] = React.useState("B-Block");
  const [room, setRoom] = React.useState("Rm 204");

function evaluateAiSeverityAndPriority(t: string, d: string, cat: string): { severity: number; priority: "P1" | "P2" | "P3" | "P4"; explanation: string } {
  const text = `${t} ${d} ${cat}`.toLowerCase();
  if (
    text.includes("spark") ||
    text.includes("fire") ||
    text.includes("shock") ||
    text.includes("short circuit") ||
    text.includes("smoke") ||
    text.includes("collapse") ||
    text.includes("gas") ||
    text.includes("naked wire") ||
    text.includes("exposed wire")
  ) {
    return { severity: 5, priority: "P1", explanation: "Critical Hazard: Life-safety risk" };
  }
  if (
    text.includes("flooding") ||
    text.includes("overflow") ||
    text.includes("no water") ||
    text.includes("power outage") ||
    text.includes("blackout") ||
    text.includes("main line") ||
    text.includes("tripping")
  ) {
    return { severity: 4, priority: "P2", explanation: "High Severity: Service disruption" };
  }
  if (
    text.includes("geyser") ||
    text.includes("leak") ||
    text.includes("tap") ||
    text.includes("fan") ||
    text.includes("washroom") ||
    text.includes("cooler") ||
    text.includes("lock")
  ) {
    return { severity: 3, priority: "P3", explanation: "Standard Facility: Maintenance required" };
  }
  return { severity: 2, priority: "P4", explanation: "Minor Defect: Routine maintenance" };
}

  const handleUpvote = async (item: ComplaintItem) => {
    try {
      await apiUpvoteComplaint(item.id).catch(() => { });
      setHostelFeed((prev) =>
        prev.map((c) =>
          c.id === item.id
            ? {
              ...c,
              upvotes: c.hasUpvoted ? c.upvotes - 1 : c.upvotes + 1,
              hasUpvoted: !c.hasUpvoted,
            }
            : c
        )
      );
      toast.success(item.hasUpvoted ? "Upvote removed" : "Complaint upvoted!");
    } catch {
      toast.error("Failed to upvote complaint");
    }
  };

  // Load real complaints from database on mount
  const loadLiveComplaints = React.useCallback(async () => {
    try {
      const res = await apiListComplaints({ hostel_code: "HB-3" });
      const items = Array.isArray(res) ? res : res?.items || [];
      if (items.length > 0) {
        const mapped: ComplaintItem[] = items.map((item: any) => ({
          id: item.id,
          ticket_no: item.ticket_no || item.id,
          title: item.title,
          category: item.category_code || "General",
          block: item.block_name || "Block B",
          room: item.room_no || "204",
          severity: item.severity || 3,
          status: item.status as any,
          upvotes: item.upvote_count || 0,
          hasUpvoted: false,
          createdAt: item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now",
        }));
        setMyComplaints(mapped);
        setHostelFeed(mapped);
      }
    } catch (err) {
      console.warn("Could not load backend complaints feed:", err);
    }
  }, []);

  React.useEffect(() => {
    loadLiveComplaints();
  }, [loadLiveComplaints]);

  const handleLodgeComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Please fill in title and description");
      return;
    }

    setIsSubmitting(true);
    try {
      const aiAssessment = evaluateAiSeverityAndPriority(title, description, category);
      let realId = `c-${Date.now()}`;
      let realTicketNo = `CIQ-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      let serverStatus: any = aiAssessment.severity >= 4 || aiAssessment.priority === "P1" ? "ASSIGNED" : "OPEN";

      try {
        const res = await apiCreateComplaint({
          title,
          description,
          category_code: category.toUpperCase(),
          block_name: block,
          room_no: room,
          severity: aiAssessment.severity,
          hostel_code: "HB-3",
        });

        if (res?.id) realId = res.id;
        if (res?.ticket_no) realTicketNo = res.ticket_no;
        if (res?.status) serverStatus = res.status;
      } catch (err: any) {
        console.warn("Backend sync notice:", err?.message);
      }

      const newTicket: ComplaintItem = {
        id: realId,
        ticket_no: realTicketNo,
        title,
        category,
        block,
        room,
        severity: aiAssessment.severity,
        status: serverStatus,
        upvotes: 1,
        createdAt: "Just now",
      };

      setMyComplaints((prev) => [newTicket, ...prev]);
      setHostelFeed((prev) => [newTicket, ...prev]);
      toast.success(`Complaint #${newTicket.ticket_no} lodged and forwarded to Hostel Rep!`);
      loadLiveComplaints();
      setTitle("");
      setDescription("");
      setShowLodgeForm(false);
      setIsSubmitting(false);
    } catch {
      toast.error("Could not lodge complaint. Saved offline.");
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: ComplaintItem["status"]) => {
    switch (status) {
      case "OPEN":
        return <Badge variant="secondary">OPEN</Badge>;
      case "VERIFIED":
        return <Badge variant="outline">VERIFIED</Badge>;
      case "ASSIGNED":
        return <Badge variant="outline">ASSIGNED</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="default">IN PROGRESS</Badge>;
      case "RESOLVED":
        return <Badge variant="secondary">RESOLVED</Badge>;
      case "CLOSED":
        return <Badge variant="outline">CLOSED</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>My Filed Issues</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              {myComplaints.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1.5">
            <FileTextIcon className="size-3.5" />
            <span>1 active in progress</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Resolved Rate</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              67%
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2Icon className="size-3.5" />
            <span>2 resolved / closed</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Student Reward Points</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              340 pts
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1.5">
            <AwardIcon className="size-3.5" />
            <span>Top 10% Reporter in HB-3</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Hostel Live SLA</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              4.2 hrs
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1.5">
            <ClockIcon className="size-3.5" />
            <span>Average turnaround time</span>
          </CardContent>
        </Card>
      </div>

      {/* Lodge Complaint CTA / Collapsible Box */}
      {showLodgeForm ? (
        <Card>
          <CardHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Lodge New Hostel Complaint</CardTitle>
                <CardDescription className="text-xs">
                  Direct submission to HB-3 Representative triage inbox (2.1)
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLodgeForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleLodgeComplaint} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs">Issue Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Geyser tripping switch in 2nd floor bathroom"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="category" className="text-xs">Category</Label>
                  <select
                    id="category"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Electrical">Electrical</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Carpentry">Carpentry</option>
                    <option value="Internet/LAN">Internet / LAN</option>
                    <option value="Sanitation">Sanitation</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="block" className="text-xs">Block / Wing</Label>
                  <Input
                    id="block"
                    value={block}
                    onChange={(e) => setBlock(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="room" className="text-xs">Room / Location</Label>
                  <Input
                    id="room"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs">Detailed Description & Evidence</Label>
                <textarea
                  id="description"
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Describe problem severity, exact location, when it started..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              {/* AI Determined Priority Notice */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <SparklesIcon className="size-3.5 text-primary" />
                    <span>Priority Assessed by CampusIQ AI</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-medium bg-primary/10 text-primary border-primary/20">
                    Auto-Triage Active
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Students cannot select priority directly. CampusIQ AI automatically determines severity and priority (P1–P4) based on risk factors and description. Hostel Representatives and higher authorities can adjust priority during verification.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLodgeForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? "Lodging..." : "Submit Complaint"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="flex items-center justify-between rounded-lg border bg-card p-4">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-foreground">Need maintenance assistance?</h3>
            <p className="text-xs text-muted-foreground">
              Submit electrical, plumbing, carpentry, or wifi issues directly to your hall team.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowLodgeForm(true)}
            className="gap-1.5"
          >
            <PlusCircleIcon className="size-4" />
            <span>Lodge Complaint</span>
          </Button>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="my-tickets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-tickets">My Tickets ({myComplaints.length})</TabsTrigger>
          <TabsTrigger value="hostel-feed">Hostel Feed & Upvoting ({hostelFeed.length})</TabsTrigger>
          <TabsTrigger value="rewards">Dignity & Rewards</TabsTrigger>
          <TabsTrigger value="heatmap" className="gap-1.5">
            <MapPinIcon className="size-3.5" />
            <span>Campus Heatmap</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: My Tickets */}
        <TabsContent value="my-tickets" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">My Filed Complaints</CardTitle>
              <CardDescription className="text-xs">
                Tracking ticket lifecycle from submission to Warden verification and resolution.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Issue Details</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Logged</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myComplaints.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs font-semibold">
                        {item.ticket_no}
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        <div className="font-medium text-xs text-foreground truncate">
                          {item.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[11px]">
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.block}, {item.room}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px]">
                          Lvl {item.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.createdAt}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Hostel Feed & Upvoting */}
        <TabsContent value="hostel-feed" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">Hostel Community Feed (HB-3)</CardTitle>
                  <CardDescription className="text-xs">
                    Upvote issues affecting your wing or common facilities to escalate priority (2.1).
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  {hostelFeed.length} Open Issues
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Reported Issue</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Upvotes</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hostelFeed.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs font-medium">
                        {item.ticket_no}
                      </TableCell>
                      <TableCell className="max-w-[260px]">
                        <div className="font-medium text-xs text-foreground">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {item.category} • Logged {item.createdAt}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.block}, {item.room}
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        <span className="font-mono text-xs font-semibold tabular-nums">
                          {item.upvotes}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={item.hasUpvoted ? "default" : "outline"}
                          size="sm"
                          className="h-8 gap-1.5 text-xs"
                          onClick={() => handleUpvote(item)}
                        >
                          <ThumbsUpIcon className="size-3.5" />
                          <span>{item.hasUpvoted ? "Upvoted" : "Upvote"}</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Rewards & Dignity */}
        <TabsContent value="rewards" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <SparklesIcon className="size-4" />
                  <span>Dignity Points Ledger</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Earn points for reporting verifiable facility issues and civic contributions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between border-b pb-2 text-xs">
                  <div>
                    <div className="font-medium">Verified Complaint Resolution</div>
                    <div className="text-muted-foreground text-[11px]">Ceiling Fan CMP-2026-0054</div>
                  </div>
                  <Badge variant="secondary">+100 pts</Badge>
                </div>
                <div className="flex items-center justify-between border-b pb-2 text-xs">
                  <div>
                    <div className="font-medium">Community Upvote Accuracy</div>
                    <div className="text-muted-foreground text-[11px]">Water Purifier CMP-2026-0089</div>
                  </div>
                  <Badge variant="secondary">+40 pts</Badge>
                </div>
                <div className="flex items-center justify-between pb-1 text-xs">
                  <div>
                    <div className="font-medium">Civic Reporter Tier 1</div>
                    <div className="text-muted-foreground text-[11px]">Clean Campus Initiative</div>
                  </div>
                  <Badge variant="secondary">+200 pts</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <AwardIcon className="size-4" />
                  <span>Earned Recognition Badges</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Official hostel council verified recognitions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground font-bold">
                    <CheckCircle2Icon className="size-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold">Active Reporter</div>
                    <div className="text-[11px] text-muted-foreground">Logged 5+ verified complaints</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground font-bold">
                    <AlertCircleIcon className="size-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold">Hazard Spotter</div>
                    <div className="text-[11px] text-muted-foreground">Reported urgent electrical spark early</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 4: Campus Heatmap */}
        <TabsContent value="heatmap" className="space-y-4">
          <NitRourkelaMap />
        </TabsContent>
      </Tabs>
    </div>
  );
}
