"use client";

import * as React from "react";
import { AssetItem, AssetStatus, AssetCategory } from "./asset-types";
import { ASSET_COLUMNS, INITIAL_CAMPUS_ASSETS } from "./asset-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  WrenchIcon,
  ZapIcon,
  DropletsIcon,
  ShieldAlertIcon,
  BuildingIcon,
  PlusCircleIcon,
  SearchIcon,
  GripVerticalIcon,
  RotateCcwIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  SparklesIcon,
  ClockIcon,
  MapPinIcon,
  ActivityIcon,
} from "lucide-react";
import { toast } from "sonner";

export function AssetManager() {
  const [assets, setAssets] = React.useState<AssetItem[]>(INITIAL_CAMPUS_ASSETS);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<"all" | AssetCategory>("all");
  const [draggingAssetId, setDraggingAssetId] = React.useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = React.useState<AssetStatus | null>(null);
  const [showAddForm, setShowAddForm] = React.useState(false);

  // New asset form state
  const [newName, setNewName] = React.useState("");
  const [newCategory, setNewCategory] = React.useState<AssetCategory>("energy");
  const [newLocation, setNewLocation] = React.useState("");
  const [newStatus, setNewStatus] = React.useState<AssetStatus>("operational");
  const [newTech, setNewTech] = React.useState("");
  const [newNotes, setNewNotes] = React.useState("");

  // Filtered assets
  const filteredAssets = React.useMemo(() => {
    return assets.filter((item) => {
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.tag.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        (item.assignedTechnician && item.assignedTechnician.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [assets, selectedCategory, searchQuery]);

  // Metrics
  const metrics = React.useMemo(() => {
    const total = assets.length;
    const operational = assets.filter((a) => a.status === "operational").length;
    const maintenance = assets.filter((a) => a.status === "maintenance").length;
    const repair = assets.filter((a) => a.status === "repair").length;
    const critical = assets.filter((a) => a.status === "critical").length;
    const avgHealth = total > 0 ? Math.round(assets.reduce((sum, a) => sum + a.healthScore, 0) / total) : 0;
    return { total, operational, maintenance, repair, critical, avgHealth };
  }, [assets]);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, assetId: string) => {
    e.dataTransfer.setData("text/plain", assetId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingAssetId(assetId);
  };

  const handleDragEnd = () => {
    setDraggingAssetId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, colId: AssetStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumn !== colId) {
      setDragOverColumn(colId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, colId: AssetStatus) => {
    e.preventDefault();
    if (dragOverColumn === colId) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStatus: AssetStatus) => {
    e.preventDefault();
    const assetId = e.dataTransfer.getData("text/plain") || draggingAssetId;
    setDraggingAssetId(null);
    setDragOverColumn(null);

    if (!assetId) return;

    const targetAsset = assets.find((a) => a.id === assetId);
    if (!targetAsset) return;

    if (targetAsset.status === targetStatus) return;

    // Calculate adjusted health score depending on target status
    let adjustedHealth = targetAsset.healthScore;
    if (targetStatus === "operational") adjustedHealth = Math.max(adjustedHealth, 90);
    else if (targetStatus === "maintenance") adjustedHealth = Math.min(Math.max(adjustedHealth, 70), 80);
    else if (targetStatus === "repair") adjustedHealth = Math.min(adjustedHealth, 55);
    else if (targetStatus === "critical") adjustedHealth = Math.min(adjustedHealth, 35);

    setAssets((prev) =>
      prev.map((a) =>
        a.id === assetId
          ? {
              ...a,
              status: targetStatus,
              healthScore: adjustedHealth,
              lastInspected: "Just now (State Updated)",
            }
          : a
      )
    );

    const colDef = ASSET_COLUMNS.find((c) => c.id === targetStatus);
    toast.success(`Asset "${targetAsset.name}" moved to "${colDef?.title || targetStatus}".`);
  };

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newLocation.trim()) {
      toast.error("Please enter asset name and location");
      return;
    }

    const newAsset: AssetItem[] = [
      {
        id: `ast-${Date.now()}`,
        name: newName.trim(),
        tag: `AST-NR-${newCategory.toUpperCase().slice(0, 3)}-${Math.floor(100 + Math.random() * 900)}`,
        category: newCategory,
        location: newLocation.trim(),
        status: newStatus,
        healthScore: newStatus === "operational" ? 95 : newStatus === "maintenance" ? 75 : newStatus === "repair" ? 50 : 30,
        lastInspected: "Today (Newly Registered)",
        assignedTechnician: newTech.trim() || "Unassigned",
        installedYear: new Date().getFullYear(),
        notes: newNotes.trim() || "Initial registration into  asset directory.",
      },
    ];

    setAssets((prev) => [...newAsset, ...prev]);
    toast.success(`Registered new asset: ${newName}`);

    // Reset form
    setNewName("");
    setNewLocation("");
    setNewTech("");
    setNewNotes("");
    setShowAddForm(false);
  };

  const getCategoryIcon = (cat: AssetCategory) => {
    switch (cat) {
      case "energy":
        return <ZapIcon className="size-3.5 text-primary" />;
      case "water":
        return <DropletsIcon className="size-3.5 text-primary" />;
      case "facility":
        return <BuildingIcon className="size-3.5 text-primary" />;
      case "safety":
        return <ShieldAlertIcon className="size-3.5 text-destructive" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Overview Tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Card className="p-3">
          <div className="text-[11px] font-medium text-muted-foreground">Total Assets</div>
          <div className="font-mono text-xl font-bold tabular-nums text-foreground mt-0.5">
            {metrics.total}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Across 462 Acres</div>
        </Card>
        <Card className="p-3">
          <div className="text-[11px] font-medium text-muted-foreground">Fleet Health</div>
          <div className="font-mono text-xl font-bold tabular-nums text-foreground mt-0.5">
            {metrics.avgHealth}%
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Composite Score</div>
        </Card>
        <Card className="p-3 border-emerald-500/20 bg-emerald-500/5">
          <div className="text-[11px] font-medium text-muted-foreground">Operational</div>
          <div className="font-mono text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
            {metrics.operational}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Nominal telemetry</div>
        </Card>
        <Card className="p-3 border-amber-500/20 bg-amber-500/5">
          <div className="text-[11px] font-medium text-muted-foreground">Scheduled</div>
          <div className="font-mono text-xl font-bold tabular-nums text-amber-600 dark:text-amber-400 mt-0.5">
            {metrics.maintenance}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Routine servicing</div>
        </Card>
        <Card className="p-3 border-orange-500/20 bg-orange-500/5">
          <div className="text-[11px] font-medium text-muted-foreground">Under Repair</div>
          <div className="font-mono text-xl font-bold tabular-nums text-orange-600 dark:text-orange-400 mt-0.5">
            {metrics.repair}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Squad assigned</div>
        </Card>
        <Card className="p-3 border-destructive/20 bg-destructive/5">
          <div className="text-[11px] font-medium text-muted-foreground">Critical</div>
          <div className="font-mono text-xl font-bold tabular-nums text-destructive mt-0.5">
            {metrics.critical}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Urgent triage</div>
        </Card>
      </div>

      {/* Action Bar & Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search asset, tag, room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1">
            <Button
              variant={selectedCategory === "all" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className="h-8 px-2.5 text-xs"
            >
              All
            </Button>
            <Button
              variant={selectedCategory === "energy" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory("energy")}
              className="h-8 px-2.5 text-xs gap-1"
            >
              <ZapIcon className="size-3" />
              <span>Energy</span>
            </Button>
            <Button
              variant={selectedCategory === "water" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory("water")}
              className="h-8 px-2.5 text-xs gap-1"
            >
              <DropletsIcon className="size-3" />
              <span>Water</span>
            </Button>
            <Button
              variant={selectedCategory === "facility" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory("facility")}
              className="h-8 px-2.5 text-xs gap-1"
            >
              <BuildingIcon className="size-3" />
              <span>Facility</span>
            </Button>
            <Button
              variant={selectedCategory === "safety" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory("safety")}
              className="h-8 px-2.5 text-xs gap-1"
            >
              <ShieldAlertIcon className="size-3" />
              <span>Safety</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            className="h-8 text-xs gap-1.5"
          >
            <PlusCircleIcon className="size-3.5" />
            <span>{showAddForm ? "Close Form" : "Add Asset"}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAssets(INITIAL_CAMPUS_ASSETS);
              toast.success("Reset assets to default baseline.");
            }}
            className="h-8 text-xs gap-1"
          >
            <RotateCcwIcon className="size-3" />
            <span>Reset</span>
          </Button>
        </div>
      </div>

      {/* Collapsible Add Asset Form */}
      {showAddForm && (
        <Card className="border-primary/20 bg-muted/10 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Register New Campus Facility Asset</CardTitle>
            <CardDescription className="text-xs">
              Add equipment to the central NIT Rourkela inventory. Drag-and-drop enabled immediately upon creation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAsset} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <Label className="text-xs">Asset Name *</Label>
                  <Input
                    placeholder="e.g. 500kVA Transformer #3"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-8 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Category</Label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as AssetCategory)}
                    className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                  >
                    <option value="energy">Energy & Electrical</option>
                    <option value="water">Water & Plumbing</option>
                    <option value="facility">General Facility</option>
                    <option value="safety">Fire & Safety</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Location / Sector *</Label>
                  <Input
                    placeholder="e.g. CVR Hall - Pump House"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="h-8 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Initial Status</Label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as AssetStatus)}
                    className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                  >
                    <option value="operational">Operational & Online</option>
                    <option value="maintenance">Scheduled Maintenance</option>
                    <option value="repair">Under Active Repair</option>
                    <option value="critical">Critical / Out of Service</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Assigned Technician</Label>
                  <Input
                    placeholder="e.g. Er. Ramesh Mohanty"
                    value={newTech}
                    onChange={(e) => setNewTech(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Telemetry / Maintenance Notes</Label>
                  <Input
                    placeholder="e.g. Oil level nominal, vibration check passed"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="h-8 text-xs">
                  Save Asset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Drag & Drop Kanban Lifecycle Board */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {ASSET_COLUMNS.map((column) => {
          const columnAssets = filteredAssets.filter((a) => a.status === column.id);
          const isOver = dragOverColumn === column.id;

          return (
            <div
              key={column.id}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={(e) => handleDragLeave(e, column.id)}
              onDrop={(e) => handleDrop(e, column.id)}
              className={`flex flex-col rounded-xl border transition-all duration-200 min-h-[500px] ${
                isOver
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "bg-muted/10 border-border"
              }`}
            >
              {/* Column Header */}
              <div className="p-3 border-b flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      {column.title}
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-mono">
                      {columnAssets.length}
                    </Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {column.description}
                  </div>
                </div>
              </div>

              {/* Droppable Card Container */}
              <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                {columnAssets.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/20 text-center p-4">
                    <span className="text-xs text-muted-foreground">Drop assets here</span>
                    <span className="text-[10px] text-muted-foreground/70 mt-0.5">Drag any card to change status</span>
                  </div>
                ) : (
                  columnAssets.map((asset) => {
                    const isDragging = draggingAssetId === asset.id;

                    return (
                      <div
                        key={asset.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, asset.id)}
                        onDragEnd={handleDragEnd}
                        className={`group relative rounded-lg border bg-card p-3 shadow-2xs transition-all cursor-grab active:cursor-grabbing hover:shadow-xs hover:border-primary/40 ${
                          isDragging ? "opacity-40 scale-95" : ""
                        }`}
                      >
                        {/* Header: Tag & Health */}
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <GripVerticalIcon className="size-3 text-muted-foreground opacity-50 group-hover:opacity-100" />
                            <span className="font-mono text-[10px] font-semibold text-primary truncate">
                              {asset.tag}
                            </span>
                          </div>
                          <Badge
                            variant={
                              asset.healthScore >= 85
                                ? "outline"
                                : asset.healthScore >= 60
                                ? "secondary"
                                : "destructive"
                            }
                            className="text-[10px] font-mono px-1.5 py-0 h-4"
                          >
                            {asset.healthScore}% HP
                          </Badge>
                        </div>

                        {/* Title */}
                        <div className="mt-1.5 text-xs font-semibold text-foreground leading-snug">
                          {asset.name}
                        </div>

                        {/* Location */}
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <MapPinIcon className="size-3 text-muted-foreground/80 shrink-0" />
                          <span className="truncate">{asset.location}</span>
                        </div>

                        {/* Telemetry / Notes snippet */}
                        {asset.notes && (
                          <div className="mt-2 text-[10.5px] text-muted-foreground bg-muted/30 rounded p-1.5 line-clamp-2 leading-relaxed">
                            {asset.notes}
                          </div>
                        )}

                        {/* Footer: Technician & Category */}
                        <div className="mt-2.5 pt-2 border-t flex items-center justify-between text-[10px] text-muted-foreground">
                          <div className="flex items-center gap-1 truncate max-w-[140px]">
                            {getCategoryIcon(asset.category)}
                            <span className="truncate">{asset.assignedTechnician || "Unassigned"}</span>
                          </div>
                          <div className="font-mono text-[9.5px]">
                            {asset.installedYear}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
