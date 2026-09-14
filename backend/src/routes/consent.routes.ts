import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validateBody } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { getPatientProfileOrThrow } from "../services/access";
import { HttpError } from "../middleware/errorHandler";
import { recordAudit } from "../utils/audit";

export const consentRouter = Router();
consentRouter.use(requireAuth);

// The patient-side "who has access to my records" screen.
consentRouter.get(
  "/",
  requireRole("PATIENT"),
  asyncHandler(async (req, res) => {
    const patient = await getPatientProfileOrThrow(req.auth!.userId);
    const consents = await prisma.consent.findMany({
      where: { patientId: patient.id },
      orderBy: { grantedAt: "desc" },
      include: { doctor: { select: { id: true, specialty: true, user: { select: { firstName: true, lastName: true } } } } },
    });
    res.json({ consents });
  }),
);

const createSchema = z.object({
  doctorId: z.string().uuid(),
  scope: z.string().optional(),
});

consentRouter.post(
  "/",
  requireRole("PATIENT"),
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const patient = await getPatientProfileOrThrow(req.auth!.userId);
    const body = req.body as z.infer<typeof createSchema>;

    const doctor = await prisma.doctorProfile.findUnique({ where: { id: body.doctorId } });
    if (!doctor) throw new HttpError(404, "Doctor not found");

    const consent = await prisma.consent.create({
      data: { patientId: patient.id, doctorId: body.doctorId, scope: body.scope ?? "FULL_RECORD" },
    });

    await recordAudit(req, { action: "CONSENT_GRANT", targetType: "Consent", targetId: consent.id });
    res.status(201).json({ consent });
  }),
);

consentRouter.delete(
  "/:id",
  requireRole("PATIENT"),
  asyncHandler(async (req, res) => {
    const patient = await getPatientProfileOrThrow(req.auth!.userId);
    const consent = await prisma.consent.findUnique({ where: { id: req.params.id } });
    if (!consent || consent.patientId !== patient.id) throw new HttpError(404, "Consent not found");

    await prisma.consent.update({ where: { id: consent.id }, data: { revokedAt: new Date() } });
    await recordAudit(req, { action: "CONSENT_REVOKE", targetType: "Consent", targetId: consent.id });
    res.status(204).send();
  }),
);
