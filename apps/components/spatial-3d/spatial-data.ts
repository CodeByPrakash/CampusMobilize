/**
 * CampusIQ 3D Spatial Twin — Asset & Work Step Data Definitions
 * Includes multi-spectrum telemetry (Standard, X-Ray, Thermal FLIR, Night Sensor)
 */

export type ViewSpectrum = "standard" | "xray" | "heat" | "night";

export type AssetCategory = "hostel" | "streetlight" | "power" | "water" | "solar";

export interface TelemetryReading {
  temperatureC: number;
  voltageV?: number;
  currentA?: number;
  luxLevel?: number;
  pressureBar?: number;
  vibrationMmS?: number;
  efficiencyPercent?: number;
}

export interface SpatialAsset {
  id: string;
  name: string;
  code: string;
  category: AssetCategory;
  categoryLabel: string;
  location: string;
  position: [number, number, number]; // [x, y, z] in 3D scene
  dimensions: [number, number, number]; // [width, height, depth]
  status: "ACTIVE_WORK" | "NORMAL" | "SCHEDULED_AUDIT" | "ANOMALY";
  statusLabel: string;
  workDescription?: string;
  assignedContractor?: string;
  ticketNo?: string;
  slaDeadline?: string;
  telemetry: TelemetryReading;
  internalComponents: {
    conduits: string[];
    piping: string[];
    structuralType: string;
  };
  thermalProfile: {
    baseTempC: number;
    hotspotTempC: number;
    flirSeverity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    hotspotLocation: string;
  };
}

export interface WorkStep {
  stepNumber: number;
  phaseId: string;
  title: string;
  subtitle: string;
  durationEst: string;
  focusAssetId: string;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  description: string;
  safetyCheck: string;
  activeTrade: string;
  statusBadge: string;
  milestoneMetric: string;
}

