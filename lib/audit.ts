import { prisma } from "./db";

export async function logAudit({
  actorName,
  action,
  entityType,
  entityId,
  metadata,
}: {
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorName,
        action,
        entityType,
        entityId,
        metadataJson: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }
}
