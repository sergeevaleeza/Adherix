import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeEnrollmentStatus } from "@/lib/status";

export async function GET() {
  try {
    const today = new Date();
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7);

    const enrollments = await prisma.treatmentEnrollment.findMany({
      where: { status: "ACTIVE" },
      include: {
        protocol: true,
        patient: { select: { id: true, displayName: true, internalId: true, providerName: true } },
        outreachTasks: { where: { status: { in: ["OPEN", "VOICEMAIL_LEFT"] } } },
      },
    });

    const completedThisWeek = await prisma.treatmentEvent.count({
      where: {
        eventType: "COMPLETED",
        eventDate: { gte: weekStart, lte: today },
      },
    });

    const openOutreach = await prisma.outreachTask.count({
      where: { status: { in: ["OPEN", "VOICEMAIL_LEFT", "CONTACTED"] } },
    });

    let dueToday = 0;
    let dueThisWeek = 0;
    let overdue = 0;
    let highPriority = 0;

    const urgentPatients: {
      patientId: string;
      displayName: string;
      internalId: string;
      providerName: string;
      protocolName: string;
      nextDueDate: string | null;
      status: string;
    }[] = [];

    const statusCounts: Record<string, number> = {
      HIGH_PRIORITY: 0,
      OVERDUE: 0,
      NEEDS_OUTREACH: 0,
      DUE_TODAY: 0,
      DUE_SOON: 0,
      ON_TRACK: 0,
    };

    for (const enrollment of enrollments) {
      const status = computeEnrollmentStatus(enrollment, new Date());
      statusCounts[status] = (statusCounts[status] ?? 0) + 1;

      if (status === "DUE_TODAY") dueToday++;
      if (status === "DUE_SOON") dueThisWeek++;
      if (status === "OVERDUE") overdue++;
      if (status === "HIGH_PRIORITY") highPriority++;

      if (["HIGH_PRIORITY", "OVERDUE", "NEEDS_OUTREACH", "DUE_TODAY"].includes(status)) {
        urgentPatients.push({
          patientId: enrollment.patient.id,
          displayName: enrollment.patient.displayName,
          internalId: enrollment.patient.internalId,
          providerName: enrollment.patient.providerName,
          protocolName: enrollment.protocol.name,
          nextDueDate: enrollment.nextDueDate?.toISOString() ?? null,
          status,
        });
      }
    }

    urgentPatients.sort((a, b) => {
      const order = ["HIGH_PRIORITY", "OVERDUE", "NEEDS_OUTREACH", "DUE_TODAY"];
      return order.indexOf(a.status) - order.indexOf(b.status);
    });

    return NextResponse.json({
      stats: {
        dueToday,
        dueThisWeek,
        overdue,
        needsOutreach: openOutreach,
        highPriority,
        completedThisWeek,
      },
      urgentPatients: urgentPatients.slice(0, 10),
      statusCounts,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
