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
  AssetCategory,
} from "@/components/spatial-3d/spatial-data";
import { DigitalTwinViewer } from "@/components/spatial-3d/digital-twin-viewer";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BoxIcon,
  LayersIcon,
  FlameIcon,
  MoonIcon,
  PlayIcon,
  PauseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ActivityIcon,
  ZapIcon,
  DropletsIcon,
  LightbulbIcon,
  SunIcon,
  Building2Icon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  WrenchIcon,
  EyeIcon,
  ArrowLeftIcon,
  Maximize2Icon,
  ShieldCheckIcon,
  RotateCcwIcon,
  RadioIcon,
  XIcon,
} from "lucide-react";

export default function Spatial3DDigitalTwinPage() {
  const router = useRouter();

  // Mode & Step States
  const [spectrum, setSpectrum] = useState<ViewSpectrum>("standard");
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlayingSteps, setIsPlayingSteps] = useState<boolean>(false);
  const [selectedAsset, setSelectedAsset] = useState<SpatialAsset | null>(SPATIAL_ASSETS[0]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);

  const currentStep: WorkStep = WORK_STEPS[currentStepIndex];

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

  // Filtered Assets
  const filteredAssets = SPATIAL_ASSETS.filter((asset) => {
    if (categoryFilter === "all") return true;
    return asset.category === categoryFilter;
  });

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* =========================================================================
          TOP COMMAND HEADER
          ========================================================================= */}
      <header className="h-16 px-4 md:px-6 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md z-30 flex items-center justify-between shrink-0 shadow-lg shadow-black/40">
        <div className="flex items-center gap-3">
          <Link
            href="/director/dashboard"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 transition-colors"
          >
            <ArrowLeftIcon className="size-3.5" />
            <span className="hidden sm:inline">Exit to Dashboard</span>
          </Link>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <BoxIcon className="size-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm md:text-base font-bold tracking-tight text-slate-100">
                  CampusIQ 3D Spatial Twin
                </h1>
                <Badge
                  variant="outline"
                  className="bg-cyan-950/60 text-cyan-400 border-cyan-800/60 text-[10px] py-0 px-1.5 font-mono"
                >
                  LIVE WEBGL
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400 hidden md:block">
                Multi-Spectrum Lifecycle & Ongoing Works Engineering Viewer (NIT Rourkela)
              </p>
            </div>
          </div>
        </div>

        {/* Spectrum Switcher (Standard, X-Ray, Heat, Night) */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl shadow-inner">
          <button
            onClick={() => setSpectrum("standard")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              spectrum === "standard"
                ? "bg-slate-800 text-cyan-300 shadow-sm border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <LayersIcon className="size-3.5" />
            <span className="hidden lg:inline">Standard 3D</span>
          </button>

          <button
            onClick={() => setSpectrum("xray")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              spectrum === "xray"
                ? "bg-cyan-500/20 text-cyan-300 shadow-sm border border-cyan-500/40"
                : "text-slate-400 hover:text-cyan-300"
            }`}
          >
            <EyeIcon className="size-3.5 text-cyan-400" />
            <span>X-Ray Blueprint</span>
          </button>

          <button
            onClick={() => setSpectrum("heat")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              spectrum === "heat"
                ? "bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/40"
                : "text-slate-400 hover:text-amber-300"
            }`}
          >
            <FlameIcon className="size-3.5 text-amber-400" />
            <span>Thermal FLIR</span>
          </button>

          <button
            onClick={() => setSpectrum("night")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              spectrum === "night"
                ? "bg-indigo-500/20 text-indigo-300 shadow-sm border border-indigo-500/40"
                : "text-slate-400 hover:text-indigo-300"
            }`}
          >
            <MoonIcon className="size-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Night Lux</span>
          </button>
        </div>

        {/* Top-Right Language Switcher */}
        <div className="flex items-center gap-2.5">
          <LanguageSwitcher />
        </div>
      </header>

      {/* =========================================================================
          MAIN 3D VIEWPORT CONTAINER
          ========================================================================= */}
      <div className="relative flex-1 w-full overflow-hidden">
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
        />

        {/* Spectrum Mode Watermark Banner */}
        <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-700/60 bg-slate-900/80 backdrop-blur-md text-xs font-mono text-slate-300 shadow-xl">
          <span className="size-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-slate-400 uppercase tracking-widest text-[10px]">Spectrum:</span>
          <span className="font-semibold text-cyan-300 uppercase">
            {spectrum === "xray"
              ? "X-Ray Translucent Conduits & Internal Piping"
              : spectrum === "heat"
              ? "Infrared Thermal FLIR (Anomaly Hotspots)"
              : spectrum === "night"
              ? "Smart Streetlight Lux Sensor Grid"
              : "Standard PBR Architectural Scene"}
          </span>
        </div>

        {/* FLIR Thermal Legend Bar (Visible in Heat Mode) */}
        {spectrum === "heat" && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 px-4 py-2 rounded-xl border border-amber-500/30 bg-slate-900/90 backdrop-blur-md shadow-2xl text-[11px] font-mono text-slate-200">
            <div className="flex items-center justify-between w-64 text-[10px] text-slate-400">
              <span>20°C (Safe)</span>
              <span>45°C (Warm)</span>
              <span>75°C (Warning)</span>
              <span className="text-red-400 font-bold">95°C+ (Hotspot)</span>
            </div>
            <div className="h-3 w-64 rounded-full bg-gradient-to-r from-blue-700 via-cyan-400 via-yellow-400 via-orange-500 to-red-600 border border-slate-700 shadow-inner" />
          </div>
        )}

        {/* =========================================================================
            LEFT FLOATING ASSET EXPLORER DRAWER
            ========================================================================= */}
        <div className="absolute top-4 left-4 bottom-28 w-72 z-20 hidden md:flex flex-col rounded-2xl border border-slate-800/80 bg-slate-950/85 backdrop-blur-xl shadow-2xl shadow-black/80 overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RadioIcon className="size-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Campus Assets ({filteredAssets.length})
              </span>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="p-2 border-b border-slate-800/60 flex flex-wrap gap-1 bg-slate-900/50">
            {[
              { id: "all", label: "All" },
              { id: "hostel", label: "Hostels" },
              { id: "streetlight", label: "Streetlights" },
              { id: "power", label: "Substation" },
              { id: "water", label: "Water" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                  categoryFilter === cat.id
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Asset List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
            {filteredAssets.map((asset) => {
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
                      ? "border-cyan-500/60 bg-cyan-950/30 shadow-md shadow-cyan-950/50"
                      : "border-slate-800/60 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-100 truncate">
                      {asset.name}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                        asset.status === "ACTIVE_WORK"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                          : asset.status === "ANOMALY"
                          ? "bg-red-500/20 text-red-300 border border-red-500/40"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      }`}
                    >
                      {asset.status === "ACTIVE_WORK"
                        ? "Active Work"
                        : asset.status === "ANOMALY"
                        ? "Anomaly"
                        : "Normal"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>{asset.categoryLabel}</span>
                    <span className="text-cyan-400 font-semibold">
                      {spectrum === "heat"
                        ? `${asset.thermalProfile.hotspotTempC}°C`
                        : `${asset.telemetry.temperatureC}°C`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            RIGHT FLOATING ASSET INSPECTION DRAWER
            ========================================================================= */}
        {selectedAsset && isInspectorOpen && (
          <div className="absolute top-4 right-4 bottom-28 w-84 md:w-96 z-20 flex flex-col rounded-2xl border border-slate-800/80 bg-slate-950/90 backdrop-blur-xl shadow-2xl shadow-black/80 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-2.5">
                <div
                  className={`size-3 rounded-full ${
                    selectedAsset.status === "ACTIVE_WORK"
                      ? "bg-amber-400 animate-pulse"
                      : "bg-emerald-400"
                  }`}
                />
                <div>
                  <h3 className="text-sm font-bold text-slate-100">{selectedAsset.name}</h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                    <span>{selectedAsset.code}</span>
                    <span>•</span>
                    <span>{selectedAsset.location}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsInspectorOpen(false)}
                className="size-7 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            {/* Content Details */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs custom-scrollbar">
              {/* Work Order / Ongoing Maintenance Banner */}
              {selectedAsset.workDescription && (
                <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
                    <WrenchIcon className="size-3.5" />
                    <span>Ongoing Work Order ({selectedAsset.ticketNo})</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {selectedAsset.workDescription}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-amber-500/20">
                    <span>Lead: {selectedAsset.assignedContractor}</span>
                    <span className="text-amber-400 font-bold">{selectedAsset.slaDeadline}</span>
                  </div>
                </div>
              )}

              {/* Live Multi-Spectrum Telemetry Gauges */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Live Asset Telemetry
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/50">
                    <span className="text-[10px] text-slate-400 block">Temperature</span>
                    <span className="text-base font-bold font-mono text-cyan-300">
                      {selectedAsset.telemetry.temperatureC}°C
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/50">
                    <span className="text-[10px] text-slate-400 block">FLIR Hotspot Peak</span>
                    <span className="text-base font-bold font-mono text-amber-400">
                      {selectedAsset.thermalProfile.hotspotTempC}°C
                    </span>
                  </div>
                  {selectedAsset.telemetry.voltageV !== undefined && (
                    <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/50">
                      <span className="text-[10px] text-slate-400 block">Voltage Feed</span>
                      <span className="text-base font-bold font-mono text-slate-200">
                        {selectedAsset.telemetry.voltageV} V
                      </span>
                    </div>
                  )}
                  {selectedAsset.telemetry.pressureBar !== undefined && (
                    <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/50">
                      <span className="text-[10px] text-slate-400 block">Water Pressure</span>
                      <span className="text-base font-bold font-mono text-cyan-400">
                        {selectedAsset.telemetry.pressureBar} Bar
                      </span>
                    </div>
                  )}
                  {selectedAsset.telemetry.luxLevel !== undefined && (
                    <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/50">
                      <span className="text-[10px] text-slate-400 block">Optical Lux Output</span>
                      <span className="text-base font-bold font-mono text-amber-300">
                        {selectedAsset.telemetry.luxLevel} lx
                      </span>
                    </div>
                  )}
                  {selectedAsset.telemetry.vibrationMmS !== undefined && (
                    <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/50">
                      <span className="text-[10px] text-slate-400 block">Mechanical Vibration</span>
                      <span className="text-base font-bold font-mono text-slate-300">
                        {selectedAsset.telemetry.vibrationMmS} mm/s
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* X-Ray Internal Building Components */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Internal Components (X-Ray View)</span>
                  <button
                    onClick={() => setSpectrum("xray")}
                    className="text-cyan-400 hover:underline font-mono text-[10px]"
                  >
                    View in X-Ray
                  </button>
                </span>
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/50 space-y-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Conduits & Wiring:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedAsset.internalComponents.conduits.map((c, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-amber-300 border border-slate-700"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  {selectedAsset.internalComponents.piping.length > 0 && (
                    <div>
                      <span className="text-[10px] text-slate-400 block">Plumbing Lines:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedAsset.internalComponents.piping.map((p, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-cyan-300 border border-slate-700"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] text-slate-400 block">Structural Frame:</span>
                    <span className="text-[11px] text-slate-200">
                      {selectedAsset.internalComponents.structuralType}
                    </span>
                  </div>
                </div>
              </div>

              {/* FLIR Hotspot Location */}
              <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1">
                <span className="text-[10px] text-slate-400 block">FLIR Hotspot Location:</span>
                <span className="text-[11px] text-slate-200 font-mono">
                  {selectedAsset.thermalProfile.hotspotLocation}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            BOTTOM STEP-BY-STEP WORK LIFECYCLE SCRUBBER DOCK
            ========================================================================= */}
        <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-800/80 bg-slate-950/90 backdrop-blur-xl shadow-2xl shadow-black/80">
          {/* Step Timeline Player Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlayingSteps(!isPlayingSteps)}
              className={`size-10 rounded-xl flex items-center justify-center font-bold transition-all shadow-md ${
                isPlayingSteps
                  ? "bg-amber-500 text-slate-950 shadow-amber-500/30"
                  : "bg-cyan-500 text-slate-950 shadow-cyan-500/30 hover:bg-cyan-400"
              }`}
            >
              {isPlayingSteps ? (
                <PauseIcon className="size-5 fill-current" />
              ) : (
                <PlayIcon className="size-5 fill-current ml-0.5" />
              )}
            </button>

            <div className="flex items-center gap-1">
              <button
                disabled={currentStepIndex === 0}
                onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                className="size-8 rounded-lg border border-slate-800 bg-slate-900 flex items-center justify-center text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
              >
                <ChevronLeftIcon className="size-4" />
              </button>
              <button
                disabled={currentStepIndex === WORK_STEPS.length - 1}
                onClick={() =>
                  setCurrentStepIndex((prev) => Math.min(WORK_STEPS.length - 1, prev + 1))
                }
                className="size-8 rounded-lg border border-slate-800 bg-slate-900 flex items-center justify-center text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
              >
                <ChevronRightIcon className="size-4" />
              </button>
            </div>

            {/* Current Step Title & Narrative */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-100">{currentStep.title}</span>
                <Badge
                  variant="outline"
                  className="bg-cyan-950/60 text-cyan-400 border-cyan-800 text-[10px] py-0 px-2 font-mono"
                >
                  {currentStep.statusBadge}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-sm md:max-w-md">
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
                <button
                  key={step.stepNumber}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all shrink-0 ${
                    isActive
                      ? "border-cyan-500 bg-cyan-950/40 text-cyan-300 font-bold shadow-md shadow-cyan-950/40"
                      : isPast
                      ? "border-slate-800 bg-slate-900/60 text-emerald-400"
                      : "border-slate-800/60 bg-slate-900/30 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <span
                    className={`size-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isActive
                        ? "bg-cyan-500 text-slate-950"
                        : isPast
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {step.stepNumber}
                  </span>
                  <span className="hidden lg:inline">{step.phaseId}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
