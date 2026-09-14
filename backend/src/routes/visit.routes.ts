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

export const visitRouter = Router();
visitRouter.use(requireAuth);

// Documents are deliberately narrowed here: storageKey never leaves the
// server except inside a short-lived signed URL from GET /imaging/:id or
// GET /test-orders' result view — never as a raw list field.
const documentListSelect = { id: true, mimeType: true, uploadedAt: true } as const;

const fullVisitInclude = {
  diagnoses: true,
  testOrders: { include: { result: { include: { documents: { select: documentListSelect } } } } },
  imagingStudies: { include: { documents: { select: documentListSelect } } },
  prescriptions: true,
} as const;

const createSchema = z.object({
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  caseId: z.string().uuid().optional(),
  chiefComplaint: z.string().optional(),
  notes: z.string().optional(),
  vitals: z
    .object({
      bloodPressure: z.string().optional(),
      heartRate: z.number().optional(),
      temperatureC: z.number().optional(),
      weightKg: z.number().optional(),
      heightCm: z.number().optional(),
    })
    .optional(),
});

visitRouter.post(
  "/",
  requireRole("DOCTOR"),
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createSchema>;
    await assertCanAccessPatient(req, body.patientId);
    const doctor = await getDoctorProfileOrThrow(req.auth!.userId);

    if (body.appointmentId) {
      const appointment = await prisma.appointment.findUnique({ where: { id: body.appointmentId } });
      if (!appointment || appointment.doctorId !== doctor.id || appointment.patientId !== body.patientId) {
        throw new HttpError(400, "appointmentId does not match this doctor/patient");
      }
    }

    const visit = await prisma.visit.create({
      data: {
        patientId: body.patientId,
        doctorId: doctor.id,
        appointmentId: body.appointmentId,
        caseId: body.caseId,
        chiefComplaint: body.chiefComplaint,
        notes: body.notes,
        vitalsJson: body.vitals,
      },
      include: fullVisitInclude,
    });

    await recordAudit(req, { action: "VISIT_CREATE", targetType: "Visit", targetId: visit.id });
    res.status(201).json({ visit });
  }),
);

visitRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const visit = await prisma.visit.findUnique({ where: { id: req.params.id }, include: fullVisitInclude });
    if (!visit) throw new HttpError(404, "Visit not found");
    await assertCanAccessPatient(req, visit.patientId);

    await recordAudit(req, { action: "VISIT_VIEW", targetType: "Visit", targetId: visit.id });
    res.json({ visit });
  }),
);

export const patientVisitsRouter = Router();
patientVisitsRouter.use(requireAuth);

// Mounted at /patients/:patientId/visits — the case-history timeline.
patientVisitsRouter.get(
  "/:patientId/visits",
  asyncHandler(async (req, res) => {
    await assertCanAccessPatient(req, req.params.patientId);
    const visits = await prisma.visit.findMany({
      where: { patientId: req.params.patientId },
      orderBy: { visitDate: "desc" },
      include: fullVisitInclude,
      take: 100,
    });

    await recordAudit(req, { action: "PATIENT_VISITS_VIEW", targetType: "PatientProfile", targetId: req.params.patientId });
    res.json({ visits });
  }),
);
