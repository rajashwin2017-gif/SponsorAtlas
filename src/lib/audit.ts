import { prisma } from "@/lib/prisma";

export function logAudit(
  actorId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  metadata?: Record<string, unknown>
) {
  return prisma.auditLog.create({
    data: { actorId, action, targetType, targetId, metadata: metadata as any },
  });
}
