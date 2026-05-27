import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, outcomeNote } = body;

    const task = await prisma.outreachTask.update({
      where: { id },
      data: {
        status,
        outcomeNote,
        lastAttemptAt: new Date(),
      },
      include: {
        patient: { select: { displayName: true, internalId: true } },
        enrollment: { include: { protocol: true } },
      },
    });

    await logAudit({
      actorName: "Staff",
      action: `OUTREACH_${status}`,
      entityType: "OutreachTask",
      entityId: id,
      metadata: { newStatus: status, outcomeNote, patientId: task.patientId },
    });

    return NextResponse.json({ task });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update outreach task" }, { status: 500 });
  }
}
