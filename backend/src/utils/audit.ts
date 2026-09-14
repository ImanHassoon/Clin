import { Request } from "express";
import { prisma } from "../lib/prisma";

interface AuditParams {
  action: string;
  targetType: string;
  targetId?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Every read/write of clinical data should call this. Never throws on
 * failure to write the log — a logging bug must not block the request —
 * but does report to stderr so it isn't silently lost.
 */
export async function recordAudit(req: Request, params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: req.auth?.userId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        reason: params.reason,
        ipAddress: req.ip,
        metadataJson: params.metadata as any,
      },
    });
  } catch (err) {
    console.error("Failed to write audit log", err);
  }
}
