import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { patientId, protocolId, startDate, lastTreatmentDate, nextDueDate, notes } = body;

    if (!patientId || !protocolId || !startDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const enrollment = await prisma.treatmentEnrollment.create({
      data: {
        patientId,
        protocolId,
        startDate: new Date(startDate),
        lastTreatmentDate: lastTreatmentDate ? new Date(lastTreatmentDate) : null,
        nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
        notes,
      },
      include: { protocol: true },
    });

    await logAudit({
      actorName: "Staff",
      action: "CREATE_ENROLLMENT",
      entityType: "TreatmentEnrollment",
      entityId: enrollment.id,
      metadata: { patientId, protocolId },
    });

    return NextResponse.json({ enrollment }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create enrollment" }, { status: 500 });
  }
}
