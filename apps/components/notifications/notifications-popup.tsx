"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BellIcon,
  CheckCheckIcon,
  Trash2Icon,
  FlameIcon,
  WrenchIcon,
  SparklesIcon,
  AwardIcon,
  RadioIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  ExternalLinkIcon,
  XIcon,
  PlusCircleIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "cn";

export interface CampusNotification {
  id: string;
  title: string;
  description: string;
  timeAgo: string;
  category: "HAZARD" | "WORK_ORDER" | "FESTIVAL" | "REWARD" | "SYSTEM";
  severity: "CRITICAL" | "WARNING" | "INFO" | "SUCCESS";
  isRead: boolean;
  linkUrl?: string;
}

const INITIAL_NOTIFICATIONS: CampusNotification[] = [
  {
    id: "notif-1",
    title: "P1 Thermal Anomaly Detected",
    description: "Substation 2 Transformer FLIR reading peaked at 78°C (+15°C above baseline). Automated cooling fans initiated.",
    timeAgo: "2m ago",
    category: "HAZARD",
    severity: "CRITICAL",
    isRead: false,
    linkUrl: "/telemetry",
  },
  {
    id: "notif-2",
    title: "Innovision 2026 Festival Mandate",
    description: "Surge preparedness mandate issued for HB-3, CVR & KMS hostels. Provisional contingency budget ₹52,000 sanctioned.",
    timeAgo: "12m ago",
    category: "FESTIVAL",
    severity: "WARNING",
    isRead: false,
    linkUrl: "/chief-warden/festivals",
  },
  {
    id: "notif-3",
    title: "New Work Order Dispatched",
    description: "Ticket CIQ-2026-90001 (HB-3 Electrical Short) assigned to Senior Electrician. 24h SLA active.",
    timeAgo: "34m ago",
    category: "WORK_ORDER",
    severity: "INFO",
    isRead: false,
    linkUrl: "/care-taker/dashboard",
  },
  {
    id: "notif-4",
    title: "3D Digital Twin Anomaly Synced",
    description: "Streetlight Node SL-102 (North Gate) logged Lux flicker anomaly in Night Lux mode.",
    timeAgo: "1h ago",
    category: "SYSTEM",
    severity: "WARNING",
    isRead: true,
    linkUrl: "/spatial-3d",
  },
  {
    id: "notif-5",
    title: "Reward Points Credited",
    description: "Student Wing Coordination bonus: +25 dignity points credited for verified water filter sanitation review.",
    timeAgo: "2h ago",
    category: "REWARD",
    severity: "SUCCESS",
    isRead: true,
    linkUrl: "/student/rewards",
  },
];

