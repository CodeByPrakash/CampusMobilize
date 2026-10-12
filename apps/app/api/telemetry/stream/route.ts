import { NextResponse } from "next/server";

export interface SensorTelemetryItem {
  id: string;
  name: string;
  zone: string;
  category: "air_quality" | "waste" | "energy" | "water" | "traffic" | "equipment" | "safety" | "sustainability";
  value: number;
  unit: string;
  status: "NORMAL" | "WARNING" | "ANOMALY";
  trend: "RISING" | "FALLING" | "STABLE";
  timestamp: string;
  predicted6h: number;
  predicted24h: number;
  thresholdMax?: number;
  anomalyScore?: number;
  notes?: string;
}

export interface AnomalyItem {
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

export interface RecommendationItem {
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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") || "live"; // live | synthetic | open_data

  // Base multiplier based on mode
  const isSyntheticSurge = mode === "synthetic";

  const telemetry: SensorTelemetryItem[] = [
    // 1. Air Quality Sensors
    {
      id: "aqi-gate1",
      name: "Main Gate Ambient AQI",
      zone: "Main Gate Ingress",
      category: "air_quality",
      value: isSyntheticSurge ? 168 : 84,
      unit: "AQI",
      status: isSyntheticSurge ? "WARNING" : "NORMAL",
      trend: isSyntheticSurge ? "RISING" : "STABLE",
      timestamp: "Just now",
      predicted6h: isSyntheticSurge ? 195 : 92,
      predicted24h: isSyntheticSurge ? 210 : 88,
      thresholdMax: 100,
      anomalyScore: isSyntheticSurge ? 0.78 : 0.12,
      notes: "PM2.5: 38 µg/m³ | PM10: 68 µg/m³ | Sensor: Plantower PMS5003",
    },
    {
      id: "aqi-acad",
      name: "Lecture Hall Complex AQI",
      zone: "Academic Sector A",
      category: "air_quality",
      value: 62,
      unit: "AQI",
      status: "NORMAL",
      trend: "STABLE",
      timestamp: "Just now",
      predicted6h: 68,
      predicted24h: 64,
      thresholdMax: 100,
      anomalyScore: 0.08,
      notes: "CO2: 440 ppm | Optimal ventilation in central atrium",
    },
    {
      id: "aqi-workshop",
      name: "Central Workshop Exhaust Air",
      zone: "Industrial Complex",
      category: "air_quality",
      value: isSyntheticSurge ? 210 : 132,
      unit: "AQI",
      status: "WARNING",
      trend: "RISING",
      timestamp: "Just now",
      predicted6h: 145,
      predicted24h: 120,
      thresholdMax: 150,
      anomalyScore: 0.65,
      notes: "VOC sensor detected slight paint booth filter degradation",
    },

    // 2. Waste Bin Overflow Sensors (Ultrasonic)
    {
      id: "bin-h14-mess",
      name: "Hall 14 Mess Waste Hub",
      zone: "Hall 14 (HB-3 / HB-14)",
      category: "waste",
      value: isSyntheticSurge ? 96 : 88,
      unit: "% Fill",
      status: "ANOMALY",
      trend: "RISING",
      timestamp: "Just now",
      predicted6h: 100,
      predicted24h: 100,
      thresholdMax: 85,
      anomalyScore: 0.92,
      notes: "Fill rate: +14% / hr. Estimated overflow countdown: 48 mins!",
    },
    {
      id: "bin-sac-quad",
      name: "SAC Food Court Smart Compactor",
      zone: "Student Activity Centre",
      category: "waste",
      value: isSyntheticSurge ? 92 : 74,
      unit: "% Fill",
      status: isSyntheticSurge ? "ANOMALY" : "NORMAL",
      trend: "RISING",
      timestamp: "Just now",
      predicted6h: 88,
      predicted24h: 94,
      thresholdMax: 85,
      anomalyScore: 0.44,
      notes: "Solar compaction cycle active; capacity extension +3 hours",
    },
    {
      id: "bin-lib",
      name: "Biju Patnaik Central Library Quad",
      zone: "Library Quadrangle",
      category: "waste",
      value: 41,
      unit: "% Fill",
      status: "NORMAL",
      trend: "STABLE",
      timestamp: "Just now",
      predicted6h: 46,
      predicted24h: 60,
      thresholdMax: 85,
      anomalyScore: 0.05,
      notes: "Dry paper & recyclable segregated load normal",
    },

    // 3. Energy Usage Optimization (Smart Meters)
    {
      id: "energy-sub1",
      name: "Substation 1 Main Feeder Draw",
      zone: "North Campus Grid",
      category: "energy",
      value: isSyntheticSurge ? 1840 : 1240,
      unit: "kW",
      status: isSyntheticSurge ? "WARNING" : "NORMAL",
      trend: isSyntheticSurge ? "RISING" : "STABLE",
      timestamp: "Just now",
      predicted6h: isSyntheticSurge ? 2100 : 1310,
      predicted24h: isSyntheticSurge ? 1750 : 1180,
      thresholdMax: 1800,
      anomalyScore: isSyntheticSurge ? 0.84 : 0.22,
      notes: "Power Factor: 0.96 | Peak tariff window 18:00 - 22:00 active",
    },
    {
      id: "energy-solar",
      name: "Rooftop Solar PV Generation",
      zone: "Campus-Wide Solar Array",
      category: "energy",
      value: 485,
      unit: "kW (Clean)",
      status: "NORMAL",
      trend: "STABLE",
      timestamp: "Just now",
      predicted6h: 120,
      predicted24h: 510,
      thresholdMax: 600,
      anomalyScore: 0.02,
      notes: "Solar offsetting 39.1% of daytime academic base load",
    },
    {
      id: "energy-h14",
      name: "Hall 14 Geyser & Power Baseline",
      zone: "Hostel 14 Wing A & B",
      category: "energy",
      value: isSyntheticSurge ? 340 : 218,
      unit: "kW",
      status: "NORMAL",
      trend: "RISING",
      timestamp: "Just now",
      predicted6h: 290,
      predicted24h: 220,
      thresholdMax: 350,
      anomalyScore: 0.18,
      notes: "Smart circuit breakers: 0 nuisance trips in last 24h",
    },

    // 4. Water Use Alerts
    {
      id: "water-main-flow",
      name: "Central Treatment Plant Pump Flow",
      zone: "South Water Works",
      category: "water",
      value: isSyntheticSurge ? 1420 : 1180,
      unit: "L / min",
      status: "NORMAL",
      trend: "STABLE",
      timestamp: "Just now",
      predicted6h: 1250,
      predicted24h: 1100,
      thresholdMax: 1600,
      anomalyScore: 0.15,
      notes: "Overhead Reservoir 1 at 88% capacity | Water quality TDS: 82 PPM",
    },
    {
      id: "water-cvr-leak",
      name: "CVR Hall Vertical Riser Acoustic Sensor",
      zone: "CVR Hall East Wing",
      category: "water",
      value: 14.2,
      unit: "L/min (Loss)",
      status: "ANOMALY",
      trend: "RISING",
      timestamp: "Just now",
      predicted6h: 16.5,
      predicted24h: 22.0,
      thresholdMax: 5.0,
      anomalyScore: 0.94,
      notes: "Acoustic micro-vibration detected joint failure on 3rd floor riser",
    },

    // 5. Traffic & Parking Hotspots
    {
      id: "traffic-main-gate",
      name: "Main Gate Vehicular Flow Index",
      zone: "Main Gate Highway Entry",
      category: "traffic",
      value: isSyntheticSurge ? 48 : 22,
      unit: "vehicles / min",
      status: isSyntheticSurge ? "WARNING" : "NORMAL",
      trend: isSyntheticSurge ? "RISING" : "STABLE",
      timestamp: "Just now",
      predicted6h: 38,
      predicted24h: 24,
      thresholdMax: 40,
      anomalyScore: isSyntheticSurge ? 0.72 : 0.18,
      notes: "ANPR cameras: 98.4% recognized institute RFID tags",
    },
    {
      id: "parking-acad-lot",
      name: "Central Academic Parking Bay",
      zone: "Sector 2 Academic Core",
      category: "traffic",
      value: 86,
      unit: "% Occupancy",
      status: "WARNING",
      trend: "RISING",
      timestamp: "Just now",
      predicted6h: 92,
      predicted24h: 40,
      thresholdMax: 85,
      anomalyScore: 0.68,
      notes: "28 / 200 bays available. Overflow redirected to Stadium West lot",
    },

    // 6. Equipment Utilization
    {
      id: "equip-transformer2",
      name: "Transformer #2 Winding Temp",
      zone: "Sector 2 Substation",
      category: "equipment",
      value: isSyntheticSurge ? 78.4 : 68.2,
      unit: "°C",
      status: isSyntheticSurge ? "WARNING" : "NORMAL",
      trend: "RISING",
      timestamp: "Just now",
      predicted6h: isSyntheticSurge ? 82.5 : 71.0,
      predicted24h: 65.0,
      thresholdMax: 75.0,
      anomalyScore: isSyntheticSurge ? 0.81 : 0.32,
      notes: "Forced air oil cooling activated at 68°C; load shift available",
    },
    {
      id: "equip-dg-genset",
      name: "Campus Standby DG 500kVA",
      zone: "Central Power House",
      category: "equipment",
      value: 84,
      unit: "% Fuel Ready",
      status: "NORMAL",
      trend: "STABLE",
      timestamp: "Just now",
      predicted6h: 84,
      predicted24h: 84,
      thresholdMax: 100,
      anomalyScore: 0.04,
      notes: "Auto-synchronizer armed. 0 grid drops in last 48 hours",
    },

    // 7. Safety Incident Trend Monitoring
    {
      id: "safety-hazard-index",
      name: "Campus Risk Index (CRI) Telemetry",
      zone: "Campus-Wide Hazard Index",
      category: "safety",
      value: isSyntheticSurge ? 46.5 : 31.2,
      unit: "CRI (0-100)",
      status: isSyntheticSurge ? "WARNING" : "NORMAL",
      trend: isSyntheticSurge ? "RISING" : "FALLING",
      timestamp: "Just now",
      predicted6h: isSyntheticSurge ? 52.0 : 28.5,
      predicted24h: isSyntheticSurge ? 38.0 : 26.0,
      thresholdMax: 50.0,
      anomalyScore: isSyntheticSurge ? 0.74 : 0.16,
      notes: "Multi-factor risk score aggregating 380 historical tickets",
    },

    // 8. Sustainability Scorecard
    {
      id: "sust-composite",
      name: "Composite Sustainability Index",
      zone: "NIT Rourkela ESG Metric",
      category: "sustainability",
      value: 86.4,
      unit: "/ 100",
      status: "NORMAL",
      trend: "RISING",
      timestamp: "Just now",
      predicted6h: 86.8,
      predicted24h: 87.2,
      thresholdMax: 100,
      anomalyScore: 0.03,
      notes: "Water recovery: 84.2% | Clean energy: 38.4% | Green canopy: 42%",
    },
  ];

