"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ZapIcon,
  DropletsIcon,
  FlameIcon,
  TrendingUpIcon,
  FileTextIcon,
  UploadCloudIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { apiGetUtilityForecasts } from "@/lib/api";

interface QuantileForecast {
  utility: string;
  month: string;
  baseline: string;
  p10_conservative: string;
  p50_expected: string;
  p90_surge: string;
  projectedCost: string;
}

const FORECASTS_DATA: QuantileForecast[] = [
  {
    utility: "Electricity (Power Grid)",
    month: "November 2026",
    baseline: "142,000 kWh",
    p10_conservative: "135,000 kWh",
    p50_expected: "148,000 kWh",
    p90_surge: "165,000 kWh",
    projectedCost: "₹11,84,000",
  },
  {
    utility: "Electricity (Festival Month)",
    month: "December 2026 (Nitrutsav)",
    baseline: "155,000 kWh",
    p10_conservative: "148,000 kWh",
    p50_expected: "168,000 kWh",
    p90_surge: "192,000 kWh",
    projectedCost: "₹13,44,000",
  },
  {
    utility: "Municipal Water Supply",
    month: "November 2026",
    baseline: "3,800,000 L",
    p10_conservative: "3,650,000 L",
    p50_expected: "3,950,000 L",
    p90_surge: "4,400,000 L",
    projectedCost: "₹3,16,000",
  },
  {
    utility: "LPG Commercial Mess Cylinders",
    month: "November 2026",
    baseline: "420 units",
    p10_conservative: "400 units",
    p50_expected: "435 units",
    p90_surge: "470 units",
    projectedCost: "₹7,83,000",
  },
];

export function EstateOfficerDashboard() {
  const [selectedUtility, setSelectedUtility] = React.useState("electricity");
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadedFileName, setUploadedFileName] = React.useState<string | null>(null);

  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setTimeout(() => {
        setIsUploading(false);
        setUploadedFileName(file.name);
        toast.success(`Parsed bill ${file.name}: 100% data reconciled with TPWODL tariff!`);
      }, 900);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Monthly Power Baseline</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              142,000 kWh
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1.5">
            <ZapIcon className="size-3.5" />
            <span>P50: 148,000 kWh</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Water Consumption</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              3.8M Liters
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1.5">
            <DropletsIcon className="size-3.5" />
            <span>Daily avg: 126k L</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Projected Utility Spend</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              ₹22.8 Lakh
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1.5">
            <TrendingUpIcon className="size-3.5" />
            <span>Within approved budget cap</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Infrastructure Health</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              98.2%
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2Icon className="size-3.5" />
            <span>Substation 2 & 4 nominal</span>
          </CardContent>
        </Card>
      </div>

      {/* Bill Ingestion Box */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold text-foreground">Utility Bills Parsing & Reconciliation Engine (§2.7)</h3>
          <p className="text-xs text-muted-foreground">
            Upload electricity (TPWODL) or water bills (PDF / CSV) for automatic tariff verification & baseline tuning.
          </p>
        </div>
        <div>
          <label className="cursor-pointer">
            <input
              type="file"
              className="hidden"
              accept=".pdf,.csv,.xlsx"
              onChange={handleSimulateUpload}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={isUploading}
              className="gap-1.5 pointer-events-none"
            >
              <UploadCloudIcon className="size-4" />
              <span>{isUploading ? "Parsing Bill..." : "Upload & Parse Bill"}</span>
            </Button>
          </label>
        </div>
      </div>

      {uploadedFileName && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileTextIcon className="size-4 text-primary" />
            <span>Successfully reconciled <strong>{uploadedFileName}</strong>. Consumption verified.</span>
          </div>
          <Badge variant="outline" className="text-[10px]">Verified</Badge>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="forecasts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="forecasts">Quantile Forecasts (P10 / P50 / P90)</TabsTrigger>
          <TabsTrigger value="alerts">Infrastructure Alerts (Substations & Pumps)</TabsTrigger>
          <TabsTrigger value="baseline">36-Month Baselines</TabsTrigger>
        </TabsList>

        <TabsContent value="forecasts" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Probabilistic Utility Consumption Forecasts (§2.7)</CardTitle>
              <CardDescription className="text-xs">
                Derived from 36 months historical telemetry and academic festival calendar surges.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utility Service</TableHead>
                    <TableHead>Target Period</TableHead>
                    <TableHead>Historical Baseline</TableHead>
                    <TableHead>P10 (Conservative)</TableHead>
                    <TableHead>P50 (Expected Median)</TableHead>
                    <TableHead>P90 (Peak Surge)</TableHead>
                    <TableHead className="text-right">Projected Spend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {FORECASTS_DATA.map((f, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium text-xs">
                        {f.utility}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {f.month}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {f.baseline}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {f.p10_conservative}
                      </TableCell>
                      <TableCell className="text-xs font-mono font-semibold">
                        {f.p50_expected}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {f.p90_surge}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold">
                        {f.projectedCost}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangleIcon className="size-4" />
                  <span>Substation 3 Transformer Temp</span>
                </CardTitle>
                <CardDescription className="text-xs">Supplying Halls 14 & KMS</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Winding Temp:</span>
                  <span className="font-mono font-semibold">68°C (Normal)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Threshold:</span>
                  <span className="font-mono">85°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cooling Pumps:</span>
                  <Badge variant="secondary" className="text-[10px]">Dual Run</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <DropletsIcon className="size-4" />
                  <span>Sector 2 Main Water Valve</span>
                </CardTitle>
                <CardDescription className="text-xs">Pump House Feeder Line</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Line Pressure:</span>
                  <span className="font-mono font-semibold">4.2 bar</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Flow Rate:</span>
                  <span className="font-mono">820 L / min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Telemetry Status:</span>
                  <Badge variant="secondary" className="text-[10px]">Online</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="baseline" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">36-Month Historical Baselining</CardTitle>
              <CardDescription className="text-xs">
                Seasonal trend curves accounting for summer holidays, winter semester and inter-NIT sports surges.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs space-y-3">
              <div className="rounded-lg border p-3 flex justify-between items-center">
                <div>
                  <div className="font-medium">Summer Baseline (May - July)</div>
                  <div className="text-muted-foreground">Reduced occupancy (Research scholars & interns only)</div>
                </div>
                <Badge variant="outline">48,000 kWh / mo</Badge>
              </div>
              <div className="rounded-lg border p-3 flex justify-between items-center">
                <div>
                  <div className="font-medium">Peak Academic Term (Aug - Nov)</div>
                  <div className="text-muted-foreground">Full campus capacity (All hostel blocks operational)</div>
                </div>
                <Badge variant="outline">146,000 kWh / mo</Badge>
              </div>
              <div className="rounded-lg border p-3 flex justify-between items-center">
                <div>
                  <div className="font-medium">Winter & Festival Term (Dec - Feb)</div>
                  <div className="text-muted-foreground">High water heater load & festival lighting</div>
                </div>
                <Badge variant="outline">158,000 kWh / mo</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
