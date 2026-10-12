"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  XIcon,
  MapPinIcon,
  LayersIcon,
  Maximize2Icon,
  CompassIcon,
  ExternalLinkIcon,
  Building2Icon,
  UsersIcon,
  DoorOpenIcon,
  NavigationIcon,
  ShieldCheckIcon,
  SatelliteIcon,
  MapIcon,
} from "lucide-react";
import { toast } from "sonner";

export interface HallMapData {
  code: string;
  name: string;
  type: string;
  resident_count: number;
  lat: number;
  lng: number;
  wardenName?: string;
  blocks?: { name: string; rooms?: any[] }[];
}

export const CAMPUS_HALLS_COORDINATES: Record<string, { lat: number; lng: number; warden: string; description: string }> = {
  "HB-3": {
    lat: 22.2545,
    lng: 84.8982,
    warden: "Dr. S. Nanda",
    description: "Hall of Residence 14 · Main Senior & Postgraduate Complex",
  },
  "HB-1": {
    lat: 22.2568,
    lng: 84.8995,
    warden: "Prof. S. Mohapatra",
    description: "K.M.S. Hall of Residence · North Wing Residential Block",
  },
  "HB-2": {
    lat: 22.2562,
    lng: 84.8980,
    warden: "Dr. P. K. Ray",
    description: "Hall of Residence 2 (MV Hall) · Northwest Quadrangle",
  },
  "HB-4": {
    lat: 22.2552,
    lng: 84.9002,
    warden: "Dr. B. C. Panda",
    description: "Hall of Residence 4 (DBA Hall) · East Perimeter Block",
  },
};

interface HallSatelliteModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedHall: HallMapData | null;
  allHalls: HallMapData[];
  onSelectHall?: (hall: HallMapData) => void;
}

