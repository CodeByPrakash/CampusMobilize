"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  SPATIAL_ASSETS,
  WORK_STEPS,
  SpatialAsset,
  ViewSpectrum,
  WorkStep,
} from "@/components/spatial-3d/spatial-data";
import { DigitalTwinViewer } from "@/components/spatial-3d/digital-twin-viewer";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NotificationsPopup } from "@/components/notifications/notifications-popup";
import { RoleSwitchModal } from "@/components/dashboards/role-switch-modal";
import { ROLES, RoleDefinition } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BoxIcon,
  LayersIcon,
  FlameIcon,
  MoonIcon,
  SunIcon,
  CrosshairIcon,
  ThermometerIcon,
  PlayIcon,
  PauseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ActivityIcon,
  ZapIcon,
  DropletsIcon,
  WrenchIcon,
  EyeIcon,
  ArrowLeftIcon,
  Maximize2Icon,
  Minimize2Icon,
  RotateCcwIcon,
  RadioIcon,
  XIcon,
  SearchIcon,
  UserCheckIcon,
  SlidersHorizontalIcon,
} from "lucide-react";

export default function Spatial3DDigitalTwinPage() {
  const router = useRouter();

  // Mode & Step States
  const [spectrum, setSpectrum] = useState<ViewSpectrum>("standard");
  const [environmentMode, setEnvironmentMode] = useState<"day" | "night">("day");
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlayingSteps, setIsPlayingSteps] = useState<boolean>(false);
  const [selectedAsset, setSelectedAsset] = useState<SpatialAsset | null>(SPATIAL_ASSETS[0]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);
  const [isAssetDrawerOpen, setIsAssetDrawerOpen] = useState<boolean>(true);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [currentRole, setCurrentRole] = useState<RoleDefinition>(ROLES[6]); // Default Director

  const currentStep: WorkStep = WORK_STEPS[currentStepIndex];

  // Detect active role from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedRoleId = localStorage.getItem("current_role_id");
      if (savedRoleId) {
        const found = ROLES.find((r) => r.id === savedRoleId);
        if (found) setCurrentRole(found);
      }
    }
  }, []);

  // Auto-step timeline playback
  useEffect(() => {
    if (!isPlayingSteps) return;

    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= WORK_STEPS.length - 1) {
          setIsPlayingSteps(false);
          return prev;
        }
        return prev + 1;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [isPlayingSteps]);

  // Synchronize selected asset when step changes
  useEffect(() => {
    const focusAsset = SPATIAL_ASSETS.find((a) => a.id === currentStep.focusAssetId);
    if (focusAsset) {
      setSelectedAsset(focusAsset);
    }
  }, [currentStepIndex, currentStep.focusAssetId]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Filtered Assets
  const filteredAssets = SPATIAL_ASSETS.filter((asset) => {
    const matchesCategory = categoryFilter === "all" || asset.category === categoryFilter;
    const matchesSearch =
      searchQuery.trim() === "" ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background text-foreground flex flex-col font-sans select-none">
      {/* =========================================================================
          TOP COMMAND HEADER
          ========================================================================= */}
      <header className="h-16 px-3 sm:px-6 border-b border-border bg-card/90 backdrop-blur-md z-30 flex items-center justify-between shrink-0 shadow-xs">
        {/* Left: Return & Branding */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(currentRole.route)}
            className="text-xs h-9 gap-1.5 shadow-2xs font-medium"
            title={`Return to ${currentRole.name}'s Dashboard`}
          >
            <ArrowLeftIcon className="size-3.5" />
            <span className="hidden sm:inline">Exit to {currentRole.name.split(" ")[0]}</span>
          </Button>

          <Separator orientation="vertical" className="h-5 hidden md:block" />

          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-2xs">
              <BoxIcon className="size-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-foreground">
                  3D Spatial Digital Twin
                </h1>
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/30 text-[10px] py-0 px-1.5 font-mono"
                >
                  LIVE WEBGL
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground hidden lg:block">
                Multi-Spectrum Lifecycle & Ongoing Works Engineering Viewer (NIT Rourkela)
              </p>
            </div>
          </div>
        </div>

        {/* Center: Spectrum Switcher (Standard, X-Ray, Heat, Night) */}
        <div className="flex items-center gap-1 bg-muted/60 border border-border p-1 rounded-xl shadow-2xs">
          <Button
            size="sm"
            variant={spectrum === "standard" ? "default" : "ghost"}
            onClick={() => setSpectrum("standard")}
            className="h-7 text-xs font-semibold gap-1.5 px-2.5"
          >
            <LayersIcon className="size-3.5" />
            <span className="hidden md:inline">Standard 3D</span>
          </Button>

          <Button
            size="sm"
            variant={spectrum === "xray" ? "default" : "ghost"}
            onClick={() => setSpectrum("xray")}
            className={`h-7 text-xs font-semibold gap-1.5 px-2.5 ${
              spectrum === "xray"
                ? "bg-cyan-600 hover:bg-cyan-500 text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <EyeIcon className="size-3.5" />
            <span>X-Ray</span>
          </Button>

          <Button
            size="sm"
            variant={spectrum === "heat" ? "default" : "ghost"}
            onClick={() => setSpectrum("heat")}
            className={`h-7 text-xs font-semibold gap-1.5 px-2.5 ${
              spectrum === "heat"
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FlameIcon className="size-3.5" />
            <span>Thermal FLIR</span>
          </Button>

          <Button
            size="sm"
            variant={spectrum === "night" ? "default" : "ghost"}
            onClick={() => {
              setSpectrum("night");
              setEnvironmentMode("night");
            }}
            className={`h-7 text-xs font-semibold gap-1.5 px-2.5 ${
              spectrum === "night"
                ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MoonIcon className="size-3.5" />
            <span className="hidden sm:inline">Night Lux</span>
          </Button>

          <Separator orientation="vertical" className="h-4 mx-1" />

          {/* Environment Lighting Day / Night Toggle */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const nextEnv = environmentMode === "day" ? "night" : "day";
              setEnvironmentMode(nextEnv);
              if (spectrum === "night" && nextEnv === "day") {
                setSpectrum("standard");
              }
            }}
            className="h-7 text-xs font-semibold gap-1.5 px-2.5 hover:bg-background/80"
            title={environmentMode === "day" ? "Switch environment to Night" : "Switch environment to Day"}
          >
            {environmentMode === "day" ? (
              <>
                <SunIcon className="size-3.5 text-amber-500 fill-amber-500/20" />
                <span>Day ☀️</span>
              </>
            ) : (
              <>
                <MoonIcon className="size-3.5 text-indigo-400 fill-indigo-400/20" />
                <span>Night 🌙</span>
              </>
            )}
          </Button>
        </div>

        {/* Right: Controls & Utility Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Toggle Asset Drawer Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsAssetDrawerOpen(!isAssetDrawerOpen)}
            title={isAssetDrawerOpen ? "Hide Asset Catalog" : "Show Asset Catalog"}
            className="size-8"
          >
            <SlidersHorizontalIcon className="size-3.5 text-muted-foreground" />
          </Button>

          {/* Role Switcher */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRoleModalOpen(true)}
            className="text-xs h-8 gap-1.5 hidden md:flex"
            title="Switch Persona"
          >
            <UserCheckIcon className="size-3.5 text-muted-foreground" />
            <span>{currentRole.name.split(" ")[0]}</span>
          </Button>

          {/* Fullscreen Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            className="size-8 hidden sm:flex"
          >
            {isFullscreen ? (
              <Minimize2Icon className="size-3.5 text-muted-foreground" />
            ) : (
              <Maximize2Icon className="size-3.5 text-muted-foreground" />
            )}
          </Button>

          <NotificationsPopup />
          <LanguageSwitcher />
        </div>
      </header>

      {/* =========================================================================
          MAIN 3D VIEWPORT CONTAINER
          ========================================================================= */}
      <div
        className={`relative flex-1 w-full overflow-hidden transition-colors duration-500 ${
          spectrum === "heat"
            ? "bg-[#070618]"
            : spectrum === "xray" || spectrum === "night" || environmentMode === "night"
            ? "bg-slate-950"
            : "bg-[#bde0fe]"
        }`}
      >
        {/* Three.js Engine Canvas */}
        <DigitalTwinViewer
          spectrum={spectrum}
          currentStep={currentStep}
          selectedAsset={selectedAsset}
          onSelectAsset={(asset) => {
            setSelectedAsset(asset);
            setIsInspectorOpen(true);
          }}
          filteredCategory={categoryFilter}
          environmentMode={environmentMode}
        />

        {/* Spectrum Mode Watermark Banner */}
        <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border/80 bg-card/85 backdrop-blur-md text-xs font-mono text-card-foreground shadow-lg">
          <span className="size-2 rounded-full bg-primary animate-ping" />
          <span className="text-muted-foreground uppercase tracking-wider text-[10px]">
            Mode:
          </span>
          <span className="font-semibold text-primary uppercase">
            {spectrum === "xray"
              ? "X-Ray Translucent Conduits & Internal Piping"
              : spectrum === "heat"
              ? "Infrared Thermal FLIR (Anomaly Hotspots)"
              : spectrum === "night"
              ? "Smart Streetlight Lux Sensor Grid"
              : environmentMode === "day"
              ? "Daytime Sunny Architectural PBR Scene"
              : "Standard Night Architectural Scene"}
          </span>
        </div>

        {/* FLIR Thermal Thermogram HUD (Visible in Heat Mode) */}
        {spectrum === "heat" && (
          <>
            {/* Top Thermal Gradient Scale & Quick Hotspots */}
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 px-5 py-2.5 rounded-2xl border border-amber-500/30 bg-card/95 backdrop-blur-xl shadow-2xl text-[11px] font-mono text-card-foreground max-w-lg w-full">
              <div className="flex items-center justify-between w-full text-[10px] text-muted-foreground font-sans">
                <div className="flex items-center gap-1.5 text-amber-500 font-semibold font-mono">
                  <FlameIcon className="size-3.5" />
                  <span>FLIR T1020 HD THERMAL SCALE</span>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">ε = 0.95 • LWIR 7.5-14 µm</span>
              </div>

              {/* Temperature Scale Bar with Precise Ticks */}
              <div className="w-full flex flex-col gap-1">
                <div className="h-3 w-full rounded-full bg-gradient-to-r from-[#1e3a8a] via-[#06b6d4] via-[#10b981] via-[#facc15] via-[#f97316] to-[#ef4444] border border-border shadow-inner" />
                <div className="flex items-center justify-between w-full text-[10px] font-mono text-muted-foreground">
                  <span className="text-cyan-400">20°C (Cold)</span>
                  <span className="text-emerald-400">38°C</span>
                  <span className="text-yellow-400">55°C (Warm)</span>
                  <span className="text-orange-400">70°C</span>
                  <span className="text-red-400 font-bold">85°C+ (HOTSPOT)</span>
                </div>
              </div>

              {/* Quick Anomaly Target Shortcuts */}
              <div className="flex items-center gap-1.5 w-full pt-1 border-t border-border/60">
                <span className="text-[10px] text-muted-foreground mr-1">Hotspots:</span>
                {[
                  { id: "asset-hb3", label: "HB-3 DB-4", temp: "84.6°C", color: "text-red-400 border-red-500/40 bg-red-500/10" },
                  { id: "asset-substation", label: "Substation T-2", temp: "89.2°C", color: "text-red-400 border-red-500/40 bg-red-500/10" },
                  { id: "asset-sl-04", label: "Streetlight SL-04", temp: "62.5°C", color: "text-amber-400 border-amber-500/40 bg-amber-500/10" },
                ].map((target) => (
                  <button
                    key={target.id}
                    onClick={() => {
                      const found = SPATIAL_ASSETS.find((a) => a.id === target.id);
                      if (found) {
                        setSelectedAsset(found);
                        setIsInspectorOpen(true);
                      }
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded-md border font-mono flex items-center gap-1 hover:brightness-125 transition-all ${target.color}`}
                  >
                    <span className="size-1.5 rounded-full bg-current animate-ping" />
                    <span>{target.label}</span>
                    <span className="font-bold">({target.temp})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* High-Tech FLIR Spot-Meter Reticle HUD (Top-Right / Floating) */}
            <div className="absolute bottom-28 right-4 sm:right-96 z-20 pointer-events-none flex flex-col gap-1.5 p-3 rounded-xl border border-cyan-500/40 bg-slate-950/85 backdrop-blur-md text-xs font-mono text-cyan-300 shadow-xl shadow-cyan-950/40 max-w-[260px]">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground border-b border-cyan-500/30 pb-1">
                <span className="flex items-center gap-1 text-cyan-400">
                  <CrosshairIcon className="size-3 text-cyan-400 animate-spin" style={{ animationDuration: "12s" }} />
                  SPOT-METER RETICLE
                </span>
                <span className="text-emerald-400">LOCK: ACTIVE</span>
              </div>
              <div className="text-[11px] text-slate-100 font-semibold truncate">
                {selectedAsset ? selectedAsset.name : "Homi Bhabha Hall (HB-3)"}
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] text-slate-400">Peak Thermal:</span>
                <span className={`text-base font-bold ${
                  (selectedAsset?.thermalProfile.hotspotTempC || 84.6) > 75 ? "text-red-400 animate-pulse" : "text-amber-400"
                }`}>
                  {selectedAsset ? `${selectedAsset.thermalProfile.hotspotTempC}°C` : "84.6°C"}
                </span>
              </div>
              <div className="flex items-baseline justify-between text-[10px] text-slate-400">
                <span>Ambient ΔT:</span>
                <span className="text-amber-300 font-semibold">
                  +{((selectedAsset?.thermalProfile.hotspotTempC || 84.6) - 28.0).toFixed(1)}°C
                </span>
              </div>
              <div className="text-[9px] text-slate-400 truncate pt-1 border-t border-cyan-500/20">
                Loc: {selectedAsset?.thermalProfile.hotspotLocation || "Wing B DB Junction #4"}
              </div>
            </div>
          </>
        )}

        {/* =========================================================================
            LEFT FLOATING ASSET EXPLORER DRAWER
            ========================================================================= */}
        {isAssetDrawerOpen && (
          <div className="absolute top-4 left-4 bottom-28 w-72 sm:w-80 z-20 flex flex-col rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-left duration-200">
            {/* Header */}
            <div className="p-3 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-2">
                <RadioIcon className="size-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-card-foreground">
                  Campus Assets ({filteredAssets.length})
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsAssetDrawerOpen(false)}
                className="size-6 text-muted-foreground hover:text-foreground"
              >
                <XIcon className="size-3.5" />
              </Button>
            </div>

            {/* Search Box */}
            <div className="p-2 border-b border-border/60">
              <div className="relative">
                <SearchIcon className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter hostels, lights, pumps..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-8 pr-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="p-2 border-b border-border/60 flex flex-wrap gap-1 bg-muted/20">
              {[
                { id: "all", label: "All" },
                { id: "hostel", label: "Hostels" },
                { id: "streetlight", label: "Streetlights" },
                { id: "power", label: "Substation" },
                { id: "water", label: "Water" },
              ].map((cat) => (
                <Button
                  key={cat.id}
                  size="sm"
                  variant={categoryFilter === cat.id ? "default" : "outline"}
                  onClick={() => setCategoryFilter(cat.id)}
                  className="h-6 px-2 text-[10px] rounded-md font-medium"
                >
                  {cat.label}
                </Button>
              ))}
            </div>

            {/* Asset List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
              {filteredAssets.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  No assets match current filter.
                </div>
              ) : (
                filteredAssets.map((asset) => {
                  const isSelected = selectedAsset?.id === asset.id;
                  return (
                    <div
                      key={asset.id}
                      onClick={() => {
                        setSelectedAsset(asset);
                        setIsInspectorOpen(true);
                      }}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-xs"
                          : "border-border/60 bg-card hover:border-border hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-card-foreground truncate">
                          {asset.name}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-mono px-1.5 py-0 font-bold ${
                            asset.status === "ACTIVE_WORK"
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40"
                              : asset.status === "ANOMALY"
                              ? "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40"
                              : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40"
                          }`}
                        >
                          {asset.status === "ACTIVE_WORK"
                            ? "Active Work"
                            : asset.status === "ANOMALY"
                            ? "Anomaly"
                            : "Normal"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                        <span>{asset.categoryLabel}</span>
                        <span className="text-primary font-semibold">
                          {spectrum === "heat"
                            ? `${asset.thermalProfile.hotspotTempC}°C`
                            : `${asset.telemetry.temperatureC}°C`}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            RIGHT FLOATING ASSET INSPECTION DRAWER
            ========================================================================= */}
        {selectedAsset && isInspectorOpen && (
          <div className="absolute top-4 right-4 bottom-28 w-80 sm:w-96 z-20 flex flex-col rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-3.5 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-2.5">
                <div
                  className={`size-3 rounded-full ${
                    selectedAsset.status === "ACTIVE_WORK"
                      ? "bg-amber-500 animate-pulse"
                      : "bg-emerald-500"
                  }`}
                />
                <div>
                  <h3 className="text-sm font-bold text-card-foreground">
                    {selectedAsset.name}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                    <span>{selectedAsset.code}</span>
                    <span>•</span>
                    <span>{selectedAsset.location}</span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsInspectorOpen(false)}
                className="size-7 text-muted-foreground hover:text-foreground"
              >
                <XIcon className="size-4" />
              </Button>
            </div>

            {/* Content Details */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs custom-scrollbar">
              {/* Work Order / Ongoing Maintenance Banner */}
              {selectedAsset.workDescription && (
                <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold text-xs">
                    <WrenchIcon className="size-3.5" />
                    <span>Ongoing Work Order ({selectedAsset.ticketNo})</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {selectedAsset.workDescription}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono pt-1 border-t border-amber-500/20">
                    <span>Lead: {selectedAsset.assignedContractor}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">
                      {selectedAsset.slaDeadline}
                    </span>
                  </div>
                </div>
              )}

              {/* Live Multi-Spectrum Telemetry Gauges */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  Live Asset Telemetry
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl border border-border bg-muted/30">
                    <span className="text-[10px] text-muted-foreground block">
                      Temperature
                    </span>
                    <span className="text-base font-bold font-mono text-primary">
                      {selectedAsset.telemetry.temperatureC}°C
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-border bg-muted/30">
                    <span className="text-[10px] text-muted-foreground block">
                      FLIR Hotspot Peak
                    </span>
                    <span className="text-base font-bold font-mono text-amber-600 dark:text-amber-400">
                      {selectedAsset.thermalProfile.hotspotTempC}°C
                    </span>
                  </div>
                  {selectedAsset.telemetry.voltageV !== undefined && (
                    <div className="p-2.5 rounded-xl border border-border bg-muted/30">
                      <span className="text-[10px] text-muted-foreground block">
                        Voltage Feed
                      </span>
                      <span className="text-base font-bold font-mono text-card-foreground">
                        {selectedAsset.telemetry.voltageV} V
                      </span>
                    </div>
                  )}
                  {selectedAsset.telemetry.pressureBar !== undefined && (
                    <div className="p-2.5 rounded-xl border border-border bg-muted/30">
                      <span className="text-[10px] text-muted-foreground block">
                        Water Pressure
                      </span>
                      <span className="text-base font-bold font-mono text-cyan-600 dark:text-cyan-400">
                        {selectedAsset.telemetry.pressureBar} Bar
                      </span>
                    </div>
                  )}
                  {selectedAsset.telemetry.luxLevel !== undefined && (
                    <div className="p-2.5 rounded-xl border border-border bg-muted/30">
                      <span className="text-[10px] text-muted-foreground block">
                        Optical Lux Output
                      </span>
                      <span className="text-base font-bold font-mono text-amber-500">
                        {selectedAsset.telemetry.luxLevel} lx
                      </span>
                    </div>
                  )}
                  {selectedAsset.telemetry.vibrationMmS !== undefined && (
                    <div className="p-2.5 rounded-xl border border-border bg-muted/30">
                      <span className="text-[10px] text-muted-foreground block">
                        Mechanical Vibration
                      </span>
                      <span className="text-base font-bold font-mono text-card-foreground">
                        {selectedAsset.telemetry.vibrationMmS} mm/s
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* X-Ray Internal Building Components */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Internal Components (X-Ray View)</span>
                  <button
                    onClick={() => setSpectrum("xray")}
                    className="text-primary hover:underline font-mono text-[10px]"
                  >
                    View in X-Ray
                  </button>
                </span>
                <div className="p-3 rounded-xl border border-border bg-muted/30 space-y-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">
                      Conduits & Wiring:
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedAsset.internalComponents.conduits.map((c, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-muted text-[10px] font-mono text-amber-600 dark:text-amber-300 border border-border"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  {selectedAsset.internalComponents.piping.length > 0 && (
                    <div>
                      <span className="text-[10px] text-muted-foreground block">
                        Plumbing Lines:
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedAsset.internalComponents.piping.map((p, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-muted text-[10px] font-mono text-cyan-600 dark:text-cyan-300 border border-border"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] text-muted-foreground block">
                      Structural Frame:
                    </span>
                    <span className="text-[11px] text-card-foreground">
                      {selectedAsset.internalComponents.structuralType}
                    </span>
                  </div>
                </div>
              </div>

              {/* FLIR Hotspot Location */}
              <div className="p-3 rounded-xl border border-border bg-muted/30 space-y-1">
                <span className="text-[10px] text-muted-foreground block">
                  FLIR Hotspot Location:
                </span>
                <span className="text-[11px] text-card-foreground font-mono">
                  {selectedAsset.thermalProfile.hotspotLocation}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            BOTTOM STEP-BY-STEP WORK LIFECYCLE SCRUBBER DOCK
            ========================================================================= */}
        <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl shadow-xl">
          {/* Step Timeline Player Controls */}
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant={isPlayingSteps ? "secondary" : "default"}
              onClick={() => setIsPlayingSteps(!isPlayingSteps)}
              className="size-10 rounded-xl shadow-xs"
              title={isPlayingSteps ? "Pause Auto-Scrubber" : "Play Lifecycle Simulation"}
            >
              {isPlayingSteps ? (
                <PauseIcon className="size-4.5 fill-current" />
              ) : (
                <PlayIcon className="size-4.5 fill-current ml-0.5" />
              )}
            </Button>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                disabled={currentStepIndex === 0}
                onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                className="size-8"
                title="Previous Lifecycle Step"
              >
                <ChevronLeftIcon className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={currentStepIndex === WORK_STEPS.length - 1}
                onClick={() =>
                  setCurrentStepIndex((prev) => Math.min(WORK_STEPS.length - 1, prev + 1))
                }
                className="size-8"
                title="Next Lifecycle Step"
              >
                <ChevronRightIcon className="size-4" />
              </Button>
            </div>

            {/* Current Step Title & Narrative */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-card-foreground">
                  {currentStep.title}
                </span>
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/30 text-[10px] py-0 px-2 font-mono"
                >
                  {currentStep.statusBadge}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground truncate max-w-xs sm:max-w-md md:max-w-lg">
                {currentStep.subtitle}
              </p>
            </div>
          </div>

          {/* Interactive Timeline Stepper Nodes */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {WORK_STEPS.map((step, idx) => {
              const isActive = idx === currentStepIndex;
              const isPast = idx < currentStepIndex;

              return (
                <Button
                  key={step.stepNumber}
                  size="sm"
                  variant={isActive ? "default" : isPast ? "secondary" : "outline"}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`h-8 px-2.5 text-xs font-mono shrink-0 gap-1.5 ${
                    isActive ? "shadow-xs font-bold" : ""
                  }`}
                >
                  <span
                    className={`size-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isActive
                        ? "bg-primary-foreground text-primary"
                        : isPast
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step.stepNumber}
                  </span>
                  <span className="hidden lg:inline">{step.phaseId}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Role Switcher Modal */}
      <RoleSwitchModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        currentRoleId={currentRole.id}
      />
    </div>
  );
}
