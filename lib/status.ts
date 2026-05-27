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
    color: "#7c3aed",
    bgColor: "bg-purple-100",
    textColor: "text-purple-800",
    borderColor: "border-purple-300",
    priority: 1,
  },
  OVERDUE: {
    label: "Overdue",
    color: "#dc2626",
    bgColor: "bg-red-100",
    textColor: "text-red-800",
    borderColor: "border-red-300",
    priority: 2,
  },
  NEEDS_OUTREACH: {
    label: "Needs Outreach",
    color: "#ea580c",
    bgColor: "bg-orange-100",
    textColor: "text-orange-800",
    borderColor: "border-orange-300",
    priority: 3,
  },
  DUE_TODAY: {
    label: "Due Today",
    color: "#d97706",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-800",
    borderColor: "border-yellow-300",
    priority: 4,
  },
  DUE_SOON: {
    label: "Due Soon",
    color: "#2563eb",
    bgColor: "bg-blue-100",
    textColor: "text-blue-800",
    borderColor: "border-blue-300",
    priority: 5,
  },
  ON_TRACK: {
    label: "On Track",
    color: "#16a34a",
    bgColor: "bg-green-100",
    textColor: "text-green-800",
    borderColor: "border-green-300",
    priority: 6,
  },
  COMPLETED: {
    label: "Completed",
    color: "#16a34a",
    bgColor: "bg-green-50",
    textColor: "text-green-700",
    borderColor: "border-green-200",
    priority: 7,
  },
  PAUSED: {
    label: "Paused",
    color: "#6b7280",
    bgColor: "bg-gray-100",
    textColor: "text-gray-700",
    borderColor: "border-gray-300",
    priority: 8,
  },
  DISCONTINUED: {
    label: "Discontinued",
    color: "#6b7280",
    bgColor: "bg-gray-100",
    textColor: "text-gray-600",
    borderColor: "border-gray-300",
    priority: 9,
  },
  NO_DATE: {
    label: "No Date Set",
    color: "#9ca3af",
    bgColor: "bg-gray-50",
    textColor: "text-gray-500",
    borderColor: "border-gray-200",
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
