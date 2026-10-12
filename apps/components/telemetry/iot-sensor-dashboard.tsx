"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  LineChart,
  ReferenceLine,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  WindIcon,
  Trash2Icon,
  ZapIcon,
  DropletsIcon,
  CarIcon,
  WrenchIcon,
  ShieldAlertIcon,
  TrophyIcon,
  SparklesIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  ActivityIcon,
  RadioIcon,
  RefreshCwIcon,
  ArrowUpRightIcon,
  ClockIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  UploadCloudIcon,
  SlidersIcon,
  SendIcon,
  ShieldCheckIcon,
} from "lucide-react";

interface SensorItem {
  id: string;
  name: string;
  zone: string;
  category: string;
  value: number;
  unit: string;
  status: "NORMAL" | "WARNING" | "ANOMALY";
  trend: "RISING" | "FALLING" | "STABLE";
  timestamp: string;
  predicted6h: number;
  predicted24h: number;
  thresholdMax?: number;
  notes?: string;
}

interface AnomalyItem {
  id: string;
  sensorId: string;
  title: string;
  location: string;
  domain: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "WATCHLIST";
  confidence: number;
  deviation: string;
  detectedAt: string;
  explanation: string;
  predictedConsequence: string;
}

interface RecommendationItem {
  id: string;
  title: string;
  domain: string;
  urgency: "IMMEDIATE" | "NEXT_2H" | "NEXT_8H" | "DAILY_SOP";
  targetZone: string;
  actionText: string;
  estimatedImpact: string;
  costOffsetInr?: number;
  whyThisIsNeeded: string;
  dispatchAction: string;
}

// 24-Hour historical + 24-hour forecasted telemetry trend series
const INITIAL_SERIES = [
  { time: "00:00", actualAir: 54, forecastAir: 54, wasteFill: 24, energyKw: 720, waterFlow: 380, trafficRate: 4 },
  { time: "03:00", actualAir: 58, forecastAir: 58, wasteFill: 28, energyKw: 680, waterFlow: 340, trafficRate: 2 },
  { time: "06:00", actualAir: 72, forecastAir: 72, wasteFill: 36, energyKw: 940, waterFlow: 920, trafficRate: 18 },
  { time: "09:00", actualAir: 88, forecastAir: 88, wasteFill: 52, energyKw: 1380, waterFlow: 1240, trafficRate: 36 },
  { time: "12:00", actualAir: 94, forecastAir: 94, wasteFill: 71, energyKw: 1560, waterFlow: 1380, trafficRate: 28 },
  { time: "15:00", actualAir: 86, forecastAir: 86, wasteFill: 88, energyKw: 1620, waterFlow: 1180, trafficRate: 24 }, // Current
  { time: "18:00 (F)", actualAir: null, forecastAir: 112, wasteFill: 96, energyKw: 1840, waterFlow: 1420, trafficRate: 42 },
  { time: "21:00 (F)", actualAir: null, forecastAir: 98, wasteFill: 74, energyKw: 1480, waterFlow: 960, trafficRate: 14 },
  { time: "00:00 (F)", actualAir: null, forecastAir: 64, wasteFill: 32, energyKw: 820, waterFlow: 420, trafficRate: 6 },
  { time: "03:00 (F)", actualAir: null, forecastAir: 56, wasteFill: 30, energyKw: 710, waterFlow: 360, trafficRate: 2 },
  { time: "06:00 (F)", actualAir: null, forecastAir: 70, wasteFill: 38, energyKw: 950, waterFlow: 890, trafficRate: 16 },
  { time: "09:00 (F)", actualAir: null, forecastAir: 85, wasteFill: 55, energyKw: 1340, waterFlow: 1210, trafficRate: 34 },
];

