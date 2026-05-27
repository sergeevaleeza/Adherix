// Shared TypeScript types used across the app

export interface PatientWithStatus {
  id: string;
  displayName: string;
  internalId: string;
  providerName: string;
  isActive: boolean;
  phoneOptional?: string | null;
  emailOptional?: string | null;
  enrollments: EnrollmentWithProtocol[];
}

export interface EnrollmentWithProtocol {
  id: string;
  patientId: string;
  status: string;
  startDate: Date | string;
  lastTreatmentDate: Date | string | null;
  nextDueDate: Date | string | null;
  notes?: string | null;
  protocol: {
    id: string;
    name: string;
    category: string;
    defaultIntervalDays: number;
    dueSoonDays: number;
    overdueAfterDays: number;
    escalationAfterDays: number;
  };
  outreachTasks?: { status: string }[];
}

export interface DashboardStats {
  dueToday: number;
  dueThisWeek: number;
  overdue: number;
  needsOutreach: number;
  highPriority: number;
  completedThisWeek: number;
}