export const SPATIAL_ASSETS: SpatialAsset[] = [
  {
    id: "asset-hb3",
    name: "Homi Bhabha Hall (HB-3)",
    code: "HB-3",
    category: "hostel",
    categoryLabel: "Residential Hall",
    location: "North Campus Sector 2",
    position: [-22, 6, -18],
    dimensions: [24, 12, 16],
    status: "ACTIVE_WORK",
    statusLabel: "Active Civil & Electrical Work",
    workDescription: "Wing B 2nd floor conduit rewiring, geyser line replacement & exterior facade scaffolding audit",
    assignedContractor: "Suresh Babu & Works Team",
    ticketNo: "CIQ-2026-90002",
    slaDeadline: "Today, 18:30 IST",
    telemetry: {
      temperatureC: 38.4,
      voltageV: 231,
      currentA: 42.8,
      vibrationMmS: 1.2,
      pressureBar: 3.1,
    },
    internalComponents: {
      conduits: ["415V Main Sub-Feeder", "Corridor Wiring Riser B-2", "Emergency LED Bus"],
      piping: ["32mm CPVC Hot Water Header", "50mm GI Cold Water Line", "Greywater Soil Stack"],
      structuralType: "RCC Frame with Post-Tensioned Beams",
    },
    thermalProfile: {
      baseTempC: 28.2,
      hotspotTempC: 84.6,
      flirSeverity: "HIGH",
      hotspotLocation: "Wing B Distribution Board Junction #4",
    },
  },
  {
    id: "asset-cvr",
    name: "CV Raman Hall (CVR)",
    code: "CVR",
    category: "hostel",
    categoryLabel: "Residential Hall",
    location: "Central Campus Quad",
    position: [24, 5.5, -20],
    dimensions: [22, 11, 14],
    status: "NORMAL",
    statusLabel: "Operational (Normal)",
    workDescription: "Routine monthly inspection completed. Airflow balance verified.",
    assignedContractor: "Facilities Maintenance Cell",
    ticketNo: "CIQ-2026-00088",
    slaDeadline: "Cleared",
    telemetry: {
      temperatureC: 27.1,
      voltageV: 234,
      currentA: 31.4,
      pressureBar: 3.4,
    },
    internalComponents: {
      conduits: ["Standard 230V Single Phase Feeder"],
      piping: ["25mm PPR Supply Line"],
      structuralType: "Brick Infill RCC",
    },
    thermalProfile: {
      baseTempC: 26.8,
      hotspotTempC: 32.1,
      flirSeverity: "LOW",
      hotspotLocation: "Roof Solar Water Collector Inlet",
    },
  },
  {
    id: "asset-substation",
    name: "Primary 11kV Substation & Transformers",
    code: "SUB-01",
    category: "power",
    categoryLabel: "High-Voltage Grid",
    location: "East Utility Yard",
    position: [32, 3.5, 12],
    dimensions: [12, 7, 10],
    status: "ACTIVE_WORK",
    statusLabel: "Transformer T-2 Thermal Anomaly",
    workDescription: "Oil cooling radiator flush & bushing contact impedance test on Transformer 2",
    assignedContractor: "State Electricity Board (TPWODL) Special Unit",
    ticketNo: "CIQ-2026-90001",
    slaDeadline: "Critical P1 (2h Remaining)",
    telemetry: {
      temperatureC: 89.2,
      voltageV: 11000,
      currentA: 185.0,
      vibrationMmS: 4.8,
    },
    internalComponents: {
      conduits: ["11kV XLPE Underground Cable", "Low-Loss Copper Bus Duct", "SCADA Telemetry Fiber"],
      piping: ["Transformer Oil Cooling Loop", "Nitrogen Fire Suppression Header"],
      structuralType: "Explosion-Resistant Reinforced Vault",
    },
    thermalProfile: {
      baseTempC: 44.0,
      hotspotTempC: 96.8,
      flirSeverity: "CRITICAL",
      hotspotLocation: "Transformer T-2 High-Voltage Secondary Bushing",
    },
  },
  {
    id: "asset-sl-04",
    name: "Smart Streetlight SL-04 (Hostel Ave)",
    code: "SL-04",
    category: "streetlight",
    categoryLabel: "Smart Luminaire",
    location: "Avenue 3 opposite HB-3 Gate",
    position: [-10, 4, -4],
    dimensions: [1.2, 8, 1.2],
    status: "ACTIVE_WORK",
    statusLabel: "Bulb Outage & Driver Replacement",
    workDescription: "Driver PCB failed during voltage transient; replacing with 120W IP66 Surge-Protected LED unit",
    assignedContractor: "Campus Electrical Wing (R. Das)",
    ticketNo: "CIQ-2026-90004",
    slaDeadline: "Today, 17:00 IST",
    telemetry: {
      temperatureC: 62.5,
      voltageV: 184,
      currentA: 0.1,
      luxLevel: 4, // Faulty, expected 65
    },
    internalComponents: {
      conduits: ["Underground Armoured 3-Core Cable", "Zigbee Smart Mesh Node"],
      piping: [],
      structuralType: "Galvanized Octagonal Pole 8m",
    },
    thermalProfile: {
      baseTempC: 31.0,
      hotspotTempC: 78.4,
      flirSeverity: "MEDIUM",
      hotspotLocation: "Internal Constant-Current Driver Box",
    },
  },
  {
    id: "asset-sl-01",
    name: "Smart Streetlight SL-01 (Main Gateway)",
    code: "SL-01",
    category: "streetlight",
    categoryLabel: "Smart Luminaire",
    location: "North Avenue Entry",
    position: [-28, 4, 18],
    dimensions: [1.2, 8, 1.2],
    status: "NORMAL",
    statusLabel: "Operational (Auto-Dimming)",
    workDescription: "Operating under automated astronomical twilight curve.",
    assignedContractor: "Automated Sensor Mesh",
    telemetry: {
      temperatureC: 34.0,
      voltageV: 232,
      currentA: 0.52,
      luxLevel: 68,
    },
    internalComponents: {
      conduits: ["Underground Armoured Cable", "LoRaWAN Gateway Link"],
      piping: [],
      structuralType: "Galvanized Octagonal Pole 8m",
    },
    thermalProfile: {
      baseTempC: 28.0,
      hotspotTempC: 42.0,
      flirSeverity: "LOW",
      hotspotLocation: "Luminaire Fin Array",
    },
  },
  {
    id: "asset-sl-02",
    name: "Smart Streetlight SL-02 (Central Spine)",
    code: "SL-02",
    category: "streetlight",
    categoryLabel: "Smart Luminaire",
    location: "Mid-Campus Boulevard",
    position: [0, 4, 18],
    dimensions: [1.2, 8, 1.2],
    status: "NORMAL",
    statusLabel: "Operational",
    workDescription: "Active light sensing; photocell calibrated.",
    assignedContractor: "Automated Sensor Mesh",
    telemetry: {
      temperatureC: 33.2,
      voltageV: 230,
      currentA: 0.51,
      luxLevel: 65,
    },
    internalComponents: {
      conduits: ["Underground Armoured Cable"],
      piping: [],
      structuralType: "Galvanized Octagonal Pole 8m",
    },
    thermalProfile: {
      baseTempC: 27.5,
      hotspotTempC: 40.5,
      flirSeverity: "LOW",
      hotspotLocation: "LED Heat Spreader",
    },
  },
  {
    id: "asset-water-tower",
    name: "Central Overhead Reservoir & Hydro-Pneumatic Station",
    code: "WTR-01",
    category: "water",
    categoryLabel: "Water Distribution",
    location: "South-West Hilltop Basin",
    position: [-26, 9, 20],
    dimensions: [10, 18, 10],
    status: "NORMAL",
    statusLabel: "Operational (4.2 Bar)",
    workDescription: "Ultrasonic level sensor active; UV filtration cycle running.",
    assignedContractor: "Public Health Engineering Team",
    ticketNo: "WTR-AUD-2026",
    slaDeadline: "Audit Pass",
    telemetry: {
      temperatureC: 21.8,
      pressureBar: 4.2,
      voltageV: 415,
      currentA: 18.2,
      vibrationMmS: 0.8,
    },
    internalComponents: {
      conduits: ["415V 3-Phase Pump Supply"],
      piping: ["150mm Ductile Iron Rising Main", "200mm Gravity Feeder Ring"],
      structuralType: "Intze Elevated Concrete Reservoir 2.5L Litres",
    },
    thermalProfile: {
      baseTempC: 21.2,
      hotspotTempC: 26.5,
      flirSeverity: "LOW",
      hotspotLocation: "Pump Bearing Housing #2",
    },
  },
  {
    id: "asset-solar-array",
    name: "Rooftop Solar PV Microgrid (120 kWp)",
    code: "SOL-03",
    category: "solar",
    categoryLabel: "Renewable Generation",
    location: "HB-3 & Academic Terrace",
    position: [-22, 13.2, -18],
    dimensions: [20, 1.2, 12],
    status: "NORMAL",
    statusLabel: "Generating 84.2 kW Clean Power",
    workDescription: "Inverters synced with campus 415V bus. Micro-inverter MPPT optimal.",
    assignedContractor: "CleanTech Renewable Asset Management",
    telemetry: {
      temperatureC: 56.4,
      voltageV: 620,
      currentA: 135.8,
      efficiencyPercent: 93.4,
    },
    internalComponents: {
      conduits: ["1000V DC String Cabling", "RS-485 Modbus Inverter Bus"],
      piping: [],
      structuralType: "Anodized Aluminum Dual-Tilt Mounting Racks",
    },
    thermalProfile: {
      baseTempC: 45.0,
      hotspotTempC: 62.0,
      flirSeverity: "LOW",
      hotspotLocation: "Array Junction Box Bypass Diode",
    },
  },
];