export function HallSatelliteModal({
  isOpen,
  onClose,
  selectedHall,
  allHalls,
  onSelectHall,
}: HallSatelliteModalProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<any>(null);
  const markersRef = React.useRef<Record<string, any>>({});
  const activeTileLayerRef = React.useRef<any>(null);
  const labelsLayerRef = React.useRef<any>(null);

  const [activeHall, setActiveHall] = React.useState<HallMapData | null>(selectedHall);
  const [mapType, setMapType] = React.useState<"satellite" | "hybrid" | "osm">("satellite");
  const [isMapReady, setIsMapReady] = React.useState(false);

  // Sync active hall when prop changes
  React.useEffect(() => {
    if (selectedHall) {
      setActiveHall(selectedHall);
    } else if (allHalls.length > 0) {
      setActiveHall(allHalls[0]);
    }
  }, [selectedHall, allHalls]);

  // Coordinates resolution
  const getCoordinates = React.useCallback((hall: HallMapData) => {
    if (hall.lat && hall.lng) return { lat: hall.lat, lng: hall.lng };
    const found = CAMPUS_HALLS_COORDINATES[hall.code];
    if (found) return { lat: found.lat, lng: found.lng };
    return { lat: 22.2545, lng: 84.8982 };
  }, []);

  // Initialize Leaflet Map
  React.useEffect(() => {
    if (!isOpen) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current = {};
        activeTileLayerRef.current = null;
        labelsLayerRef.current = null;
        setIsMapReady(false);
      }
      return;
    }

    let isCancelled = false;

    async function setupMap() {
      if (!mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      try {
        // Dynamically import Leaflet and inject CSS
        const L = (await import("leaflet")).default;
        await import("leaflet/dist/leaflet.css");

        if (isCancelled || !mapContainerRef.current) return;

        const initialCoords = activeHall ? getCoordinates(activeHall) : { lat: 22.2555, lng: 84.8990 };

        const map = L.map(mapContainerRef.current, {
          center: [initialCoords.lat, initialCoords.lng],
          zoom: 17,
          zoomControl: false,
          maxZoom: 19,
          minZoom: 14,
        });

        // Add custom zoom control top-right
        L.control.zoom({ position: "topright" }).addTo(map);

        // Satellite Tile Layer (Esri World Imagery)
        const satLayer = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          {
            maxZoom: 19,
            attribution: 'Tiles &copy; Esri &mdash; OpenStreetMap &copy; contributors',
          }
        );

        satLayer.addTo(map);
        activeTileLayerRef.current = satLayer;

        // Custom DivIcons for each hall
        const markers: Record<string, any> = {};

        allHalls.forEach((hall) => {
          const coords = getCoordinates(hall);
          const isSelected = activeHall?.code === hall.code;

          const iconHtml = `
            <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-300 hover:scale-110">
              ${
                isSelected
                  ? '<div class="absolute -inset-3 rounded-full bg-indigo-500/30 animate-ping"></div><div class="absolute -inset-2 rounded-full bg-indigo-500/40"></div>'
                  : ""
              }
              <div class="relative flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-xl border ${
                isSelected
                  ? "bg-indigo-600 text-white border-white ring-2 ring-indigo-400"
                  : "bg-slate-900/90 text-white border-slate-700 hover:bg-slate-800"
              }">
                <svg class="size-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <span class="text-[11px] font-bold font-mono tracking-tight">${hall.code}</span>
              </div>
            </div>
          `;

          const customIcon = L.divIcon({
            html: iconHtml,
            className: "custom-hall-pin",
            iconSize: [40, 40],
            iconAnchor: [20, 20],
          });

          const marker = L.marker([coords.lat, coords.lng], { icon: customIcon }).addTo(map);

          marker.on("click", () => {
            setActiveHall(hall);
            if (onSelectHall) onSelectHall(hall);
            map.flyTo([coords.lat, coords.lng], 18, { duration: 1.2 });
          });

          markers[hall.code] = marker;
        });

        markersRef.current = markers;
        mapInstanceRef.current = map;
        setIsMapReady(true);

        // Invalidate size to ensure clean render inside modal
        setTimeout(() => {
          map.invalidateSize();
        }, 150);
      } catch (err) {
        console.error("Leaflet initialization notice:", err);
      }
    }

    setupMap();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, allHalls, getCoordinates, onSelectHall]);

  // Update Map Position & Marker Highlights when Active Hall changes
  React.useEffect(() => {
    if (!mapInstanceRef.current || !activeHall) return;

    const coords = getCoordinates(activeHall);
    mapInstanceRef.current.flyTo([coords.lat, coords.lng], 18, { duration: 1.0 });

    // Update markers HTML to reflect selected state
    import("leaflet").then(({ default: L }) => {
      allHalls.forEach((hall) => {
        const marker = markersRef.current[hall.code];
        if (!marker) return;

        const isSelected = activeHall.code === hall.code;
        const iconHtml = `
          <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-300 hover:scale-110">
            ${
              isSelected
                ? '<div class="absolute -inset-3 rounded-full bg-indigo-500/30 animate-ping"></div><div class="absolute -inset-2 rounded-full bg-indigo-500/40"></div>'
                : ""
            }
            <div class="relative flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-xl border ${
              isSelected
                ? "bg-indigo-600 text-white border-white ring-2 ring-indigo-400"
                : "bg-slate-900/90 text-white border-slate-700 hover:bg-slate-800"
            }">
              <svg class="size-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span class="text-[11px] font-bold font-mono tracking-tight">${hall.code}</span>
            </div>
          </div>
        `;

        marker.setIcon(
          L.divIcon({
            html: iconHtml,
            className: "custom-hall-pin",
            iconSize: [40, 40],
            iconAnchor: [20, 20],
          })
        );
      });
    });
  }, [activeHall, allHalls, getCoordinates]);

  // Switch Tile Layer: Satellite / Hybrid / OSM
  const handleTileLayerSwitch = async (type: "satellite" | "hybrid" | "osm") => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const L = (await import("leaflet")).default;

    // Remove current tile layer
    if (activeTileLayerRef.current) {
      map.removeLayer(activeTileLayerRef.current);
    }
    if (labelsLayerRef.current) {
      map.removeLayer(labelsLayerRef.current);
      labelsLayerRef.current = null;
    }

    if (type === "satellite") {
      const satLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 19,
          attribution: 'Tiles &copy; Esri &mdash; OpenStreetMap &copy; contributors',
        }
      );
      satLayer.addTo(map);
      activeTileLayerRef.current = satLayer;
    } else if (type === "hybrid") {
      const satLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 19,
          attribution: 'Tiles &copy; Esri',
        }
      );
      const labelsLayer = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png",
        {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors, &copy; CARTO',
        }
      );
      satLayer.addTo(map);
      labelsLayer.addTo(map);
      activeTileLayerRef.current = satLayer;
      labelsLayerRef.current = labelsLayer;
    } else {
      // Standard OpenStreetMap
      const osmLayer = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }
      );
      osmLayer.addTo(map);
      activeTileLayerRef.current = osmLayer;
    }

    setMapType(type);
    toast.success(`Switched map layer to ${type === "satellite" ? "Satellite View" : type === "hybrid" ? "Hybrid Satellite" : "OpenStreetMap Standard"}`);
  };

  const handleCenterAll = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([22.2555, 84.8990], 16, { duration: 1.0 });
  };

  if (!isOpen) return null;

  const currentCoords = activeHall ? getCoordinates(activeHall) : { lat: 22.2545, lng: 84.8982 };
  const osmUrl = `https://www.openstreetmap.org/?mlat=${currentCoords.lat}&mlon=${currentCoords.lng}#map=18/${currentCoords.lat}/${currentCoords.lng}`;
  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${currentCoords.lat},${currentCoords.lng}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2 sm:p-4 md:p-6 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl h-[92vh] flex flex-col rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden text-slate-100">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-inner">
              <SatelliteIcon className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  {activeHall?.name || "Campus Residential Complex"}
                </h2>
                <Badge className="bg-indigo-600 text-white font-mono text-[11px] px-2 py-0.5">
                  {activeHall?.code || "NITR"}
                </Badge>
                <Badge variant="outline" className="text-[11px] text-slate-300 border-slate-700">
                  {activeHall?.type || "RESIDENTIAL"}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <MapPinIcon className="size-3 text-indigo-400" />
                <span>OpenStreetMap Satellite Topography · NIT Rourkela Campus</span>
                <span className="text-slate-600">|</span>
                <span className="font-mono text-slate-300">
                  {currentCoords.lat.toFixed(4)}° N, {currentCoords.lng.toFixed(4)}° E
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* External Links */}
            <a
              href={osmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white transition-colors"
            >
              <MapIcon className="size-3.5 text-emerald-400" />
              <span>OpenStreetMap</span>
              <ExternalLinkIcon className="size-3 text-slate-400" />
            </a>

            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="size-8 p-0 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <XIcon className="size-4" />
            </Button>
          </div>
        </div>

        {/* Main Content: Map Container + Floating Sidebar Info */}
        <div className="relative flex-1 w-full h-full bg-slate-950 overflow-hidden">
          
          {/* Leaflet Map Target */}
          <div ref={mapContainerRef} className="absolute inset-0 z-0 w-full h-full" />

          {/* Top Floating Controls Bar */}
          <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 bg-slate-900/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2">
              Layer:
            </span>
            <Button
              size="sm"
              variant={mapType === "satellite" ? "default" : "ghost"}
              onClick={() => handleTileLayerSwitch("satellite")}
              className={`h-7 text-xs px-2.5 rounded-lg transition-all ${
                mapType === "satellite"
                  ? "bg-indigo-600 text-white shadow-md font-semibold"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <SatelliteIcon className="size-3 mr-1" />
              Satellite View
            </Button>

            <Button
              size="sm"
              variant={mapType === "hybrid" ? "default" : "ghost"}
              onClick={() => handleTileLayerSwitch("hybrid")}
              className={`h-7 text-xs px-2.5 rounded-lg transition-all ${
                mapType === "hybrid"
                  ? "bg-indigo-600 text-white shadow-md font-semibold"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <LayersIcon className="size-3 mr-1" />
              Satellite + Labels
            </Button>

            <Button
              size="sm"
              variant={mapType === "osm" ? "default" : "ghost"}
              onClick={() => handleTileLayerSwitch("osm")}
              className={`h-7 text-xs px-2.5 rounded-lg transition-all ${
                mapType === "osm"
                  ? "bg-indigo-600 text-white shadow-md font-semibold"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <MapIcon className="size-3 mr-1" />
              Street Map
            </Button>

            <div className="h-4 w-px bg-slate-700 mx-1" />

            <Button
              size="sm"
              variant="ghost"
              onClick={handleCenterAll}
              className="h-7 text-xs px-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <Maximize2Icon className="size-3 mr-1" />
              Campus View
            </Button>
          </div>

          {/* Quick Hall Selector Chips */}
          <div className="absolute bottom-4 left-4 z-20 flex flex-wrap items-center gap-2 bg-slate-900/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl max-w-[calc(100%-2rem)] md:max-w-xl">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2">
              Select Hall:
            </span>
            {allHalls.map((h) => {
              const isSelected = activeHall?.code === h.code;
              return (
                <button
                  key={h.code}
                  onClick={() => {
                    setActiveHall(h);
                    if (onSelectHall) onSelectHall(h);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-md font-semibold ring-1 ring-indigo-400"
                      : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60"
                  }`}
                >
                  <span className="font-mono font-bold">{h.code}</span>
                  <span className="truncate max-w-[100px] sm:max-w-none">{h.name.replace(/Hall of Residence\s*/i, "Hall ")}</span>
                </button>
              );
            })}
          </div>

          {/* Floating Infrastructure Information Card */}
          {activeHall && (
            <div className="absolute top-16 right-4 z-20 w-80 max-w-[calc(100%-2rem)] bg-slate-900/90 backdrop-blur-md p-4 rounded-xl border border-slate-800 shadow-2xl space-y-3.5">
              <div className="flex items-start justify-between border-b border-slate-800 pb-2.5">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-indigo-400 font-bold">
                    Institutional Profile
                  </div>
                  <h3 className="text-sm font-bold text-white mt-0.5">
                    {activeHall.name}
                  </h3>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                  Online Telemetry
                </Badge>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800">
                  <div className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <UsersIcon className="size-3 text-indigo-400" />
                    Capacity
                  </div>
                  <div className="text-sm font-bold text-white font-mono mt-0.5">
                    {activeHall.resident_count || 850}
                  </div>
                  <div className="text-[10px] text-slate-500">Students residing</div>
                </div>

                <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800">
                  <div className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <ShieldCheckIcon className="size-3 text-emerald-400" />
                    Warden
                  </div>
                  <div className="text-xs font-semibold text-white truncate mt-0.5" title={CAMPUS_HALLS_COORDINATES[activeHall.code]?.warden || "Faculty Warden"}>
                    {CAMPUS_HALLS_COORDINATES[activeHall.code]?.warden || "Dr. S. Nanda"}
                  </div>
                  <div className="text-[10px] text-slate-500">Chief Hall Council</div>
                </div>
              </div>

              {/* Wing / Block Topology */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <DoorOpenIcon className="size-3 text-slate-400" />
                  Wings & Block Footprints:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeHall.blocks && activeHall.blocks.length > 0 ? (
                    activeHall.blocks.map((b, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-slate-800/80 px-2 py-0.5 text-[11px] font-medium text-slate-300 border border-slate-700/60"
                      >
                        {b.name} ({b.rooms?.length || 40} rms)
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-500">
                      Standard multi-story wing layout
                    </span>
                  )}
                </div>
              </div>

              {/* Coordinates & Compass */}
              <div className="rounded-lg bg-slate-950/80 p-2.5 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center justify-between text-slate-300 font-mono">
                  <span>LAT: {currentCoords.lat.toFixed(5)}</span>
                  <span>LNG: {currentCoords.lng.toFixed(5)}</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Accurate WGS84 Geolocation for NIT Rourkela Drone & Sensor Telemetry
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
