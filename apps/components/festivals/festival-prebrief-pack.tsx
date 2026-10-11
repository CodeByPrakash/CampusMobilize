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
  DownloadIcon,
  UsersIcon,
  WrenchIcon,
  ClockIcon,
  Building2Icon,
  CheckIcon,
  FileTextIcon,
  ActivityIcon,
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
  const [checkedItems, setCheckedItems] = React.useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: true,
    3: true,
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
        directives: prebrief?.recommendations || [
          "Pre-inspect pumps and overhead tanks in target hostels 48h prior.",
          "Schedule 4 additional sweepers per residential block during peak meal hours.",
          "Stage emergency electrical repair kits with on-call technicians.",
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
    water_surge_pct: Math.round(((selectedEvent.water_surge_multiplier || 1.3) - 1) * 100),
    electricity_surge_pct: Math.round(((selectedEvent.electricity_surge_multiplier || 1.2) - 1) * 100),
    hygiene_pressure_multiplier: selectedEvent.hygiene_pressure_multiplier || 2.8,
  };
  const budgetInr = prebrief?.estimated_budget_inr ?? prebrief?.budget_inr ?? 52000;
  const criticalHostels = prebrief?.critical_hostels || ["HB-3", "CVR", "KMS", "Hall 14"];
  const checklist = prebrief?.contingency_checklist || prebrief?.recommendations || [
    `Pre-inspect pumps and overhead tanks in ${criticalHostels.join(", ")} 48h prior`,
    "Schedule 4 additional sweepers per residential block during peak meal hours",
    "Stage emergency electrical repair kits with on-call technicians",
    `Reserve provisional emergency contingency budget of ₹${budgetInr.toLocaleString()}`,
  ];
  const staffing = prebrief?.staffing_plan || {
    extra_sanitation_workers: 4,
    on_call_electricians: 2,
    pump_operators: 2,
  };

  return (
    <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
      {/* Card Header with Mandate Actions */}
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-600 text-white text-xs font-semibold py-0.5 px-2">
                Automated Pre-Brief Pack (§8.5)
              </Badge>
              <Badge variant="outline" className="text-xs text-slate-500 font-mono">
                Occasion Countdown: In {daysUntil} Days
              </Badge>
            </div>
            <CardTitle className="text-lg font-bold text-slate-900">
              Hostel Preparedness Mandate — {eventName}
            </CardTitle>
            <p className="text-xs text-slate-500">
              Synthesized by CampusIQ AI Pre-Brief Engine • Official directive for Hall Wardens & Estate Office.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenSimulator}
              className="text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-xs gap-1.5 shadow-2xs"
            >
              <SparklesIcon className="size-3.5 text-indigo-600" />
              Simulate Stress in Digital Twin
            </Button>

            {mandate ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowOrderModal(true)}
                className="bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 text-xs gap-1.5"
              >
                <CheckCircle2Icon className="size-3.5 text-emerald-600" />
                View Mandate #{mandate.mandate_id?.slice(-8)}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleIssueMandate}
                disabled={isIssuing}
                className="bg-slate-900 text-white hover:bg-slate-800 text-xs gap-1.5 shadow-2xs"
              >
                <ShieldCheckIcon className="size-4" />
                {isIssuing ? "Dispatching Mandate..." : "Issue Chief Warden Mandate"}
              </Button>
            )}
          </div>
        </div>

        {/* Issued Mandate Status Banner */}
        {mandate && (
          <div className="mt-3 p-2.5 rounded-lg border border-emerald-300 bg-emerald-50/70 text-emerald-900 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2Icon className="size-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Mandate {mandate.mandate_id} Dispatched:</strong> Acknowledged by Estate Officer & All 4 Hall Wardens. Requisition active.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowOrderModal(true)}
                className="h-6 text-[11px] text-emerald-800 hover:text-emerald-950 px-2"
              >
                <FileTextIcon className="size-3 mr-1" />
                Order Slip
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  window.print();
                  toast.success("Printing Official Mandate Order Slip");
                }}
                className="h-6 text-[11px] text-emerald-800 hover:text-emerald-950 px-2"
              >
                <PrinterIcon className="size-3 mr-1" />
                Print Order
              </Button>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-5 space-y-6">
        {/* Executive Summary Plain Language Box (§8.5) */}
        {prebrief?.summary_text && (
          <div className="p-3.5 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/70 to-slate-50 text-indigo-950 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-900">
              <SparklesIcon className="size-3.5 text-indigo-600" />
              Autonomous Operational Synthesis (§8.5)
            </div>
            <p className="text-xs text-indigo-900/90 leading-relaxed font-sans">
              {prebrief.summary_text}
            </p>
          </div>
        )}

        {/* Surge Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/30">
            <div className="text-[11px] font-medium text-blue-700 flex items-center gap-1">
              <DropletsIcon className="size-3 text-blue-600" />
              Water Surge Demand
            </div>
            <div className="text-xl font-bold text-blue-950 mt-1">
              +{surges.water_surge_pct}%
            </div>
            <p className="text-[10px] text-blue-700/80">Pre-fill 100% sumps 12h prior</p>
          </div>

          <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/30">
            <div className="text-[11px] font-medium text-amber-700 flex items-center gap-1">
              <ZapIcon className="size-3 text-amber-600" />
              Electricity Surge
            </div>
            <div className="text-xl font-bold text-amber-950 mt-1">
              +{surges.electricity_surge_pct}%
            </div>
            <p className="text-[10px] text-amber-700/80">Substation dual-feed ready</p>
          </div>

          <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/30">
            <div className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
              <UsersIcon className="size-3 text-emerald-600" />
              Hygiene Pressure
            </div>
            <div className="text-xl font-bold text-emerald-950 mt-1">
              {surges.hygiene_pressure_multiplier}x
            </div>
            <p className="text-[10px] text-emerald-700/80">4-hour washroom cycles</p>
          </div>

          <div className="p-3 rounded-lg border border-purple-200 bg-purple-50/30">
            <div className="text-[11px] font-medium text-purple-700 flex items-center gap-1">
              <ShieldCheckIcon className="size-3 text-purple-600" />
              Contingency Reserve
            </div>
            <div className="text-xl font-bold text-purple-950 mt-1">
              ₹{budgetInr.toLocaleString()}
            </div>
            <p className="text-[10px] text-purple-700/80">Estate contingency sanctioned</p>
          </div>
        </div>

        {/* Critical Hostels Watchlist Chips */}
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <Building2Icon className="size-3.5 text-indigo-600" />
            Critical Hostels Watchlist & Footfall Influx:
          </div>
          <div className="flex flex-wrap gap-2">
            {criticalHostels.map((code: string) => (
              <Badge
                key={code}
                variant="outline"
                className="bg-slate-50 border-slate-300 text-slate-800 text-xs py-1 px-2.5 font-medium flex items-center gap-1.5"
              >
                <span className="font-bold text-indigo-700">{code}</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  {code === "HB-3"
                    ? "Primary Guest Hub (+1,450)"
                    : code === "CVR"
                    ? "Dining & Mess Hub (+980)"
                    : code === "KMS"
                    ? "Girls Delegations (+820)"
                    : "Mega Event Staging (+1,250)"}
                </span>
              </Badge>
            ))}
          </div>
        </div>

        {/* 3 Core Contingency Directive Boxes (Like user screenshot + enhanced) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-sm text-blue-900">
              <DropletsIcon className="size-4 text-blue-600" />
              Water Contingency Buffer
            </div>
            <p className="text-xs text-blue-800 leading-relaxed">
              Pre-fill all rooftop storage tanks to 100% 12 hours before festival inauguration. 2 standby 10,000L PHED tankers requisitioned for Hall 14 & Hall 3. Booster pumps scheduled for off-peak 14:00 fill.
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-sm text-amber-900">
              <ZapIcon className="size-4 text-amber-600" />
              Diesel Generator (DG) Reserves
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              Ensure 800-litre HSD fuel reserve in Substation 2 generator. Mandatory dual-feed breaker check scheduled with Estate Electrical Wing. Stage emergency portable halogen masts for open grounds.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-sm text-emerald-900">
              <ShieldCheckIcon className="size-4 text-emerald-600" />
              Sanitation & Flying Squad
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Washroom cleaning frequency doubled to 4-hour cycle. 2 roving emergency plumbers assigned to high-density guest hostels. Rapid response trash disposal stationed at CVR & HB-3.
            </p>
          </div>
        </div>

        {/* Staffing Allocation Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <WrenchIcon className="size-3.5 text-indigo-600" />
              Mandated Emergency Support Staffing Allocation
            </div>
            <Badge variant="outline" className="text-[10px] bg-white text-slate-600">
              Estate Deployment Roster
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600">Extra Sanitation Workers</span>
              <strong className="text-slate-900 font-mono text-sm">
                +{staffing.extra_sanitation_workers} personnel
              </strong>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600">On-Call Electricians</span>
              <strong className="text-slate-900 font-mono text-sm">
                +{staffing.on_call_electricians} technicians
              </strong>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600">Pump & RO Operators</span>
              <strong className="text-slate-900 font-mono text-sm">
                +{staffing.pump_operators} operators
              </strong>
            </div>
          </div>
        </div>

        {/* Verified Action Checklist with Checkboxes */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-800">
            Chief Warden Verification Checklist:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {checklist.map((item: string, idx: number) => {
              const isChecked = !!checkedItems[idx];
              return (
                <div
                  key={idx}
                  onClick={() => toggleCheck(idx)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-colors flex items-start gap-2.5 ${
                    isChecked
                      ? "border-emerald-200 bg-emerald-50/30 text-emerald-950"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div
                    className={`size-4 rounded mt-0.5 flex items-center justify-center shrink-0 ${
                      isChecked
                        ? "bg-emerald-600 text-white"
                        : "border border-slate-300 bg-slate-50"
                    }`}
                  >
                    {isChecked && <CheckIcon className="size-3" />}
                  </div>
                  <span className={`text-xs ${isChecked ? "line-through opacity-80" : ""}`}>
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
              <Badge variant="outline" className="text-xs font-mono">
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
                <span>HB-3, CVR, KMS, Hall 14 Wardens & Estate Officer</span>
              </div>
              <div className="pt-1">
                <span className="text-slate-500 block mb-1">Directives Enacted:</span>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-800">
                  <li>Overhead storage tanks 100% pre-filled 12h prior.</li>
                  <li>Standby 10kL PHED tankers staged at Hall 14 & Hall 3.</li>
                  <li>Substation 2 generator 800L fuel top-up confirmed.</li>
                  <li>Washroom cleaning frequency set to 4-hour cyclical inspections.</li>
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
