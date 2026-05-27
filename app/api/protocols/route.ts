import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    const protocols = await prisma.treatmentProtocol.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { enrollments: true } },
      },
    });
    return NextResponse.json({ protocols });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch protocols" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, category, defaultIntervalDays, dueSoonDays, overdueAfterDays, escalationAfterDays, description } = body;

    if (!name || !category || !defaultIntervalDays) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const protocol = await prisma.treatmentProtocol.create({
      data: {
        name,
        category,
        defaultIntervalDays,
        dueSoonDays: dueSoonDays ?? 7,
        overdueAfterDays: overdueAfterDays ?? 3,
        escalationAfterDays: escalationAfterDays ?? 7,
        description,
        isBuiltIn: false,
      },
    });

    await logAudit({
      actorName: "Staff",
      action: "CREATE_PROTOCOL",
      entityType: "TreatmentProtocol",
      entityId: protocol.id,
      metadata: { name, category },
    });

    return NextResponse.json({ protocol }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create protocol" }, { status: 500 });
  }
}
