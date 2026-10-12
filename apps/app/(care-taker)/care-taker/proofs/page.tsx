"use client";

import * as React from "react";
import { ROLES } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { getCaretakerNav } from "@/components/dashboards/nav-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2Icon, CameraIcon, UploadCloudIcon, ExternalLinkIcon, ShieldCheckIcon, CalendarIcon, UserIcon } from "lucide-react";
import { toast } from "sonner";
import { apiListComplaints, apiUploadToS3 } from "@/lib/api";

export default function CaretakerProofsPage() {
  const role = ROLES.find((r) => r.id === "caretaker") || ROLES[3];
  const navItems = getCaretakerNav();

  const [proofs, setProofs] = React.useState<any[]>([
    {
      id: "prf-1",
      ticket: "CIQ-2026-00001",
      title: "Replacement of 5-Stage RO Water Filter & Pressure Valve",
      resolvedAt: "Oct 11, 2026 • 15:42",
      technician: "Maheswar Nayak (Plumbing)",
      status: "Stored in S3 (evidences)",
      proofImage: "https://br-lingering-dawn-azbuqnic.storage.c-3.ap-southeast-1.aws.neon.tech/evidences/complaints/broken_pipe_f8baf3a97b52.jpg",
      notes: "Installed Kent commercial cartridge, TDS stabilized at 82 PPM.",
    },
    {
      id: "prf-2",
      ticket: "CIQ-2026-00002",
      title: "Wing A Corridor LED Batten Fitting & Choke Replacement",
      resolvedAt: "Oct 10, 2026 • 11:20",
      technician: "Suresh Babu (Electrical)",
      status: "Stored in S3 (evidences)",
      proofImage: "https://br-lingering-dawn-azbuqnic.storage.c-3.ap-southeast-1.aws.neon.tech/evidences/test_upload.txt",
      notes: "Installed 36W Philips LED batten. Wiring insulation tested at 500V.",
    },
  ]);
  const [isUploading, setIsUploading] = React.useState(false);

  React.useEffect(() => {
    async function loadRealProofs() {
      try {
        const res = await apiListComplaints({ status: "RESOLVED", hostel_code: "HB-3" });
        const items = Array.isArray(res) ? res : res?.items || [];
        const withProofs = items.filter((c: any) => c.resolution_photo_url);
        if (withProofs.length > 0) {
          const mapped = withProofs.map((c: any) => ({
            id: c.id,
            ticket: c.ticket_no || c.id,
            title: c.title,
            resolvedAt: "Recent",
            technician: c.assigned_to_name || "Assigned Tradesman",
            status: "Stored in S3 (evidences)",
            proofImage: c.resolution_photo_url,
            notes: c.resolution_note || c.description,
          }));
          setProofs((prev) => [...mapped, ...prev]);
        }
      } catch {
        // demo fallback
      }
    }
    loadRealProofs();
  }, []);

  const handleUploadNewProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await apiUploadToS3(file, "proofs");
      const newEntry = {
        id: `s3-${Date.now()}`,
        ticket: "CIQ-NEW",
        title: file.name,
        resolvedAt: "Just now",
        technician: "R. Das (Caretaker)",
        status: "S3 Bucket: evidences",
        proofImage: res.url,
        notes: `Uploaded to S3 bucket ${res.bucket} folder proofs/`,
      };
      setProofs((prev) => [newEntry, ...prev]);
      toast.success(`Photo successfully uploaded to S3 bucket '${res.bucket || "evidences"}'!`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload photo to S3");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <div className="space-y-6 max-w-8xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Resolution Proofs & S3 Evidence Gallery
            </h1>
            <p className="text-sm text-slate-500">
              Photographic verification log stored in Neon S3-compatible storage (Bucket: <strong className="text-indigo-600 font-mono">evidences</strong>).
            </p>
          </div>
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUploadNewProof}
              disabled={isUploading}
            />
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors">
              <UploadCloudIcon className="size-4" />
              {isUploading ? "Uploading to S3..." : "Upload New S3 Evidence Photo"}
            </span>
          </label>
        </div>

        {/* Proof Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {proofs.map((p) => (
            <Card key={p.id} className="bg-white border-slate-200 overflow-hidden hover:shadow-sm transition-all flex flex-col justify-between">
              <div>
                <div className="relative aspect-video bg-slate-100 overflow-hidden flex items-center justify-center border-b border-slate-100">
                  {p.proofImage?.endsWith(".txt") ? (
                    <div className="p-4 text-center text-xs text-slate-500 font-mono">
                      [S3 Object: {p.proofImage.split("/").pop()}]
                    </div>
                  ) : (
                    <img
                      src={p.proofImage}
                      alt={p.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback icon placeholder if binary was test format
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=600";
                      }}
                    />
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-indigo-600/90 text-white backdrop-blur-sm text-xs font-semibold">
                      {p.status}
                    </Badge>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-semibold text-indigo-600">
                    {p.ticket}
                  </div>
                  <CardTitle className="text-sm font-bold text-slate-900 line-clamp-2">
                    {p.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-slate-600 pb-2">
                  <p className="line-clamp-2">{p.notes}</p>
                  <div className="pt-2 border-t border-slate-100 space-y-1 text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <UserIcon className="size-3.5 text-slate-400" />
                      <span>{p.technician}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className="size-3.5 text-slate-400" />
                      <span>{p.resolvedAt}</span>
                    </div>
                  </div>
                </CardContent>
              </div>
              <div className="p-4 pt-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs gap-1.5 border-slate-200"
                  onClick={() => {
                    if (p.proofImage) window.open(p.proofImage, "_blank");
                    else toast.info("No photo URL attached");
                  }}
                >
                  <ExternalLinkIcon className="size-3.5 text-slate-500" />
                  Open S3 Object URL
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </RoleDashboardShell>
  );
}
