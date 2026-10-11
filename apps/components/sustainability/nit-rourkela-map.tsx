"use client";

import * as React from "react";
import {
  CampusPlace,
  SectorBoundary,
  HeatmapPoint,
  SustainabilityCategory,
  RiskLevel,
} from "./sustainability-types";
import {
  NIT_ROURKELA_CENTER,
  CAMPUS_SECTORS,
  CAMPUS_PLACES,
  HEATMAP_POINTS,
} from "./sustainability-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ZapIcon,
  DropletsIcon,
  Trash2Icon,
  ShieldAlertIcon,
  LayersIcon,
  EyeIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  SparklesIcon,
  RotateCcwIcon,
  MapPinIcon,
  FlameIcon,
  SearchIcon,
  NavigationIcon,
  TruckIcon,
  ClockIcon,
  CompassIcon,
} from "lucide-react";
import { toast } from "sonner";

interface BuildingFootprint {
  id: string;
  name: string;
  placeId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  category: "admin" | "academic" | "hostel" | "utility" | "sports";
}

const BUILDINGS_25D: BuildingFootprint[] = [
  // Sector 1: Admin & Central Core
  { id: "b-main", name: "Main Administrative Building", placeId: "pl-main-bldg", x: 48, y: 76, width: 15, height: 7, category: "admin" },
  { id: "b-lib", name: "Biju Patnaik Central Library", placeId: "pl-library", x: 67, y: 68, width: 10, height: 9, category: "admin" },
  { id: "b-sac", name: "Student Activity Centre (SAC)", placeId: "pl-sac", x: 46, y: 58, width: 13, height: 8, category: "sports" },
  { id: "b-golden", name: "Golden Jubilee Hall", x: 68, y: 80, width: 9, height: 6, category: "admin" },

  // Academic Quad (West)
  { id: "b-cse", name: "Dept. of CSE & EE", placeId: "pl-cse-dept", x: 26, y: 70, width: 14, height: 8, category: "academic" },
  { id: "b-mech", name: "Mechanical & Civil Complex", placeId: "pl-chem-labs", x: 22, y: 57, width: 13, height: 8, category: "academic" },
  { id: "b-tiir", name: "TIIR Innovation Centre", placeId: "pl-tiir", x: 30, y: 46, width: 10, height: 7, category: "academic" },

  // Sector 2: Utility & Works Hub (East)
  { id: "b-substation", name: "33kV Substation 1 Yard", placeId: "pl-substation-1", x: 78, y: 36, width: 11, height: 8, category: "utility" },
  { id: "b-pump", name: "Central Water Works & Pump", placeId: "pl-pump-house", x: 72, y: 48, width: 10, height: 7, category: "utility" },
  { id: "b-stp", name: "STP Effluent Recycling", placeId: "pl-sewage-plant", x: 83, y: 26, width: 9, height: 6, category: "utility" },

  // Hostel Zone (North & Northwest)
  { id: "b-hb3", name: "Hostel 14 (HB-3 Hall)", placeId: "pl-hb3", x: 24, y: 32, width: 12, height: 9, category: "hostel" },
  { id: "b-cvr", name: "C.V. Raman Hall (CVR)", placeId: "pl-cvr", x: 20, y: 18, width: 11, height: 8, category: "hostel" },
  { id: "b-kms", name: "K.M.S. Hall of Residence", placeId: "pl-kms", x: 38, y: 16, width: 11, height: 8, category: "hostel" },
  { id: "b-gdb", name: "G.D. Birla Hall (GDB)", placeId: "pl-gdb", x: 42, y: 32, width: 11, height: 8, category: "hostel" },
  { id: "b-mess", name: "Central Dining Hall", x: 34, y: 26, width: 8, height: 6, category: "hostel" },
];