export function NotificationsPopup() {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<CampusNotification[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = React.useState<"all" | "unread" | "critical">("all");
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Close on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success("All notifications marked as read");
  };

  const handleClearAll = () => {
    setNotifications([]);
    toast.info("Cleared all notifications");
  };

  const handleSimulateAlert = () => {
    const alerts: CampusNotification[] = [
      {
        id: `notif-${Date.now()}`,
        title: "KMS Water Sump Level Warning",
        description: "IoT Sensor Node #142 reported tank level below 20%. Secondary booster pump auto-staged.",
        timeAgo: "Just now",
        category: "HAZARD",
        severity: "CRITICAL",
        isRead: false,
        linkUrl: "/telemetry",
      },
      {
        id: `notif-${Date.now()}`,
        title: "Warden Resolution Approved",
        description: "Hall 14 Room 204 electrical rewiring approved with photo proof signoff by Dr. S. Nanda.",
        timeAgo: "Just now",
        category: "WORK_ORDER",
        severity: "SUCCESS",
        isRead: false,
        linkUrl: "/warden/approvals",
      },
    ];

    const pick = alerts[Math.floor(Math.random() * alerts.length)];
    setNotifications((prev) => [pick, ...prev]);
    toast.warning(`New Alert: ${pick.title}`, {
      description: pick.description,
    });
  };

  const handleNotificationClick = (notif: CampusNotification) => {
    handleMarkAsRead(notif.id);
    setIsOpen(false);
    if (notif.linkUrl) {
      router.push(notif.linkUrl);
    }
  };

  const filteredList = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "critical") return n.severity === "CRITICAL";
    return true;
  });

  const getCategoryIcon = (category: CampusNotification["category"], severity: CampusNotification["severity"]) => {
    if (severity === "CRITICAL") return <FlameIcon className="size-4 text-red-500" />;
    switch (category) {
      case "HAZARD":
        return <AlertTriangleIcon className="size-4 text-amber-500" />;
      case "WORK_ORDER":
        return <WrenchIcon className="size-4 text-blue-500" />;
      case "FESTIVAL":
        return <SparklesIcon className="size-4 text-indigo-500" />;
      case "REWARD":
        return <AwardIcon className="size-4 text-emerald-500" />;
      default:
        return <RadioIcon className="size-4 text-primary" />;
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative size-8 text-muted-foreground hover:text-foreground transition-all",
          isOpen && "bg-accent text-foreground"
        )}
        title="Notifications & Live Alerts"
      >
        <BellIcon className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-xs animate-pulse font-mono">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown Popup Card */}
      {isOpen && (
        <div className="absolute right-0 top-10 z-50 w-80 sm:w-96 rounded-2xl border border-border bg-popover/95 text-popover-foreground shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
          {/* Header */}
          <div className="p-3.5 border-b border-border bg-muted/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <BellIcon className="size-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Notifications</h4>
                <p className="text-[10px] text-muted-foreground font-mono">
                  {unreadCount} unread • CampusIQ Live Feed
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSimulateAlert}
                className="size-7 text-muted-foreground hover:text-foreground"
                title="Simulate New Live Alert"
              >
                <PlusCircleIcon className="size-3.5" />
              </Button>

              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleMarkAllAsRead}
                  className="size-7 text-muted-foreground hover:text-foreground"
                  title="Mark all as read"
                >
                  <CheckCheckIcon className="size-3.5" />
                </Button>
              )}

              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearAll}
                  className="size-7 text-muted-foreground hover:text-destructive"
                  title="Clear all"
                >
                  <Trash2Icon className="size-3.5" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="size-7 text-muted-foreground hover:text-foreground"
              >
                <XIcon className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* Quick Filter Tabs */}
          <div className="px-3 py-2 border-b border-border/70 flex items-center gap-1.5 bg-muted/20">
            <Button
              size="sm"
              variant={filter === "all" ? "default" : "ghost"}
              onClick={() => setFilter("all")}
              className="h-6 px-2.5 text-[11px] font-medium rounded-lg"
            >
              All ({notifications.length})
            </Button>
            <Button
              size="sm"
              variant={filter === "unread" ? "default" : "ghost"}
              onClick={() => setFilter("unread")}
              className="h-6 px-2.5 text-[11px] font-medium rounded-lg"
            >
              Unread ({unreadCount})
            </Button>
            <Button
              size="sm"
              variant={filter === "critical" ? "default" : "ghost"}
              onClick={() => setFilter("critical")}
              className="h-6 px-2.5 text-[11px] font-medium rounded-lg"
            >
              Critical ({notifications.filter((n) => n.severity === "CRITICAL").length})
            </Button>
          </div>

          {/* Notifications Scrollable List */}
          <div className="max-h-84 overflow-y-auto divide-y divide-border/60 custom-scrollbar">
            {filteredList.length === 0 ? (
              <div className="py-8 px-4 text-center text-xs text-muted-foreground space-y-2">
                <CheckCircle2Icon className="size-8 mx-auto text-muted-foreground/40" />
                <p>No notifications matching this filter.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSimulateAlert}
                  className="text-xs h-7 gap-1 mt-1"
                >
                  <PlusCircleIcon className="size-3" />
                  Simulate Live Alert
                </Button>
              </div>
            ) : (
              filteredList.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={cn(
                    "p-3 transition-colors cursor-pointer flex items-start gap-2.5 relative group",
                    !notif.isRead ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/40"
                  )}
                >
                  {/* Category / Severity Icon */}
                  <div
                    className={cn(
                      "size-8 rounded-lg shrink-0 flex items-center justify-center mt-0.5 border",
                      notif.severity === "CRITICAL"
                        ? "bg-red-500/10 border-red-500/30"
                        : notif.severity === "WARNING"
                        ? "bg-amber-500/10 border-amber-500/30"
                        : notif.severity === "SUCCESS"
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-blue-500/10 border-blue-500/30"
                    )}
                  >
                    {getCategoryIcon(notif.category, notif.severity)}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0 pr-5">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {notif.title}
                      </span>
                      {!notif.isRead && (
                        <span className="size-1.5 rounded-full bg-primary shrink-0" />
                      )}
                    </div>

                    <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                      {notif.description}
                    </p>

                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground font-mono">
                      <span>{notif.timeAgo}</span>
                      <span>•</span>
                      <span className="uppercase text-[9px] font-bold tracking-wider">
                        {notif.category}
                      </span>
                      {notif.linkUrl && (
                        <span className="text-primary flex items-center gap-0.5 group-hover:underline ml-auto">
                          <span>View</span>
                          <ExternalLinkIcon className="size-2.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Mark as Read Action Button */}
                  {!notif.isRead && (
                    <button
                      onClick={(e) => handleMarkAsRead(notif.id, e)}
                      title="Mark as read"
                      className="absolute right-2.5 top-3 size-5 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <CheckCheckIcon className="size-3" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-border bg-muted/30 flex items-center justify-between text-[11px] text-muted-foreground px-3">
            <span>Real-time push enabled</span>
            <Button
              variant="link"
              size="sm"
              onClick={handleSimulateAlert}
              className="h-auto p-0 text-[11px] text-primary"
            >
              + Send Test Alert
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
