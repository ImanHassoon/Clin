import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validateBody } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { assertCanAccessPatient, getDoctorProfileOrThrow } from "../services/access";
import { HttpError } from "../middleware/errorHandler";
import { recordAudit } from "../utils/audit";

export const caseRouter = Router();
caseRouter.use(requireAuth);

const createSchema = z.object({
  patientId: z.string().uuid(),
  title: z.string().min(1),
});

caseRouter.post(
  "/",
  requireRole("DOCTOR"),
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createSchema>;
    await assertCanAccessPatient(req, body.patientId);
    const doctor = await getDoctorProfileOrThrow(req.auth!.userId);

    const medicalCase = await prisma.medicalCase.create({
      data: { patientId: body.patientId, title: body.title, primaryDoctorId: doctor.id },
    });

    await recordAudit(req, { action: "CASE_CREATE", targetType: "MedicalCase", targetId: medicalCase.id });
    res.status(201).json({ case: medicalCase });
  }),
);

const patchSchema = z.object({
  title: z.string().optional(),
  status: z.enum(["OPEN", "CLOSED"]).optional(),
});

caseRouter.patch(
  "/:id",
  requireRole("DOCTOR"),
  validateBody(patchSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.medicalCase.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "Case not found");
    await assertCanAccessPatient(req, existing.patientId);

    const body = req.body as z.infer<typeof patchSchema>;
    const updated = await prisma.medicalCase.update({
      where: { id: existing.id },
      data: {
        title: body.title,
        status: body.status,
        closedAt: body.status === "CLOSED" ? new Date() : body.status === "OPEN" ? null : undefined,
      },
    });

    await recordAudit(req, { action: "CASE_UPDATE", targetType: "MedicalCase", targetId: updated.id });
    res.json({ case: updated });
  }),
);

export const patientCasesRouter = Router();
patientCasesRouter.use(requireAuth);

// Mounted at /patients/:patientId/cases
patientCasesRouter.get(
  "/:patientId/cases",
  asyncHandler(async (req, res) => {
    await assertCanAccessPatient(req, req.params.patientId);
    const cases = await prisma.medicalCase.findMany({
      where: { patientId: req.params.patientId },
      orderBy: { openedAt: "desc" },
    });
    res.json({ cases });
  }),
);
