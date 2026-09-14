import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { assertCanAccessPatient } from "../services/access";
import { recordAudit } from "../utils/audit";
import { HttpError } from "../middleware/errorHandler";

export const patientRouter = Router();
patientRouter.use(requireAuth);

patientRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    await assertCanAccessPatient(req, req.params.id);

    const patient = await prisma.patientProfile.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } },
    });
    if (!patient) throw new HttpError(404, "Patient not found");

    await recordAudit(req, { action: "PATIENT_PROFILE_VIEW", targetType: "PatientProfile", targetId: patient.id });
    res.json({ patient });
  }),
);
