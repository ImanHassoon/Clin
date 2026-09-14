import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { asyncHandler } from "../utils/asyncHandler";

export const auditRouter = Router();
auditRouter.use(requireAuth);

auditRouter.get(
  "/",
  requireRole("CLINIC_ADMIN"),
  asyncHandler(async (req, res) => {
    const take = Math.min(Number(req.query.take) || 50, 200);
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take,
      include: { actor: { select: { email: true, role: true } } },
    });
    res.json({ logs });
  }),
);
