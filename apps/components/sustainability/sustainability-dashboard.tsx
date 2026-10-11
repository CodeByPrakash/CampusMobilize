"use client";

import * as React from "react";
import { NitRourkelaMap } from "./nit-rourkela-map";
import { SustainabilityScoreCharts } from "./sustainability-score-charts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPinIcon,
  LineChartIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ActivityIcon,
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
            Geospatial risk heatmap, sector-by-sector telemetry, and predictive Sustainability AI scoring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5 py-1 px-2.5 text-xs">
            <SparklesIcon className="size-3.5 text-primary" />
            <span>AI Model v4.2 Active</span>
          </Badge>
        </div>
      </div>

      {/* Main Tabs: Map View & Graphical Graphs View */}
      <Tabs defaultValue="map" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="map" className="gap-1.5 text-xs">
            <MapPinIcon className="size-3.5" />
            <span>Interactive Campus Heatmap & Sectors</span>
          </TabsTrigger>
          <TabsTrigger value="graphs" className="gap-1.5 text-xs">
            <LineChartIcon className="size-3.5" />
            <span>Sustainability AI Score Graphs & Analytics</span>
          </TabsTrigger>
        </TabsList>

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
