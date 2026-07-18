import {
  Activity,
  Bell,
  ClipboardList,
  FileBarChart,
  HeartPulse,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  section?: "operate" | "insight" | "platform";
};

export const ADMIN_NAV: readonly AdminNavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, section: "operate" },
  { href: "/admin/users", label: "Users", icon: Users, section: "operate" },
  {
    href: "/admin/interviews",
    label: "Interviews",
    icon: ClipboardList,
    section: "operate",
  },
  {
    href: "/admin/reports",
    label: "Reports",
    icon: FileBarChart,
    section: "operate",
  },
  {
    href: "/admin/notifications",
    label: "Notifications",
    icon: Bell,
    section: "operate",
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: Activity,
    section: "insight",
  },
  {
    href: "/admin/system",
    label: "System Health",
    icon: HeartPulse,
    section: "insight",
  },
  {
    href: "/admin/feedback",
    label: "Feedback",
    icon: MessageSquare,
    section: "platform",
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: Settings,
    section: "platform",
  },
] as const;
