import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") ?? "";
    const priorityFilter = searchParams.get("priority") ?? "";

    const tasks = await prisma.outreachTask.findMany({
      where: {
        status: statusFilter
          ? { equals: statusFilter }
          : { notIn: ["CLOSED"] },
        priority: priorityFilter ? { equals: priorityFilter } : undefined,
      },
      include: {
        patient: { select: { id: true, displayName: true, internalId: true, providerName: true, phoneOptional: true } },
        enrollment: { include: { protocol: true } },
      },
      orderBy: [
        { priority: "desc" },
        { dueDate: "asc" },
        { createdAt: "asc" },
      ],
    });

    return NextResponse.json({ tasks });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch outreach tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { patientId, enrollmentId, reason, priority, dueDate } = body;

    if (!patientId || !enrollmentId || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const task = await prisma.outreachTask.create({
      data: {
        patientId,
        enrollmentId,
        reason,
        priority: priority ?? "NORMAL",
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        patient: { select: { displayName: true, internalId: true } },
        enrollment: { include: { protocol: true } },
      },
    });

    await logAudit({
      actorName: "Staff",
      action: "CREATE_OUTREACH_TASK",
      entityType: "OutreachTask",
      entityId: task.id,
      metadata: { patientId, reason, priority },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create outreach task" }, { status: 500 });
  }
}
