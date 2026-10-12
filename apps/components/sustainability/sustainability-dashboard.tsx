"use client";

import * as React from "react";
import { NitRourkelaMap } from "./nit-rourkela-map";
import { SustainabilityScoreCharts } from "./sustainability-score-charts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IoTSensorDashboard } from "@/components/telemetry/iot-sensor-dashboard";
import {
  MapPinIcon,
  LineChartIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ActivityIcon,
  RadioIcon,
} from "lucide-react";

export function SustainabilityDashboard() {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Campus Sustainability AI & Spatial Risk Intelligence
            </h2>
            <Badge variant="outline" className="text-xs font-mono">
              NIT Rourkela
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Geospatial risk heatmap, sector telemetry, IoT sensor stream ingestion, anomaly alerts, and prescriptive administrative recommendations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5 py-1 px-2.5 text-xs">
            <SparklesIcon className="size-3.5 text-primary" />
            <span>AI Model v4.2 Active</span>
          </Badge>
        </div>
      </div>

      {/* Main Tabs: Map View, IoT Telemetry Hub & Score Graphs View */}
      <Tabs defaultValue="telemetry" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="telemetry" className="gap-1.5 text-xs font-semibold text-primary">
            <RadioIcon className="size-3.5" />
            <span>Live IoT Telemetry & Anomaly Hub</span>
          </TabsTrigger>
          <TabsTrigger value="map" className="gap-1.5 text-xs">
            <MapPinIcon className="size-3.5" />
            <span>Interactive Campus Heatmap & Sectors</span>
          </TabsTrigger>
          <TabsTrigger value="graphs" className="gap-1.5 text-xs">
            <LineChartIcon className="size-3.5" />
            <span>Sustainability AI Score Graphs & Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="telemetry" className="space-y-4">
          <IoTSensorDashboard />
        </TabsContent>

        <TabsContent value="map" className="space-y-4">
          <NitRourkelaMap />
        </TabsContent>

        <TabsContent value="graphs" className="space-y-4">
          <SustainabilityScoreCharts />
        </TabsContent>
      </Tabs>
    </div>
  );
}