export function NitRourkelaMap() {
  const [selectedCategory, setSelectedCategory] = React.useState<SustainabilityCategory>("all");
  const [places, setPlaces] = React.useState<CampusPlace[]>(CAMPUS_PLACES);
  const [heatmapPoints, setHeatmapPoints] = React.useState<HeatmapPoint[]>(HEATMAP_POINTS);
  const [dbSummary, setDbSummary] = React.useState<{ totalComplaints: number; openComplaints: number; highRiskComplaints: number } | null>(null);
  const [dbConnected, setDbConnected] = React.useState(false);
  const [selectedPlace, setSelectedPlace] = React.useState<CampusPlace | null>(CAMPUS_PLACES[3]); // default: Substation 1
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showHeatmap, setShowHeatmap] = React.useState(true);
  const [mapTheme, setMapTheme] = React.useState<"uber-light" | "uber-dark">("uber-light");
  const [isSimulatingDispatch, setIsSimulatingDispatch] = React.useState(false);

  // Fetch real data from backend / Neon PostgreSQL database
  React.useEffect(() => {
    fetch("/api/sustainability/map-data")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.places && data.places.length > 0) {
          setPlaces(data.places);
          if (data.heatmapPoints && data.heatmapPoints.length > 0) {
            setHeatmapPoints(data.heatmapPoints);
          }
          if (data.summary) {
            setDbSummary(data.summary);
          }
          setDbConnected(true);
        }
      })
      .catch((err) => {
        console.error("Database sync notice:", err);
      });
  }, []);

  // Filter places based on category and search query
  const filteredPlaces = React.useMemo(() => {
    return places.filter((place) => {
      const matchCat = selectedCategory === "all" || place.category === selectedCategory;
      const matchSearch =
        searchQuery === "" ||
        place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.sector.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [places, selectedCategory, searchQuery]);

  // Filter heatmap points based on category
  const filteredHeatmapPoints = React.useMemo(() => {
    if (selectedCategory === "all") return heatmapPoints;
    return heatmapPoints.filter((p) => p.category === selectedCategory);
  }, [heatmapPoints, selectedCategory]);

  const geoToPercent = (lat: number, lng: number): { x: number; y: number } => {
    const minLat = 22.2498;
    const maxLat = 22.2578;
    const minLng = 84.8962;
    const maxLng = 84.9068;

    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
    return { x: Math.max(4, Math.min(96, x)), y: Math.max(4, Math.min(96, y)) };
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "energy":
        return <ZapIcon className="size-3" />;
      case "water":
        return <DropletsIcon className="size-3" />;
      case "waste":
        return <Trash2Icon className="size-3" />;
      case "safety":
        return <ShieldAlertIcon className="size-3" />;
      default:
        return <MapPinIcon className="size-3" />;
    }
  };

  const handleDispatchSquad = (place: CampusPlace) => {
    setIsSimulatingDispatch(true);
    setTimeout(() => {
      setIsSimulatingDispatch(false);
      toast.success(
        `🚨 Campus Works EV Squad #02 dispatched to ${place.name}! Estimated Arrival: 3 mins.`
      );
    }, 800);
  };

  const isDark = mapTheme === "uber-dark";

  return (
    <div className="space-y-4">
      {/* Uber/Ola Top Search & Control Header */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-xs md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative w-full">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search NIT Rourkela building, hostel or sector..."
              className="pl-9 h-9 text-xs bg-muted/40 border-border focus-visible:ring-1"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-1">
            <Button
              variant={selectedCategory === "all" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setSelectedCategory("all")}
            >
              All
            </Button>
            <Button
              variant={selectedCategory === "energy" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs px-2.5 gap-1"
              onClick={() => setSelectedCategory("energy")}
            >
              <ZapIcon className="size-3 text-primary" />
              <span>Energy</span>
            </Button>
            <Button
              variant={selectedCategory === "water" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs px-2.5 gap-1"
              onClick={() => setSelectedCategory("water")}
            >
              <DropletsIcon className="size-3" />
              <span>Water</span>
            </Button>
            <Button
              variant={selectedCategory === "waste" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs px-2.5 gap-1"
              onClick={() => setSelectedCategory("waste")}
            >
              <Trash2Icon className="size-3" />
              <span>Waste</span>
            </Button>
            <Button
              variant={selectedCategory === "safety" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs px-2.5 gap-1"
              onClick={() => setSelectedCategory("safety")}
            >
              <ShieldAlertIcon className="size-3" />
              <span>Safety</span>
            </Button>
          </div>

          {/* Heatmap Toggle */}
          <Button
            variant={showHeatmap ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs px-2.5 gap-1.5"
            onClick={() => setShowHeatmap(!showHeatmap)}
          >
            <FlameIcon className="size-3.5" />
            <span>Heatmap {showHeatmap ? "ON" : "OFF"}</span>
          </Button>

          {/* Uber Map Theme (Light Shaded vs Dark Shaded) */}
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs px-2.5 gap-1.5"
            onClick={() => setMapTheme(isDark ? "uber-light" : "uber-dark")}
          >
            <LayersIcon className="size-3.5" />
            <span>{isDark ? "Uber Night" : "White & Shaded"}</span>
          </Button>
        </div>
      </div>

      {/* Main Map Viewer & Side Drawer */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Ola/Uber Style White & Shaded Vector Map */}
        <div
          className={`relative min-h-[580px] rounded-xl border overflow-hidden shadow-sm transition-colors duration-300 lg:col-span-2 ${
            isDark ? "bg-[#181a1f]" : "bg-[#f8f9fa]"
          }`}
        >
          {/* Base SVG Rendering: Parks, Roads, Shaded 2.5D Buildings */}
          <svg className="absolute inset-0 size-full select-none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              {/* Subtle Road Texture / Dashed lines */}
              <pattern id="roadStripes" width="20" height="20" patternUnits="userSpaceOnUse">
                <line x1="0" y1="10" x2="20" y2="10" stroke={isDark ? "#2a2e39" : "#e9ecef"} strokeWidth="1" />
              </pattern>

              {/* Shaded Drop Shadows for 2.5D Buildings */}
              <filter id="buildingElevation" x="-10%" y="-10%" width="130%" height="130%">
                <feDropShadow dx="3" dy="4" stdDeviation="2.5" floodColor={isDark ? "#000000" : "#212529"} floodOpacity={isDark ? "0.45" : "0.14"} />
              </filter>
            </defs>

            {/* 1. GREEN ZONES & CAMPUS PARKS (Subtle Pastel Green Shading) */}
            <g id="campus-parks" opacity={isDark ? 0.25 : 0.85}>
              {/* Main Admin Quadrangle Lawn */}
              <rect x="47%" y="67%" width="16%" height="7%" rx="6" fill={isDark ? "#1b2e24" : "#e8f5e9"} stroke={isDark ? "#284435" : "#c8e6c9"} strokeWidth="1" />
              {/* SAC Sports Ground / Oval Track */}
              <ellipse cx="52%" cy="50%" rx="9%" ry="5%" fill={isDark ? "#1b2e24" : "#e8f5e9"} stroke={isDark ? "#284435" : "#c8e6c9"} strokeWidth="1" strokeDasharray="3 3" />
              {/* Hostel Zone Garden */}
              <rect x="23%" y="24%" width="17%" height="6%" rx="6" fill={isDark ? "#1b2e24" : "#e8f5e9"} stroke={isDark ? "#284435" : "#c8e6c9"} strokeWidth="1" />
              {/* Technology Park Green Belt */}
              <rect x="20%" y="46%" width="8%" height="8%" rx="4" fill={isDark ? "#1b2e24" : "#e8f5e9"} stroke={isDark ? "#284435" : "#c8e6c9"} strokeWidth="1" />
            </g>

            {/* 2. CAMPUS WATER BODY / BALANCED ECO POND */}
            <g id="water-features" opacity={isDark ? 0.35 : 0.85}>
              <ellipse cx="80%" cy="56%" rx="6%" ry="4%" fill={isDark ? "#16283b" : "#e1f5fe"} stroke={isDark ? "#203a55" : "#b3e5fc"} strokeWidth="1" />
              <text x="80%" y="57%" textAnchor="middle" className="text-[9px] fill-muted-foreground font-medium select-none pointer-events-none">
                Eco Retention Pond
              </text>
            </g>

            {/* 3. ROADS & AVENUES (Signature Ola/Uber Clean White & Shaded Style) */}
            <g id="roads-network">
              {/* --- Layer A: Road Casing / Under-Border (Grey Shading) --- */}
              {/* NIT Rourkela Outer Ring Road */}
              <rect x="12%" y="10%" width="78%" height="78%" rx="36" fill="none" stroke={isDark ? "#242731" : "#dee2e6"} strokeWidth="22" strokeLinejoin="round" />
              {/* Central Spine Avenue (N-S) */}
              <line x1="49%" y1="12%" x2="49%" y2="88%" stroke={isDark ? "#242731" : "#dee2e6"} strokeWidth="18" strokeLinecap="round" />
              {/* Cross Campus Arterial (E-W) */}
              <line x1="14%" y1="64%" x2="88%" y2="64%" stroke={isDark ? "#242731" : "#dee2e6"} strokeWidth="18" strokeLinecap="round" />
              {/* Hostel Loop Road */}
              <line x1="14%" y1="38%" x2="65%" y2="38%" stroke={isDark ? "#242731" : "#dee2e6"} strokeWidth="16" strokeLinecap="round" />
              {/* Sector 2 Utility Spur */}
              <line x1="49%" y1="46%" x2="88%" y2="46%" stroke={isDark ? "#242731" : "#dee2e6"} strokeWidth="16" strokeLinecap="round" />

              {/* --- Layer B: Road Surface (Crisp White / Shaded Clean Fill) --- */}
              {/* Outer Ring Road */}
              <rect x="12%" y="10%" width="78%" height="78%" rx="36" fill="none" stroke={isDark ? "#1f222a" : "#ffffff"} strokeWidth="18" strokeLinejoin="round" />
              {/* Central Spine Avenue */}
              <line x1="49%" y1="12%" x2="49%" y2="88%" stroke={isDark ? "#1f222a" : "#ffffff"} strokeWidth="14" strokeLinecap="round" />
              {/* Cross Campus Arterial */}
              <line x1="14%" y1="64%" x2="88%" y2="64%" stroke={isDark ? "#1f222a" : "#ffffff"} strokeWidth="14" strokeLinecap="round" />
              {/* Hostel Loop Road */}
              <line x1="14%" y1="38%" x2="65%" y2="38%" stroke={isDark ? "#1f222a" : "#ffffff"} strokeWidth="12" strokeLinecap="round" />
              {/* Sector 2 Utility Spur */}
              <line x1="49%" y1="46%" x2="88%" y2="46%" stroke={isDark ? "#1f222a" : "#ffffff"} strokeWidth="12" strokeLinecap="round" />

              {/* --- Layer C: Dashed Center Lane Dividers (Ola/Uber Navigation style) --- */}
              <rect x="12%" y="10%" width="78%" height="78%" rx="36" fill="none" stroke={isDark ? "#383c48" : "#cbd5e1"} strokeWidth="1.2" strokeDasharray="6 6" />
              <line x1="49%" y1="13%" x2="49%" y2="87%" stroke={isDark ? "#383c48" : "#cbd5e1"} strokeWidth="1.2" strokeDasharray="6 6" />
              <line x1="15%" y1="64%" x2="87%" y2="64%" stroke={isDark ? "#383c48" : "#cbd5e1"} strokeWidth="1.2" strokeDasharray="6 6" />
              <line x1="15%" y1="38%" x2="64%" y2="38%" stroke={isDark ? "#383c48" : "#cbd5e1"} strokeWidth="1" strokeDasharray="5 5" />
            </g>

            {/* 4. SECTOR LABELS & BOUNDARIES */}
            <g id="sectors">
              {CAMPUS_SECTORS.map((s) => {
                const center = geoToPercent(s.center[0], s.center[1]);
                return (
                  <text
                    key={s.id}
                    x={`${center.x}%`}
                    y={`${center.y - 10}%`}
                    textAnchor="middle"
                    fill={isDark ? "#8b949e" : "#64748b"}
                    className="text-[10px] font-bold tracking-widest uppercase select-none pointer-events-none opacity-60"
                  >
                    {s.name.split(" ")[0]} {s.name.split(" ")[1]}
                  </text>
                );
              })}
            </g>

            {/* 5. 2.5D SHADED BUILDINGS (Extruded White Roof with Soft Drop Elevation Shading) */}
            <g id="buildings-25d">
              {BUILDINGS_25D.map((b) => {
                const isSelected = selectedPlace?.name.includes(b.name.split(" ")[0]);
                const roofFill = isDark ? "#222731" : "#ffffff";
                const facadeFill = isDark ? "#171a21" : "#e2e8f0";
                const borderStroke = isSelected
                  ? "var(--primary)"
                  : isDark
                  ? "#2d3340"
                  : "#cbd5e1";

                return (
                  <g
                    key={b.id}
                    filter="url(#buildingElevation)"
                    className="cursor-pointer transition-transform hover:scale-[1.02]"
                    onClick={() => {
                      const matched = CAMPUS_PLACES.find((p) => p.name.includes(b.name.split(" ")[0]));
                      if (matched) setSelectedPlace(matched);
                    }}
                  >
                    {/* 2.5D Extruded Elevation Facade (South-East Shading) */}
                    <rect
                      x={`${b.x + 0.8}%`}
                      y={`${b.y + 1.2}%`}
                      width={`${b.width}%`}
                      height={`${b.height}%`}
                      rx="3"
                      fill={facadeFill}
                      stroke={isDark ? "#12151b" : "#cbd5e1"}
                      strokeWidth="0.8"
                    />

                    {/* Clean White Roof Top */}
                    <rect
                      x={`${b.x}%`}
                      y={`${b.y}%`}
                      width={`${b.width}%`}
                      height={`${b.height}%`}
                      rx="3"
                      fill={roofFill}
                      stroke={borderStroke}
                      strokeWidth={isSelected ? "2" : "1"}
                    />

                    {/* Roof Accent Inset Details */}
                    <rect
                      x={`${b.x + 1.5}%`}
                      y={`${b.y + 1.2}%`}
                      width={`${b.width - 3}%`}
                      height={`${b.height - 2.4}%`}
                      rx="2"
                      fill="none"
                      stroke={isDark ? "#2d3340" : "#f1f5f9"}
                      strokeWidth="0.6"
                    />

                    {/* Clean Typography Building Label */}
                    <text
                      x={`${b.x + b.width / 2}%`}
                      y={`${b.y + b.height / 2 + 1}%`}
                      textAnchor="middle"
                      fill={isDark ? "#e6edf3" : "#1e293b"}
                      className="text-[9.5px] font-semibold tracking-tight pointer-events-none select-none"
                    >
                      {b.name.length > 20 ? b.name.substring(0, 18) + "…" : b.name}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* 6. UBER/OLA ACTIVE SQUAD ROUTE POLYLINE (EV Buggy on Patrol) */}
            <g id="patrol-route">
              <path
                d="M 49% 76% L 49% 46% L 78% 46% L 78% 36%"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2.5"
                strokeDasharray="4 4"
                strokeLinecap="round"
                className="opacity-80"
              />
            </g>
          </svg>

          {/* 7. HEATMAP OVERLAY LAYER (Smooth Gradient Glow on White Shaded Canvas) */}
          {showHeatmap && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden mix-blend-multiply dark:mix-blend-screen">
              {filteredHeatmapPoints.map((pt, idx) => {
                const pos = geoToPercent(pt.lat, pt.lng);
                const color =
                  pt.intensity > 0.7
                    ? "rgba(225, 29, 72, 0.40)" // high risk hotspot
                    : pt.intensity > 0.4
                    ? "rgba(234, 88, 12, 0.32)" // moderate risk
                    : "rgba(16, 185, 129, 0.22)"; // safe green

                return (
                  <div
                    key={idx}
                    className="absolute rounded-full transition-all duration-700 blur-2xl"
                    style={{
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      width: `${pt.radius * 2.2}px`,
                      height: `${pt.radius * 2.2}px`,
                      transform: "translate(-50%, -50%)",
                      backgroundColor: color,
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* 8. INTERACTIVE OLA/UBER STYLE PULSING PINS & SQUADS */}
          <div className="absolute inset-0 pointer-events-auto">
            {filteredPlaces.map((place) => {
              const pos = geoToPercent(place.lat, place.lng);
              const isSelected = selectedPlace?.id === place.id;
              const isCritical = place.riskLevel === "high";

              return (
                <button
                  key={place.id}
                  onClick={() => setSelectedPlace(place)}
                  className={`group absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 focus:outline-none ${
                    isSelected ? "scale-125 z-40" : "hover:scale-115 z-20"
                  }`}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                  {/* Subtle Radar Pulse on Hotspots */}
                  {isCritical && (
                    <span className="absolute -inset-1.5 rounded-full bg-destructive/35 animate-ping" />
                  )}

                  {/* Clean Circular Uber-style Pin with White Rim */}
                  <div
                    className={`flex items-center justify-center size-7 rounded-full shadow-lg border-2 transition-all ${
                      isCritical
                        ? "bg-destructive text-destructive-foreground border-white ring-2 ring-destructive/40"
                        : isSelected
                        ? "bg-primary text-primary-foreground border-white ring-2 ring-primary"
                        : isDark
                        ? "bg-[#252a36] text-[#e6edf3] border-[#383f4f]"
                        : "bg-white text-foreground border-slate-300 hover:border-foreground"
                    }`}
                  >
                    {getCategoryIcon(place.category)}
                  </div>

                  {/* Sleek Pill Badge on Marker */}
                  <div className="pointer-events-none absolute left-1/2 -bottom-5 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[9.5px] font-semibold bg-background/95 text-foreground border shadow-sm backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    {place.name.split(" ")[0]} {place.name.split(" ")[1] || ""}
                  </div>
                </button>
              );
            })}

            {/* Simulated Live EV Response Patrol Buggy (Ola/Uber Driver icon on Map) */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-1000"
              style={{ left: "62%", top: "46%" }}
              title="Works EV Buggy #02 Active on Patrol"
            >
              <div className="flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-[10px] font-semibold shadow-md border border-white">
                <TruckIcon className="size-3" />
                <span>EV Squad #02</span>
              </div>
            </div>
          </div>

          {/* Floating Ola/Uber Map Overlay Controls */}
          {/* Top-Left Campus Pill */}
          <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2 rounded-full bg-background/95 px-3 py-1.5 border border-border shadow-sm backdrop-blur-xs text-xs font-semibold text-foreground">
            <CompassIcon className="size-3.5 text-primary" />
            <span>NIT Rourkela • White & Shaded GIS</span>
            <span className="text-[11px] font-mono text-muted-foreground font-normal">462 Acres</span>
            {dbConnected && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 gap-1 font-mono text-primary border-primary/30 bg-primary/5">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                <span>DB: {dbSummary?.totalComplaints || 380} Tickets</span>
              </Badge>
            )}
          </div>

          {/* Bottom-Right Zoom / Reset Pill */}
          <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-full bg-background/95 backdrop-blur-xs text-xs gap-1.5 shadow-sm"
              onClick={() => {
                setSelectedPlace(CAMPUS_PLACES[0]);
                toast.success("Map re-centered on NIT Rourkela Main Quad.");
              }}
            >
              <RotateCcwIcon className="size-3" />
              <span>Center</span>
            </Button>
          </div>
        </div>

        {/* Ola/Uber Style Ride & Telemetry Drawer Card */}
        <div className="space-y-4 lg:col-span-1">
          {selectedPlace ? (
            <Card className="h-full flex flex-col shadow-xs border">
              {/* Header: Place Name & Status */}
              <CardHeader className="border-b pb-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                      <MapPinIcon className="size-3 text-primary" />
                      <span>{selectedPlace.sector}</span>
                    </div>
                    <CardTitle className="text-base font-bold text-foreground">
                      {selectedPlace.name}
                    </CardTitle>
                  </div>
                  <Badge
                    variant={
                      selectedPlace.riskLevel === "high"
                        ? "destructive"
                        : selectedPlace.riskLevel === "moderate"
                        ? "default"
                        : "secondary"
                    }
                    className="text-[10px] font-mono font-semibold"
                  >
                    {selectedPlace.riskLevel.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-4 flex-1">
                {/* Score Indicators (Uber Style KPI tiles) */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl border p-3 bg-muted/20">
                    <span className="text-[11px] text-muted-foreground">Spatial Risk</span>
                    <div className="font-mono text-2xl font-bold tabular-nums text-foreground mt-0.5">
                      {selectedPlace.riskScore}
                      <span className="text-xs font-normal text-muted-foreground"> / 100</span>
                    </div>
                  </div>

                  <div className="rounded-xl border p-3 bg-muted/20">
                    <span className="text-[11px] text-muted-foreground">Sustainability AI</span>
                    <div className="font-mono text-2xl font-bold tabular-nums text-foreground mt-0.5">
                      {selectedPlace.sustainabilityScore}
                      <span className="text-xs font-normal text-muted-foreground"> / 100</span>
                    </div>
                  </div>
                </div>

                {/* Live Telemetry Sensor Node */}
                <div className="rounded-xl border p-3 text-xs space-y-1.5 bg-card">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="font-medium text-foreground">Telemetry Sensor Feed</span>
                    <Badge
                      variant={
                        selectedPlace.telemetry.status === "critical"
                          ? "destructive"
                          : selectedPlace.telemetry.status === "warning"
                          ? "default"
                          : "secondary"
                      }
                      className="text-[10px]"
                    >
                      {selectedPlace.telemetry.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between font-semibold text-sm text-foreground pt-1">
                    <span>{selectedPlace.telemetry.metricName}</span>
                    <span className="font-mono">{selectedPlace.telemetry.value}</span>
                  </div>
                  {selectedPlace.telemetry.target && (
                    <div className="text-[11px] text-muted-foreground">
                      Baseline Target: {selectedPlace.telemetry.target}
                    </div>
                  )}
                </div>

                {/* Active Incident Warning */}
                {selectedPlace.recentIncident && (
                  <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-xs space-y-1">
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      <AlertTriangleIcon className="size-3.5 text-destructive" />
                      <span>Active Incident Hotline</span>
                    </div>
                    <p className="text-muted-foreground text-[11px]">
                      {selectedPlace.recentIncident}
                    </p>
                  </div>
                )}

                {/* AI Recommendation Box */}
                <div className="rounded-xl border p-3 text-xs space-y-1.5 bg-muted/10">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <SparklesIcon className="size-3.5 text-primary" />
                    <span>AI Autonomous Action</span>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    {selectedPlace.aiRecommendation}
                  </p>
                </div>

                {/* Ola/Uber Style Dispatch Action CTA */}
                <div className="pt-2 border-t mt-auto space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ClockIcon className="size-3 text-primary" />
                      <span>EV Squad ETA:</span>
                    </span>
                    <span className="font-semibold text-foreground">3 - 5 mins</span>
                  </div>

                  <Button
                    size="sm"
                    disabled={isSimulatingDispatch}
                    onClick={() => handleDispatchSquad(selectedPlace)}
                    className="w-full text-xs gap-1.5 h-9"
                  >
                    <NavigationIcon className="size-3.5" />
                    <span>
                      {isSimulatingDispatch ? "Dispatching Patrol Buggy..." : "Dispatch Works Squad (§14)"}
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center p-6 text-center text-xs text-muted-foreground">
              Select any building or sector on the map to inspect live sensor telemetry and dispatch maintenance crews.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
