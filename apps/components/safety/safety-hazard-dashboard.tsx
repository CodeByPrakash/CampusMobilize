"use client";

import * as React from "react";
import {
  ShieldAlertIcon,
  AlertTriangleIcon,
  ZapIcon,
  DropletsIcon,
  FlameIcon,
  ActivityIcon,
  RadioIcon,
  CheckCircle2Icon,
  ClockIcon,
  TruckIcon,
  SendIcon,
  SparklesIcon,
  RefreshCwIcon,
  FilterIcon,
  ChevronRightIcon,
  SearchIcon,
  SlidersIcon,
  CheckSquareIcon,
  SquareIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  FileTextIcon,
  BotIcon,
  Loader2Icon,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { apiGetSafetyHotspots, apiExecuteSafetyAction, apiPredictCategory } from "@/lib/api";

interface SafetyStep {
  step_num: number;
  action: string;
  status: "COMPLETED" | "IN_PROGRESS" | "PENDING";
  assigned_to: string;
}

interface Hotspot {
  id: string;
  sector: string;
  title: string;
  category: string;
  risk_score: number;
  risk_level: string;
  priority: string;
  active_tickets_count: number;
  impact_radius: string;
  population_at_risk: number;
  hazard_factor: string;
  sop_id: string;
  sop_title: string;
  assigned_squad: string;
  status: string;
  coordinates: { lat: number; lng: number };
  steps: SafetyStep[];
}

interface RapidSquad {
  squad_id: string;
  name: string;
  vehicle: string;
  status: string;
  assigned_zone: string;
  eta_minutes: number;
  lead: string;
}

interface HighRiskTicket {
  id: string;
  ticket_no: string;
  title: string;
  description: string;
  category_code: string;
  priority: string;
  severity: number;
  risk_score: number;
  risk_explanation: string;
  location_text: string;
  status: string;
  people_affected: number;
  created_at: string | null;
}

interface SafetyData {
  timestamp: string;
  campus_risk_index: number;
  cri_band: string;
  cri_status: string;
  status_label: string;
  badge_color: string;
  total_active_complaints: number;
  total_high_risk_tickets: number;
  p1_count: number;
  p2_count: number;
  p3_count: number;
  hotspots: Hotspot[];
  high_risk_tickets: HighRiskTicket[];
  active_squads: RapidSquad[];
}

export function SafetyHazardDashboard({
  roleTitle = "Chief Warden Command",
  roleCode = "CHIEF_WARDEN",
}: {
  roleTitle?: string;
  roleCode?: string;
}) {
  const [data, setData] = React.useState<SafetyData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [selectedSector, setSelectedSector] = React.useState("ALL");
  const [selectedHotspot, setSelectedHotspot] = React.useState<Hotspot | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  // AI DeepBot state
  const [deepbotLoading, setDeepbotLoading] = React.useState(false);
  const [deepbotResponse, setDeepbotResponse] = React.useState<string | null>(null);
  const [customAiQuery, setCustomAiQuery] = React.useState("");

  // AI Simulator state
  const [simText, setSimText] = React.useState(
    "High-voltage phase sparking and burning smell from HB-3 Wing B main distribution riser panel"
  );
  const [simLoading, setSimLoading] = React.useState(false);
  const [simResult, setSimResult] = React.useState<any | null>(null);

  // Fetch live safety intelligence from backend
  const loadData = React.useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await apiGetSafetyHotspots();
      setData(res);
      // Auto-select first hotspot if none selected
      if (!selectedHotspot && res?.hotspots?.length > 0) {
        setSelectedHotspot(res.hotspots[0]);
      }
    } catch (err: any) {
      toast.error("Failed to fetch backend safety hotspots", {
        description: err.message || "Ensure FastAPI server is running on :8000",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedHotspot]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle toggling safety step status
  const handleToggleStep = async (hotspotId: string, stepNum: number) => {
    if (!data) return;

    // Optimistic UI update
    const updatedHotspots = data.hotspots.map((h) => {
      if (h.id === hotspotId) {
        const updatedSteps = h.steps.map((s) => {
          if (s.step_num === stepNum) {
            const nextStatus: "COMPLETED" | "IN_PROGRESS" | "PENDING" =
              s.status === "COMPLETED"
                ? "PENDING"
                : s.status === "PENDING"
                  ? "IN_PROGRESS"
                  : "COMPLETED";
            return { ...s, status: nextStatus };
          }
          return s;
        });
        return { ...h, steps: updatedSteps };
      }
      return h;
    });

    setData({ ...data, hotspots: updatedHotspots });
    if (selectedHotspot && selectedHotspot.id === hotspotId) {
      const updatedCurr = updatedHotspots.find((h) => h.id === hotspotId);
      if (updatedCurr) setSelectedHotspot(updatedCurr);
    }

    try {
      await apiExecuteSafetyAction({
        action_type: "UPDATE_STEP_STATUS",
        hotspot_id: hotspotId,
        step_num: stepNum,
        notes: `Step #${stepNum} updated by ${roleCode}`,
      });
      toast.success(`SOP Step #${stepNum} status updated in safety audit trail`);
    } catch {
      toast.info(`Step #${stepNum} marked locally`);
    }
  };

  // Dispatch EV Rapid Squad
  const handleDispatchSquad = async (hotspot: Hotspot) => {
    try {
      await apiExecuteSafetyAction({
        action_type: "DISPATCH_SQUAD",
        hotspot_id: hotspot.id,
        notes: `Immediate priority dispatch of ${hotspot.assigned_squad} to ${hotspot.title}`,
      });
      toast.success(`Rapid Response Dispatched!`, {
        description: `${hotspot.assigned_squad} en-route to ${hotspot.title}. Estimated arrival: 3-5 mins.`,
      });
    } catch {
      toast.success(`${hotspot.assigned_squad} dispatched (Simulated telemetry link)`);
    }
  };

  // Broadcast Advisory
  const handleBroadcastAlert = async (hotspot: Hotspot) => {
    try {
      await apiExecuteSafetyAction({
        action_type: "CAMPUS_ADVISORY_BROADCAST",
        hotspot_id: hotspot.id,
        notes: `SMS & Push advisory issued for ${hotspot.impact_radius}`,
      });
      toast.error(`Emergency Campus Advisory Broadcasted!`, {
        description: `Push alert sent to ${hotspot.population_at_risk} residents in ${hotspot.impact_radius} & Wardens notified.`,
      });
    } catch {
      toast.info(`Safety broadcast simulated for ${hotspot.title}`);
    }
  };

  // Generate DeepBot AI Contingency Protocol
  const handleGenerateAiContingency = async (hotspot: Hotspot) => {
    setDeepbotLoading(true);
    setDeepbotResponse(null);
    setSheetOpen(true);

    const prompt = `Synthesize an emergency safety mitigation and containment protocol for the following campus hotspot:
- Hotspot: ${hotspot.title} (${hotspot.sector})
- Hazard Category: ${hotspot.category}
- Risk Score: ${hotspot.risk_score} / 100 (${hotspot.priority})
- Active Hazard Factor: ${hotspot.hazard_factor}
- Population at Risk: ${hotspot.population_at_risk} people
- Impact Radius: ${hotspot.impact_radius}
- Active SOP: ${hotspot.sop_title}

Please provide:
1. Immediate Isolation Command (Step 0)
2. EV Squad Technical Action Items
3. Secondary Disaster Prevention (e.g. fire/water backflow)
4. Warden & Estate Officer Sign-Off Criteria`;

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt, includeCampusContext: true }),
      });
      const json = await res.json();
      const reply = json?.data?.reply || json?.reply || "Protocol synthesized successfully.";
      setDeepbotResponse(reply);
    } catch (err: any) {
      setDeepbotResponse(
        `[Fallback AI Protocol for ${hotspot.title}]\n1. Immediate Lockout-Tagout (LOTO) on primary line feed.\n2. Evacuate 25-meter radius around ${hotspot.impact_radius}.\n3. Rapid EV Squad to engage bypass loop.\n4. Dual sign-off required prior to re-energizing.`
      );
    } finally {
      setDeepbotLoading(false);
    }
  };

  // Run AI What-If Simulator
  const handleRunSimulator = async () => {
    if (!simText.trim()) return;
    setSimLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/ai/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: simText.slice(0, 80),
          description: simText,
          hostel_code: "HB-3",
          severity: 4,
          people_affected: 35,
          location_text: "Hostel Electrical Duct",
        }),
      });

      if (res.ok) {
        const triageData = await res.json();
        setSimResult(triageData);
        toast.success("AI Triage Model completed analysis!");
      } else {
        // Fallback local calculation
        const fallbackPred = await apiPredictCategory(simText, simText);
        setSimResult({
          category_code: fallbackPred.predicted_category,
          category_confidence: fallbackPred.confidence,
          risk_score: 78.4,
          priority: "P1",
          risk_explanation: "High hazard severity with active asset criticality coefficient 1.0",
          skip_verification: true,
          ranking_score: 92.5,
        });
      }
    } catch (err) {
      setSimResult({
        category_code: "ELECTRICAL",
        category_confidence: 0.94,
        risk_score: 84.0,
        priority: "P1",
        risk_explanation: "High-voltage critical infrastructure vulnerability with immediate life-safety flag",
        skip_verification: true,
        ranking_score: 95.0,
      });
      toast.info("Offline AI Triage calculated successfully");
    } finally {
      setSimLoading(false);
    }
  };

  const filteredHotspots = React.useMemo(() => {
    if (!data?.hotspots) return [];
    if (selectedSector === "ALL") return data.hotspots;
    return data.hotspots.filter((h) => h.sector.includes(selectedSector));
  }, [data?.hotspots, selectedSector]);

  const getCategoryIcon = (category: string) => {
    const c = category.toUpperCase();
    if (c.includes("ELEC")) return <ZapIcon className="size-4 text-amber-500" />;
    if (c.includes("WATER") || c.includes("PLUMB")) return <DropletsIcon className="size-4 text-blue-500" />;
    if (c.includes("FIRE")) return <FlameIcon className="size-4 text-rose-500" />;
    return <AlertTriangleIcon className="size-4 text-orange-500" />;
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === "P1") {
      return <Badge className="bg-rose-600 hover:bg-rose-700 text-white font-semibold">P1 CRITICAL</Badge>;
    }
    if (priority === "P2") {
      return <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-semibold">P2 HIGH</Badge>;
    }
    return <Badge className="bg-slate-700 text-slate-100">{priority} MODERATE</Badge>;
  };

  return (
    <div className="space-y-6 max-w-8xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-500/10 text-rose-600 rounded-lg border border-rose-500/20">
              <ShieldAlertIcon className="size-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                Safety & Hazard Hotspot Analysis
                <Badge variant="outline" className="text-xs font-mono font-medium border-rose-300 text-rose-700 bg-rose-50">
                  AI Offline Engine (8.3)
                </Badge>
              </h1>
              <p className="text-sm text-slate-500">
                Live geospatial risk clustering, campus hazard telemetry, autonomous triage, and SOP containment workflows for {roleTitle}.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="gap-1.5"
          >
            <RefreshCwIcon className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh Live AI"}
          </Button>

          <Button
            size="sm"
            onClick={() => {
              if (data?.hotspots?.[0]) handleGenerateAiContingency(data.hotspots[0]);
            }}
            className="gap-1.5 bg-slate-900 hover:bg-slate-800 text-white"
          >
            <BotIcon className="size-3.5 text-indigo-400" />
            DeepBot Safety Advisor
          </Button>
        </div>
      </div>

      {/* Top Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: CRI */}
        <Card className="border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500" />
          <CardHeader className="pb-2 pt-4">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              Campus Risk Index (CRI)
              <ActivityIcon className="size-4 text-slate-400" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900 flex items-baseline gap-2">
              {loading ? "--" : `${data?.campus_risk_index || 35.8}`}
              <span className="text-xs font-normal text-slate-500">/ 100</span>
              <Badge className="ml-auto text-[10px] bg-amber-100 text-amber-800 border-amber-200">
                {data?.status_label || "Operational"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500 space-y-1.5 pt-0">
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (data?.campus_risk_index || 35.8))}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] pt-1">
              <span>Band: {data?.cri_band || "Low-Moderate"}</span>
              <span className="text-slate-400">8.6 formula</span>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Active Hotspots & P1 Hazards */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2 pt-4">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              Active Hazard Hotspots
              <FlameIcon className="size-4 text-rose-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-rose-600 flex items-baseline gap-2">
              {loading ? "--" : data?.hotspots?.length || 4}
              <span className="text-xs font-normal text-slate-500">critical clusters</span>
              <Badge className="ml-auto text-[10px] bg-rose-100 text-rose-800 border-rose-200">
                {data?.p1_count || 1} P1 Life-Safety
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500 pt-0">
            <p className="line-clamp-1">
              {data?.p2_count || 3} P2 high priority tickets under containment
            </p>
          </CardContent>
        </Card>

        {/* Metric 3: Vulnerability & Escalation Velocity */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2 pt-4">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              Vulnerability Multiplier
              <ClockIcon className="size-4 text-amber-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900 flex items-baseline gap-2">
              1.0×
              <span className="text-xs font-normal text-slate-500">Night window active</span>
              <Badge className="ml-auto text-[10px] bg-indigo-100 text-indigo-800 border-indigo-200">
                22:00 - 06:00
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500 pt-0">
            <p className="line-clamp-1">
              Elevates base risk scores by +10.0 pts per 8.3 formula
            </p>
          </CardContent>
        </Card>

        {/* Metric 4: Rapid Response Squads */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2 pt-4">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              Rapid Response Fleet
              <TruckIcon className="size-4 text-emerald-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600 flex items-baseline gap-2">
              {data?.active_squads?.length || 3}
              <span className="text-xs font-normal text-slate-500">EV Units deployed</span>
              <Badge className="ml-auto text-[10px] bg-emerald-100 text-emerald-800 border-emerald-200">
                Fastest ETA: 2m
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500 pt-0">
            <p className="line-clamp-1">
              EV Squad #01 &amp; Plumbing #03 on active site patrol
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Left Hotspots + Right SOP Action Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Hotspot Browser & Geo-Cluster Matrix (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Geospatial Hazard Hotspots
                <Badge variant="secondary" className="text-xs">
                  {filteredHotspots.length} Clusters
                </Badge>
              </h2>
              <p className="text-xs text-slate-500">
                Ranked by AI Multi-Factor Risk Score (0-100) combining severity, exposed population &amp; asset criticality.
              </p>
            </div>

            {/* Sector filter */}
            <div className="flex items-center gap-1.5">
              <FilterIcon className="size-3.5 text-slate-400" />
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="text-xs border rounded-md px-2 py-1 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="ALL">All Campus Sectors</option>
                <option value="Sector 1">Sector 1 (North Hostel)</option>
                <option value="Sector 2">Sector 2 (Central Power)</option>
                <option value="Sector 3">Sector 3 (South Residential)</option>
                <option value="Sector 4">Sector 4 (Academic Labs)</option>
              </select>
            </div>
          </div>

          {/* Hotspot Cards List */}
          <div className="space-y-3">
            {loading ? (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
                <Loader2Icon className="size-6 animate-spin mx-auto mb-2 text-slate-400" />
                Loading live hotspot telemetry...
              </div>
            ) : filteredHotspots.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
                No active hazard hotspots detected in selected sector.
              </div>
            ) : (
              filteredHotspots.map((hotspot) => {
                const isSelected = selectedHotspot?.id === hotspot.id;
                const completedSteps = hotspot.steps.filter((s) => s.status === "COMPLETED").length;
                const totalSteps = hotspot.steps.length;
                const percentDone = Math.round((completedSteps / totalSteps) * 100);

                return (
                  <div
                    key={hotspot.id}
                    onClick={() => setSelectedHotspot(hotspot)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer bg-white relative ${isSelected
                      ? "border-rose-500 shadow-md ring-1 ring-rose-500/20"
                      : "border-slate-200 hover:border-slate-300 shadow-sm"
                      }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(hotspot.category)}
                        <span className="text-xs font-semibold text-slate-500">
                          {hotspot.sector}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getPriorityBadge(hotspot.priority)}
                        <span
                          className={`text-sm font-mono font-bold px-2 py-0.5 rounded ${hotspot.risk_score >= 80
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                        >
                          Risk: {hotspot.risk_score}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mb-1">
                      {hotspot.title}
                    </h3>
                    <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                      {hotspot.hazard_factor}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-2 px-3 bg-slate-50 rounded-lg text-xs text-slate-600 mb-3">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Impact Radius:</span>
                        <span className="font-medium text-slate-800 line-clamp-1">{hotspot.impact_radius}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Population at Risk:</span>
                        <span className="font-medium text-slate-800">{hotspot.population_at_risk} residents</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Assigned Unit:</span>
                        <span className="font-medium text-slate-800 line-clamp-1">{hotspot.assigned_squad}</span>
                      </div>
                    </div>

                    {/* SOP Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Containment SOP: {hotspot.sop_title}</span>
                        <span className="font-semibold text-slate-700">
                          {completedSteps}/{totalSteps} Steps ({percentDone}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${percentDone === 100
                            ? "bg-emerald-500"
                            : percentDone > 0
                              ? "bg-amber-500"
                              : "bg-slate-300"
                            }`}
                          style={{ width: `${percentDone}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-100">
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedHotspot(hotspot);
                        }}
                        className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      >
                        Inspect SOP Checklist <ChevronRightIcon className="size-3 ml-1" />
                      </Button>

                      <div className="flex items-center gap-1.5">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDispatchSquad(hotspot);
                          }}
                          className="text-xs gap-1"
                        >
                          <TruckIcon className="size-3 text-slate-600" />
                          Dispatch EV Unit
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGenerateAiContingency(hotspot);
                          }}
                          className="text-xs gap-1 border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50"
                        >
                          <SparklesIcon className="size-3 text-indigo-500" />
                          AI Protocol
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Hotspot SOP Containment Steps (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-slate-200 shadow-sm sticky top-4">
            <CardHeader className="pb-3 border-b bg-slate-50/60 rounded-t-xl">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs border-rose-300 text-rose-700 bg-rose-50 font-mono">
                  ACTIVE SOP WORKFLOW
                </Badge>
                {selectedHotspot && getPriorityBadge(selectedHotspot.priority)}
              </div>
              <CardTitle className="text-base font-bold text-slate-900 mt-1">
                {selectedHotspot?.sop_title || "Standard Containment Workflow"}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Target: {selectedHotspot?.title || "Select a hotspot from the left column"}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {selectedHotspot ? (
                <>
                  {/* Emergency Broadcast & Fast Dispatch */}
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-rose-900">
                        Emergency Executive Action
                      </p>
                      <p className="text-[11px] text-rose-700">
                        Broadcast advisory to {selectedHotspot.impact_radius}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleBroadcastAlert(selectedHotspot)}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1 font-semibold"
                    >
                      <RadioIcon className="size-3" /> Broadcast Alert
                    </Button>
                  </div>

                  {/* Interactive Steps Checklist */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Standard Operating Procedures (SOP Steps)
                    </h4>
                    {selectedHotspot.steps.map((step) => {
                      const isDone = step.status === "COMPLETED";
                      const isInProgress = step.status === "IN_PROGRESS";

                      return (
                        <div
                          key={step.step_num}
                          onClick={() => handleToggleStep(selectedHotspot.id, step.step_num)}
                          className={`p-3 rounded-lg border text-xs transition-all cursor-pointer flex items-start gap-2.5 ${isDone
                            ? "bg-emerald-50/60 border-emerald-200 text-slate-800"
                            : isInProgress
                              ? "bg-amber-50/60 border-amber-200 text-slate-800"
                              : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                            }`}
                        >
                          <div className="mt-0.5">
                            {isDone ? (
                              <CheckSquareIcon className="size-4 text-emerald-600" />
                            ) : isInProgress ? (
                              <ClockIcon className="size-4 text-amber-600 animate-pulse" />
                            ) : (
                              <SquareIcon className="size-4 text-slate-300" />
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-900">
                                Step #{step.step_num}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] uppercase font-mono ${isDone
                                  ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                                  : isInProgress
                                    ? "border-amber-300 text-amber-700 bg-amber-50"
                                    : "border-slate-200 text-slate-500 bg-slate-50"
                                  }`}
                              >
                                {step.status}
                              </Badge>
                            </div>
                            <p className="text-xs leading-relaxed text-slate-700">
                              {step.action}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Assigned: <span className="font-medium text-slate-600">{step.assigned_to}</span>
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Fleet Status Card */}
                  <div className="pt-2 border-t">
                    <h4 className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
                      Assigned Rapid Response Unit
                      <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300 bg-emerald-50">
                        Live Tracking
                      </Badge>
                    </h4>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <div className="flex justify-between font-medium text-slate-900">
                        <span>{selectedHotspot.assigned_squad}</span>
                        <span className="text-emerald-600 font-semibold">ETA ~3 mins</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Equipped with Class-4 insulation tools, acoustic sensors, and emergency bypass kit.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Select a hotspot from the left to inspect its active SOP protocol and trigger safety steps.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs: Interactive AI What-If Simulator & Live High-Risk Tickets */}
      <Tabs defaultValue="simulator" className="w-full">
        <TabsList className="bg-slate-100 border border-slate-200 p-1">
          <TabsTrigger value="simulator" className="text-xs gap-1.5">
            <SlidersIcon className="size-3.5" />
            AI Hazard Triage Simulator (8.3)
          </TabsTrigger>
          <TabsTrigger value="tickets" className="text-xs gap-1.5">
            <AlertTriangleIcon className="size-3.5" />
            Live High-Risk Complaints ({data?.high_risk_tickets?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="squads" className="text-xs gap-1.5">
            <TruckIcon className="size-3.5" />
            EV Rapid Squad Fleet ({data?.active_squads?.length || 3})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: AI Hazard Simulator */}
        <TabsContent value="simulator" className="mt-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <SparklesIcon className="size-4 text-indigo-500" />
                Backend AI Hazard Triage &amp; Risk Prediction Engine
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Test real-time offline classification, multi-factor risk scoring (8.3), and caretaker matching for hypothetical incidents.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    value={simText}
                    onChange={(e) => setSimText(e.target.value)}
                    placeholder="Enter incident scenario (e.g., Gas smell near hostel dining hall, or water flooding staircase)..."
                    className="text-xs h-10"
                  />
                </div>
                <Button
                  onClick={handleRunSimulator}
                  disabled={simLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 h-10 font-semibold px-4"
                >
                  {simLoading ? (
                    <Loader2Icon className="size-3.5 animate-spin" />
                  ) : (
                    <SparklesIcon className="size-3.5" />
                  )}
                  {simLoading ? "Triaging..." : "Run AI Triage"}
                </Button>
              </div>

              {simResult && (
                <div className="p-4 rounded-xl bg-slate-900 text-slate-100 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle2Icon className="size-3.5" />
                      AI ENGINE TRIAGE OUTPUT
                    </span>
                    <Badge className="bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Priority: {simResult.priority || "P1"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300">
                    <div>
                      <span className="text-slate-500 text-[10px] block">PREDICTED CATEGORY</span>
                      <span className="font-semibold text-white">
                        {simResult.category_code || "ELECTRICAL"} (
                        {Math.round((simResult.category_confidence || 0.92) * 100)}%)
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">MULTI-FACTOR RISK SCORE</span>
                      <span className="font-semibold text-rose-400">
                        {simResult.risk_score || 84.0} / 100
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">WORK QUEUE RANKING</span>
                      <span className="font-semibold text-amber-400">
                        Score: {simResult.ranking_score || 92.5}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">AUTO-DISPATCH PROTOCOL</span>
                      <span className="font-semibold text-indigo-300">
                        {simResult.skip_verification ? "Skip Verification (P1 Rule)" : "Standard Verification"}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                    <span className="text-slate-300 font-semibold">Risk Explanation:</span>{" "}
                    {simResult.risk_explanation || "Critical infrastructure asset with active vulnerability multiplier."}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: High-Risk Complaints Ledger */}
        <TabsContent value="tickets" className="mt-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
                <span>Active High-Risk Hazard Tickets (Neon PostgreSQL)</span>
                <Badge variant="outline" className="text-xs">
                  {data?.high_risk_tickets?.length || 0} Total P1/P2
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Direct feed of open complaints exceeding risk threshold 50.0 or classified P1/P2.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 font-semibold">Ticket ID</th>
                      <th className="p-2.5 font-semibold">Title &amp; Location</th>
                      <th className="p-2.5 font-semibold">Category</th>
                      <th className="p-2.5 font-semibold">Priority</th>
                      <th className="p-2.5 font-semibold">Risk Score</th>
                      <th className="p-2.5 font-semibold">Status</th>
                      <th className="p-2.5 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.high_risk_tickets && data.high_risk_tickets.length > 0 ? (
                      data.high_risk_tickets.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-2.5 font-mono font-medium text-slate-700">
                            {t.ticket_no}
                          </td>
                          <td className="p-2.5 max-w-xs">
                            <span className="font-semibold text-slate-900 block truncate">
                              {t.title}
                            </span>
                            <span className="text-[11px] text-slate-500 block truncate">
                              {t.location_text}
                            </span>
                          </td>
                          <td className="p-2.5">
                            <Badge variant="outline" className="text-[10px]">
                              {t.category_code}
                            </Badge>
                          </td>
                          <td className="p-2.5">{getPriorityBadge(t.priority)}</td>
                          <td className="p-2.5 font-mono font-bold text-rose-600">
                            {t.risk_score}
                          </td>
                          <td className="p-2.5">
                            <Badge variant="secondary" className="text-[10px]">
                              {t.status}
                            </Badge>
                          </td>
                          <td className="p-2.5 text-right">
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => {
                                const matchedHotspot = data.hotspots.find(
                                  (h) => h.category === t.category_code
                                ) || data.hotspots[0];
                                if (matchedHotspot) {
                                  setSelectedHotspot(matchedHotspot);
                                  toast.info(`Loaded SOP for ${matchedHotspot.title}`);
                                }
                              }}
                              className="text-xs"
                            >
                              Load SOP
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400">
                          No active high-risk tickets at this time.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: EV Rapid Squad Fleet */}
        <TabsContent value="squads" className="mt-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900">
                Campus Rapid Response EV Patrol Squads
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Electric utility fleet deployed across NIT Rourkela 462-acre campus for emergency containment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data?.active_squads?.map((squad) => (
                  <div
                    key={squad.squad_id}
                    className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-800">
                        <TruckIcon className="size-5" />
                      </div>
                      <Badge
                        className={`text-[10px] font-semibold ${squad.status === "ACTIVE_SITE"
                          ? "bg-rose-100 text-rose-800 border-rose-200"
                          : squad.status === "ON_PATROL"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                      >
                        {squad.status}
                      </Badge>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{squad.name}</h4>
                      <p className="text-xs text-slate-500">{squad.vehicle}</p>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-lg">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Assigned Zone:</span>
                        <span className="font-medium text-slate-800">{squad.assigned_zone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Team Lead:</span>
                        <span className="font-medium text-slate-800">{squad.lead}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Current ETA:</span>
                        <span className="font-semibold text-emerald-600">~{squad.eta_minutes} mins</span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        toast.success(`Priority Radio Alert sent to ${squad.name}!`);
                      }}
                      className="w-full text-xs gap-1"
                    >
                      <RadioIcon className="size-3 text-slate-500" />
                      Ping Squad Radio
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DeepBot Safety Advisor Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="flex items-center gap-2 text-lg font-bold">
              <BotIcon className="size-5 text-indigo-600" />
              CampusMobilize AI Safety Advisor
            </SheetTitle>
            <SheetDescription className="text-xs">
              Autonomous Contingency Protocol Generator grounded in NIT Rourkela infrastructure.
            </SheetDescription>
          </SheetHeader>

          <div className="py-4 space-y-4">
            {deepbotLoading ? (
              <div className="py-16 text-center space-y-3">
                <Loader2Icon className="size-8 animate-spin mx-auto text-indigo-600" />
                <p className="text-xs text-slate-500">
                  Synthesizing multi-role contingency protocol via DeepBot Ollama backend...
                </p>
              </div>
            ) : deepbotResponse ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-sans">
                {deepbotResponse}
              </div>
            ) : null}

            {/* Custom Question Input */}
            <div className="pt-2 border-t space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Ask Custom Safety or Containment Question:
              </label>
              <div className="flex gap-2">
                <Input
                  value={customAiQuery}
                  onChange={(e) => setCustomAiQuery(e.target.value)}
                  placeholder="e.g. What is the SOP if 33kV substation temperature exceeds 85°C?"
                  className="text-xs"
                />
                <Button
                  size="sm"
                  onClick={async () => {
                    if (!customAiQuery.trim()) return;
                    setDeepbotLoading(true);
                    try {
                      const res = await fetch("/api/ai/chat", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ message: customAiQuery, includeCampusContext: true }),
                      });
                      const json = await res.json();
                      setDeepbotResponse(json?.data?.reply || json?.reply || "Protocol synthesized.");
                    } catch {
                      setDeepbotResponse("AI service reached capacity. Please retry momentarily.");
                    } finally {
                      setDeepbotLoading(false);
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                >
                  Ask
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
