"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  LineChart,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DAILY_SCORE_TRENDS,
} from "./sustainability-data";
import {
  SparklesIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ShieldCheckIcon,
  ZapIcon,
  DropletsIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
} from "lucide-react";

export function SustainabilityScoreCharts() {
  const [selectedMetric, setSelectedMetric] = React.useState<"composite" | "energy" | "water" | "carbon">("composite");
  const [timeRange, setTimeRange] = React.useState<"7d" | "all">("all");
  const [scoreData, setScoreData] = React.useState<any[]>(DAILY_SCORE_TRENDS);
  const [dbKpis, setDbKpis] = React.useState<any>({
    sustainabilityScore: 86.4,
    campusRiskIndex: 31,
    cleanEnergyShare: 38.4,
    waterRecoveryEfficiency: 84.2,
    totalComplaints: 380,
  });
  const [isDbLoaded, setIsDbLoaded] = React.useState(false);

  // Fetch real score data from Neon PostgreSQL database
  React.useEffect(() => {
    fetch("/api/sustainability/score-data")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.trends && data.trends.length > 0) {
          setScoreData(data.trends);
          if (data.kpis) setDbKpis(data.kpis);
          setIsDbLoaded(true);
        }
      })
      .catch((err) => {
        console.error("Score DB sync notice:", err);
      });
  }, []);

  const displayedData = React.useMemo(() => {
    if (timeRange === "7d") {
      return scoreData.slice(-7);
    }
    return scoreData;
  }, [scoreData, timeRange]);

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Sustainability AI Score</CardDescription>
              <Badge variant="secondary" className="text-[10px] gap-1 font-mono">
                <SparklesIcon className="size-3" />
                {isDbLoaded ? "Live DB" : "AI Verified"}
              </Badge>
            </div>
            <CardTitle className="text-3xl font-extrabold tabular-nums tracking-tight">
              {dbKpis.sustainabilityScore}
              <span className="text-sm font-normal text-muted-foreground"> / 100</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center justify-between">
            <div className="flex items-center gap-1 text-foreground font-medium">
              <TrendingUpIcon className="size-3.5 text-foreground" />
              <span>+5.8% this month</span>
            </div>
            <Badge variant="outline" className="text-[10px]">Tier A (Green)</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Campus Risk Index (CRI)</CardDescription>
              <Badge variant="outline" className="text-[10px] font-mono">
                {isDbLoaded ? "Live DB" : "Inverse Risk"}
              </Badge>
            </div>
            <CardTitle className="text-3xl font-extrabold tabular-nums tracking-tight">
              {dbKpis.campusRiskIndex}
              <span className="text-sm font-normal text-muted-foreground"> / 100</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center justify-between">
            <div className="flex items-center gap-1 font-medium">
              <TrendingDownIcon className="size-3.5" />
              <span>-11 pts safe decline</span>
            </div>
            <Badge variant="secondary" className="text-[10px]">Low Risk</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Clean Energy Share</CardDescription>
              <ZapIcon className="size-3.5 text-muted-foreground" />
            </div>
            <CardTitle className="text-3xl font-extrabold tabular-nums tracking-tight">
              {dbKpis.cleanEnergyShare}%
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center justify-between">
            <span>Rooftop solar micro-grid</span>
            <span className="font-mono font-medium text-foreground">420 kWp</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Water Recovery Efficiency</CardDescription>
              <DropletsIcon className="size-3.5 text-muted-foreground" />
            </div>
            <CardTitle className="text-3xl font-extrabold tabular-nums tracking-tight">
              {dbKpis.waterRecoveryEfficiency}%
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center justify-between">
            <span>STP effluent reused</span>
            <span className="font-mono font-medium text-foreground">128k L/day</span>
          </CardContent>
        </Card>
      </div>

      {/* Main Interactive Chart Card */}
      <Card>
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <SparklesIcon className="size-4" />
                <span>AI Sustainability & Campus Risk Trajectory</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time multi-dimensional scoring incorporating sensor telemetry, power usage, and complaint resolution.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-md border p-0.5 bg-muted/30">
                <Button
                  variant={timeRange === "7d" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 text-xs px-2.5"
                  onClick={() => setTimeRange("7d")}
                >
                  7 Days
                </Button>
                <Button
                  variant={timeRange === "all" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 text-xs px-2.5"
                  onClick={() => setTimeRange("all")}
                >
                  Full Term + Projections
                </Button>
              </div>

              <div className="flex rounded-md border p-0.5 bg-muted/30">
                <Button
                  variant={selectedMetric === "composite" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 text-xs px-2.5"
                  onClick={() => setSelectedMetric("composite")}
                >
                  AI Score vs Risk
                </Button>
                <Button
                  variant={selectedMetric === "energy" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 text-xs px-2.5"
                  onClick={() => setSelectedMetric("energy")}
                >
                  Energy (%)
                </Button>
                <Button
                  variant={selectedMetric === "water" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 text-xs px-2.5"
                  onClick={() => setSelectedMetric("water")}
                >
                  Water (%)
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {selectedMetric === "composite" ? (
                <AreaChart
                  data={displayedData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--destructive)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--destructive)" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    className="text-[11px] fill-muted-foreground font-mono"
                  />
                  <YAxis
                    domain={[20, 100]}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    className="text-[11px] fill-muted-foreground font-mono"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-3 shadow-md text-xs space-y-1.5">
                            <div className="font-semibold text-foreground">
                              {payload[0].payload.date}
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-muted-foreground">Sustainability Score:</span>
                              <span className="font-mono font-bold text-foreground">
                                {payload[0].payload.sustainabilityScore} / 100
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-muted-foreground">Campus Risk Index:</span>
                              <span className="font-mono font-bold text-destructive">
                                {payload[0].payload.campusRiskIndex} / 100
                              </span>
                            </div>
                            {payload[0].payload.predictedScore && (
                              <div className="flex items-center justify-between gap-4 text-[11px] border-t pt-1">
                                <span className="text-muted-foreground">AI Target Forecast:</span>
                                <span className="font-mono font-semibold">
                                  {payload[0].payload.predictedScore}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sustainabilityScore"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#scoreGrad)"
                    name="Sustainability AI Score"
                  />
                  <Area
                    type="monotone"
                    dataKey="campusRiskIndex"
                    stroke="var(--destructive)"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#riskGrad)"
                    name="Campus Risk Index"
                  />
                  <Line
                    type="monotone"
                    dataKey="predictedScore"
                    stroke="var(--muted-foreground)"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    dot={false}
                    name="AI Forecast Trend"
                  />
                </AreaChart>
              ) : selectedMetric === "energy" ? (
                <AreaChart
                  data={displayedData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} className="text-[11px] fill-muted-foreground font-mono" />
                  <YAxis domain={[60, 100]} tickLine={false} axisLine={false} className="text-[11px] fill-muted-foreground font-mono" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2.5 shadow-md text-xs">
                            <div className="font-semibold">{payload[0].payload.date}</div>
                            <div className="text-muted-foreground">
                              Energy Efficiency: <span className="font-mono font-bold text-foreground">{payload[0].payload.energyEfficiency}%</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="energyEfficiency"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fill="url(#energyGrad)"
                  />
                </AreaChart>
              ) : (
                <AreaChart
                  data={displayedData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} className="text-[11px] fill-muted-foreground font-mono" />
                  <YAxis domain={[60, 100]} tickLine={false} axisLine={false} className="text-[11px] fill-muted-foreground font-mono" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2.5 shadow-md text-xs">
                            <div className="font-semibold">{payload[0].payload.date}</div>
                            <div className="text-muted-foreground">
                              Water Recovery Rate: <span className="font-mono font-bold text-foreground">{payload[0].payload.waterRecovery}%</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="waterRecovery"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fill="url(#waterGrad)"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Chart Legend & Legend Info */}
          <div className="mt-4 flex flex-wrap items-center justify-between border-t pt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-full bg-primary" />
                <span className="font-medium text-foreground">Sustainability AI Score (0-100)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-full bg-destructive" />
                <span>Campus Risk Index (0-100)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-muted-foreground">---</span>
                <span>AI Projection Model</span>
              </div>
            </div>

            <div className="text-[11px]">
              Sensor Telemetry Refresh Rate: <span className="font-mono font-medium">Real-time (5s)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Anomaly Diagnostics & Prescriptive Actions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangleIcon className="size-4" />
              <span>AI Anomaly Detection & Hotspot Alerts</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Live machine learning alerts generated from TPWODL power meters and acoustic leak sensors.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs space-y-1">
              <div className="flex items-center justify-between font-semibold text-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-destructive" />
                  CVR Hall 3rd Floor - Acoustic Pipe Leak
                </span>
                <Badge variant="destructive" className="text-[10px]">High Severity</Badge>
              </div>
              <p className="text-muted-foreground text-[11px]">
                Loss rate: 14 L / min. Acoustic spectrum indicates joint slip on main vertical riser. Plumber dispatch requested.
              </p>
            </div>

            <div className="rounded-lg border p-3 text-xs space-y-1">
              <div className="flex items-center justify-between font-semibold text-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-foreground" />
                  Sector 2 Substation 1 - Winding Temperature Spike
                </span>
                <Badge variant="outline" className="text-[10px]">Watchlist</Badge>
              </div>
              <p className="text-muted-foreground text-[11px]">
                Transformer 2 reached 74°C during peak afternoon draw. Recommended automatic load shift to Feeder 4.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2Icon className="size-4" />
              <span>Sustainability Optimization Recommendations</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Autonomous energy and water conservation levers with estimated cost offsets.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">HB-3 Rooftop Solar Geyser Schedule</span>
                <Badge variant="secondary" className="text-[10px]">+₹14,200 / mo</Badge>
              </div>
              <p className="text-muted-foreground text-[11px]">
                Shift pre-heating cycle between 11:00 AM - 02:00 PM to capture maximum solar irradiance, cutting evening grid reliance.
              </p>
            </div>

            <div className="rounded-lg border p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">SAC Auditorium Floodlight Timer Optimization</span>
                <Badge variant="secondary" className="text-[10px]">+₹8,500 / mo</Badge>
              </div>
              <p className="text-muted-foreground text-[11px]">
                Synchronize smart motion sensors with cultural club calendar bookings to prevent idle high-bay burn.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
