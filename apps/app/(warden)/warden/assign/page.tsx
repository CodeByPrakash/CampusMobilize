"use client";

import * as React from "react";
import { ROLES } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { getWardenNav } from "@/components/dashboards/nav-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  UserPlusIcon,
  WrenchIcon,
  CheckCircle2Icon,
  ShieldCheckIcon,
  ClockIcon,
  ZapIcon,
  DropletsIcon,
  HammerIcon,
  FilterIcon,
  SearchIcon,
  AlertCircleIcon,
  ArrowRightIcon,
  SparklesIcon,
  RotateCcwIcon,
  PhoneIcon,
  MapPinIcon,
} from "lucide-react";
import { toast } from "sonner";
import { apiListComplaints, apiTransitionComplaint } from "@/lib/api";
import {
  AssignTradesmanDrawer,
  TRADESMEN_ROSTER,
  Tradesman,
} from "@/components/warden/assign-tradesman-drawer";

export default function WardenAssignPage() {
  const role = ROLES.find((r) => r.id === "warden") || ROLES[4];
  const navItems = getWardenNav();

  const [tickets, setTickets] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filterCategory, setFilterCategory] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Drawer state for the right-side full-height popup
  const [drawerOpen, setDrawerOpen] = React.useState<boolean>(false);
  const [selectedTicket, setSelectedTicket] = React.useState<any | null>(null);
  const [drawerInitialTrade, setDrawerInitialTrade] = React.useState<
    "Electrician" | "Plumber" | "Carpenter" | "Caretaker" | "All"
  >("All");

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiListComplaints({ hostel_code: "HB-3" });
      const items = Array.isArray(res) ? res : res?.items || [];
      setTickets(items);
    } catch {
      // Demo fallback if network is offline
      setTickets([
        {
          id: "CIQ-2026-00001",
          ticket_no: "CIQ-2026-00001",
          title: "Main ceiling fan sparking and regulator burnt",
          description: "Continuous sparks and burning odor coming from regulator inside room 204.",
          category_code: "ELECTRICAL",
          priority: "P1",
          status: "ASSIGNED",
          location_text: "Hostel 14, B-Block, Room 204",
          assigned_to_name: "Suresh Babu",
        },
        {
          id: "CIQ-2026-00140",
          ticket_no: "CIQ-2026-00140",
          title: "Water dispenser paper cup dispenser broken & valve leakage",
          description: "Plastic cup dispenser next to water cooler has snapped off and valve is leaking puddle.",
          category_code: "WATER",
          priority: "P3",
          status: "IN_PROGRESS",
          location_text: "Hostel 14, 1st Floor Corridor",
          assigned_to_name: "Maheswar Nayak",
        },
        {
          id: "CIQ-2026-00040",
          ticket_no: "CIQ-2026-00040",
          title: "Main hostel back gate padlock broken",
          description: "The security padlock on the back wicket gate is broken. Anyone can enter from outside.",
          category_code: "SECURITY",
          priority: "P1",
          status: "OPEN",
          location_text: "Hostel 14 Back Perimeter Gate",
        },
        {
          id: "CIQ-2026-00233",
          ticket_no: "CIQ-2026-00233",
          title: "Drinking water cooler leaking and dirty filter",
          description: "Water cooler on D-Block 1st floor is leaking puddles on the corridor floor.",
          category_code: "WATER",
          priority: "P2",
          status: "OPEN",
          location_text: "Hostel 14, D-Block 1st Floor",
        },
        {
          id: "CIQ-2026-00183",
          ticket_no: "CIQ-2026-00183",
          title: "Loose electrical socket with burning smell in room 335",
          description: "Wall power socket sparking when laptop charger plugged in. Requires immediate rewire.",
          category_code: "ELECTRICAL",
          priority: "P1",
          status: "VERIFIED",
          location_text: "Hostel 14, C-Block, Room 335",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Open right-side full-height popup with specific trade preset
  const handleOpenAssignDrawer = (
    ticket: any,
    tradePreset: "Electrician" | "Plumber" | "Carpenter" | "Caretaker" | "All"
  ) => {
    setSelectedTicket(ticket);
    setDrawerInitialTrade(tradePreset);
    setDrawerOpen(true);
  };

  // Called when assignment successfully submitted from the right-side popup
  const handleAssignmentSuccess = (ticketId: string, tradesman: Tradesman, note: string) => {
    // Update local state immediately for responsive UI
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId || t.ticket_no === ticketId) {
          return {
            ...t,
            status: "ASSIGNED",
            assigned_to_name: tradesman.name,
            tradesman_name: tradesman.name,
            trade: tradesman.trade,
          };
        }
        return t;
      })
    );
    loadData();
  };

  // Filter tickets
  const filteredTickets = React.useMemo(() => {
    return tickets.filter((t) => {
      // Category filter
      if (filterCategory === "ELECTRICAL" && !t.category_code?.includes("ELEC")) return false;
      if (filterCategory === "WATER" && !t.category_code?.includes("WATER")) return false;
      if (filterCategory === "P1" && t.priority !== "P1") return false;
      if (filterCategory === "UNASSIGNED" && t.status !== "OPEN" && t.status !== "VERIFIED") return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title?.toLowerCase().includes(q);
        const matchesTicket = (t.ticket_no || t.id)?.toLowerCase().includes(q);
        const matchesLoc = t.location_text?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesTicket && !matchesLoc) return false;
      }

      return true;
    });
  }, [tickets, filterCategory, searchQuery]);

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <div className="space-y-6 max-w-8xl pb-10">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Assign Tradesmen & Resource Dispatch
            </h1>
            <p className="text-sm text-slate-500">
              Match resident complaints with certified institute technicians and monitor active workloads (6, 7.4).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              className="text-xs gap-1.5 shadow-2xs"
            >
              <RotateCcwIcon className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Queue</span>
            </Button>
            <Badge className="bg-slate-900 text-white px-3 py-1.5 text-xs font-semibold">
              Hall of Residence 14 Roster
            </Badge>
          </div>
        </div>

        {/* Technician Workload Overview Cards */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <ShieldCheckIcon className="size-3.5 text-indigo-600" />
              Certified Institute Tradesmen On-Call Roster
            </h3>
            <span className="text-[11px] text-slate-400">
              Total active technicians: {TRADESMEN_ROSTER.length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {TRADESMEN_ROSTER.slice(0, 4).map((tm) => (
              <Card
                key={tm.id}
                className="bg-white border-slate-200 hover:border-indigo-300 transition-all shadow-2xs cursor-pointer group"
                onClick={() => {
                  // If tickets exist, open drawer with this trade preset
                  if (tickets.length > 0) {
                    handleOpenAssignDrawer(tickets[0], tm.trade);
                  }
                }}
              >
                <CardHeader className="p-3.5 pb-2">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-medium ${tm.trade === "Electrician"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : tm.trade === "Plumber"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                    >
                      {tm.trade === "Electrician" && <ZapIcon className="size-2.5 mr-1 text-amber-500 inline" />}
                      {tm.trade === "Plumber" && <DropletsIcon className="size-2.5 mr-1 text-blue-500 inline" />}
                      {tm.tradeTitle}
                    </Badge>
                    <span className="text-xs font-bold text-amber-600">{tm.rating}</span>
                  </div>
                  <CardTitle className="text-sm font-bold text-slate-900 mt-1 flex items-center justify-between">
                    <span>{tm.name}</span>
                    <ArrowRightIcon className="size-3 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3.5 pt-0 flex items-center justify-between text-xs text-slate-500">
                  <Badge
                    className={`text-[10px] py-0 px-1.5 ${tm.activeJobs === 0
                      ? "bg-emerald-100 text-emerald-800"
                      : tm.activeJobs === 1
                        ? "bg-blue-100 text-blue-800"
                        : "bg-amber-100 text-amber-800"
                      }`}
                  >
                    {tm.activeJobs === 0 ? "Available (0 Jobs)" : `${tm.activeJobs} Active Jobs`}
                  </Badge>
                  <span className="font-mono text-[11px] text-slate-400">{tm.phone}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Ticket Assignment Queue Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <UserPlusIcon className="size-4 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">
                Tickets Awaiting Technician Assignment
              </h2>
              <Badge variant="outline" className="font-mono text-xs">
                {filteredTickets.length} Tickets
              </Badge>
            </div>

            {/* Filter Pills & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <SearchIcon className="size-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter ticket or room..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-600 w-44"
                />
              </div>

              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterCategory("ALL")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${filterCategory === "ALL" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600"
                    }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCategory("ELECTRICAL")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${filterCategory === "ELECTRICAL" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600"
                    }`}
                >
                  <ZapIcon className="size-3 text-amber-500" />
                  Electrical
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCategory("WATER")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${filterCategory === "WATER" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600"
                    }`}
                >
                  <DropletsIcon className="size-3 text-blue-500" />
                  Plumbing
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCategory("P1")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${filterCategory === "P1" ? "bg-white text-rose-700 shadow-2xs font-bold" : "text-slate-600"
                    }`}
                >
                  P1 Emergency
                </button>
              </div>
            </div>
          </div>

          {/* Ticket Cards List */}
          {filteredTickets.length === 0 ? (
            <Card className="bg-white border-slate-200 p-12 text-center space-y-2">
              <CheckCircle2Icon className="size-8 text-emerald-500 mx-auto" />
              <CardTitle className="text-sm font-bold text-slate-800">
                All Work Orders Assigned
              </CardTitle>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No tickets matching current filters. All complaints have designated technicians or have been resolved.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((t) => {
                const isElectrical = t.category_code?.includes("ELEC");
                const isWater = t.category_code?.includes("WATER") || t.category_code?.includes("HYGIENE");
                const isP1 = t.priority === "P1";

                return (
                  <Card
                    key={t.id}
                    className={`bg-white border-slate-200 hover:border-slate-300 transition-all shadow-2xs ${isP1 ? "border-l-4 border-l-rose-500" : ""
                      }`}
                  >
                    <CardHeader className="p-4 pb-2.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-800">
                            {t.ticket_no || t.id}
                          </span>

                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold ${isP1
                              ? "bg-rose-50 text-rose-700 border-rose-300"
                              : t.priority === "P2"
                                ? "bg-amber-50 text-amber-700 border-amber-300"
                                : "bg-slate-50 text-slate-700 border-slate-200"
                              }`}
                          >
                            {t.priority || "P3"}
                          </Badge>

                          <Badge
                            variant="outline"
                            className={`text-[10px] font-mono uppercase ${isElectrical
                              ? "border-amber-200 text-amber-800 bg-amber-50/50"
                              : isWater
                                ? "border-blue-200 text-blue-800 bg-blue-50/50"
                                : "border-slate-200 text-slate-700"
                              }`}
                          >
                            {t.category_code || "GENERAL"}
                          </Badge>

                          {t.assigned_to_name && (
                            <Badge className="bg-indigo-50 text-indigo-800 border-indigo-200 text-[10px] font-normal">
                              Assigned: {t.assigned_to_name}
                            </Badge>
                          )}
                        </div>

                        <CardTitle className="text-sm sm:text-base font-bold text-slate-900">
                          {t.title}
                        </CardTitle>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant="outline"
                          className={`text-[11px] font-mono ${t.status === "ASSIGNED"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : t.status === "IN_PROGRESS"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : t.status === "OPEN"
                                ? "bg-slate-100 text-slate-700 border-slate-300"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                        >
                          Status: {t.status}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 pt-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2 max-w-2xl">
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {t.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1 text-slate-600">
                            <MapPinIcon className="size-3 text-indigo-500" />
                            {t.location_text || `${t.block_name || "Block B"}, Room ${t.room_no || "204"}`}
                          </span>
                          <span className="flex items-center gap-1">
                            <ClockIcon className="size-3 text-slate-400" />
                            SLA Window:{" "}
                            <strong className="text-slate-700 font-mono">
                              {isP1 ? "2h (Emergency)" : "8h-24h"}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons Triggering the Rightside Popup Drawer */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs border-amber-300 hover:bg-amber-50 text-amber-900 gap-1.5 font-medium shadow-2xs"
                          onClick={() => handleOpenAssignDrawer(t, "Electrician")}
                        >
                          <ZapIcon className="size-3.5 text-amber-500" />
                          <span>Assign Electrician</span>
                        </Button>

                        <Button
                          size="sm"
                          className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 font-semibold shadow-2xs"
                          onClick={() => handleOpenAssignDrawer(t, "Plumber")}
                        >
                          <DropletsIcon className="size-3.5 text-white" />
                          <span>Assign Plumber</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-slate-600 hover:text-slate-900"
                          onClick={() => handleOpenAssignDrawer(t, "All")}
                        >
                          <span>More Trades...</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* FULL-HEIGHT RIGHT-SIDE SLIDE-OVER POPUP DRAWER */}
      <AssignTradesmanDrawer
        ticket={selectedTicket}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        initialTrade={drawerInitialTrade}
        onSuccess={handleAssignmentSuccess}
      />
    </RoleDashboardShell>
  );
}
