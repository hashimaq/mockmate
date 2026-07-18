import {
  BarChart3,
  ClipboardList,
  FileText,
  HelpCircle,
  History,
  LayoutDashboard,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const DASHBOARD_NAV: readonly DashboardNavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/interviews", label: "Interviews", icon: ClipboardList },
  { href: "/dashboard/resume", label: "Resume", icon: FileText },
  { href: "/dashboard/history", label: "History", icon: History },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/help", label: "Help", icon: HelpCircle },
] as const;
