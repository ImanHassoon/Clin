import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validateBody } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { assertCanAccessPatient, assertDoctorOwnsVisit, getDoctorProfileOrThrow } from "../services/access";
import { recordAudit } from "../utils/audit";

export const visitPrescriptionRouter = Router();
visitPrescriptionRouter.use(requireAuth);

const createSchema = z.object({
  medication: z.string().min(1),
  dosage: z.string().min(1),
  frequency: z.string().min(1),
  durationDays: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

// Mounted at /visits/:visitId/prescriptions
visitPrescriptionRouter.post(
  "/:visitId/prescriptions",
  requireRole("DOCTOR"),
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const doctor = await getDoctorProfileOrThrow(req.auth!.userId);
    const visit = await assertDoctorOwnsVisit(doctor.id, req.params.visitId);

    const body = req.body as z.infer<typeof createSchema>;
    const prescription = await prisma.prescription.create({
      data: { visitId: visit.id, doctorId: doctor.id, ...body },
    });

    await recordAudit(req, { action: "PRESCRIPTION_CREATE", targetType: "Prescription", targetId: prescription.id });
    res.status(201).json({ prescription });
  }),
);

export const patientPrescriptionRouter = Router();
patientPrescriptionRouter.use(requireAuth);

// Mounted at /patients/:patientId/prescriptions
patientPrescriptionRouter.get(
  "/:patientId/prescriptions",
  asyncHandler(async (req, res) => {
    await assertCanAccessPatient(req, req.params.patientId);
    const prescriptions = await prisma.prescription.findMany({
      where: { visit: { patientId: req.params.patientId } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ prescriptions });
  }),
);
