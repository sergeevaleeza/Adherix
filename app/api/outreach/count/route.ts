import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const [urgent, total] = await Promise.all([
    prisma.outreachTask.count({
      where: { status: { notIn: ["CLOSED"] }, priority: "URGENT" },
    }),
    prisma.outreachTask.count({
      where: { status: { notIn: ["CLOSED"] } },
    }),
  ]);
  return NextResponse.json({ urgent, total });
}