export const WORK_STEPS: WorkStep[] = [
  {
    stepNumber: 1,
    phaseId: "TRIAGE",
    title: "1. AI Triage & Fault Isolation",
    subtitle: "Automated telemetry flags anomalies across HB-3, Substation & Streetlights",
    durationEst: "Day 0 — 00:00 to 01:30",
    focusAssetId: "asset-hb3",
    cameraPosition: [-12, 18, 12],
    cameraTarget: [-22, 6, -18],
    description:
      "IoT vibration and thermal edge nodes detect resistance spike at HB-3 Wing B and 89°C hotspot at Transformer T-2. Streetlight SL-04 communicates zero optical lux return. AI classification engine prioritizes P1 emergency ticket.",
    safetyCheck: "Automatic Breaker Trip Verification: Completed remotely via SCADA.",
    activeTrade: "Central Facility Control Room",
    statusBadge: "Critical Alert Triaged",
    milestoneMetric: "3 Nodes Flagged",
  },
  {
    stepNumber: 2,
    phaseId: "STAGING",
    title: "2. Safety Perimeter & Scaffold Staging",
    subtitle: "LOTO procedures, structural scaffolding & material kits positioned on-site",
    durationEst: "Day 1 — 07:00 to 11:30",
    focusAssetId: "asset-hb3",
    cameraPosition: [-28, 12, -4],
    cameraTarget: [-22, 8, -18],
    description:
      "Civil contractors erect 3-tier tubular steel scaffolding along HB-3 Wing B exterior facade. Amber safety netting and perimeter physical barricades deployed. Replacement 120W LED driver kit and XLPE conduit reels delivered to site.",
    safetyCheck: "Lockout/Tagout (LOTO) Padlock Verified on Panel DP-02.",
    activeTrade: "Scaffolding & Rigging Team",
    statusBadge: "Perimeter Secured",
    milestoneMetric: "Scaffolding Level 3 Up",
  },
  {
    stepNumber: 3,
    phaseId: "ACTIVE_WORK",
    title: "3. Active Conduit Pull & Component Retrofit",
    subtitle: "High-voltage cable pull, plumbing sleeve jointing & luminaire driver replacement",
    durationEst: "Day 2 — 09:00 to 16:30",
    focusAssetId: "asset-sl-04",
    cameraPosition: [-4, 9, 8],
    cameraTarget: [-10, 4, -4],
    description:
      "Electricians fish fire-retardant low-smoke copper conduits through HB-3 concrete risers. Hydraulic bucket truck elevates technician to replace fried driver on Streetlight SL-04. Substation team drains dielectric fluid sample from Transformer T-2.",
    safetyCheck: "1000V Insulated Tools & ARC Flash Suits Worn.",
    activeTrade: "Certified Electricians & Tradesmen",
    statusBadge: "In Progress (68% Done)",
    milestoneMetric: "42m Cable Pulled",
  },
  {
    stepNumber: 4,
    phaseId: "THERMAL_AUDIT",
    title: "4. Multi-Spectrum & Pressure Quality Audit",
    subtitle: "Infrared thermal scan (FLIR) & 6-bar hydrostatic pressure testing",
    durationEst: "Day 3 — 10:00 to 13:00",
    focusAssetId: "asset-substation",
    cameraPosition: [26, 11, 24],
    cameraTarget: [32, 3.5, 12],
    description:
      "Calibrated thermographic camera scans distribution panels and transformer bushings: core temp stabilized to 41.2°C (safe band). Hydrostatic pump pressurizes replacement water pipe at 6 bar for 60 minutes with 0.00 bar drop recorded.",
    safetyCheck: "Thermal Delta < 15°C across phase busbars confirmed.",
    activeTrade: "Quality Assurance & Estate Inspector",
    statusBadge: "Inspection Passed",
    milestoneMetric: "FLIR Clean (0 Hotspots)",
  },
  {
    stepNumber: 5,
    phaseId: "COMMISSIONED",
    title: "5. Operational Commissioning & Twin Sync",
    subtitle: "Power restored, smart lux calibrated & SLA tickets closed with immutable audit log",
    durationEst: "Day 3 — 15:00 Final",
    focusAssetId: "asset-hb3",
    cameraPosition: [0, 26, 32],
    cameraTarget: [0, 4, 0],
    description:
      "Normal utility feeds re-energized. Streetlight SL-04 returns 65 lux baseline reading on telemetry dashboard. Resident satisfaction confirmation received from student representative. Maintenance ticket closed under SLA deadline.",
    safetyCheck: "Full Interlock Tests Passed. All permits formally signed off.",
    activeTrade: "Estate Officer & Chief Warden Sign-off",
    statusBadge: "System Fully Commissioned",
    milestoneMetric: "100% Operational",
  },
];
