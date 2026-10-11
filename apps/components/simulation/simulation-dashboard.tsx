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
  FlameIcon,
  UsersIcon,
  SunIcon,
  CloudRainIcon,
  ClockIcon,
  Building2Icon,
  ActivityIcon,
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

export function SimulationDashboard() {
  // Water simulation state
  const [waterInflow, setWaterInflow] = React.useState<number>(1800); // kL/day
  const [waterPerCapita, setWaterPerCapita] = React.useState<number>(135); // L/student/day
  const [leakagePercent, setLeakagePercent] = React.useState<number>(12); // % loss
  const [rainBuffer, setRainBuffer] = React.useState<number>(450); // kL

  // Energy simulation state
  const [ambientTemp, setAmbientTemp] = React.useState<number>(34); // °C
  const [solarOffsetPercent, setSolarOffsetPercent] = React.useState<number>(38); // %
  const [concurrencySurge, setConcurrencySurge] = React.useState<number>(15); // %
  const [isGridOutage, setIsGridOutage] = React.useState<boolean>(false);

  // Other things / Campus Event scenario
  const [campusPopulation, setCampusPopulation] = React.useState<number>(8500); // standard
  const [activeScenario, setActiveScenario] = React.useState<string>("nominal");

  // AI Assessment response
  const [isAiAssessing, setIsAiAssessing] = React.useState<boolean>(false);
  const [aiAssessment, setAiAssessment] = React.useState<string | null>(null);

  // Computed simulation metrics
  const simResults = React.useMemo(() => {
    // Water computations
    const dailyGrossDemand = (campusPopulation * waterPerCapita) / 1000; // kL
    const effectiveDemand = dailyGrossDemand * (1 + leakagePercent / 100);
    const netWaterBalance = waterInflow + rainBuffer - effectiveDemand;
    const reservoirCapacity = 2400; // kL total storage across campus
    const reservoirHours = Math.max(
      4,
      Math.min(72, Math.round((reservoirCapacity / Math.max(effectiveDemand / 24, 10))))
    );

    // Energy computations
    // Temp factor: for every degree above 28°C, HVAC power rises by 3.2%
    const tempFactor = Math.max(1, 1 + ((ambientTemp - 28) * 0.032));
    const baseEnergyPeak = 1250; // kW
    const grossPeakKw = Math.round(
      baseEnergyPeak * tempFactor * (campusPopulation / 8500) * (1 + concurrencySurge / 100)
    );
    const solarGenerationKw = Math.round(grossPeakKw * (solarOffsetPercent / 100));
    const netGridDemandKw = Math.max(200, grossPeakKw - solarGenerationKw);
    const substationCapacityKw = 2500;
    const transformerLoadPercent = Math.round((netGridDemandKw / substationCapacityKw) * 100);

    // Composite Campus Risk Index (0 - 100)
    let calculatedCri = 32;
    if (netWaterBalance < 0) calculatedCri += Math.min(25, Math.abs(netWaterBalance) / 40);
    if (transformerLoadPercent > 75) calculatedCri += (transformerLoadPercent - 75) * 1.5;
    if (leakagePercent > 18) calculatedCri += (leakagePercent - 18) * 1.2;
    if (isGridOutage) calculatedCri += 22;
    calculatedCri = Math.min(96, Math.max(12, Math.round(calculatedCri)));

    // Estimated daily utility cost (₹)
    const dailyKwh = netGridDemandKw * 14;
    const energyCost = Math.round(dailyKwh * 6.8); // ₹6.8 per commercial unit
    const waterCost = Math.round(waterInflow * 14); // ₹14 per kL treatment
    const totalDailyCost = energyCost + waterCost;

    return {
      effectiveDemand: Math.round(effectiveDemand),
      netWaterBalance: Math.round(netWaterBalance),
      reservoirHours,
      grossPeakKw,
      solarGenerationKw,
      netGridDemandKw,
      transformerLoadPercent,
      calculatedCri,
      totalDailyCost,
    };
  }, [
    waterInflow,
    waterPerCapita,
    leakagePercent,
    rainBuffer,
    ambientTemp,
    solarOffsetPercent,
    concurrencySurge,
    isGridOutage,
    campusPopulation,
  ]);

  // Hourly curve generation for Recharts
  const hourlyChartData = React.useMemo(() => {
    const hours = [
      "00:00", "02:00", "04:00", "06:00", "08:00", "10:00",
      "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"
    ];

    return hours.map((hour, idx) => {
      // Natural diurnal curves
      const timeFactorEnergy = [0.45, 0.40, 0.38, 0.55, 0.85, 0.95, 0.90, 0.88, 0.82, 1.0, 0.92, 0.70][idx];
      const timeFactorWater = [0.20, 0.15, 0.15, 0.60, 0.95, 0.80, 0.50, 0.45, 0.60, 0.85, 0.75, 0.40][idx];

      const baselineKw = Math.round(1200 * timeFactorEnergy);
      const simulatedKw = Math.round(simResults.netGridDemandKw * timeFactorEnergy);

      const baselineWater = Math.round(110 * timeFactorWater);
      const simulatedWater = Math.round((simResults.effectiveDemand / 24) * timeFactorWater * 1.5);

      const baselineCri = 32;
      const simulatedCri = Math.round(
        simResults.calculatedCri * (0.8 + 0.3 * timeFactorEnergy)
      );

      return {
        hour,
        baselineKw,
        simulatedKw,
        baselineWater,
        simulatedWater,
        baselineCri,
        simulatedCri,
      };
    });
  }, [simResults]);

  // Preset Scenario Appliers
  const applyScenario = (type: string) => {
    setActiveScenario(type);
    if (type === "nominal") {
      setCampusPopulation(8500);
      setAmbientTemp(32);
      setWaterInflow(1800);
      setWaterPerCapita(135);
      setLeakagePercent(12);
      setSolarOffsetPercent(38);
      setConcurrencySurge(15);
      setIsGridOutage(false);
      toast.success("Applied Nominal Semester Baseline.");
    } else if (type === "fest") {
      setCampusPopulation(13500); // +5,000 TechFest visitors
      setAmbientTemp(30);
      setWaterInflow(2200);
      setWaterPerCapita(155);
      setLeakagePercent(15);
      setSolarOffsetPercent(35);
      setConcurrencySurge(45); // Night lighting & audio surges
      setIsGridOutage(false);
      toast.success("Applied Innovision / TechFest Surge Scenario.");
    } else if (type === "heatwave") {
      setCampusPopulation(8500);
      setAmbientTemp(44); // 44°C extreme heat
      setWaterInflow(1600);
      setWaterPerCapita(170); // High showering and drinking
      setLeakagePercent(16);
      setSolarOffsetPercent(52); // High sunshine
      setConcurrencySurge(50); // Full HVAC chiller load
      setIsGridOutage(false);
      toast.success("Applied Extreme Summer Heatwave Scenario.");
    } else if (type === "monsoon") {
      setCampusPopulation(8500);
      setAmbientTemp(27);
      setWaterInflow(2400);
      setRainBuffer(1100); // Rainwater tanks brimming
      setLeakagePercent(22); // Ground shifting / pipe leak risk
      setSolarOffsetPercent(15); // Overcast cloud cover
      setConcurrencySurge(10);
      setIsGridOutage(false);
      toast.success("Applied Monsoon Storm & Rainwater Buffer Scenario.");
    }
  };

  // Run AI Simulation Assessment through DeepBot
  const handleRunAiAssessment = async () => {
    setIsAiAssessing(true);
    setAiAssessment(null);

    const simulationPrompt = `Please perform an executive engineering assessment for the following simulated campus scenario at NIT Rourkela:
- Scenario: ${activeScenario.toUpperCase()}
- Population: ${campusPopulation} residents & visitors
- Water Inflow: ${waterInflow} kL/day, Demand: ${simResults.effectiveDemand} kL/day, Net Balance: ${simResults.netWaterBalance} kL, Leakage: ${leakagePercent}%
- Energy Peak Demand: ${simResults.netGridDemandKw} kW (Substation load: ${simResults.transformerLoadPercent}%), Solar Offset: ${solarOffsetPercent}%, Ambient Temp: ${ambientTemp}°C
- Grid Outage Mode: ${isGridOutage ? "ACTIVE (DG Cutover)" : "NORMAL (TPWODL Utility Grid)"}
- Computed Campus Risk Index: ${simResults.calculatedCri} / 100

Provide:
1. Primary Vulnerability Analysis
2. 3 Actionable Preventive Measures for Estate Office & Warden Team
3. Projected Resource Savings / Cost Risk`;

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: simulationPrompt, includeCampusContext: true }),
      });

      const data = await res.json();
      const reply = data?.data?.reply || data?.reply || "Simulation assessment generated.";
      setAiAssessment(reply);
      toast.success("DeepBot AI Assessment completed!");
    } catch {
      toast.error("Could not complete AI assessment");
      setAiAssessment(
        "Simulation Diagnosis: Transformer load is approaching 78% of rated limit. Recommend shifting water pump schedule to off-peak hours (14:00 - 17:00) to balance grid draw and avoid tariff penalties."
      );
    } finally {
      setIsAiAssessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Preset Scenario Selector Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-muted/20 p-3 rounded-xl border">
        <div className="flex items-center gap-2">
          <ActivityIcon className="size-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">Select Simulation Scenario:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant={activeScenario === "nominal" ? "default" : "outline"}
            size="sm"
            onClick={() => applyScenario("nominal")}
            className="h-7 text-xs px-2.5 gap-1"
          >
            <Building2Icon className="size-3" />
            <span>Nominal Semester</span>
          </Button>
          <Button
            variant={activeScenario === "fest" ? "default" : "outline"}
            size="sm"
            onClick={() => applyScenario("fest")}
            className="h-7 text-xs px-2.5 gap-1"
          >
            <UsersIcon className="size-3" />
            <span>Innovision (+5k Visitors)</span>
          </Button>
          <Button
            variant={activeScenario === "heatwave" ? "default" : "outline"}
            size="sm"
            onClick={() => applyScenario("heatwave")}
            className="h-7 text-xs px-2.5 gap-1"
          >
            <FlameIcon className="size-3 text-rose-500" />
            <span>44°C Heatwave</span>
          </Button>
          <Button
            variant={activeScenario === "monsoon" ? "default" : "outline"}
            size="sm"
            onClick={() => applyScenario("monsoon")}
            className="h-7 text-xs px-2.5 gap-1"
          >
            <CloudRainIcon className="size-3 text-primary" />
            <span>Monsoon Buffer</span>
          </Button>
        </div>
      </div>

      {/* Real-time Dynamic Calculated KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="p-3">
          <span className="text-[11px] font-medium text-muted-foreground">Simulated CRI</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span
              className={`font-mono text-2xl font-bold tabular-nums ${
                simResults.calculatedCri > 65
                  ? "text-destructive"
                  : simResults.calculatedCri > 45
                  ? "text-amber-500"
                  : "text-emerald-500"
              }`}
            >
              {simResults.calculatedCri}
            </span>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">
            Baseline: 32 / 100
          </span>
        </Card>

        <Card className="p-3">
          <span className="text-[11px] font-medium text-muted-foreground">Net Peak Demand</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-mono text-2xl font-bold tabular-nums text-foreground">
              {simResults.netGridDemandKw}
            </span>
            <span className="text-xs text-muted-foreground">kW</span>
          </div>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">
            Substation: {simResults.transformerLoadPercent}% Load
          </span>
        </Card>

        <Card className="p-3">
          <span className="text-[11px] font-medium text-muted-foreground">Water Net Balance</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span
              className={`font-mono text-2xl font-bold tabular-nums ${
                simResults.netWaterBalance < 0 ? "text-destructive" : "text-emerald-500"
              }`}
            >
              {simResults.netWaterBalance > 0 ? `+${simResults.netWaterBalance}` : simResults.netWaterBalance}
            </span>
            <span className="text-xs text-muted-foreground">kL/day</span>
          </div>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">
            Buffer: {simResults.reservoirHours} hrs reserve
          </span>
        </Card>

        <Card className="p-3">
          <span className="text-[11px] font-medium text-muted-foreground">Solar Generation</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-mono text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {simResults.solarGenerationKw}
            </span>
            <span className="text-xs text-muted-foreground">kW</span>
          </div>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">
            Offsetting {solarOffsetPercent}% of load
          </span>
        </Card>

        <Card className="p-3 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-medium text-muted-foreground">Daily Utility Cost</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-mono text-2xl font-bold tabular-nums text-foreground">
              ₹{(simResults.totalDailyCost / 1000).toFixed(1)}k
            </span>
            <span className="text-xs text-muted-foreground">/ day</span>
          </div>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">
            Tariff: ₹6.8/kWh + Water
          </span>
        </Card>
      </div>

      {/* Main 2-Column Grid: Left Sliders, Right Visualization & AI Assessment */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Interactive Sliders (5 cols) */}
        <div className="space-y-4 lg:col-span-5">
          <Card className="shadow-xs">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <DropletsIcon className="size-4 text-primary" />
                <span>Water Infrastructure Parameters</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-4">
              {/* Slider 1: Inflow */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <Label>Municipal Inflow Rate</Label>
                  <span className="font-mono font-semibold text-foreground">{waterInflow} kL/day</span>
                </div>
                <input
                  type="range"
                  min="800"
                  max="3200"
                  step="50"
                  value={waterInflow}
                  onChange={(e) => setWaterInflow(Number(e.target.value))}
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Slider 2: Per Capita */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <Label>Resident Consumption Rate</Label>
                  <span className="font-mono font-semibold text-foreground">{waterPerCapita} L/person</span>
                </div>
                <input
                  type="range"
                  min="90"
                  max="220"
                  step="5"
                  value={waterPerCapita}
                  onChange={(e) => setWaterPerCapita(Number(e.target.value))}
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Slider 3: Leakage Loss */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <Label>Pipe Seepage & Leakage Loss</Label>
                  <span className={`font-mono font-semibold ${leakagePercent > 18 ? "text-destructive" : "text-foreground"}`}>
                    {leakagePercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="35"
                  step="1"
                  value={leakagePercent}
                  onChange={(e) => setLeakagePercent(Number(e.target.value))}
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Slider 4: Rain Buffer */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <Label>Rainwater Tank Buffer</Label>
                  <span className="font-mono font-semibold text-foreground">{rainBuffer} kL</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1200"
                  step="50"
                  value={rainBuffer}
                  onChange={(e) => setRainBuffer(Number(e.target.value))}
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xs">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ZapIcon className="size-4 text-primary" />
                <span>Energy & Micro-Grid Parameters</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-4">
              {/* Slider 5: Ambient Temp */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <Label>Ambient Outdoor Temperature</Label>
                  <span className={`font-mono font-semibold ${ambientTemp >= 40 ? "text-rose-500" : "text-foreground"}`}>
                    {ambientTemp}°C
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="48"
                  step="1"
                  value={ambientTemp}
                  onChange={(e) => setAmbientTemp(Number(e.target.value))}
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Slider 6: Solar Offset */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <Label>Solar Photovoltaic Generation</Label>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {solarOffsetPercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="85"
                  step="5"
                  value={solarOffsetPercent}
                  onChange={(e) => setSolarOffsetPercent(Number(e.target.value))}
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Slider 7: Concurrency Surge */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <Label>Appliance Concurrency Surge</Label>
                  <span className="font-mono font-semibold text-foreground">+{concurrencySurge}%</span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="60"
                  step="5"
                  value={concurrencySurge}
                  onChange={(e) => setConcurrencySurge(Number(e.target.value))}
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Toggle: Grid Outage */}
              <div className="pt-2 border-t flex items-center justify-between text-xs">
                <div>
                  <div className="font-medium text-foreground">TPWODL Grid Outage (DG Mode)</div>
                  <div className="text-[11px] text-muted-foreground">Emergency backup generators engaged</div>
                </div>
                <Button
                  variant={isGridOutage ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setIsGridOutage(!isGridOutage)}
                  className="h-7 text-xs"
                >
                  {isGridOutage ? "Outage ACTIVE" : "Grid Normal"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Comparative Charts & DeepBot Assessment (7 cols) */}
        <div className="space-y-4 lg:col-span-7">
          <Card className="shadow-xs">
            <CardHeader className="pb-3 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-sm font-semibold">24-Hour Stress Curve Comparison</CardTitle>
                  <CardDescription className="text-xs">
                    Baseline Nominal vs. Simulated Trajectory
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">
                  Real-time Formula Engine
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <Tabs defaultValue="energy" className="space-y-3">
                <TabsList className="w-full sm:w-auto h-8">
                  <TabsTrigger value="energy" className="text-xs h-7">
                    Energy Grid (kW)
                  </TabsTrigger>
                  <TabsTrigger value="water" className="text-xs h-7">
                    Water Flow (kL/hr)
                  </TabsTrigger>
                  <TabsTrigger value="risk" className="text-xs h-7">
                    Risk Index (CRI)
                  </TabsTrigger>
                </TabsList>

                {/* Energy Tab */}
                <TabsContent value="energy">
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={hourlyChartData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} unit="kW" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--background)",
                            borderColor: "var(--border)",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                        <Area
                          type="monotone"
                          dataKey="baselineKw"
                          name="Baseline Demand"
                          stroke="#94a3b8"
                          fill="#94a3b8"
                          fillOpacity={0.15}
                        />
                        <Area
                          type="monotone"
                          dataKey="simulatedKw"
                          name="Simulated Stress"
                          stroke="#e11d48"
                          fill="#e11d48"
                          fillOpacity={0.25}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                {/* Water Tab */}
                <TabsContent value="water">
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={hourlyChartData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} unit=" kL" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--background)",
                            borderColor: "var(--border)",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                        <Line
                          type="monotone"
                          dataKey="baselineWater"
                          name="Baseline Draw"
                          stroke="#94a3b8"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="simulatedWater"
                          name="Simulated Draw (with Leaks)"
                          stroke="#0284c7"
                          strokeWidth={2.5}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                {/* Risk Tab */}
                <TabsContent value="risk">
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={hourlyChartData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--background)",
                            borderColor: "var(--border)",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                        <Line
                          type="monotone"
                          dataKey="baselineCri"
                          name="Baseline CRI (Nominal 32)"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="simulatedCri"
                          name="Simulated Risk Index"
                          stroke="#f59e0b"
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

          {/* AI Simulation Assessment CTA & Result */}
          <Card className="shadow-xs border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SparklesIcon className="size-4 text-primary" />
                  <CardTitle className="text-sm font-semibold">
                    DeepBot AI Contingency Strategy
                  </CardTitle>
                </div>
                <Button
                  size="sm"
                  disabled={isAiAssessing}
                  onClick={handleRunAiAssessment}
                  className="h-8 text-xs gap-1.5"
                >
                  <PlayCircleIcon className="size-3.5" />
                  <span>{isAiAssessing ? "Simulating with AI..." : "Run AI Assessment"}</span>
                </Button>
              </div>
              <CardDescription className="text-xs">
                Dispatches your live simulated parameters to the DeepBot Ollama backend to generate an automated facility action plan.
              </CardDescription>
            </CardHeader>
            {aiAssessment && (
              <CardContent className="pt-0">
                <div className="rounded-lg border bg-card p-3.5 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                  {aiAssessment}
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