  const anomalies: AnomalyItem[] = [
    {
      id: "anom-01",
      sensorId: "bin-h14-mess",
      title: "Hall 14 Mess Waste Bin Imminent Overflow",
      location: "Hall 14 (HB-3 / HB-14) Dining Court",
      domain: "Waste Management",
      severity: "CRITICAL",
      confidence: 0.94,
      deviation: "+310% surge over normal Tuesday rate",
      detectedAt: "8 mins ago",
      explanation: "Post-lunch dining turnover caused ultrasonic bin level to shoot from 48% to 88% in 45 minutes. Compaction threshold reached.",
      predictedConsequence: "Complete spillage across pedestrian corridor in approx. 48 minutes if collection vehicle is delayed.",
    },
    {
      id: "anom-02",
      sensorId: "water-cvr-leak",
      title: "CVR Hall Vertical Riser Acoustic Pipe Slip",
      location: "CVR Hall, East Wing 3rd Floor",
      domain: "Water Distribution",
      severity: "HIGH",
      confidence: 0.92,
      deviation: "Continuous 14.2 L/min loss during zero-use window",
      detectedAt: "24 mins ago",
      explanation: "Acoustic hydrophone frequency signature matches structural pipe crack on vertical galvanized riser.",
      predictedConsequence: "Seepage into ceiling electrical junction box if not isolated within 3 hours. Estimated 850L water wastage.",
    },
    {
      id: "anom-03",
      sensorId: "equip-transformer2",
      title: "Substation #2 Winding Temperature Elevation",
      location: "Sector 2 Electrical Yard",
      domain: "Power & Equipment",
      severity: "MEDIUM",
      confidence: 0.84,
      deviation: "Winding temp 78.4°C (+9.2°C above ambient baseline)",
      detectedAt: "35 mins ago",
      explanation: "Afternoon peak drawing on Feeder 2 coinciding with high solar ambient temperature.",
      predictedConsequence: "Thermal trip risk if load increases beyond 1,850 kW. Accelerated dielectric oil degradation.",
    },
    {
      id: "anom-04",
      sensorId: "parking-acad-lot",
      title: "Academic Core Parking Saturation Bottleneck",
      location: "Sector 2 Academic Core",
      domain: "Traffic & Ingress",
      severity: "WATCHLIST",
      confidence: 0.76,
      deviation: "86% capacity reached 45 mins earlier than usual",
      detectedAt: "18 mins ago",
      explanation: "Simultaneous guest symposium and campus recruiter vehicle arrivals.",
      predictedConsequence: "Queue formation extending to Biju Patnaik highway turnoff by 14:00.",
    },
  ];

