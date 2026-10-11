"use client";

import * as React from "react";
import { ROLES } from "@/lib/roles";
import { RoleDashboardShell } from "@/components/dashboards/role-dashboard-shell";
import { getStudentNav } from "@/components/dashboards/nav-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThumbsUpIcon, SparklesIcon, Building2Icon } from "lucide-react";
import { toast } from "sonner";
import { apiListComplaints, apiUpvoteComplaint } from "@/lib/api";

export default function StudentUpvotesPage() {
  const role = ROLES.find((r) => r.id === "student") || ROLES[0];
  const navItems = getStudentNav();

  const [complaints, setComplaints] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [upvotedIds, setUpvotedIds] = React.useState<Record<string, boolean>>({});

  const fetchHostelIssues = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiListComplaints({ hostel_code: "HB-3" });
      const items = Array.isArray(data) ? data : data?.items || [];
      setComplaints(items);
    } catch {
      toast.error("Failed to load community feed");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchHostelIssues();
  }, [fetchHostelIssues]);

  const handleUpvote = async (id: string) => {
    try {
      await apiUpvoteComplaint(id);
      setUpvotedIds((prev) => ({ ...prev, [id]: !prev[id] }));
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, upvote_count: (c.upvote_count || 0) + (upvotedIds[id] ? -1 : 1) }
            : c
        )
      );
      toast.success(upvotedIds[id] ? "Upvote removed" : "Upvoted! Community weight increased.");
    } catch {
      toast.error("Could not register upvote");
    }
  };

  return (
    <RoleDashboardShell role={role} navItems={navItems}>
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Community Upvoting Feed</h1>
            <p className="text-xs text-muted-foreground">
              Hostel 14 (HB-3) resident-prioritized common issues and peer endorsements (§2.2)
            </p>
          </div>
          <Badge variant="outline" className="px-2.5 py-1 text-xs gap-1 border-primary/20 text-primary">
            <Building2Icon className="size-3.5" />
            <span>HB-3 Resident Hall</span>
          </Badge>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading community issues...</div>
        ) : complaints.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            No complaints currently open in Hostel 14. Facilities running smoothly!
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {complaints.map((item) => {
              const hasUpvoted = !!upvotedIds[item.id];
              return (
                <Card key={item.id} className="border border-border hover:border-primary/30 transition-colors shadow-xs">
                  <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-primary font-mono">{item.ticket_no}</span>
                        <Badge variant="secondary" className="text-[10px] uppercase">{item.category_code || "GENERAL"}</Badge>
                        <Badge
                          variant={item.status === "RESOLVED" || item.status === "CLOSED" ? "outline" : "default"}
                          className="text-[10px]"
                        >
                          {item.status}
                        </Badge>
                        {item.priority === "P1" && (
                          <Badge variant="destructive" className="text-[10px]">P1 CRITICAL</Badge>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                      <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1">
                        <span>Location: {item.location_text || "HB-3 Wing"}</span>
                        <span>Severity: {item.severity || 3}/5</span>
                        {item.risk_score && <span>Risk: {Math.round(item.risk_score)}/100</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:self-center">
                      <Button
                        size="sm"
                        variant={hasUpvoted ? "default" : "outline"}
                        onClick={() => handleUpvote(item.id)}
                        className="gap-1.5 min-w-28 text-xs"
                      >
                        <ThumbsUpIcon className="size-3.5" />
                        <span>{item.upvote_count || 0} Upvotes</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </RoleDashboardShell>
  );
}
