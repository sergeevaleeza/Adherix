export type TreatmentStatus =
  | "DUE_TODAY"
  | "DUE_SOON"
  | "ON_TRACK"
  | "OVERDUE"
  | "HIGH_PRIORITY"
  | "NEEDS_OUTREACH"
  | "COMPLETED"
  | "PAUSED"
  | "DISCONTINUED"
  | "NO_DATE";

export interface StatusInfo {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  priority: number;
}

export const STATUS_CONFIG: Record<TreatmentStatus, StatusInfo> = {
  HIGH_PRIORITY: {
    label: "High Priority",
    color: "#B91C1C",
    bgColor: "#FEE2E2",
    textColor: "#B91C1C",
    borderColor: "#FECACA",
    priority: 1,
  },
  OVERDUE: {
    label: "Overdue",
    color: "#DC2626",
    bgColor: "#FEE2E2",
    textColor: "#DC2626",
    borderColor: "#FCA5A5",
    priority: 2,
  },
  NEEDS_OUTREACH: {
    label: "Needs Outreach",
    color: "#0E9F93",
    bgColor: "#DDF7F4",
    textColor: "#0E9F93",
    borderColor: "#A7EDE8",
    priority: 3,
  },
  DUE_TODAY: {
    label: "Due Today",
    color: "#B45309",
    bgColor: "#FFF4DE",
    textColor: "#B45309",
    borderColor: "#F5D9A0",
    priority: 4,
  },
  DUE_SOON: {
    label: "Due Soon",
    color: "#B45309",
    bgColor: "#FFF4DE",
    textColor: "#B45309",
    borderColor: "#F5D9A0",
    priority: 5,
  },
  ON_TRACK: {
    label: "On Track",
    color: "#059669",
    bgColor: "#DCFCE7",
    textColor: "#059669",
    borderColor: "#A7F3D0",
    priority: 6,
  },
  COMPLETED: {
    label: "Completed",
    color: "#059669",
    bgColor: "#DCFCE7",
    textColor: "#059669",
    borderColor: "#A7F3D0",
    priority: 7,
  },
  PAUSED: {
    label: "Paused",
    color: "#6B7280",
    bgColor: "#F3F4F6",
    textColor: "#6B7280",
    borderColor: "#E5E7EB",
    priority: 8,
  },
  DISCONTINUED: {
    label: "Discontinued",
    color: "#9CA3AF",
    bgColor: "#F9FAFB",
    textColor: "#9CA3AF",
    borderColor: "#E5E7EB",
    priority: 9,
  },
  NO_DATE: {
    label: "No Date Set",
    color: "#9CA3AF",
    bgColor: "#F9FAFB",
    textColor: "#9CA3AF",
    borderColor: "#E5E7EB",
    priority: 10,
  },
};

export interface EnrollmentForStatus {
  status: string;
  nextDueDate: Date | null;
  protocol: {
    overdueAfterDays: number;
    escalationAfterDays: number;
    dueSoonDays: number;
  };
  outreachTasks?: { status: string }[];
}

export function computeEnrollmentStatus(
  enrollment: EnrollmentForStatus,
  today: Date = new Date()
): TreatmentStatus {
  if (enrollment.status === "PAUSED") return "PAUSED";
  if (enrollment.status === "DISCONTINUED") return "DISCONTINUED";

  const hasOpenOutreach = enrollment.outreachTasks?.some(
    (t) => t.status === "OPEN" || t.status === "VOICEMAIL_LEFT"
  );

  if (!enrollment.nextDueDate) return "NO_DATE";

  const due = new Date(enrollment.nextDueDate);
  const todayMs = today.setHours(0, 0, 0, 0);
  const dueMs = due.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((dueMs - todayMs) / 86400000);

  const { overdueAfterDays, escalationAfterDays, dueSoonDays } =
    enrollment.protocol;

  if (diffDays < -escalationAfterDays) return "HIGH_PRIORITY";
  if (diffDays < -overdueAfterDays) return "OVERDUE";
  if (hasOpenOutreach) return "NEEDS_OUTREACH";
  if (diffDays === 0) return "DUE_TODAY";
  if (diffDays > 0 && diffDays <= dueSoonDays) return "DUE_SOON";
  if (diffDays < 0) return "OVERDUE";
  return "ON_TRACK";
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function daysFromNow(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.floor((d.getTime() - today.getTime()) / 86400000);
}

export function daysLabel(days: number | null): string {
  if (days === null) return "—";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days > 0) return `In ${days} days`;
  return `${Math.abs(days)} days ago`;
}
