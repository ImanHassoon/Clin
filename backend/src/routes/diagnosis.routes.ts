import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validateBody } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { assertCanAccessPatient, assertDoctorOwnsVisit, getDoctorProfileOrThrow } from "../services/access";
import { HttpError } from "../middleware/errorHandler";
import { recordAudit } from "../utils/audit";

export const visitDiagnosisRouter = Router();
visitDiagnosisRouter.use(requireAuth);

const createSchema = z.object({
  icdCode: z.string().optional(),
  description: z.string().min(1),
  severity: z.string().optional(),
});

// Mounted at /visits/:visitId/diagnoses
visitDiagnosisRouter.post(
  "/:visitId/diagnoses",
  requireRole("DOCTOR"),
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const doctor = await getDoctorProfileOrThrow(req.auth!.userId);
    const visit = await assertDoctorOwnsVisit(doctor.id, req.params.visitId);

    const body = req.body as z.infer<typeof createSchema>;
    const diagnosis = await prisma.diagnosis.create({
      data: { visitId: visit.id, doctorId: doctor.id, ...body },
    });

    await recordAudit(req, { action: "DIAGNOSIS_CREATE", targetType: "Diagnosis", targetId: diagnosis.id });
    res.status(201).json({ diagnosis });
  }),
);

export const caseDiagnosisRouter = Router();
caseDiagnosisRouter.use(requireAuth);

// Mounted at /cases/:caseId/diagnoses
caseDiagnosisRouter.get(
  "/:caseId/diagnoses",
  asyncHandler(async (req, res) => {
    const medicalCase = await prisma.medicalCase.findUnique({ where: { id: req.params.caseId } });
    if (!medicalCase) throw new HttpError(404, "Case not found");
    await assertCanAccessPatient(req, medicalCase.patientId);

    const diagnoses = await prisma.diagnosis.findMany({
      where: { visit: { caseId: medicalCase.id } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ diagnoses });
  }),
);
