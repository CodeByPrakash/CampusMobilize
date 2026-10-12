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
  MapPinIcon,
  FlameIcon,
  RadioIcon,
  BoxIcon,
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
    title: "Wing Coordination",
    url: "/cr/dashboard",
    icon: <BuildingIcon className="size-4" />,
  },
  {
    title: "Wing Residents",
    url: "/cr/residents",
    icon: <UsersIcon className="size-4" />,
    badge: "48",
  },
  {
    title: "Common Amenities",
    url: "/cr/amenities",
    icon: <Building2Icon className="size-4" />,
  },
  {
    title: "Endorsement Log",
    url: "/cr/endorsements",
    icon: <FileCheckIcon className="size-4" />,
  },
  {
    title: "Map",
    url: "/student/map",
    icon: <MapPinIcon className="size-4" />,
    badge: "Heatmap",
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
  {
    title: "3D Digital Twin",
    url: "/spatial-3d",
    icon: <BoxIcon className="size-4" />,
    badge: "X-Ray & Heat",
  },
];

export const getCrNav = (): NavItemConfig[] => getStudentNav();

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
  {
    title: "3D Digital Twin",
    url: "/spatial-3d",
    icon: <BoxIcon className="size-4" />,
    badge: "Hostel 3D",
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
  {
    title: "3D Digital Twin",
    url: "/spatial-3d",
    icon: <BoxIcon className="size-4" />,
    badge: "Live Ops",
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
    title: "Safety & Hazards",
    url: "/warden/hazards",
    icon: <FlameIcon className="size-4" />,
    badge: "AI Risk",
  },
  {
    title: "Festival Pre-Briefs",
    url: "/warden/festivals",
    icon: <SparklesIcon className="size-4" />,
  },
  {
    title: "3D Digital Twin",
    url: "/spatial-3d",
    icon: <BoxIcon className="size-4" />,
    badge: "Hall 3D",
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
    title: "Safety & Hazards",
    url: "/chief-warden/hazards",
    icon: <FlameIcon className="size-4" />,
    badge: "AI Hotspots",
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
  {
    title: "3D Digital Twin",
    url: "/spatial-3d",
    icon: <BoxIcon className="size-4" />,
    badge: "Campus 3D",
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
    title: "Festival Pre-Briefs",
    url: "/estate-officer/festivals",
    icon: <SparklesIcon className="size-4" />,
    badge: "Surge Ready",
  },
  {
    title: "Hazard Hotspots",
    url: "/estate-officer/hazards",
    icon: <FlameIcon className="size-4" />,
    badge: "Safety SOPs",
  },
  {
    title: "Asset Management",
    url: "/estate-officer/assets",
    icon: <WrenchIcon className="size-4" />,
    badge: "Drag & Drop",
  },
  {
    title: "Campus Simulation",
    url: "/estate-officer/simulation",
    icon: <ActivityIcon className="size-4" />,
    badge: "What-If",
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
    title: "IoT Sensor Telemetry",
    url: "/telemetry",
    icon: <RadioIcon className="size-4" />,
    badge: "148 Nodes",
  },
  {
    title: "Grid & Substation",
    url: "/estate-officer/grid",
    icon: <AlertTriangleIcon className="size-4" />,
  },
  {
    title: "3D Spatial Twin",
    url: "/spatial-3d",
    icon: <BoxIcon className="size-4" />,
    badge: "3D Assets",
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
    title: "Festival Pre-Briefs",
    url: "/director/festivals",
    icon: <SparklesIcon className="size-4" />,
    badge: "Mega-Events",
  },
  {
    title: "3D Spatial Twin",
    url: "/spatial-3d",
    icon: <BoxIcon className="size-4" />,
    badge: "Live 3D",
  },
  {
    title: "IoT & Sensor Telemetry",
    url: "/telemetry",
    icon: <RadioIcon className="size-4" />,
    badge: "Live (148)",
  },
  {
    title: "Safety Hotspots",
    url: "/director/hazards",
    icon: <FlameIcon className="size-4" />,
    badge: "Live Hotspots",
  },
  {
    title: "AI Insights",
    url: "/ai-insights",
    icon: <SparklesIcon className="size-4" />,
    badge: "DeepBot",
  },
  {
    title: "Campus Simulation",
    url: "/director/simulation",
    icon: <PlayCircleIcon className="size-4" />,
    badge: "What-If",
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

export const getNavForRoleId = (roleId?: string): NavItemConfig[] => {
  switch (roleId) {
    case "director":
      return getDirectorNav();
    case "estate_officer":
    case "estate-officer":
      return getEstateOfficerNav();
    case "chief_warden":
    case "chief-warden":
      return getChiefWardenNav();
    case "warden":
      return getWardenNav();
    case "caretaker":
    case "care-taker":
      return getCaretakerNav();
    case "hostel_rep":
    case "hostel-rep":
      return getHostelRepNav();
    case "student_rep":
    case "student-rep":
    case "cr":
    case "student":
      return getStudentNav();
    default:
      return getDirectorNav();
  }
};

