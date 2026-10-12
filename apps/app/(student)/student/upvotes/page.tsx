"use client";

import * as React from "react";
import { ROLES } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { getStudentNav } from "@/components/dashboards/nav-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ThumbsUpIcon,
  SparklesIcon,
  Building2Icon,
  FlameIcon,
  SearchIcon,
  FilterIcon,
  ArrowRightIcon,
  MessageSquareIcon,
  MapPinIcon,
  ClockIcon,
  ZapIcon,
  DropletsIcon,
  HammerIcon,
  ShieldAlertIcon,
  TrendingUpIcon,
  UsersIcon,
  CheckCircle2Icon,
  RotateCcwIcon,
  ExternalLinkIcon,
} from "lucide-react";
import { toast } from "sonner";
import { apiListComplaints, apiUpvoteComplaint } from "@/lib/api";
import { CommunityIssueDetailDrawer } from "@/components/student/community-issue-detail-drawer";

export default function StudentUpvotesPage() {
  const role = ROLES.find((r) => r.id === "student") || ROLES[0];
  const navItems = getStudentNav();

  const [complaints, setComplaints] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [upvotedIds, setUpvotedIds] = React.useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [filterCategory, setFilterCategory] = React.useState<string>("ALL");
  const [sortBy, setSortBy] = React.useState<"upvotes" | "newest" | "risk">("upvotes");

  // State for the full-height right-side detail drawer
  const [selectedTicket, setSelectedTicket] = React.useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState<boolean>(false);

  const fetchHostelIssues = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiListComplaints({ hostel_code: "HB-3" });
      const items = Array.isArray(data) ? data : data?.items || [];
      if (items.length > 0) {
        setComplaints(items);
      } else {
        // Fallback demo community issues
        setComplaints(getDemoCommunityIssues());
      }
    } catch {
      setComplaints(getDemoCommunityIssues());
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchHostelIssues();
  }, [fetchHostelIssues]);

  // Demo issues fallback
  const getDemoCommunityIssues = () => [
    {
      id: "ciq-c1",
      ticket_no: "CIQ-2026-00001",
      title: "Main ceiling fan sparking and regulator burnt in Room 204",
      description: "Speed regulator sparked vigorously when switched to level 3. Continuous burning plastic smell inside room. Switchboard isolated at main breaker.",
      category_code: "ELECTRICAL",
      priority: "P1",
      status: "ASSIGNED",
      upvote_count: 14,
      severity: 5,
      risk_score: 88,
      location_text: "Hostel 14, B-Block, Room 204",
      assigned_to_name: "Suresh Babu",
      people_affected: 8,
      created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
    {
      id: "ciq-c2",
      ticket_no: "CIQ-2026-00233",
      title: "Drinking water cooler leaking puddles and contaminated filter",
      description: "Water cooler on D-Block 1st floor is leaking muddy puddles on the corridor floor. Dispenser water tastes metallic. Filter replacement needed.",
      category_code: "WATER",
      priority: "P2",
      status: "OPEN",
      upvote_count: 9,
      severity: 4,
      risk_score: 72,
      location_text: "Hostel 14, D-Block 1st Floor",
      people_affected: 34,
      created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
    },
    {
      id: "ciq-c3",
      ticket_no: "CIQ-2026-00040",
      title: "Main hostel back perimeter gate security padlock snapped",
      description: "The padlock latch on the back wicket gate has snapped off. Anyone can enter the hostel quad from the outside road at night without register entry.",
      category_code: "SECURITY",
      priority: "P1",
      status: "OPEN",
      upvote_count: 18,
      severity: 5,
      risk_score: 91,
      location_text: "Hostel 14 Back Perimeter Gate",
      people_affected: 120,
      created_at: new Date(Date.now() - 8 * 3600000).toISOString(),
    },
    {
      id: "ciq-c4",
      ticket_no: "CIQ-2026-00183",
      title: "Loose wall power socket sparking with heavy ozone smell",
      description: "Wall outlet in 3rd floor study room sparks when study lamps plugged in. Internal screw clamp is loose.",
      category_code: "ELECTRICAL",
      priority: "P1",
      status: "VERIFIED",
      upvote_count: 11,
      severity: 4,
      risk_score: 82,
      location_text: "Hostel 14, C-Block, Room 335",
      people_affected: 12,
      created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    },
    {
      id: "ciq-c5",
      ticket_no: "CIQ-2026-00140",
      title: "Water dispenser paper cup holder snapped & valve dripping",
      description: "Plastic cup dispenser next to water cooler has snapped off and valve is leaking puddle onto walkway.",
      category_code: "WATER",
      priority: "P3",
      status: "IN_PROGRESS",
      upvote_count: 6,
      severity: 3,
      risk_score: 45,
      location_text: "Hostel 14, 1st Floor Corridor",
      assigned_to_name: "Maheswar Nayak",
      people_affected: 15,
      created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    },
    {
      id: "ciq-c6",
      ticket_no: "CIQ-2026-00088",
      title: "West wing 2nd floor bathroom flush tank continuously overflowing",
      description: "Ball valve stuck open causing clean water to continuously overflow down the drain. Wasting water and flooding floor.",
      category_code: "WATER",
      priority: "P2",
      status: "OPEN",
      upvote_count: 7,
      severity: 3,
      risk_score: 58,
      location_text: "Hostel 14, West Wing Washroom 2B",
      people_affected: 28,
      created_at: new Date(Date.now() - 30 * 3600000).toISOString(),
    },
  ];

  // Upvote toggle handler
  const handleUpvote = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const currentlyUpvoted = !!upvotedIds[id];
    setUpvotedIds((prev) => ({ ...prev, [id]: !currentlyUpvoted }));

    setComplaints((prev) =>
      prev.map((c) =>
        c.id === id || c.ticket_no === id
          ? { ...c, upvote_count: (c.upvote_count || 0) + (currentlyUpvoted ? -1 : 1) }
          : c
      )
    );

    try {
      await apiUpvoteComplaint(id);
      toast.success(
        currentlyUpvoted ? "Upvote removed" : "Upvoted! Community queue weight boosted."
      );
    } catch {
      // Revert if API fails
      setUpvotedIds((prev) => ({ ...prev, [id]: currentlyUpvoted }));
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === id || c.ticket_no === id
            ? { ...c, upvote_count: (c.upvote_count || 0) + (currentlyUpvoted ? 1 : -1) }
            : c
        )
      );
      toast.error("Could not register upvote");
    }
  };

  // Open right-side full display popup
  const handleOpenDetail = (item: any) => {
    setSelectedTicket(item);
    setDrawerOpen(true);
  };

  // Filter & sort logic
  const filteredIssues = React.useMemo(() => {
    return complaints
      .filter((c) => {
        // Category filter
        if (filterCategory === "ELECTRICAL" && !c.category_code?.includes("ELEC")) return false;
        if (filterCategory === "WATER" && !c.category_code?.includes("WATER") && !c.category_code?.includes("HYGIENE")) return false;
        if (filterCategory === "P1" && c.priority !== "P1") return false;
        if (filterCategory === "TRENDING" && (c.upvote_count || 0) < 5) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = c.title?.toLowerCase().includes(q);
          const matchesTicket = (c.ticket_no || c.id)?.toLowerCase().includes(q);
          const matchesLoc = c.location_text?.toLowerCase().includes(q);
          if (!matchesTitle && !matchesTicket && !matchesLoc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "upvotes") {
          return (b.upvote_count || 0) - (a.upvote_count || 0);
        } else if (sortBy === "risk") {
          return (b.risk_score || 0) - (a.risk_score || 0);
        } else {
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        }
      });
  }, [complaints, filterCategory, searchQuery, sortBy]);

  // Top trending ticket calculation
  const topTrendingIssue = React.useMemo(() => {
    if (complaints.length === 0) return null;
    return [...complaints].sort((a, b) => (b.upvote_count || 0) - (a.upvote_count || 0))[0];
  }, [complaints]);

  const p1Count = complaints.filter((c) => c.priority === "P1").length;

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <div className="space-y-6 max-w-8xl pb-12">
        {/* Top Header & Community Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-rose-600 text-white text-[11px] font-semibold gap-1 py-0.5 px-2">
                <FlameIcon className="size-3" />
                <span>Hostel 14 Voice</span>
              </Badge>
              <span className="text-xs text-slate-500 font-mono">
                Peer Endorsements &amp; Live Triage (2.2)
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Student Community Upvoting Feed
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Vote on common campus facility issues to autonomously boost AI resolution priority and technician dispatch.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchHostelIssues}
              className="text-xs gap-1.5 shadow-2xs"
            >
              <RotateCcwIcon className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Feed</span>
            </Button>
            <Badge variant="outline" className="px-3 py-1 text-xs gap-1.5 border-indigo-200 text-indigo-700 bg-indigo-50/50">
              <Building2Icon className="size-3.5" />
              <span>HB-3 / Hall 14 Scope</span>
            </Badge>
          </div>
        </div>

        {/* Top Community Trending Highlights Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card
            className="border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-white p-3.5 shadow-2xs cursor-pointer hover:border-indigo-300 transition-all"
            onClick={() => topTrendingIssue && handleOpenDetail(topTrendingIssue)}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                <FlameIcon className="size-3.5 text-rose-500" />
                #1 Top Endorsed Issue
              </span>
              <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px]">
                {topTrendingIssue?.upvote_count || 0} Upvotes
              </Badge>
            </div>
            <h4 className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">
              {topTrendingIssue?.title || "No trending issues"}
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
              {topTrendingIssue?.location_text || "Click to inspect full discussion"}
            </p>
          </Card>

          <Card className="border-rose-100 bg-gradient-to-br from-rose-50/40 to-white p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
                <ShieldAlertIcon className="size-3.5 text-rose-600" />
                Emergency P1 Alerts
              </span>
              <Badge variant="destructive" className="text-[10px]">
                {p1Count} Urgent
              </Badge>
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1 font-mono">
              {p1Count} Active Safety Risks
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Instant bypass to Caretaker &amp; Warden triage
            </p>
          </Card>

          <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50/40 to-white p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                <TrendingUpIcon className="size-3.5 text-emerald-600" />
                Autonomous Queue Impact
              </span>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                Live Dynamic Weight
              </Badge>
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1 font-mono">
              +15% SLA Weight
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Per 5 peer endorsements in campus algorithm
            </p>
          </Card>
        </div>

        {/* Search, Filter Tabs & Sort Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <SearchIcon className="size-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search issues, tags, room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-600 w-52 shadow-2xs"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs shadow-2xs">
              <button
                type="button"
                onClick={() => setFilterCategory("ALL")}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${filterCategory === "ALL" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                All Feed
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory("TRENDING")}
                className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${filterCategory === "TRENDING" ? "bg-white text-rose-700 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                <FlameIcon className="size-3 text-rose-500" />
                Trending
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory("ELECTRICAL")}
                className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${filterCategory === "ELECTRICAL" ? "bg-white text-amber-800 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                <ZapIcon className="size-3 text-amber-500" />
                Electrical
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory("WATER")}
                className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${filterCategory === "WATER" ? "bg-white text-blue-800 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                <DropletsIcon className="size-3 text-blue-500" />
                Plumbing
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory("P1")}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${filterCategory === "P1" ? "bg-white text-rose-700 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                🚨 P1 Critical
              </button>
            </div>
          </div>

          {/* Sort By Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 self-end md:self-center">
            <span className="text-[11px] font-medium">Sort by:</span>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setSortBy("upvotes")}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${sortBy === "upvotes" ? "bg-white text-slate-900 font-bold shadow-2xs" : "text-slate-600"
                  }`}
              >
                Most Upvoted
              </button>
              <button
                type="button"
                onClick={() => setSortBy("newest")}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${sortBy === "newest" ? "bg-white text-slate-900 font-bold shadow-2xs" : "text-slate-600"
                  }`}
              >
                Newest
              </button>
              <button
                type="button"
                onClick={() => setSortBy("risk")}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${sortBy === "risk" ? "bg-white text-slate-900 font-bold shadow-2xs" : "text-slate-600"
                  }`}
              >
                Highest Risk
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SOCIAL MEDIA STYLE GRID CARDS LAYOUT */}
        {/* ========================================================================= */}
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="size-8 border-3 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Loading community issues feed...</p>
          </div>
        ) : filteredIssues.length === 0 ? (
          <Card className="bg-white border-slate-200 p-16 text-center space-y-3">
            <CheckCircle2Icon className="size-10 text-emerald-500 mx-auto" />
            <CardTitle className="text-base font-bold text-slate-900">
              No matching community issues found
            </CardTitle>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Facilities running smoothly or try clearing your search/category filters.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredIssues.map((item) => {
              const hasUpvoted = !!upvotedIds[item.id] || !!upvotedIds[item.ticket_no];
              const isElectrical = item.category_code?.includes("ELEC");
              const isWater = item.category_code?.includes("WATER") || item.category_code?.includes("HYGIENE");
              const isP1 = item.priority === "P1";

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenDetail(item)}
                  className={`group bg-white rounded-2xl border transition-all duration-200 shadow-2xs hover:shadow-md cursor-pointer flex flex-col justify-between overflow-hidden relative ${isP1
                    ? "border-rose-200 hover:border-rose-300"
                    : "border-slate-200 hover:border-indigo-300"
                    }`}
                >
                  {/* Top Emergency Highlight Stripe for P1 */}
                  {isP1 && (
                    <div className="h-1 bg-gradient-to-r from-rose-500 to-amber-500 w-full" />
                  )}

                  <div className="p-5 space-y-3.5">
                    {/* 1. Author Row & Post Timestamp */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`size-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-2xs ${isElectrical
                            ? "bg-amber-500"
                            : isWater
                              ? "bg-blue-600"
                              : "bg-indigo-600"
                            }`}
                        >
                          {item.title.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            Hostel 14 Resident
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.ticket_no || item.id}
                          </span>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono ${item.status === "RESOLVED" || item.status === "CLOSED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : item.status === "IN_PROGRESS"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : item.status === "ASSIGNED"
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                      >
                        {item.status}
                      </Badge>
                    </div>

                    {/* 2. Badges Row: Category & Priority */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase font-mono ${isElectrical
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : isWater
                            ? "bg-blue-50 text-blue-800 border-blue-200"
                            : "bg-slate-50 text-slate-700 border-slate-200"
                          }`}
                      >
                        {isElectrical && <ZapIcon className="size-2.5 mr-1 text-amber-500 inline" />}
                        {isWater && <DropletsIcon className="size-2.5 mr-1 text-blue-500 inline" />}
                        {item.category_code || "GENERAL"}
                      </Badge>

                      {isP1 ? (
                        <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-[10px] font-bold">
                          🔴 P1 CRITICAL
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-slate-50 text-slate-600 border-slate-200 text-[10px]"
                        >
                          {item.priority || "P3"}
                        </Badge>
                      )}

                      {item.assigned_to_name && (
                        <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">
                          Assigned: {item.assigned_to_name}
                        </span>
                      )}
                    </div>

                    {/* 3. Post Title & Body */}
                    <div className="space-y-1.5">
                      <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* 4. Hashtags & Category Evidence Thumbnail */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 truncate text-slate-700 font-medium">
                          <MapPinIcon className="size-3 text-indigo-500 shrink-0" />
                          {item.location_text || "Hostel 14 Wing"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Severity: {item.severity || 3}/5
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1 pt-0.5">
                        <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                          #{item.category_code?.toLowerCase() || "campus"}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded">
                          #Hostel14
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded">
                          #SLAQueue
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 5. INTERACTIVE SOCIAL ENGAGEMENT TOOLBAR (Footer) */}
                  <div className="p-3.5 px-5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                    {/* Bouncy Upvote Button */}
                    <Button
                      size="sm"
                      onClick={(e) => handleUpvote(item.id || item.ticket_no, e)}
                      className={`text-xs gap-1.5 font-bold px-3 py-1.5 rounded-xl transition-all shadow-2xs ${hasUpvoted
                        ? "bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-600/20"
                        : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                    >
                      <ThumbsUpIcon
                        className={`size-3.5 ${hasUpvoted ? "fill-white text-white" : "text-slate-500"}`}
                      />
                      <span>{item.upvote_count || 0} Upvotes</span>
                    </Button>

                    {/* Comments & Endorsements Indicator */}
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1 hover:text-slate-800 transition-colors">
                        <MessageSquareIcon className="size-3.5 text-slate-400" />
                        <span>{item.people_affected || 4} Endorsed</span>
                      </span>

                      <span className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                        <span>Details</span>
                        <ArrowRightIcon className="size-3" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FULL-HEIGHT RIGHT-SIDE SLIDE-OVER DETAIL DRAWER */}
      <CommunityIssueDetailDrawer
        ticket={selectedTicket}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        hasUpvoted={
          !!selectedTicket &&
          (!!upvotedIds[selectedTicket.id] || !!upvotedIds[selectedTicket.ticket_no])
        }
        upvoteCount={
          selectedTicket
            ? complaints.find((c) => c.id === selectedTicket.id || c.ticket_no === selectedTicket.ticket_no)
              ?.upvote_count || selectedTicket.upvote_count || 0
            : 0
        }
        onToggleUpvote={(ticketId) => handleUpvote(ticketId)}
      />
    </RoleDashboardShell>
  );
}