  const recommendations: RecommendationItem[] = [
    {
      id: "rec-01",
      title: "Dispatch Secondary Waste Van to Hall 14 Mess",
      domain: "Waste Logistics",
      urgency: "IMMEDIATE",
      targetZone: "Hall 14 Mess & B-Block Perimeter",
      actionText: "Reroute Electric Waste Tug #3 from North Campus to Hall 14 compactor hub for immediate lift.",
      estimatedImpact: "Prevents overflow hazard; preserves dignity score (+1.4 pts); clears 320kg wet waste.",
      whyThisIsNeeded: "Ultrasonic sensor indicates bin will exceed 100% capacity in under 48 minutes due to festival preparation lunch rush.",
      dispatchAction: "Dispatch Waste Truck #3",
    },
    {
      id: "rec-02",
      title: "Isolate CVR Hall 3rd Floor East Valve & Dispatch Plumber",
      domain: "Water Infrastructure",
      urgency: "IMMEDIATE",
      targetZone: "CVR Hall East Wing Riser Valve 3B",
      actionText: "Remotely trigger motorized solenoid valve 3B to stop 14.2 L/min loss and alert Senior Plumber R. Das.",
      estimatedImpact: "Saves ~850 L water per hour; prevents electrical short-circuit risk in floor junction box.",
      costOffsetInr: 12400,
      whyThisIsNeeded: "Acoustic leak telemetry confirms active pipe joint fracture on vertical freshwater supply.",
      dispatchAction: "Trigger Solenoid Isolation",
    },
    {
      id: "rec-03",
      title: "Shift Substation #2 Feeder 2 Load to Feeder 4",
      domain: "Energy Optimization",
      urgency: "NEXT_2H",
      targetZone: "Sector 2 Substation 33kV Switchgear",
      actionText: "Execute automated SCADA bus-tie transfer to balance 420 kW from overheated Transformer #2 to idle Transformer #3.",
      estimatedImpact: "Drops winding temp by 8.5°C; avoids TPWODL peak penalty; extends transformer life.",
      costOffsetInr: 18500,
      whyThisIsNeeded: "Transformer #2 is operating at 78.4°C under heavy afternoon academic air-conditioning demand.",
      dispatchAction: "Execute SCADA Load Balance",
    },
    {
      id: "rec-04",
      title: "Activate Dynamic Parking Diversion to Stadium West",
      domain: "Traffic Management",
      urgency: "NEXT_2H",
      targetZone: "Academic Core & Main Gate Display Board",
      actionText: "Update digital VMS signage at Main Gate roundabout directing visitor cars to Stadium West lot (180 open bays).",
      estimatedImpact: "Eliminates highway turnaround gridlock; cuts visitor wait times by 14 minutes.",
      whyThisIsNeeded: "Academic parking is at 86% capacity with peak symposium arrivals still incoming.",
      dispatchAction: "Update VMS Signage",
    },
    {
      id: "rec-05",
      title: "Schedule Night Solar Water Pre-Heating Cycle (11:00 - 14:00)",
      domain: "Sustainability Scorecard",
      urgency: "DAILY_SOP",
      targetZone: "Hostel 14, CVR, and VS Halls",
      actionText: "Pre-heat central hostel geyser tanks during peak solar irradiance window (11:00 - 14:00) using 485 kW rooftop solar PV.",
      estimatedImpact: "Cuts evening grid draw by 180 kWh; monthly utility saving ~₹24,800; improves clean energy share by 4.2%.",
      costOffsetInr: 24800,
      whyThisIsNeeded: "Maximizes utilization of rooftop solar during high irradiance hours to offset peak tariff evening draw.",
      dispatchAction: "Apply Automated Schedule",
    },
  ];

  return NextResponse.json({
    success: true,
    mode,
    timestamp: new Date().toISOString(),
    ingestionStats: {
      activeNodes: 148,
      onlineNodes: 148,
      ingestionRate: isSyntheticSurge ? 42.5 : 28.4, // msg/sec
      latencyMs: 14.2,
      packetLossPercent: 0.02,
      healthStatus: "OPTIMAL",
    },
    telemetry,
    anomalies,
    recommendations,
  });
}
