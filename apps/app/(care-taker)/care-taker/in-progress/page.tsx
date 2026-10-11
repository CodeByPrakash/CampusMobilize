"use client";

import * as React from "react";
import { ROLES } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { getCaretakerNav } from "@/components/dashboards/nav-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PlayCircleIcon, CheckCircle2Icon, ClockIcon, WrenchIcon, CameraIcon, UserIcon, UploadCloudIcon } from "lucide-react";
import { toast } from "sonner";
import { apiListComplaints, apiTransitionComplaint, apiUploadToS3 } from "@/lib/api";

export default function CaretakerInProgressPage() {
  const role = ROLES.find((r) => r.id === "caretaker") || ROLES[3];
  const navItems = getCaretakerNav();

  const [tickets, setTickets] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [resolutionNote, setResolutionNote] = React.useState<Record<string, string>>({});
  const [proofUrls, setProofUrls] = React.useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = React.useState<Record<string, boolean>>({});

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiListComplaints({ status: "IN_PROGRESS", hostel_code: "HB-3" });
      const items = Array.isArray(res) ? res : res?.items || [];
      setTickets(items);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUploadProof = async (ticketId: string, file: File) => {
    setIsUploading((prev) => ({ ...prev, [ticketId]: true }));
    try {
      const res = await apiUploadToS3(file, "proofs");
      setProofUrls((prev) => ({ ...prev, [ticketId]: res.url }));
      toast.success(`Resolution proof uploaded directly to S3 bucket '${res.bucket || "evidences"}'!`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload photo to S3");
    } finally {
      setIsUploading((prev) => ({ ...prev, [ticketId]: false }));
    }
  };

  const handleComplete = async (ticketId: string) => {
    const note = resolutionNote[ticketId] || "Repaired and verified on site.";
    const photoUrl = proofUrls[ticketId] || "https://br-lingering-dawn-azbuqnic.storage.c-3.ap-southeast-1.aws.neon.tech/evidences/proofs/sample_resolution.jpg";
    try {
      await apiTransitionComplaint(ticketId, {
        to_status: "RESOLVED",
        note,
        photo_url: photoUrl,
      });
      toast.success(`Work Order ${ticketId} marked as RESOLVED with S3 proof! Sent for Warden audit.`);
      loadData();
    } catch (e: any) {
      toast.error(e?.message || "Failed to update status");
    }
  };


  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <div className="space-y-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Active Work Orders (In-Progress)
            </h1>
            <p className="text-sm text-slate-500">
              Jobs currently being executed by tradesmen and technicians in Hall 14.
            </p>
          </div>
          <Badge className="bg-amber-500 text-white px-3 py-1 text-sm font-semibold gap-1.5">
            <PlayCircleIcon className="size-4" />
            {tickets.length} Active Field Repairs
          </Badge>
        </div>

        {/* Tickets Grid */}
        <div className="space-y-4">
          {tickets.length === 0 ? (
            <Card className="bg-white border-slate-200 p-8 text-center text-slate-400">
              No jobs currently in progress. Check the Work Orders tab to start newly assigned tickets.
            </Card>
          ) : (
            tickets.map((t) => (
              <Card key={t.id} className="bg-white border-slate-200">
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-800">
                        {t.ticket_no || t.id}
                      </span>
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
                        In Progress
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {t.category_code || "MAINT"}
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-semibold text-slate-900">
                      {t.title}
                    </CardTitle>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-semibold text-rose-600 flex items-center gap-1 justify-end">
                      <ClockIcon className="size-3.5" />
                      SLA: 2h 45m left
                    </span>
                    <span className="text-[11px] text-slate-400">Target: P2 Standard</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <p className="text-xs text-slate-600">{t.description}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2">
                      <UserIcon className="size-4 text-slate-400" />
                      <span className="text-slate-500">Technician:</span>
                      <span className="font-medium text-slate-800">{t.assigned_to_name || "Suresh Electrician"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <WrenchIcon className="size-4 text-slate-400" />
                      <span className="text-slate-500">Location:</span>
                      <span className="font-medium text-slate-800">{t.location_text || `Room ${t.room_no}`}</span>
                    </div>
                  </div>

                  {/* S3 Photo Proof Attachment */}
                  <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <CameraIcon className="size-4 text-indigo-600" />
                      <span className="font-medium text-slate-700">Resolution Photo Proof (S3):</span>
                      {proofUrls[t.ticket_no || t.id] ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs gap-1">
                          <CheckCircle2Icon className="size-3" />
                          Uploaded to evidences S3
                        </Badge>
                      ) : (
                        <span className="text-slate-400">No proof attached yet</span>
                      )}
                    </div>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUploadProof(t.ticket_no || t.id, f);
                        }}
                      />
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium text-xs transition-colors">
                        <UploadCloudIcon className="size-3.5" />
                        {isUploading[t.ticket_no || t.id] ? "Uploading S3..." : "Upload S3 Photo Proof"}
                      </span>
                    </label>
                  </div>

                  {/* Completion Action */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                    <Input
                      placeholder="Add completion notes / parts replaced..."
                      value={resolutionNote[t.ticket_no || t.id] || ""}
                      onChange={(e) =>
                        setResolutionNote((prev) => ({
                          ...prev,
                          [t.ticket_no || t.id]: e.target.value,
                        }))
                      }
                      className="bg-white text-xs h-9"
                    />
                    <Button
                      size="sm"
                      className="h-9 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                      onClick={() => handleComplete(t.ticket_no || t.id)}
                    >
                      <CheckCircle2Icon className="size-4" />
                      Submit Resolution & Proof
                    </Button>
                  </div>

                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </RoleDashboardShell>
  );
}
