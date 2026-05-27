import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateAiDraft, type DraftType } from "@/lib/ai";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { enrollmentId, draftType } = body as { enrollmentId: string; draftType: DraftType };

    if (!enrollmentId || !draftType) {
      return NextResponse.json({ error: "enrollmentId and draftType required" }, { status: 400 });
    }

    const enrollment = await prisma.treatmentEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        patient: true,
        protocol: true,
        outreachTasks: { orderBy: { createdAt: "desc" }, take: 3 },
      },
    });

    if (!enrollment) return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });

    const outreachSummary = enrollment.outreachTasks
      .map((t) => `${t.status} on ${t.createdAt.toLocaleDateString()}: ${t.outcomeNote ?? t.reason}`)
      .join("; ");

    const content = await generateAiDraft({
      draftType,
      patientDisplayName: enrollment.patient.displayName,
      patientInternalId: enrollment.patient.internalId,
      protocolName: enrollment.protocol.name,
      lastTreatmentDate: enrollment.lastTreatmentDate?.toISOString() ?? null,
      nextDueDate: enrollment.nextDueDate?.toISOString() ?? null,
      status: "ACTIVE",
      outreachHistory: outreachSummary || undefined,
    });

    const draft = await prisma.aiDraft.create({
      data: {
        patientId: enrollment.patientId,
        enrollmentId,
        draftType,
        inputSummary: `${enrollment.protocol.name} | ${enrollment.patient.internalId}`,
        content,
      },
    });

    await logAudit({
      actorName: "Staff",
      action: "GENERATE_AI_DRAFT",
      entityType: "AiDraft",
      entityId: draft.id,
      metadata: { draftType, enrollmentId, provider: process.env.AI_PROVIDER ?? "mock" },
    });

    return NextResponse.json({ draft });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to generate draft" }, { status: 500 });
  }
}
