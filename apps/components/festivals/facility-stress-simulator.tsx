"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ZapIcon,
  DropletsIcon,
  SparklesIcon,
  RotateCcwIcon,
  PlayCircleIcon,
  AlertTriangleIcon,
  TrendingUpIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  FlameIcon,
  UsersIcon,
  SunIcon,
  CloudRainIcon,
  ClockIcon,
  Building2Icon,
  ActivityIcon,
  TruckIcon,
  DownloadIcon,
  CheckCircle2Icon,
  FileTextIcon,
  SlidersIcon,
  GaugeIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { toast } from "sonner";
import { apiSimulateFacilityStress } from "@/lib/api";
import { SimulationAiAssessment } from "@/components/simulation/simulation-ai-assessment";

interface FacilityStressSimulatorProps {
  initialEvent?: any;
  allEvents?: any[];
  onApplyAsMandate?: (simulatedPlan: any) => void;
  onClose?: () => void;
}

export function FacilityStressSimulator({
  initialEvent,
  allEvents = [],
  onApplyAsMandate,
  onClose,
}: FacilityStressSimulatorProps) {
  // Preset or selected event
  const [selectedEventId, setSelectedEventId] = React.useState<string>(
    initialEvent?.id || "evt-innovision-2026"
  );
  const [scenarioName, setScenarioName] = React.useState<string>(
    initialEvent ? `${initialEvent.name} Surge` : "Innovision 2026 Peak Surge"
  );

  // Simulation parameters
  const [basePopulation, setBasePopulation] = React.useState<number>(8500);
  const [additionalFootfall, setAdditionalFootfall] = React.useState<number>(
    initialEvent?.expected_footfall || 4500
  );
  const [waterSurgeMultiplier, setWaterSurgeMultiplier] = React.useState<number>(
    initialEvent?.water_surge_multiplier || 1.38
  );
  const [electricitySurgeMultiplier, setElectricitySurgeMultiplier] = React.useState<number>(
    initialEvent?.electricity_surge_multiplier || 1.22
  );
  const [hygieneMultiplier, setHygieneMultiplier] = React.useState<number>(
    initialEvent?.hygiene_pressure_multiplier || 3.1
  );
  const [ambientTemp, setAmbientTemp] = React.useState<number>(34); // °C
  const [isGridOutage, setIsGridOutage] = React.useState<boolean>(false);
  const [isPumpFailure, setIsPumpFailure] = React.useState<boolean>(false);
  const [leakagePercent, setLeakagePercent] = React.useState<number>(12); // %
  const [solarOffsetPercent, setSolarOffsetPercent] = React.useState<number>(38); // %
  const [waterInflowKl, setWaterInflowKl] = React.useState<number>(1800);

  // Backend AI state
  const [isRunningAi, setIsRunningAi] = React.useState<boolean>(false);
  const [backendAiData, setBackendAiData] = React.useState<any>(null);
  const [activeCurveTab, setActiveCurveTab] = React.useState<string>("energy");

  // Sync when initialEvent changes
  React.useEffect(() => {
    if (initialEvent) {
      setSelectedEventId(initialEvent.id);
      setScenarioName(`${initialEvent.name} Surge`);
      setAdditionalFootfall(initialEvent.expected_footfall || 4500);
      setWaterSurgeMultiplier(initialEvent.water_surge_multiplier || 1.38);
      setElectricitySurgeMultiplier(initialEvent.electricity_surge_multiplier || 1.22);
      setHygieneMultiplier(initialEvent.hygiene_pressure_multiplier || 3.1);
    }
  }, [initialEvent]);

  // Fast client digital twin calculations for instantaneous slider feedback
  const localSimResults = React.useMemo(() => {
    const totalPop = basePopulation + additionalFootfall;

    // Water calculations
    const dailyGrossWater = (totalPop * 135 * waterSurgeMultiplier) / 1000;
    const effectiveWaterDemand = dailyGrossWater * (1 + leakagePercent / 100);
    const actualInflow = waterInflowKl * (isPumpFailure ? 0.5 : 1.0);
    const netWaterBalance = Math.round(actualInflow - effectiveWaterDemand);
    const reservoirCapacity = 2400; // kL
    const reservoirHours = Math.max(
      3,
      Math.min(72, Math.round(reservoirCapacity / Math.max(effectiveWaterDemand / 24, 10)))
    );
    const tankersRequired = netWaterBalance < 0 ? Math.ceil(Math.abs(netWaterBalance) / 10) : 0;

    // Electrical calculations
    const tempFactor = 1.0 + Math.max(0, ambientTemp - 28) * 0.032;
    const basePeakKw = 1250;
    const grossPeakKw = Math.round(
      basePeakKw * tempFactor * (totalPop / 8500) * electricitySurgeMultiplier
    );
    const solarGenerationKw = Math.round(grossPeakKw * (solarOffsetPercent / 100));
    const netGridDemandKw = Math.max(200, grossPeakKw - solarGenerationKw);
    const substationCapacityKw = 2500;
    const transformerLoadPercent = Math.round((netGridDemandKw / substationCapacityKw) * 100);

    // DG calculations
    const dgBurnRateLHr = isGridOutage ? Math.round(netGridDemandKw * 0.24) : 0;
    const dgAutonomyHours = isGridOutage
      ? Math.max(1, Math.round((800 / Math.max(dgBurnRateLHr, 10)) * 10) / 10)
      : 24.0;

    // Hygiene complaints & squads
    const projectedHygieneTickets = Math.round(12 * hygieneMultiplier);
    const flyingSquadsRequired = Math.max(2, Math.ceil(projectedHygieneTickets / 6));

    // Composite CRI
    let calculatedCri = 30;
    if (netWaterBalance < 0) calculatedCri += Math.min(25, Math.abs(netWaterBalance) / 45);
    if (transformerLoadPercent > 75) calculatedCri += (transformerLoadPercent - 75) * 1.4;
    if (isGridOutage) calculatedCri += 20;
    if (isPumpFailure) calculatedCri += 18;
    if (hygieneMultiplier > 2.0) calculatedCri += (hygieneMultiplier - 2.0) * 8;
    calculatedCri = Math.min(96, Math.max(15, Math.round(calculatedCri)));

    // Generate 24-hour curve
    const hourlyPoints = [];
    for (let h = 0; h < 24; h++) {
      let wFactor = 0.5;
      let eFactor = 0.65;
      if (h >= 6 && h <= 9) {
        wFactor = 1.6;
        eFactor = 1.2;
      } else if (h >= 11 && h <= 15) {
        wFactor = 1.0;
        eFactor = 1.4;
      } else if (h >= 18 && h <= 22) {
        wFactor = 1.7;
        eFactor = 1.55;
      }

      const baselineWater = Math.round(((8500 * 135) / 1000 / 24) * wFactor);
      const simulatedWater = Math.round((effectiveWaterDemand / 24) * wFactor);
      const baselineKw = Math.round(850 * eFactor);
      const simulatedKw = Math.round(netGridDemandKw * (eFactor / 1.35));
      const tankPct = Math.max(
        15,
        Math.min(100, Math.round(100 - (h * (100 - (reservoirHours / 24) * 100)) / 24))
      );

      hourlyPoints.push({
        hour: `${h.toString().padStart(2, "0")}:00`,
        baselineWater,
        simulatedWater,
        baselineKw,
        simulatedKw,
        tankPct,
      });
    }

    return {
      totalPop,
      effectiveWaterDemand: Math.round(effectiveWaterDemand),
      netWaterBalance,
      reservoirHours,
      tankersRequired,
      grossPeakKw,
      solarGenerationKw,
      netGridDemandKw,
      transformerLoadPercent,
      dgBurnRateLHr,
      dgAutonomyHours,
      projectedHygieneTickets,
      flyingSquadsRequired,
      calculatedCri,
      hourlyPoints,
    };
  }, [
    basePopulation,
    additionalFootfall,
    waterSurgeMultiplier,
    electricitySurgeMultiplier,
    hygieneMultiplier,
    ambientTemp,
    isGridOutage,
    isPumpFailure,
    leakagePercent,
    solarOffsetPercent,
    waterInflowKl,
  ]);

  // Run backend AI engine simulation
  const handleRunBackendAi = React.useCallback(async () => {
    setIsRunningAi(true);
    try {
      const payload = {
        event_id: selectedEventId,
        event_name: scenarioName,
        scenario_name: scenarioName,
        base_population: basePopulation,
        additional_footfall: additionalFootfall,
        water_surge_multiplier: waterSurgeMultiplier,
        electricity_surge_multiplier: electricitySurgeMultiplier,
        hygiene_multiplier: hygieneMultiplier,
        ambient_temp: ambientTemp,
        is_grid_outage: isGridOutage,
        is_pump_failure: isPumpFailure,
        water_inflow_kl: waterInflowKl,
        leakage_percent: leakagePercent,
        solar_offset_percent: solarOffsetPercent,
      };

      const result = await apiSimulateFacilityStress(payload);
      setBackendAiData(result);
      toast.success("CampusIQ AI Physics & Forecaster Simulation Completed!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to run backend AI engine");
    } finally {
      setIsRunningAi(false);
    }
  }, [
    selectedEventId,
    scenarioName,
    basePopulation,
    additionalFootfall,
    waterSurgeMultiplier,
    electricitySurgeMultiplier,
    hygieneMultiplier,
    ambientTemp,
    isGridOutage,
    isPumpFailure,
    waterInflowKl,
    leakagePercent,
    solarOffsetPercent,
  ]);

  // Trigger initial run on load
  React.useEffect(() => {
    handleRunBackendAi();
  }, [handleRunBackendAi]);

  // Scenario Presets
  const applyPreset = (presetKey: string) => {
    if (presetKey === "innovision") {
      setSelectedEventId("evt-innovision-2026");
      setScenarioName("Innovision 2026 Techfest Surge");
      setAdditionalFootfall(4500);
      setWaterSurgeMultiplier(1.38);
      setElectricitySurgeMultiplier(1.22);
      setHygieneMultiplier(3.1);
      setAmbientTemp(32);
      setIsGridOutage(false);
      setIsPumpFailure(false);
      toast.success("Applied Innovision 2026 Festival Preset.");
    } else if (presetKey === "nitrutsav") {
      setSelectedEventId("evt-nitrutsav-2027");
      setScenarioName("Nitrutsav 2027 Cultural Fest Surge");
      setAdditionalFootfall(3800);
      setWaterSurgeMultiplier(1.3);
      setElectricitySurgeMultiplier(1.25);
      setHygieneMultiplier(2.8);
      setAmbientTemp(30);
      setIsGridOutage(false);
      setIsPumpFailure(false);
      toast.success("Applied Nitrutsav 2027 Festival Preset.");
    } else if (presetKey === "exams") {
      setSelectedEventId("evt-endsem-autumn-2026");
      setScenarioName("Autumn End-Term Exams Quiet Load");
      setAdditionalFootfall(0);
      setWaterSurgeMultiplier(1.05);
      setElectricitySurgeMultiplier(1.15);
      setHygieneMultiplier(1.4);
      setAmbientTemp(26);
      setIsGridOutage(false);
      setIsPumpFailure(false);
      toast.success("Applied Autumn End-Term Exams Preset.");
    } else if (presetKey === "heatwave") {
      setScenarioName("Extreme Summer Heatwave (42°C)");
      setAmbientTemp(42);
      setElectricitySurgeMultiplier(1.45);
      setWaterSurgeMultiplier(1.35);
      toast.warning("Applied Extreme Summer Heatwave Scenario.");
    } else if (presetKey === "grid_outage") {
      setScenarioName("Substation Grid Cutover (DG Mode)");
      setIsGridOutage(true);
      toast.error("Applied TPWODL 33kV Grid Outage Cutover.");
    } else if (presetKey === "pump_failure") {
      setScenarioName("PHED Water Main & Pump 2 Failure");
      setIsPumpFailure(true);
      toast.error("Applied Water Booster Pump Failure Scenario.");
    } else if (presetKey === "reset") {
      setScenarioName("Nominal Campus Baseline");
      setAdditionalFootfall(0);
      setWaterSurgeMultiplier(1.0);
      setElectricitySurgeMultiplier(1.0);
      setHygieneMultiplier(1.0);
      setAmbientTemp(28);
      setIsGridOutage(false);
      setIsPumpFailure(false);
      toast.info("Reset to nominal campus baseline.");
    }
  };

  // Values from backend or fallback to local
  const liveMetrics = backendAiData?.metrics || localSimResults;
  const liveCri = backendAiData?.campus_risk_index || {
    campus_risk_index: localSimResults.calculatedCri,
    band: localSimResults.calculatedCri >= 70 ? "CRITICAL_ALERT" : localSimResults.calculatedCri >= 45 ? "ELEVATED" : "NORMAL",
    badge_color: localSimResults.calculatedCri >= 70 ? "red" : localSimResults.calculatedCri >= 45 ? "amber" : "emerald",
  };
  const curveData = backendAiData?.hourly_stress_curve || localSimResults.hourlyPoints;

  return (
    <div className="space-y-6">
      {/* Top Banner & Scenario Presets */}
      <Card className="border-indigo-200 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white shadow-md">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-800/60 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-400/30 text-xs gap-1 py-0.5">
                  <ActivityIcon className="size-3 text-indigo-300 animate-pulse" />
                  Digital Twin v3.0
                </Badge>
                <Badge variant="outline" className="text-white/70 border-white/20 text-xs font-mono">
                  NIT Rourkela 462-Acre Topology
                </Badge>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>AI Facility Stress & Surge Simulator</span>
              </h2>
              <p className="text-xs sm:text-sm text-indigo-200/80">
                Autonomous physics engine modeling water drawdowns, transformer peak coincidence, and hostel sanitation during campus events.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <Button
                size="sm"
                variant="outline"
                onClick={handleRunBackendAi}
                disabled={isRunningAi}
                className="bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400 text-xs gap-1.5 shadow-sm"
              >
                <SparklesIcon className={`size-3.5 ${isRunningAi ? "animate-spin" : ""}`} />
                {isRunningAi ? "Running AI Forecasters..." : "Re-Calculate AI Analytics"}
              </Button>
              {onClose && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onClose}
                  className="text-indigo-200 hover:text-white hover:bg-white/10 text-xs"
                >
                  Close Simulator
                </Button>
              )}
            </div>
          </div>

          {/* Quick Scenario Pills */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-medium text-indigo-300 flex items-center gap-1.5">
              <SlidersIcon className="size-3" />
              <span>Quick Scenario Presets:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => applyPreset("innovision")}
                className="h-7 text-xs bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                Innovision 2026 (+4.5k)
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => applyPreset("nitrutsav")}
                className="h-7 text-xs bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                Nitrutsav 2027 (+3.8k)
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => applyPreset("exams")}
                className="h-7 text-xs bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                End-Sem Exams (Nominal)
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => applyPreset("heatwave")}
                className="h-7 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-amber-400/40"
              >
                Heatwave 42°C
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => applyPreset("grid_outage")}
                className="h-7 text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border-rose-400/40"
              >
                Grid Outage (DG Mode)
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => applyPreset("pump_failure")}
                className="h-7 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border-blue-400/40"
              >
                Booster Pump Failure
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => applyPreset("reset")}
                className="h-7 text-xs text-indigo-300 hover:text-white hover:bg-white/10 gap-1"
              >
                <RotateCcwIcon className="size-3" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Tiles Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Reservoir Water Autonomy */}
        <Card className="border-blue-200 bg-blue-50/30 p-3 space-y-1">
          <div className="flex items-center justify-between text-xs text-blue-700">
            <span className="font-medium flex items-center gap-1">
              <DropletsIcon className="size-3.5 text-blue-600" />
              Water Autonomy
            </span>
            <Badge variant="outline" className="text-[10px] bg-white border-blue-300">
              {liveMetrics.net_water_balance_kl ?? localSimResults.netWaterBalance} kL/day
            </Badge>
          </div>
          <div className="text-2xl font-bold text-blue-950">
            {liveMetrics.reservoir_buffer_hours ?? localSimResults.reservoirHours} hrs
          </div>
          <p className="text-[11px] text-blue-800">
            {(liveMetrics.tankers_required_10kl ?? localSimResults.tankersRequired) > 0 ? (
              <span className="text-amber-700 font-semibold flex items-center gap-1">
                <TruckIcon className="size-3" />
                {liveMetrics.tankers_required_10kl ?? localSimResults.tankersRequired}x 10kL Tankers Req.
              </span>
            ) : (
              "Sump buffer sufficient"
            )}
          </p>
        </Card>

        {/* Electrical Substation Load */}
        <Card className="border-amber-200 bg-amber-50/30 p-3 space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-700">
            <span className="font-medium flex items-center gap-1">
              <ZapIcon className="size-3.5 text-amber-600" />
              Substation 1 Load
            </span>
            <Badge variant="outline" className="text-[10px] bg-white border-amber-300">
              {liveMetrics.net_grid_demand_kw ?? localSimResults.netGridDemandKw} kW
            </Badge>
          </div>
          <div className="text-2xl font-bold text-amber-950">
            {liveMetrics.transformer_load_percent ?? localSimResults.transformerLoadPercent}%
          </div>
          <p className="text-[11px] text-amber-800">
            {(liveMetrics.transformer_load_percent ?? localSimResults.transformerLoadPercent) > 80 ? (
              <span className="text-rose-700 font-semibold">Overload Warning (&gt;80%)</span>
            ) : (
              "Rated for 2,500 kW capacity"
            )}
          </p>
        </Card>

        {/* DG Generator Fuel Autonomy */}
        <Card className="border-purple-200 bg-purple-50/30 p-3 space-y-1">
          <div className="flex items-center justify-between text-xs text-purple-700">
            <span className="font-medium flex items-center gap-1">
              <FlameIcon className="size-3.5 text-purple-600" />
              DG Fuel Autonomy
            </span>
            <Badge variant="outline" className="text-[10px] bg-white border-purple-300">
              800L HSD
            </Badge>
          </div>
          <div className="text-2xl font-bold text-purple-950">
            {liveMetrics.dg_autonomy_hours ?? localSimResults.dgAutonomyHours} hrs
          </div>
          <p className="text-[11px] text-purple-800">
            {isGridOutage ? (
              <span className="text-rose-700 font-semibold">
                Burn: {liveMetrics.dg_burn_rate_l_hr ?? localSimResults.dgBurnRateLHr} L/hr
              </span>
            ) : (
              "Standby Mode Ready"
            )}
          </p>
        </Card>

        {/* Hygiene Surge Pressure */}
        <Card className="border-emerald-200 bg-emerald-50/30 p-3 space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-700">
            <span className="font-medium flex items-center gap-1">
              <ShieldAlertIcon className="size-3.5 text-emerald-600" />
              Sanitation Load
            </span>
            <Badge variant="outline" className="text-[10px] bg-white border-emerald-300">
              {hygieneMultiplier}x
            </Badge>
          </div>
          <div className="text-2xl font-bold text-emerald-950">
            {liveMetrics.projected_hygiene_tickets ?? localSimResults.projectedHygieneTickets} / day
          </div>
          <p className="text-[11px] text-emerald-800">
            Mandate {liveMetrics.flying_squad_teams ?? localSimResults.flyingSquadsRequired} Roving Squads
          </p>
        </Card>

        {/* Campus Risk Index (CRI) */}
        <Card className={`col-span-2 md:col-span-1 p-3 space-y-1 border ${
          (liveCri.campus_risk_index || localSimResults.calculatedCri) >= 70
            ? "border-rose-300 bg-rose-50/50"
            : (liveCri.campus_risk_index || localSimResults.calculatedCri) >= 45
            ? "border-amber-300 bg-amber-50/50"
            : "border-emerald-300 bg-emerald-50/50"
        }`}>
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium flex items-center gap-1 text-slate-800">
              <GaugeIcon className="size-3.5 text-indigo-600" />
              Campus Risk Index
            </span>
            <Badge className={`text-[10px] ${
              (liveCri.campus_risk_index || localSimResults.calculatedCri) >= 70
                ? "bg-rose-600 text-white"
                : (liveCri.campus_risk_index || localSimResults.calculatedCri) >= 45
                ? "bg-amber-600 text-white"
                : "bg-emerald-600 text-white"
            }`}>
              {liveCri.band || "NORMAL"}
            </Badge>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {liveCri.campus_risk_index ?? localSimResults.calculatedCri} <span className="text-xs font-normal text-slate-500">/ 100</span>
          </div>
          <p className="text-[11px] text-slate-600">
            {liveCri.status_label || "Facility Health Rating"}
          </p>
        </Card>
      </div>

      {/* Main Simulation Workbench (2 Columns: Controls + Charts/AI) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Tuning Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-slate-200 bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <SlidersIcon className="size-4 text-indigo-600" />
                  What-If Variable Knobs
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono text-slate-500">
                  Total Pop: {localSimResults.totalPop.toLocaleString()}
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Adjust campus stress factors to project bottleneck thresholds.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-5">
              {/* Additional Footfall */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <Label className="text-slate-700 font-medium flex items-center gap-1">
                    <UsersIcon className="size-3.5 text-indigo-500" />
                    Additional Guest Footfall
                  </Label>
                  <span className="font-bold text-slate-900 font-mono">
                    +{additionalFootfall.toLocaleString()} visitors
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="8000"
                  step="250"
                  value={additionalFootfall}
                  onChange={(e) => setAdditionalFootfall(Number(e.target.value))}
                  className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0 (Hostelites only)</span>
                  <span>+4,500 (Techfest)</span>
                  <span>+8,000 (Mega)</span>
                </div>
              </div>

              {/* Water Surge Multiplier */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <Label className="text-slate-700 font-medium flex items-center gap-1">
                    <DropletsIcon className="size-3.5 text-blue-500" />
                    Water Consumption Surge
                  </Label>
                  <span className="font-bold text-slate-900 font-mono">
                    {waterSurgeMultiplier}x baseline
                  </span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="2.2"
                  step="0.05"
                  value={waterSurgeMultiplier}
                  onChange={(e) => setWaterSurgeMultiplier(Number(e.target.value))}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>1.0x (135 L/d)</span>
                  <span>1.4x (Fest Peak)</span>
                  <span>2.2x (Severe Draw)</span>
                </div>
              </div>

              {/* Power Surge Multiplier */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <Label className="text-slate-700 font-medium flex items-center gap-1">
                    <ZapIcon className="size-3.5 text-amber-500" />
                    Electrical Peak Demand Surge
                  </Label>
                  <span className="font-bold text-slate-900 font-mono">
                    {electricitySurgeMultiplier}x baseline
                  </span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="1.8"
                  step="0.05"
                  value={electricitySurgeMultiplier}
                  onChange={(e) => setElectricitySurgeMultiplier(Number(e.target.value))}
                  className="w-full accent-amber-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>1.0x (850 kW)</span>
                  <span>1.3x (Pro-nite)</span>
                  <span>1.8x (Stage Max)</span>
                </div>
              </div>

              {/* Hygiene Pressure Multiplier */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <Label className="text-slate-700 font-medium flex items-center gap-1">
                    <ShieldAlertIcon className="size-3.5 text-emerald-500" />
                    Hygiene Pressure Multiplier
                  </Label>
                  <span className="font-bold text-slate-900 font-mono">
                    {hygieneMultiplier}x baseline
                  </span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="4.0"
                  step="0.1"
                  value={hygieneMultiplier}
                  onChange={(e) => setHygieneMultiplier(Number(e.target.value))}
                  className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>1.0x</span>
                  <span>2.5x</span>
                  <span>4.0x (Heavy Washroom Strain)</span>
                </div>
              </div>

              {/* Ambient Temperature */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <Label className="text-slate-700 font-medium flex items-center gap-1">
                    <SunIcon className="size-3.5 text-amber-500" />
                    Ambient Temperature
                  </Label>
                  <span className="font-bold text-slate-900 font-mono">
                    {ambientTemp}°C
                  </span>
                </div>
                <input
                  type="range"
                  min="24"
                  max="44"
                  step="1"
                  value={ambientTemp}
                  onChange={(e) => setAmbientTemp(Number(e.target.value))}
                  className="w-full accent-orange-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              {/* Toggles */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-medium text-slate-800">
                      TPWODL 33kV Grid Outage
                    </Label>
                    <p className="text-[11px] text-slate-400">
                      Forces automatic cutover to Substation 2 Diesel Generator.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={isGridOutage ? "destructive" : "outline"}
                    onClick={() => setIsGridOutage(!isGridOutage)}
                    className="h-7 text-xs px-2.5 font-semibold"
                  >
                    {isGridOutage ? "Outage ACTIVE" : "Grid Stable"}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-medium text-slate-800">
                      Booster Pump 2 Mechanical Failure
                    </Label>
                    <p className="text-[11px] text-slate-400">
                      Simulates 50% campus raw water inflow loss.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={isPumpFailure ? "destructive" : "outline"}
                    onClick={() => setIsPumpFailure(!isPumpFailure)}
                    className="h-7 text-xs px-2.5 font-semibold"
                  >
                    {isPumpFailure ? "Pump TRIPPED" : "Pumps Online"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action to Apply Simulation as Live Mandate */}
          {onApplyAsMandate && (
            <Card className="border-indigo-100 bg-indigo-50/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-indigo-950 flex items-center gap-1.5">
                    <CheckCircle2Icon className="size-4 text-indigo-600" />
                    Commit Simulated Parameters
                  </div>
                  <p className="text-[11px] text-indigo-800">
                    Apply this simulated surge package directly to the official pre-brief mandate.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => onApplyAsMandate(backendAiData || localSimResults)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1 shrink-0"
                >
                  Apply As Mandate
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: 24h Stress Curves + AI Executive Report (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* 24-Hour Diurnal Recharts Curve */}
          <Card className="border-slate-200 bg-white">
            <CardHeader className="pb-2 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">
                    24-Hour Stress Curve Comparison
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Baseline Nominal vs Simulated Event Demand
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono text-indigo-700 bg-indigo-50 border-indigo-200">
                  Physics Digital Twin
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <Tabs value={activeCurveTab} onValueChange={setActiveCurveTab} className="space-y-3">
                <TabsList className="h-8">
                  <TabsTrigger value="energy" className="text-xs h-7">
                    Energy Grid (kW)
                  </TabsTrigger>
                  <TabsTrigger value="water" className="text-xs h-7">
                    Water Flow (kL/hr)
                  </TabsTrigger>
                  <TabsTrigger value="reservoir" className="text-xs h-7">
                    Sump Level (%)
                  </TabsTrigger>
                </TabsList>

                {/* Energy Tab */}
                <TabsContent value="energy">
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={curveData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} unit=" kW" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            borderColor: "#e2e8f0",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                        <Area
                          type="monotone"
                          dataKey={backendAiData ? "baseline_grid_kw" : "baselineKw"}
                          name="Nominal Grid Demand"
                          stroke="#94a3b8"
                          fill="#94a3b8"
                          fillOpacity={0.15}
                        />
                        <Area
                          type="monotone"
                          dataKey={backendAiData ? "simulated_grid_kw" : "simulatedKw"}
                          name="Simulated Peak Demand"
                          stroke="#d97706"
                          fill="#f59e0b"
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                {/* Water Tab */}
                <TabsContent value="water">
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={curveData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} unit=" kL" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            borderColor: "#e2e8f0",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                        <Area
                          type="monotone"
                          dataKey={backendAiData ? "baseline_water_kl" : "baselineWater"}
                          name="Nominal Draw (kL/hr)"
                          stroke="#94a3b8"
                          fill="#94a3b8"
                          fillOpacity={0.15}
                        />
                        <Area
                          type="monotone"
                          dataKey={backendAiData ? "simulated_water_kl" : "simulatedWater"}
                          name="Surge Draw (kL/hr)"
                          stroke="#2563eb"
                          fill="#3b82f6"
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                {/* Storage Reservoir Tab */}
                <TabsContent value="reservoir">
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={curveData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            borderColor: "#e2e8f0",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                        <Line
                          type="monotone"
                          dataKey={backendAiData ? "reservoir_pct" : "tankPct"}
                          name="Overhead Sump Level (%)"
                          stroke="#0891b2"
                          strokeWidth={2.5}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Hostel Impact Matrix Table */}
          {backendAiData?.hostel_impact_matrix && (
            <Card className="border-slate-200 bg-white">
              <CardHeader className="pb-2 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-900">
                  Hall-by-Hall Surge Impact Matrix
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Target hostel vulnerabilities and emergency staff allocation.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                        <th className="pb-2">Hostel</th>
                        <th className="pb-2">Footfall</th>
                        <th className="pb-2">Water</th>
                        <th className="pb-2">Electrical</th>
                        <th className="pb-2">Assigned Squad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {backendAiData.hostel_impact_matrix.map((h: any) => (
                        <tr key={h.code} className="hover:bg-slate-50/50">
                          <td className="py-2.5 font-bold text-slate-900">{h.code}</td>
                          <td className="py-2.5 font-mono text-indigo-700">{h.footfall_surge}</td>
                          <td className="py-2.5">
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                h.water_status === "CRITICAL"
                                  ? "bg-rose-50 text-rose-700 border-rose-300"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                              }`}
                            >
                              {h.water_status}
                            </Badge>
                          </td>
                          <td className="py-2.5">
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                h.power_status === "WARNING"
                                  ? "bg-amber-50 text-amber-700 border-amber-300"
                                  : "bg-slate-50 text-slate-700 border-slate-200"
                              }`}
                            >
                              {h.power_status}
                            </Badge>
                          </td>
                          <td className="py-2.5 text-slate-600 text-[11px]">{h.assigned_squad}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Executive Report from Backend Engine */}
          {backendAiData?.ai_executive_report_markdown && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <SparklesIcon className="size-3.5 text-indigo-600" />
                  CampusIQ AI Engine — Executive Synthesis
                </span>
                <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200">
                  Backend AI Model v3.0
                </Badge>
              </div>
              <SimulationAiAssessment rawMarkdown={backendAiData.ai_executive_report_markdown} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
