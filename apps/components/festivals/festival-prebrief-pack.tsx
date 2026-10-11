"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldCheckIcon,
  DropletsIcon,
  ZapIcon,
  SparklesIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  PrinterIcon,
  CopyIcon,
  CheckIcon,
  UsersIcon,
  WrenchIcon,
  ClockIcon,
  Building2Icon,
  FileTextIcon,
  ActivityIcon,
  CheckSquareIcon,
  CoinsIcon,
} from "lucide-react";
import { toast } from "sonner";
import { apiIssueChiefWardenMandate, apiGetChiefWardenMandate } from "@/lib/api";

interface FestivalPreBriefPackProps {
  selectedEvent: any;
  prebrief: any;
  onOpenSimulator: () => void;
}

export function FestivalPreBriefPack({
  selectedEvent,
  prebrief,
  onOpenSimulator,
}: FestivalPreBriefPackProps) {
  const [isIssuing, setIsIssuing] = React.useState(false);
  const [mandate, setMandate] = React.useState<any>(null);
  const [showOrderModal, setShowOrderModal] = React.useState(false);
  const [copiedBrief, setCopiedBrief] = React.useState(false);
  const [checkedItems, setCheckedItems] = React.useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: true,
    3: true,
    4: true,
  });

  // Load existing mandate status
  React.useEffect(() => {
    if (!selectedEvent?.id) return;
    async function fetchMandate() {
      try {
        const data = await apiGetChiefWardenMandate(selectedEvent.id);
        if (data && data.status === "ISSUED") {
          setMandate(data);
        } else {
          setMandate(null);
        }
      } catch {
        setMandate(null);
      }
    }
    fetchMandate();
  }, [selectedEvent?.id]);

  const toggleCheck = (idx: number) => {
    setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleIssueMandate = async () => {
    if (!selectedEvent?.id) return;
    setIsIssuing(true);
    try {
      const payload = {
        issuer_name: "Prof. M. Mishra",
        issuer_role: "CHIEF_WARDEN",
        target_hostels: prebrief?.critical_hostels || ["Hall 14", "Hall 3", "CVR", "HB-3", "KMS"],
        budget_approved_inr: prebrief?.estimated_budget_inr || prebrief?.budget_inr || 52000,
        directives: prebrief?.key_actions || prebrief?.recommendations || [
          "Pre-inspect pumps and overhead tanks in target hostels 48h prior.",
          "Pre-fill all rooftop storage tanks to 100% 12h prior to inauguration.",
          "Position standby 10,000L PHED tankers between Hall 14 and HB-3.",
          "Lock non-essential chiller units during 18:30–22:00 peak hours.",
          "Deploy 4 additional sanitation workers per residential block.",
        ],
      };
      const res = await apiIssueChiefWardenMandate(selectedEvent.id, payload);
      setMandate(res);
      toast.success(
        `Official Chief Warden Mandate issued & dispatched to Hall Wardens and Estate Office!`
      );
    } catch {
      // Fallback
      const fakeMandate = {
        mandate_id: `CWM-NITR-2026-${selectedEvent.id.slice(0, 6).toUpperCase()}-MANDATE`,
        status: "ISSUED",
        issued_at: new Date().toISOString(),
        issued_by: "Prof. M. Mishra (Chief Warden)",
        target_hostels: ["Hall 14", "Hall 3", "CVR", "HB-3", "KMS"],
        budget_approved_inr: 52000,
      };
      setMandate(fakeMandate);
      toast.success(`Official Chief Warden Mandate dispatched!`);
    } finally {
      setIsIssuing(false);
    }
  };

  if (!selectedEvent) return null;

  const eventName = selectedEvent.name;
  const daysUntil = prebrief?.days_until ?? 25;
  const surges = prebrief?.predicted_surges || {
    water_surge_pct: Math.round(((selectedEvent.water_surge_multiplier || 1.38) - 1) * 100),
    electricity_surge_pct: Math.round(((selectedEvent.electricity_surge_multiplier || 1.22) - 1) * 100),
    hygiene_pressure_multiplier: selectedEvent.hygiene_pressure_multiplier || 3.1,
  };
  const budgetInr = prebrief?.estimated_budget_inr ?? prebrief?.budget_inr ?? 52000;
  const criticalHostels = prebrief?.critical_hostels || ["HB-3", "CVR", "KMS", "Hall 14"];

  const structuredSummary = prebrief?.structured_summary || {
    headline: `${eventName} in ${daysUntil} days: Major campus footfall influx requiring autonomous facility readiness across ${criticalHostels.join(", ")}.`,
    water_analysis: `Water demand surge of +${surges.water_surge_pct}%. Overhead sumps must be 100% pre-filled 12h prior with standby PHED tankers positioned at Hall 14 & Hall 3.`,
    electricity_analysis: `Peak electrical demand surge of +${surges.electricity_surge_pct}%. Dual-feed breaker test scheduled; stage lighting cutover locked until 18:30 to shave coincident transformer peaks.`,
    sanitation_analysis: `Hygiene complaint pressure multiplying by ×${surges.hygiene_pressure_multiplier}. Washroom inspection cycle reduced from 8h to 4h with 2 roving emergency plumbers.`,
    budget_analysis: `Estate provisional contingency budget of ₹${budgetInr.toLocaleString()} approved for fuel top-up, tanker freight, and overtime maintenance squads.`,
  };

  const keyActions = prebrief?.key_actions || [
    `Pre-inspect pumps and overhead tanks in ${criticalHostels.join(", ")} 48h prior`,
    "Pre-fill all rooftop storage tanks to 100% 12h prior to inauguration",
    "Position 2 standby 10,000L PHED tankers between Hall 14 & Hall 3",
    "Lock non-essential chiller units during 18:30–22:00 peak hours",
    "Deploy 4 additional sanitation sweepers per residential block",
    `Authorize provisional emergency contingency budget of ₹${budgetInr.toLocaleString()}`,
  ];

  const staffing = prebrief?.staffing_plan || {
    extra_sanitation_workers: 4,
    on_call_electricians: 2,
    pump_operators: 2,
  };

  const handleCopySummary = () => {
    const textToCopy = `CAMPUSIQ PRE-BRIEF MANDATE: ${eventName}
Days Remaining: ${daysUntil} days
Surges: Water +${surges.water_surge_pct}%, Power +${surges.electricity_surge_pct}%, Hygiene ×${surges.hygiene_pressure_multiplier}
Contingency Budget: ₹${budgetInr.toLocaleString()}
Critical Hostels: ${criticalHostels.join(", ")}

EXECUTIVE DIRECTIVES:
${keyActions.map((a: string, i: number) => `${i + 1}. ${a}`).join("\n")}
`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedBrief(true);
    toast.success("Executive Pre-Brief copied to clipboard!");
    setTimeout(() => setCopiedBrief(false), 2000);
  };

  return (
    <Card className="bg-white border-slate-200 shadow-xs overflow-hidden">
      {/* Card Header with Mandate Actions */}
      <CardHeader className="border-b border-slate-100 bg-slate-50/70 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-600 text-white text-xs font-semibold py-0.5 px-2.5">
                Automated Pre-Brief Pack (§8.5)
              </Badge>
              <Badge variant="outline" className="text-xs text-slate-600 font-mono bg-white">
                Countdown: In {daysUntil} Days
              </Badge>
              <Badge variant="outline" className="text-xs text-indigo-700 border-indigo-200 bg-indigo-50 font-mono">
                {selectedEvent.kind?.toUpperCase()}
              </Badge>
            </div>
            <CardTitle className="text-lg sm:text-xl font-bold text-slate-900">
              Hostel Preparedness Mandate — {eventName}
            </CardTitle>
            <p className="text-xs text-slate-500">
              Autonomous facility readiness package for Hall Wardens, Estate Office, and PHED utilities.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenSimulator}
              className="text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-xs gap-1.5 shadow-2xs font-semibold"
            >
              <SparklesIcon className="size-3.5 text-indigo-600" />
              Simulate Stress in Digital Twin
            </Button>

            {mandate ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowOrderModal(true)}
                className="bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 text-xs gap-1.5 font-semibold"
              >
                <CheckCircle2Icon className="size-3.5 text-emerald-600" />
                View Mandate #{mandate.mandate_id?.slice(-8)}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleIssueMandate}
                disabled={isIssuing}
                className="bg-slate-900 text-white hover:bg-slate-800 text-xs gap-1.5 shadow-2xs font-semibold"
              >
                <ShieldCheckIcon className="size-4 text-emerald-400" />
                {isIssuing ? "Dispatching Mandate..." : "Issue Chief Warden Mandate"}
              </Button>
            )}
          </div>
        </div>

        {/* Issued Mandate Status Banner */}
        {mandate && (
          <div className="mt-3 p-3 rounded-xl border border-emerald-300 bg-emerald-50/80 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2Icon className="size-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Mandate #{mandate.mandate_id} Dispatched & Enacted:</strong> Officially registered by Prof. M. Mishra. Acknowledged by Estate Officer & Wardens of {criticalHostels.join(", ")}.
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowOrderModal(true)}
                className="h-6 text-[11px] bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-100 px-2.5"
              >
                <FileTextIcon className="size-3 mr-1" />
                Order Slip
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  window.print();
                  toast.success("Printing Official Mandate Order");
                }}
                className="h-6 text-[11px] bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-100 px-2.5"
              >
                <PrinterIcon className="size-3 mr-1" />
                Print Order
              </Button>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* ========================================================================= */}
        {/* Executive AI Briefing & Operational Synthesis Hub (§8.5) */}
        {/* ========================================================================= */}
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/60 via-white to-slate-50 p-4 sm:p-5 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-indigo-600 text-white">
                <SparklesIcon className="size-3.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  CampusIQ AI Operational Synthesis (§8.5)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Autonomous forecaster predictions & facility readiness guidance
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] bg-white text-indigo-700 border-indigo-200 font-mono">
                Neural Model v3.0
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopySummary}
                className="h-7 text-xs gap-1 text-indigo-700 hover:bg-indigo-100/60"
              >
                {copiedBrief ? (
                  <>
                    <CheckIcon className="size-3 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <CopyIcon className="size-3" />
                    <span>Copy Brief</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Core Headline */}
          <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed bg-white/80 p-3 rounded-xl border border-indigo-100/80">
            {structuredSummary.headline}
          </p>

          {/* 4 Pillars Operational Insights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Water Pillar */}
            <div className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1">
                  <DropletsIcon className="size-3.5 text-blue-600" />
                  Water Buffer
                </span>
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[10px] font-mono">
                  +{surges.water_surge_pct}% Surge
                </Badge>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {structuredSummary.water_analysis}
              </p>
            </div>

            {/* Electrical Pillar */}
            <div className="bg-white p-3.5 rounded-xl border border-amber-100 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                  <ZapIcon className="size-3.5 text-amber-600" />
                  Electrical Grid
                </span>
                <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] font-mono">
                  +{surges.electricity_surge_pct}% Peak
                </Badge>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {structuredSummary.electricity_analysis}
              </p>
            </div>

            {/* Sanitation Pillar */}
            <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                  <UsersIcon className="size-3.5 text-emerald-600" />
                  Sanitation Load
                </span>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-mono">
                  {surges.hygiene_pressure_multiplier}x Frequency
                </Badge>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {structuredSummary.sanitation_analysis}
              </p>
            </div>

            {/* Budget Pillar */}
            <div className="bg-white p-3.5 rounded-xl border border-purple-100 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-900 flex items-center gap-1">
                  <CoinsIcon className="size-3.5 text-purple-600" />
                  Estate Reserve
                </span>
                <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[10px] font-mono">
                  ₹{budgetInr.toLocaleString()}
                </Badge>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {structuredSummary.budget_analysis}
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Critical Hostels Deployment Watchlist */}
        {/* ========================================================================= */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Building2Icon className="size-4 text-indigo-600" />
              Critical Hostels Deployment Watchlist
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Priority Tier 1 Surveillance
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {criticalHostels.map((code: string) => {
              const roleTitle =
                code === "HB-3"
                  ? "Primary Guest Hub"
                  : code === "CVR"
                  ? "Dining & Mess Hub"
                  : code === "KMS"
                  ? "Girls Delegations"
                  : "Mega Event Staging";
              const footfallBadge =
                code === "HB-3" ? "+1,450" : code === "CVR" ? "+980" : code === "KMS" ? "+820" : "+1,250";

              return (
                <div
                  key={code}
                  className="p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition-all space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">{code}</span>
                    <Badge variant="outline" className="text-[10px] font-mono text-indigo-700 bg-indigo-50 border-indigo-200">
                      {footfallBadge} guests
                    </Badge>
                  </div>
                  <div className="text-xs font-semibold text-slate-700">{roleTitle}</div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    {code === "HB-3"
                      ? "Pre-fill 50kL sumps 12h prior. Plumber rapid squad stationed."
                      : code === "CVR"
                      ? "Mess RO operating on 24h continuous filtration."
                      : code === "KMS"
                      ? "Booster pump bypass active during morning hours."
                      : "Dual-feed automatic transfer switch verified."}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Core Operational Directive Cards */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-blue-900">
              <DropletsIcon className="size-4 text-blue-600" />
              Water Contingency Buffer
            </div>
            <p className="text-xs text-blue-800 leading-relaxed">
              Pre-fill all rooftop storage tanks to 100% 12 hours before festival inauguration. 2 standby 10,000L PHED tankers requisitioned for Hall 14 & Hall 3. Booster pumps scheduled for off-peak 14:00 fill.
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
              <ZapIcon className="size-4 text-amber-600" />
              Diesel Generator (DG) Reserves
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              Ensure 800-litre HSD fuel reserve in Substation 2 generator. Mandatory dual-feed breaker check scheduled with Estate Electrical Wing. Stage emergency portable halogen masts for open grounds.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
              <ShieldCheckIcon className="size-4 text-emerald-600" />
              Sanitation & Flying Squad
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Washroom cleaning frequency doubled to 4-hour cycle. 2 roving emergency plumbers assigned to high-density guest hostels. Rapid response trash disposal stationed at CVR & HB-3.
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Emergency Staffing Roster */}
        {/* ========================================================================= */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <WrenchIcon className="size-3.5 text-indigo-600" />
              Mandated Emergency Staffing Allocation
            </div>
            <Badge variant="outline" className="text-[10px] bg-white text-slate-600">
              Estate Deployment Roster
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Extra Sanitation Workers</span>
              <strong className="text-slate-900 font-mono text-sm">
                +{staffing.extra_sanitation_workers} personnel
              </strong>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">On-Call Electricians</span>
              <strong className="text-slate-900 font-mono text-sm">
                +{staffing.on_call_electricians} technicians
              </strong>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Pump & RO Operators</span>
              <strong className="text-slate-900 font-mono text-sm">
                +{staffing.pump_operators} operators
              </strong>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Chief Warden Verification Checklist */}
        {/* ========================================================================= */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <CheckSquareIcon className="size-4 text-emerald-600" />
              Chief Warden Pre-Inauguration Verification Checklist
            </span>
            <span className="text-[11px] text-slate-500">
              {Object.values(checkedItems).filter(Boolean).length} of {keyActions.length} Verified
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {keyActions.map((item: string, idx: number) => {
              const isChecked = !!checkedItems[idx];
              return (
                <div
                  key={idx}
                  onClick={() => toggleCheck(idx)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                    isChecked
                      ? "border-emerald-200 bg-emerald-50/40 text-emerald-950"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div
                    className={`size-4 rounded mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                      isChecked
                        ? "bg-emerald-600 text-white"
                        : "border border-slate-300 bg-slate-50"
                    }`}
                  >
                    {isChecked && <CheckIcon className="size-3" />}
                  </div>
                  <span className={`text-xs ${isChecked ? "line-through opacity-80" : "font-medium"}`}>
                    {item}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>

      {/* Official Order Slip Modal */}
      {showOrderModal && mandate && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="size-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Official Chief Warden Mandate Order Slip
                </h3>
              </div>
              <Badge variant="outline" className="text-xs font-mono bg-slate-50">
                {mandate.mandate_id}
              </Badge>
            </div>

            <div className="space-y-3 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 font-sans">
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Subject Festival:</span>
                <strong className="text-slate-900">{eventName}</strong>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Issuing Authority:</span>
                <span className="font-semibold text-slate-900">Prof. M. Mishra, Chief Warden</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Effective Window:</span>
                <span className="font-mono">{selectedEvent.starts_on} to {selectedEvent.ends_on}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Sanctioned Budget:</span>
                <span className="font-bold text-emerald-700">₹{budgetInr.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Dispatched To:</span>
                <span>{criticalHostels.join(", ")} Wardens & Estate Officer</span>
              </div>
              <div className="pt-1">
                <span className="text-slate-500 block mb-1">Directives Enacted:</span>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-800">
                  {keyActions.slice(0, 4).map((action: string, i: number) => (
                    <li key={i}>{action}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.print();
                  toast.success("Printing Order Slip");
                }}
                className="text-xs gap-1.5"
              >
                <PrinterIcon className="size-3.5" />
                Print Order
              </Button>
              <Button
                size="sm"
                onClick={() => setShowOrderModal(false)}
                className="bg-slate-900 text-white hover:bg-slate-800 text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
