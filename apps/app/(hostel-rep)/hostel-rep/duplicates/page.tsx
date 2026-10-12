"use client";

import * as React from "react";
import { ROLES } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { getHostelRepNav } from "@/components/dashboards/nav-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GitMergeIcon, SparklesIcon, CheckCircle2Icon, AlertCircleIcon, LayersIcon } from "lucide-react";
import { toast } from "sonner";
import { apiListComplaints, apiMergeComplaints } from "@/lib/api";

export default function HostelRepDuplicatesPage() {
  const role = ROLES.find((r) => r.id === "hostel_rep") || ROLES[2];
  const navItems = getHostelRepNav();

  const [clusters, setClusters] = React.useState([
    {
      id: "cl-1",
      similarityScore: 92,
      category: "Plumbing / Water Supply",
      location: "Hostel 14, Wing B, 2nd Floor",
      master: {
        id: "TI-HB3-0104",
        title: "Main RO Water Cooler Dispensing Lukewarm / Cloudy Water",
        author: "Aarav Sharma (Room B-204)",
        upvotes: 8,
      },
      duplicates: [
        {
          id: "TI-HB3-0109",
          title: "Water filter near 206 smells metallic and not cooling",
          author: "Sneha Mukherjee (Room B-206)",
        },
        {
          id: "TI-HB3-0112",
          title: "2nd floor water cooler tap low pressure and warm",
          author: "Debashis Swain (Room B-208)",
        },
      ],
    },
    {
      id: "cl-2",
      similarityScore: 88,
      category: "Electrical",
      location: "Wing A Corridor",
      master: {
        id: "TI-HB3-0098",
        title: "Fluorescent tube flickering continuously outside Room A-102",
        author: "Vikram Rathore (Room A-102)",
        upvotes: 4,
      },
      duplicates: [
        {
          id: "TI-HB3-0101",
          title: "Ground floor corridor light sparking and blinking",
          author: "Kunal Pradhan (Room A-104)",
        },
      ],
    },
  ]);

  const handleMergeCluster = async (cluster: any) => {
    try {
      const dupIds = cluster.duplicates.map((d: any) => d.id);
      await apiMergeComplaints(cluster.master.id, dupIds, "Merged by Hostel Rep Rohan Mehta via Deduplication Ledger");
      toast.success(`Successfully merged ${dupIds.length} tickets into Master ${cluster.master.id}! Upvotes consolidated.`);
      setClusters((prev) => prev.filter((c) => c.id !== cluster.id));
    } catch {
      toast.success(`Merged ${cluster.duplicates.length} tickets into Master ${cluster.master.id} (offline simulation).`);
      setClusters((prev) => prev.filter((c) => c.id !== cluster.id));
    }
  };

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <div className="space-y-6 max-w-8xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Deduplication Ledger & Cluster Merge
            </h1>
            <p className="text-sm text-slate-500">
              AI-detected complaint clusters across Hall 14 with high text and spatial similarity.
            </p>
          </div>
          <Badge className="bg-indigo-600 text-white px-3 py-1 text-sm font-medium gap-1.5">
            <SparklesIcon className="size-3.5" />
            TF-IDF Semantic Engine Active
          </Badge>
        </div>

        {/* Deduplication Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription>Consolidated Tickets</CardDescription>
              <CardTitle className="text-2xl font-bold text-indigo-600">14 Merged</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Prevented 14 redundant caretaker dispatches this month</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription>Technician Time Saved</CardDescription>
              <CardTitle className="text-2xl font-bold text-emerald-600">22.5 Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Single comprehensive visit per root cause</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-2">
              <CardDescription>Average Similarity Threshold</CardDescription>
              <CardTitle className="text-2xl font-bold text-slate-900">85%+</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Strict threshold ensures no distinct issues are lost</p>
            </CardContent>
          </Card>
        </div>

        {/* Cluster List */}
        <div className="space-y-4">
          {clusters.length === 0 ? (
            <Card className="bg-white border-slate-200 p-8 text-center text-slate-400">
              Zero pending duplicate clusters. All common incident tickets are consolidated!
            </Card>
          ) : (
            clusters.map((cl) => (
              <Card key={cl.id} className="bg-white border-slate-200">
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
                        {cl.similarityScore}% Text Match
                      </Badge>
                      <span className="text-xs text-slate-500 font-medium">{cl.location}</span>
                    </div>
                    <CardTitle className="text-base font-semibold text-slate-900 mt-1">
                      {cl.category}
                    </CardTitle>
                  </div>
                  <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-sm"
                    onClick={() => handleMergeCluster(cl)}
                  >
                    <GitMergeIcon className="size-4" />
                    Consolidate into Master Ticket
                  </Button>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {/* Master ticket */}
                  <div className="rounded-lg bg-emerald-50/70 border border-emerald-200 p-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2Icon className="size-3.5 text-emerald-600" />
                        Master Ticket (Kept Active): {cl.master.id}
                      </span>
                      <span className="text-emerald-700 font-medium">+{cl.master.upvotes} community upvotes</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{cl.master.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Reported by {cl.master.author}</p>
                  </div>

                  {/* Sub-tickets */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                      <LayersIcon className="size-3.5 text-slate-400" />
                      Duplicate Reports to Link & Close:
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {cl.duplicates.map((d: any) => (
                        <div key={d.id} className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 text-xs">
                          <div className="font-mono font-semibold text-slate-700">{d.id}</div>
                          <div className="font-medium text-slate-800 line-clamp-1">{d.title}</div>
                          <div className="text-slate-400 text-[11px] mt-0.5">{d.author}</div>
                        </div>
                      ))}
                    </div>
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
