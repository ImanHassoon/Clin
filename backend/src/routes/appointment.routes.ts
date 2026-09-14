import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validateBody } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { getDoctorProfileOrThrow, getPatientProfileOrThrow } from "../services/access";
import { HttpError } from "../middleware/errorHandler";
import { recordAudit } from "../utils/audit";

export const appointmentRouter = Router();
appointmentRouter.use(requireAuth);

const createSchema = z.object({
  doctorId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  durationMin: z.number().int().positive().max(240).optional(),
  reason: z.string().optional(),
});

// Only patients initiate a booking request; the doctor confirms it.
appointmentRouter.post(
  "/",
  requireRole("PATIENT"),
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createSchema>;
    const patient = await getPatientProfileOrThrow(req.auth!.userId);

    const doctor = await prisma.doctorProfile.findUnique({ where: { id: body.doctorId } });
    if (!doctor) throw new HttpError(404, "Doctor not found");

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: body.doctorId,
        scheduledAt: new Date(body.scheduledAt),
        durationMin: body.durationMin ?? 30,
        reason: body.reason,
      },
    });

    await recordAudit(req, { action: "APPOINTMENT_REQUEST", targetType: "Appointment", targetId: appointment.id });
    res.status(201).json({ appointment });
  }),
);

appointmentRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    if (req.auth!.role === "PATIENT") {
      const patient = await getPatientProfileOrThrow(req.auth!.userId);
      const appointments = await prisma.appointment.findMany({
        where: { patientId: patient.id },
        orderBy: { scheduledAt: "desc" },
        include: { doctor: { select: { id: true, specialty: true, user: { select: { firstName: true, lastName: true } } } } },
      });
      return res.json({ appointments });
    }

    if (req.auth!.role === "DOCTOR") {
      const doctor = await getDoctorProfileOrThrow(req.auth!.userId);
      const appointments = await prisma.appointment.findMany({
        where: { doctorId: doctor.id },
        orderBy: { scheduledAt: "desc" },
        include: { patient: { select: { id: true, user: { select: { firstName: true, lastName: true } } } } },
      });
      return res.json({ appointments });
    }

    throw new HttpError(403, "Clinic admins do not manage individual appointments in this scaffold");
  }),
);

async function assertParticipant(userId: string, role: string, appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appointment) throw new HttpError(404, "Appointment not found");

  if (role === "PATIENT") {
    const patient = await getPatientProfileOrThrow(userId);
    if (appointment.patientId !== patient.id) throw new HttpError(403, "Not your appointment");
  } else if (role === "DOCTOR") {
    const doctor = await getDoctorProfileOrThrow(userId);
    if (appointment.doctorId !== doctor.id) throw new HttpError(403, "Not your appointment");
  } else {
    throw new HttpError(403, "Not permitted");
  }
  return appointment;
}

appointmentRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const appointment = await assertParticipant(req.auth!.userId, req.auth!.role, req.params.id);
    res.json({ appointment });
  }),
);

const patchSchema = z.object({
  status: z.enum(["CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]).optional(),
  scheduledAt: z.string().datetime().optional(),
});

const DOCTOR_ONLY_TRANSITIONS = new Set(["CONFIRMED", "COMPLETED", "NO_SHOW"]);

appointmentRouter.patch(
  "/:id",
  validateBody(patchSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof patchSchema>;
    const appointment = await assertParticipant(req.auth!.userId, req.auth!.role, req.params.id);

    if (body.status && DOCTOR_ONLY_TRANSITIONS.has(body.status) && req.auth!.role !== "DOCTOR") {
      throw new HttpError(403, `Only the doctor can set status ${body.status}`);
    }

    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: body.status,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      },
    });

    // Confirming an appointment is what establishes the care relationship
    // that later gates the doctor's access to this patient's full record.
    if (body.status === "CONFIRMED") {
      await prisma.doctorPatientLink.upsert({
        where: { doctorId_patientId: { doctorId: appointment.doctorId, patientId: appointment.patientId } },
        create: { doctorId: appointment.doctorId, patientId: appointment.patientId, status: "ACTIVE" },
        update: { status: "ACTIVE", revokedAt: null },
      });
    }

    await recordAudit(req, {
      action: "APPOINTMENT_UPDATE",
      targetType: "Appointment",
      targetId: updated.id,
      metadata: { status: body.status },
    });
    res.json({ appointment: updated });
  }),
);
