import React from "react";
import {
  LayoutDashboardIcon,
  PlusCircleIcon,
  ThumbsUpIcon,
  AwardIcon,
  UsersIcon,
  BuildingIcon,
  FileCheckIcon,
  InboxIcon,
  CheckCircle2Icon,
  GitMergeIcon,
  AlertTriangleIcon,
  WrenchIcon,
  PlayCircleIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  EyeIcon,
  Building2Icon,
  ShieldAlertIcon,
  SparklesIcon,
  ZapIcon,
  TrendingUpIcon,
  UploadCloudIcon,
  ActivityIcon,
  TrophyIcon,
} from "lucide-react";

export interface NavItemConfig {
  title: string;
  url: string;
  icon: React.ReactNode;
  badge?: string;
  isActive?: boolean;
}

export const getStudentNav = (): NavItemConfig[] => [
  {
    title: "My Dashboard",
    url: "/student/dashboard",
    icon: <LayoutDashboardIcon className="size-4" />,
  },
  {
    title: "Complaints Board",
    url: "/student/lodge-complaint",
    icon: <PlusCircleIcon className="size-4" />,
    badge: "Kanban",
  },

  {
    title: "Community Upvotes",
    url: "/student/upvotes",
    icon: <ThumbsUpIcon className="size-4" />,
    badge: "8 Active",
  },
  {
    title: "Reward Points",
    url: "/student/rewards",
    icon: <AwardIcon className="size-4" />,
    badge: "340 pts",
  },
];

export const getCrNav = (): NavItemConfig[] => [
  {
    title: "Wing Overview",
    url: "/cr/dashboard",
    icon: <LayoutDashboardIcon className="size-4" />,
  },
  {
    title: "Wing B Residents",
    url: "/cr/residents",
    icon: <UsersIcon className="size-4" />,
    badge: "48",
  },
  {
    title: "Common Amenities",
    url: "/cr/amenities",
    icon: <BuildingIcon className="size-4" />,
  },
  {
    title: "Endorsement Log",
    url: "/cr/endorsements",
    icon: <FileCheckIcon className="size-4" />,
  },
];

export const getHostelRepNav = (): NavItemConfig[] => [
  {
    title: "Triage Inbox",
    url: "/hostel-rep/dashboard",
    icon: <InboxIcon className="size-4" />,
    badge: "3 Open",
  },
  {
    title: "Physical Verifications",
    url: "/hostel-rep/verifications",
    icon: <CheckCircle2Icon className="size-4" />,
  },
  {
    title: "Deduplication Ledger",
    url: "/hostel-rep/duplicates",
    icon: <GitMergeIcon className="size-4" />,
    badge: "14 Merged",
  },
  {
    title: "Hazard Alerts",
    url: "/hostel-rep/hazards",
    icon: <AlertTriangleIcon className="size-4" />,
  },
];

export const getCaretakerNav = (): NavItemConfig[] => [
  {
    title: "Work Orders",
    url: "/care-taker/dashboard",
    icon: <WrenchIcon className="size-4" />,
    badge: "4 Orders",
  },
  {
    title: "In Progress",
    url: "/care-taker/in-progress",
    icon: <PlayCircleIcon className="size-4" />,
    badge: "1",
  },
  {
    title: "Re-Work Queue",
    url: "/care-taker/rework",
    icon: <RotateCcwIcon className="size-4" />,
    badge: "1",
  },
  {
    title: "Resolution Proofs",
    url: "/care-taker/proofs",
    icon: <CheckCircle2Icon className="size-4" />,
  },
];

export const getWardenNav = (): NavItemConfig[] => [
  {
    title: "Hall 14 Command",
    url: "/warden/dashboard",
    icon: <ShieldCheckIcon className="size-4" />,
    badge: "Active",
  },
  {
    title: "Assign Tradesmen",
    url: "/warden/assign",
    icon: <UserPlusIcon className="size-4" />,
    badge: "1 Pending",
  },
  {
    title: "Resolution Audits",
    url: "/warden/approvals",
    icon: <EyeIcon className="size-4" />,
    badge: "1 To Approve",
  },
  {
    title: "Staff Performance",
    url: "/warden/staff",
    icon: <AwardIcon className="size-4" />,
  },
];

export const getChiefWardenNav = (): NavItemConfig[] => [
  {
    title: "Campus Command",
    url: "/chief-warden/dashboard",
    icon: <Building2Icon className="size-4" />,
    badge: "4 Halls",
  },
  {
    title: "Rewards Ledger",
    url: "/chief-warden/rewards",
    icon: <AwardIcon className="size-4" />,
    badge: "2 Pending",
  },
  {
    title: "Force Escalations",
    url: "/chief-warden/escalations",
    icon: <ShieldAlertIcon className="size-4" />,
  },
  {
    title: "Festival Pre-Briefs",
    url: "/chief-warden/festivals",
    icon: <SparklesIcon className="size-4" />,
  },
];

export const getEstateOfficerNav = (): NavItemConfig[] => [
  {
    title: "Utility Forecasts",
    url: "/estate-officer/dashboard",
    icon: <ZapIcon className="size-4" />,
    badge: "P10/50/90",
  },
  {
    title: "36-Mo Baseline",
    url: "/estate-officer/baseline",
    icon: <TrendingUpIcon className="size-4" />,
  },
  {
    title: "Bill Reconciliation",
    url: "/estate-officer/bills",
    icon: <UploadCloudIcon className="size-4" />,
  },
  {
    title: "Grid & Substation",
    url: "/estate-officer/grid",
    icon: <AlertTriangleIcon className="size-4" />,
  },
];

export const getDirectorNav = (): NavItemConfig[] => [
  {
    title: "Risk Index (CRI)",
    url: "/director/dashboard",
    icon: <ActivityIcon className="size-4" />,
    badge: "31 / 100",
  },
  {
    title: "Living Standards",
    url: "/director/standards",
    icon: <TrophyIcon className="size-4" />,
  },
  {
    title: "Governance Audits",
    url: "/director/audits",
    icon: <ShieldCheckIcon className="size-4" />,
  },
  {
    title: "Halls of Residence",
    url: "/director/halls",
    icon: <Building2Icon className="size-4" />,
    badge: "4 Halls",
  },
];
