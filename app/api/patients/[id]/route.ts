import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        enrollments: {
          include: {
            protocol: true,
            outreachTasks: { orderBy: { createdAt: "desc" } },
            treatmentEvents: { orderBy: { eventDate: "desc" }, take: 20 },
          },
        },
        treatmentEvents: {
          orderBy: { eventDate: "desc" },
          take: 30,
          include: { enrollment: { include: { protocol: true } } },
        },
        outreachTasks: {
          orderBy: { createdAt: "desc" },
          include: { enrollment: { include: { protocol: true } } },
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json({ patient });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch patient" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { displayName, providerName, phoneOptional, emailOptional, isActive } = body;

    const patient = await prisma.patient.update({
      where: { id },
      data: { displayName, providerName, phoneOptional, emailOptional, isActive },
    });

    await logAudit({
      actorName: "Staff",
      action: "UPDATE_PATIENT",
      entityType: "Patient",
      entityId: id,
      metadata: { changes: body },
    });

    return NextResponse.json({ patient });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update patient" }, { status: 500 });
  }
}