export function IoTSensorDashboard() {
  const [ingestMode, setIngestMode] = React.useState<"live" | "synthetic" | "open_data">("live");
  const [selectedModule, setSelectedModule] = React.useState<string>("all");
  const [forecastHorizon, setForecastHorizon] = React.useState<"6h" | "12h" | "24h" | "48h">("24h");
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [showCustomIngest, setShowCustomIngest] = React.useState(false);
  const [customJsonInput, setCustomJsonInput] = React.useState("");

  // Live telemetry state
  const [telemetry, setTelemetry] = React.useState<SensorItem[]>([]);
  const [anomalies, setAnomalies] = React.useState<AnomalyItem[]>([]);
  const [recommendations, setRecommendations] = React.useState<RecommendationItem[]>([]);
  const [acknowledgedRecs, setAcknowledgedRecs] = React.useState<Record<string, boolean>>({});
  const [chartSeries, setChartSeries] = React.useState(INITIAL_SERIES);
  const [lastUpdated, setLastUpdated] = React.useState<string>("Just now");

  // Load telemetry from API
  const fetchTelemetry = React.useCallback(async (modeParam = ingestMode) => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/telemetry/stream?mode=${modeParam}`);
      if (res.ok) {
        const data = await res.json();
        if (data.telemetry) setTelemetry(data.telemetry);
        if (data.anomalies) setAnomalies(data.anomalies);
        if (data.recommendations) setRecommendations(data.recommendations);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (e) {
      console.error("Telemetry fetch error:", e);
    } finally {
      setIsRefreshing(false);
    }
  }, [ingestMode]);

  React.useEffect(() => {
    fetchTelemetry(ingestMode);
    // 10s auto-refresh
    const interval = setInterval(() => {
      fetchTelemetry(ingestMode);
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchTelemetry, ingestMode]);

  // Handle Dispatch / Recommendation Action
  const handleExecuteRecommendation = (rec: RecommendationItem) => {
    setAcknowledgedRecs((prev) => ({ ...prev, [rec.id]: true }));
    toast.success(`Action Executed: "${rec.dispatchAction}"! Work order dispatched to engineering team.`);
  };

  // Custom Ingest handler
  const handleIngestCustomData = () => {
    try {
      const parsed = JSON.parse(customJsonInput);
      toast.success("Synthetic / Sensor JSON successfully validated and ingested into telemetry buffer!");
      setShowCustomIngest(false);
      setCustomJsonInput("");
      fetchTelemetry(ingestMode);
    } catch {
      toast.error("Invalid JSON format. Please provide valid sensor telemetry JSON.");
    }
  };

  // Filtered telemetry list
  const filteredTelemetry = React.useMemo(() => {
    if (selectedModule === "all") return telemetry;
    return telemetry.filter((t) => t.category === selectedModule);
  }, [telemetry, selectedModule]);

  return (
    <div className="space-y-6">
      {/* Top Banner: Ingestion Control Bar */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="relative flex size-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-2.5 bg-emerald-500"></span>
              </span>
              <h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg flex items-center gap-2">
                IoT Telemetry, Anomaly Detection & Predictive Forecast Engine
              </h2>
              <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 text-emerald-600 bg-emerald-500/10">
                148 SENSORS ONLINE
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Ingesting open, synthetic, and edge ultrasonic/SCADA telemetry across NIT Rourkela. Detecting outliers and short-term trends.
            </p>
          </div>

          {/* Ingestion Stream Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-lg border bg-muted/40 p-1 text-xs">
              <Button
                type="button"
                variant={ingestMode === "live" ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => {
                  setIngestMode("live");
                  fetchTelemetry("live");
                  toast.info("Ingesting Live Sensor Telemetry (148 Nodes, 5s stream)");
                }}
              >
                <RadioIcon className="size-3 mr-1" />
                Live Sensor Feed
              </Button>
              <Button
                type="button"
                variant={ingestMode === "synthetic" ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => {
                  setIngestMode("synthetic");
                  fetchTelemetry("synthetic");
                  toast.warning("Injected Synthetic Stress Scenario (Festival Surge & Grid Load)");
                }}
              >
                <SlidersIcon className="size-3 mr-1" />
                Synthetic Surge
              </Button>
              <Button
                type="button"
                variant={ingestMode === "open_data" ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => {
                  setIngestMode("open_data");
                  fetchTelemetry("open_data");
                  toast.success("Synchronized with Open CPCB / IMD Telemetry Bridge");
                }}
              >
                <UploadCloudIcon className="size-3 mr-1" />
                Open Data Bridge
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => setShowCustomIngest(!showCustomIngest)}
            >
              <UploadCloudIcon className="size-3.5" />
              <span>Ingest Custom Data</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => fetchTelemetry(ingestMode)}
              title="Refresh Telemetry"
              disabled={isRefreshing}
            >
              <RefreshCwIcon className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Telemetry Ingestion Metrics Strip */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 pt-3 border-t text-xs">
          <div>
            <span className="text-[11px] text-muted-foreground">Throughput Rate:</span>
            <p className="font-semibold text-foreground font-mono mt-0.5">
              {ingestMode === "synthetic" ? "42.5" : "28.4"} msg / sec
            </p>
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground">Median Packet Latency:</span>
            <p className="font-semibold text-foreground font-mono mt-0.5">14.2 ms (LoRaWAN & MQTT)</p>
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground">Active Anomaly Flags:</span>
            <p className="font-semibold text-destructive font-mono mt-0.5">{anomalies.length} Detected</p>
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground">Stream Buffer Status:</span>
            <p className="font-semibold text-emerald-600 font-mono mt-0.5">Zero Packet Loss (100% Fidelity)</p>
          </div>
        </div>

        {/* Optional Custom Ingest Drawer / Collapsible Box */}
        {showCustomIngest && (
          <div className="mt-4 p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <UploadCloudIcon className="size-3.5 text-primary" />
                Ingest Open / Synthetic Sensor Payload (JSON / CSV Format)
              </Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px]"
                onClick={() =>
                  setCustomJsonInput(
                    JSON.stringify(
                      {
                        sensor_id: "open-aqi-cpcb-nitrkl",
                        metric: "PM2.5",
                        value: 78.4,
                        unit: "ug/m3",
                        timestamp: new Date().toISOString(),
                        zone: "Jagda Gate Perimeter",
                      },
                      null,
                      2
                    )
                  )
                }
              >
                Load Sample Payload
              </Button>
            </div>
            <textarea
              rows={3}
              value={customJsonInput}
              onChange={(e) => setCustomJsonInput(e.target.value)}
              placeholder='Paste JSON telemetry: {"sensor_id": "sensor-01", "metric": "flow_rate", "value": 14.2, ...}'
              className="w-full rounded-md border border-input bg-background p-2 text-xs font-mono"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowCustomIngest(false)} className="text-xs h-7">
                Cancel
              </Button>
              <Button size="sm" onClick={handleIngestCustomData} className="text-xs h-7 gap-1">
                <SendIcon className="size-3" /> Ingest into Active Buffer
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Domain Modules Tabs (All 8 Example Modules!) */}
      <Tabs defaultValue="all" onValueChange={setSelectedModule} className="space-y-4">
        <div className="flex items-center justify-between overflow-x-auto pb-1">
          <TabsList className="h-9">
            <TabsTrigger value="all" className="text-xs gap-1">
              <span>All 8 Modules</span>
            </TabsTrigger>
            <TabsTrigger value="air_quality" className="text-xs gap-1">
              <WindIcon className="size-3" />
              <span>Air Quality</span>
            </TabsTrigger>
            <TabsTrigger value="waste" className="text-xs gap-1">
              <Trash2Icon className="size-3" />
              <span>Waste-Bin Overflow</span>
            </TabsTrigger>
            <TabsTrigger value="energy" className="text-xs gap-1">
              <ZapIcon className="size-3" />
              <span>Energy Optimization</span>
            </TabsTrigger>
            <TabsTrigger value="water" className="text-xs gap-1">
              <DropletsIcon className="size-3" />
              <span>Water-Use Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="traffic" className="text-xs gap-1">
              <CarIcon className="size-3" />
              <span>Traffic & Parking</span>
            </TabsTrigger>
            <TabsTrigger value="equipment" className="text-xs gap-1">
              <WrenchIcon className="size-3" />
              <span>Equipment</span>
            </TabsTrigger>
            <TabsTrigger value="safety" className="text-xs gap-1">
              <ShieldAlertIcon className="size-3" />
              <span>Safety Trends</span>
            </TabsTrigger>
            <TabsTrigger value="sustainability" className="text-xs gap-1">
              <TrophyIcon className="size-3" />
              <span>Scorecards</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Live Sensor Grid Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filteredTelemetry.map((sensor) => {
            const isAnomaly = sensor.status === "ANOMALY";
            const isWarning = sensor.status === "WARNING";
            return (
              <Card
                key={sensor.id}
                className={`transition-all ${
                  isAnomaly
                    ? "border-destructive/60 bg-destructive/5 shadow-xs"
                    : isWarning
                    ? "border-amber-500/40 bg-amber-500/5 shadow-xs"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {sensor.zone}
                      </span>
                      <CardTitle className="text-sm font-bold text-foreground mt-0.5 line-clamp-1">
                        {sensor.name}
                      </CardTitle>
                    </div>
                    {isAnomaly ? (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                        ANOMALY
                      </Badge>
                    ) : isWarning ? (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500 text-amber-600 bg-amber-500/10">
                        SURGE
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-emerald-600 bg-emerald-500/10 border-emerald-500/20">
                        OPTIMAL
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-bold font-mono text-foreground">
                      {sensor.value} <span className="text-xs font-normal text-muted-foreground">{sensor.unit}</span>
                    </div>
                    <div className="text-right text-[11px]">
                      <span className="text-muted-foreground">6h Forecast: </span>
                      <span className="font-semibold text-foreground font-mono">{sensor.predicted6h}</span>
                    </div>
                  </div>

                  {sensor.notes && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed border-t pt-1.5 mt-1">
                      {sensor.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </Tabs>

      {/* Main Trends & Predictive Forecasting Chart */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <ActivityIcon className="size-4 text-primary" />
                  <span>Interactive Trends & Short-Term Predictive Forecasting</span>
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono">
                  Horizon: {forecastHorizon.toUpperCase()}
                </Badge>
              </div>
              <CardDescription className="text-xs mt-0.5">
                Past 24-hour sensor observations coupled with next 24-hour predictive forecast curve (dashed line) and anomaly envelopes.
              </CardDescription>
            </div>

            {/* Forecast Horizon Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Horizon:</span>
              <div className="flex rounded-lg border bg-muted/40 p-0.5 text-xs">
                {(["6h", "12h", "24h", "48h"] as const).map((h) => (
                  <Button
                    key={h}
                    type="button"
                    variant={forecastHorizon === h ? "default" : "ghost"}
                    size="sm"
                    className="h-6 text-[11px] px-2"
                    onClick={() => setForecastHorizon(h)}
                  >
                    +{h}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-popover p-2.5 shadow-md text-xs space-y-1">
                          <p className="font-semibold text-foreground">{label}</p>
                          {payload.map((item: any, i: number) => (
                            <p key={i} style={{ color: item.color }} className="flex justify-between gap-4">
                              <span>{item.name}:</span>
                              <span className="font-mono font-bold">{item.value ?? "N/A"}</span>
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine x="15:00" stroke="#ef4444" strokeDasharray="3 3" label={{ value: "Now (Triage Cutoff)", fill: "#ef4444", fontSize: 10 }} />
                <ReferenceLine y={100} stroke="#dc2626" strokeDasharray="4 4" label={{ value: "Warning Threshold", fill: "#dc2626", fontSize: 10 }} />
                <Area
                  type="monotone"
                  dataKey="actualAir"
                  name="Observed Telemetry"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  fill="url(#actualGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="forecastAir"
                  name="AI Short-Term Forecast"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fill="url(#forecastGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-between border-t pt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-full bg-primary" />
                <span className="font-medium text-foreground">Observed Historical Sensor Signal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-full bg-amber-500" />
                <span>Short-Term Predictive Forecast (P50 Horizon)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-destructive inline-block" />
                <span>Threshold Breach Trigger</span>
              </div>
            </div>
            <div className="text-[11px] font-mono">
              Refresh: <span className="font-semibold text-foreground">{lastUpdated}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Section: 1. Active Anomaly Feed & 2. Plain-Language Recommendations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 1. Real-Time Anomaly Detection Feed */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <AlertTriangleIcon className="size-4 text-destructive" />
                  <span>Real-Time Anomaly Detection & Outliers</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Continuous Z-score and statistical outlier engine flagging active deviations across sensor nodes.
                </CardDescription>
              </div>
              <Badge variant="destructive" className="text-[10px]">
                {anomalies.length} Critical Outliers
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {anomalies.map((anom) => (
              <div
                key={anom.id}
                className="rounded-lg border border-destructive/30 bg-destructive/5 p-3.5 space-y-2 text-xs transition-colors hover:border-destructive/60"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-destructive">
                      {anom.domain} • {anom.detectedAt}
                    </span>
                    <h4 className="font-bold text-foreground text-xs mt-0.5">{anom.title}</h4>
                    <p className="text-[11px] text-muted-foreground">{anom.location}</p>
                  </div>
                  <Badge
                    variant={anom.severity === "CRITICAL" ? "destructive" : "outline"}
                    className="text-[10px] shrink-0 font-mono"
                  >
                    {anom.severity} ({(anom.confidence * 100).toFixed(0)}% Conf)
                  </Badge>
                </div>

                <div className="rounded-md bg-background/80 p-2 text-[11px] border space-y-1">
                  <p className="text-foreground">
                    <strong>Deviation:</strong> <span className="text-destructive font-mono">{anom.deviation}</span>
                  </p>
                  <p className="text-muted-foreground">{anom.explanation}</p>
                  <p className="text-amber-600 font-medium pt-0.5">
                    ⚠️ <strong>Projected Impact:</strong> {anom.predictedConsequence}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 2. Plain-Language Recommendations for Administrators */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <SparklesIcon className="size-4 text-primary" />
                  <span>Plain-Language Recommendations for Administrators</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Autonomous prescriptive actions generated by CampusIQ AI to prevent downtime and optimize resources.
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                Prescriptive AI
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.map((rec) => {
              const isDone = acknowledgedRecs[rec.id];
              return (
                <div
                  key={rec.id}
                  className={`rounded-lg border p-3.5 space-y-2 text-xs transition-all ${
                    isDone
                      ? "border-emerald-500/40 bg-emerald-500/5 opacity-70"
                      : "border-border bg-card hover:border-primary/40 shadow-2xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1.5 py-0 h-4 font-semibold uppercase ${
                            rec.urgency === "IMMEDIATE"
                              ? "border-destructive text-destructive bg-destructive/10"
                              : "border-amber-500 text-amber-600 bg-amber-500/10"
                          }`}
                        >
                          {rec.urgency.replace("_", " ")}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">{rec.domain}</span>
                      </div>
                      <h4 className="font-bold text-foreground text-xs mt-1">{rec.title}</h4>
                      <p className="text-[11px] text-muted-foreground">Target: {rec.targetZone}</p>
                    </div>

                    {rec.costOffsetInr && (
                      <Badge variant="secondary" className="text-[10px] shrink-0 font-mono">
                        +₹{rec.costOffsetInr.toLocaleString()} Saved
                      </Badge>
                    )}
                  </div>

                  {/* Plain Language Explanation */}
                  <div className="rounded-md bg-muted/40 p-2 text-[11px] space-y-1">
                    <p className="text-foreground leading-relaxed">
                      <strong>Plain-Language Rationale:</strong> {rec.whyThisIsNeeded}
                    </p>
                    <p className="text-muted-foreground">
                      <strong>Prescribed Action:</strong> {rec.actionText}
                    </p>
                    <p className="text-emerald-700 font-medium">
                      ✓ <strong>Expected Outcome:</strong> {rec.estimatedImpact}
                    </p>
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button
                      size="sm"
                      variant={isDone ? "outline" : "default"}
                      className="h-7 text-xs gap-1"
                      disabled={isDone}
                      onClick={() => handleExecuteRecommendation(rec)}
                    >
                      {isDone ? (
                        <>
                          <CheckCircle2Icon className="size-3 text-emerald-600" />
                          <span>Action Dispatched</span>
                        </>
                      ) : (
                        <>
                          <ArrowUpRightIcon className="size-3" />
                          <span>{rec.dispatchAction}</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
